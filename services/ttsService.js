import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { ttsList } from '../utils/tts.js'
import { GoogleGenAI } from '@google/genai'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { decryptAes } from '../utils/tts-utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get voices from utils/tts.js
const MICROSOFT_VOICES_RAW = ttsList[0].microSoft || []
const GOOGLE_VOICES_RAW = ttsList[0].googleGenAI || []

// Transform the Microsoft voice data to group by language
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

// Transform Google voice data
const GOOGLE_VOICES = GOOGLE_VOICES_RAW.reduce((acc, voice) => {
  acc[voice.key] = {
    name: voice.name,
    lang: voice.lang,
    gender: voice.sex,
    languages: voice.languages,
    example_voice_url: voice.example_voice_url,
    icon: voice.icon,
    level: voice.level,
    type: voice.type
  }
  return acc
}, {})

class TTSService {
  constructor() {
    this.providers = {
      microsoft: this.microsoftTTS.bind(this),
      'microsoft-api': this.microsoftApiTTS.bind(this),  // 新的微软API实现
      'google-genai': this.googleTTS.bind(this),  // 主要ID，与type一致
      google: this.googleTTS.bind(this),          // 兼容简写
      // baidu: this.baiduTTS.bind(this),
    }
  }

  /**
   * 获取所有可用的语音列表
   * @param {string} provider - 语音提供商 ('all', 'microsoft', 'google')
   * @param {string} language - 语言代码 ('all' 或具体语言如 'zh-CN')
   */
  async getVoiceList(provider = 'all', language = 'all') {
    const voices = {}
    
    if (provider === 'all' || provider === 'microsoft' || provider === 'microsoft-api') {
      const key = provider === 'microsoft-api' ? 'microsoft-api' : 'microsoft'
      if (language === 'all') {
        // 返回所有语言的语音，同时提供原始列表用于展示
        voices[key] = {
          grouped: MICROSOFT_VOICES,
          list: MICROSOFT_VOICES_RAW
        }
      } else {
        // 返回特定语言的语音
        voices[key] = {
          grouped: { [language]: MICROSOFT_VOICES[language] || [] },
          list: MICROSOFT_VOICES_RAW.filter(voice => voice.key.startsWith(language))
        }
      }
    }
    
    if (provider === 'all' || provider === 'google' || provider === 'google-genai') {
      voices['google-genai'] = {
        grouped: { 'multi': Object.values(GOOGLE_VOICES) },
        list: GOOGLE_VOICES_RAW.map(voice => ({
          key: voice.key,
          name: voice.name,
          sex: voice.sex,
          lang: voice.lang,
          en_lang: voice.en_lang,
          example_voice_url: voice.example_voice_url,
          icon: voice.icon,
          level: voice.level,
          type: voice.type,
          languages: voice.languages
        }))
      }
    }
    
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

  /**
   * 创建WAV文件缓冲区
   * @param {Buffer} pcmData PCM音频数据
   * @param {number} channels 声道数
   * @param {number} sampleRate 采样率
   * @param {number} bitDepth 位深度
   */
  createWavBuffer(pcmData, channels = 1, sampleRate = 24000, bitDepth = 16) {
    const byteDepth = bitDepth / 8
    const blockAlign = channels * byteDepth
    const byteRate = sampleRate * blockAlign
    const dataSize = pcmData.length
    const fileSize = 44 + dataSize
    
    const header = Buffer.alloc(44)
    let offset = 0
    
    // RIFF header
    header.write('RIFF', offset); offset += 4
    header.writeUInt32LE(fileSize - 8, offset); offset += 4
    header.write('WAVE', offset); offset += 4
    
    // fmt chunk
    header.write('fmt ', offset); offset += 4
    header.writeUInt32LE(16, offset); offset += 4  // fmt chunk size
    header.writeUInt16LE(1, offset); offset += 2   // PCM format
    header.writeUInt16LE(channels, offset); offset += 2
    header.writeUInt32LE(sampleRate, offset); offset += 4
    header.writeUInt32LE(byteRate, offset); offset += 4
    header.writeUInt16LE(blockAlign, offset); offset += 2
    header.writeUInt16LE(bitDepth, offset); offset += 2
    
    // data chunk
    header.write('data', offset); offset += 4
    header.writeUInt32LE(dataSize, offset); offset += 4
    
    return Buffer.concat([header, pcmData])
  }

  /**
   * Google TTS implementation using Gemini AI
   */
  async googleTTS(params) {
    const { text, voiceId, speed, pitch, volume, format } = params
    
    // 验证必需的环境变量
    const apiKey = process.env.GOOGLE_API_KEY
    
    if (!apiKey) {
      throw new Error('Google API key not configured')
    }
    
    if (!text || !voiceId) {
      throw new Error('Text and voiceId are required')
    }
    
    try {
      const ai = new GoogleGenAI({ apiKey })
      
      // 构建合成请求
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ 
          parts: [{ 
            text: `Say in ${voiceId} voice: ${text}` 
          }] 
        }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceId },
            },
          },
        },
      })

      const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
      if (!data) {
        throw new Error('No audio data received from Google TTS')
      }
      
      const pcmBuffer = Buffer.from(data, 'base64')
      
      // Google GenAI返回的是PCM数据，需要转换为WAV格式
      const wavBuffer = this.createWavBuffer(pcmBuffer, 1, 24000, 16)
      
      // 保存音频文件 - Google TTS强制使用wav格式
      const filename = `${uuidv4()}.wav`
      const uploadDir = path.join(path.dirname(__dirname), 'uploads', 'tts')
      await fs.mkdir(uploadDir, { recursive: true })
      
      const filePath = path.join(uploadDir, filename)
      await fs.writeFile(filePath, wavBuffer)
      
      return {
        success: true,
        data: {
          url: `/uploads/tts/${filename}`,
          filename,
          format: 'wav',  // Google TTS固定输出wav
          size: wavBuffer.byteLength,
          duration: null // Google API不直接返回时长
        }
      }
    } catch (error) {
      console.error('Google TTS error:', error.message)
      throw new Error(`Google TTS synthesis failed: ${error.message}`)
    }
  }

  /**
   * Microsoft API TTS implementation (using external API)
   */
  async microsoftApiTTS(params) {
    const { text, voiceId, speed = 1.0, pitch = 1.0, volume = 1.0, format = 'mp3' } = params
    
    if (!text || !voiceId) {
      throw new Error('Text and voiceId are required')
    }
    
    try {
      // 构建 FormData
      const formData = new FormData()
      formData.append('voice_key', voiceId)
      formData.append('voice_text', text)
      formData.append('voice_rate', (speed * 0).toString()) // 转换速度参数
      formData.append('voice_volume', (volume * 100).toString()) // 转换音量参数
      formData.append('is_sync', '1')
      formData.append('user_key', 'xiaohui_800A7DB58EE8CD323AC3FEA9547B5EEE')
      
      // 调用外部API
      const response = await axios.post('https://ps.aifun3.com/v10/tts_create_task', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'text'  // 确保获取到文本响应
      })
      
      if (!response.data) {
        throw new Error(`API请求失败: ${response.status}`)
      }
      
      // 解密响应
      const responseText = response.data
      console.log('API响应:', responseText)
      
      const deAesText = decryptAes(responseText, "qq1920520460qqxx")
      console.log('解密后:', deAesText)
      
      const deAesObject = JSON.parse(deAesText)
      
      // 检查API返回状态
      if (deAesObject.status === 'failed') {
        console.error('API错误:', deAesObject.msg)
        throw new Error(deAesObject.msg || '语音合成失败')
      }
      
      const data = deAesObject.result
      if (!data || !data.task_id) {
        throw new Error('未获取到任务ID')
      }
      
      const taskId = data.task_id
      
      // 返回下载URL
      const downloadUrl = `https://ps.aifun3.com/v10/tts_down?task_id=${taskId}`
      
      return {
        success: true,
        data: {
          url: downloadUrl,
          filename: `tts_${taskId}.mp3`,
          format: 'mp3',
          size: null, // 外部API不返回文件大小
          duration: null // 外部API不返回时长
        }
      }
    } catch (error) {
      console.error('Microsoft API TTS error:', error.message)
      throw new Error(`Microsoft API TTS synthesis failed: ${error.message}`)
    }
  }
}

export default new TTSService()