import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { ttsList } from '../utils/tts.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get Microsoft voices from utils/tts.js
const MICROSOFT_VOICES_RAW = ttsList[0].microSoft || []

// Transform the voice data to group by language
const MICROSOFT_VOICES = MICROSOFT_VOICES_RAW.reduce((acc, voice) => {
  // Extract language code from voice key (e.g., 'zh-CN' from 'zh-CN-XiaoxiaoNeural')
  const langCode = voice.key.substring(0, 5)
  
  if (!acc[langCode]) {
    acc[langCode] = []
  }
  
  acc[langCode].push({
    id: voice.key,
    name: voice.name,
    gender: voice.sex,
    lang: voice.lang,
    en_lang: voice.en_lang,
    example_voice_url: voice.example_voice_url,
    icon: voice.icon,
    level: voice.level,
    type: voice.type
  })
  
  return acc
}, {})

class TTSService {
  constructor() {
    this.providers = {
      microsoft: this.microsoftTTS.bind(this),
      // 可以在这里添加其他TTS提供商
      // google: this.googleTTS.bind(this),
      // baidu: this.baiduTTS.bind(this),
    }
  }

  /**
   * 获取所有可用的语音列表
   * @param {string} provider - 语音提供商 ('all', 'microsoft')
   * @param {string} language - 语言代码 ('all' 或具体语言如 'zh-CN')
   */
  async getVoiceList(provider = 'all', language = 'all') {
    const voices = {}
    
    if (provider === 'all' || provider === 'microsoft') {
      if (language === 'all') {
        // 返回所有语言的语音，同时提供原始列表用于展示
        voices.microsoft = {
          grouped: MICROSOFT_VOICES,
          list: MICROSOFT_VOICES_RAW
        }
      } else {
        // 返回特定语言的语音
        voices.microsoft = {
          grouped: { [language]: MICROSOFT_VOICES[language] || [] },
          list: MICROSOFT_VOICES_RAW.filter(voice => voice.key.startsWith(language))
        }
      }
    }
    
    // 可以添加其他提供商的语音列表
    
    return voices
  }

  /**
   * 合成语音
   */
  async synthesize(params) {
    const { provider = 'microsoft', text, voiceId, speed = 1.0, pitch = 1.0, volume = 1.0, format = 'mp3' } = params
    
    if (!this.providers[provider]) {
      throw new Error(`Unsupported TTS provider: ${provider}`)
    }
    
    return await this.providers[provider]({
      text,
      voiceId,
      speed,
      pitch,
      volume,
      format
    })
  }

  /**
   * Microsoft TTS implementation
   */
  async microsoftTTS(params) {
    const { text, voiceId, speed, pitch, volume, format } = params
    
    // 验证必需的环境变量
    const subscriptionKey = process.env.MICROSOFT_SPEECH_KEY
    const region = process.env.MICROSOFT_SPEECH_REGION || 'eastasia'
    
    if (!subscriptionKey) {
      throw new Error('Microsoft Speech API key not configured')
    }
    
    if (!text || !voiceId) {
      throw new Error('Text and voiceId are required')
    }
    
    // 构建SSML
    const ssml = this.buildSSML(text, voiceId, speed, pitch, volume)
    
    // 调用Microsoft Speech API
    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`
    
    try {
      const response = await axios.post(endpoint, ssml, {
        headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': this.getOutputFormat(format),
          'User-Agent': 'AI_Hub_TTS_Service'
        },
        responseType: 'arraybuffer'
      })
      
      // 保存音频文件
      const filename = `${uuidv4()}.${format}`
      const uploadDir = path.join(path.dirname(__dirname), 'uploads', 'tts')
      await fs.mkdir(uploadDir, { recursive: true })
      
      const filePath = path.join(uploadDir, filename)
      await fs.writeFile(filePath, response.data)
      
      return {
        success: true,
        data: {
          url: `/uploads/tts/${filename}`,
          filename,
          format,
          size: response.data.byteLength,
          duration: null // Microsoft API不直接返回时长，需要使用ffmpeg等工具获取
        }
      }
    } catch (error) {
      console.error('Microsoft TTS error:', error.response?.data || error.message)
      throw new Error(`TTS synthesis failed: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  /**
   * 构建SSML (Speech Synthesis Markup Language)
   */
  buildSSML(text, voiceId, speed, pitch, volume) {
    // 转换参数为SSML格式
    const rate = this.convertSpeed(speed)
    const pitchStr = this.convertPitch(pitch)
    const volumeStr = this.convertVolume(volume)
    
    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voiceId.substring(0, 5)}">
        <voice name="${voiceId}">
          <prosody rate="${rate}" pitch="${pitchStr}" volume="${volumeStr}">
            ${this.escapeXML(text)}
          </prosody>
        </voice>
      </speak>
    `
  }

  /**
   * 转换速度参数
   */
  convertSpeed(speed) {
    // Microsoft接受的速度范围: 0.5-2.0
    const clampedSpeed = Math.max(0.5, Math.min(2.0, speed))
    return `${Math.round(clampedSpeed * 100)}%`
  }

  /**
   * 转换音调参数
   */
  convertPitch(pitch) {
    // Microsoft接受的音调范围: -50% to +50%
    const percentage = (pitch - 1) * 50
    const clamped = Math.max(-50, Math.min(50, percentage))
    return `${clamped >= 0 ? '+' : ''}${Math.round(clamped)}%`
  }

  /**
   * 转换音量参数
   */
  convertVolume(volume) {
    // Microsoft接受的音量范围: 0-100
    const percentage = volume * 100
    const clamped = Math.max(0, Math.min(100, percentage))
    return `${Math.round(clamped)}%`
  }

  /**
   * 获取输出格式
   */
  getOutputFormat(format) {
    const formats = {
      'mp3': 'audio-16khz-128kbitrate-mono-mp3',
      'wav': 'riff-16khz-16bit-mono-pcm',
      'ogg': 'ogg-16khz-16bit-mono-opus',
      'webm': 'webm-16khz-16bit-mono-opus'
    }
    return formats[format] || formats['mp3']
  }

  /**
   * 转义XML特殊字符
   */
  escapeXML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

export default new TTSService()