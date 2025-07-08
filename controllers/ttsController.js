import ttsService from '../services/ttsService.js'

/**
 * @swagger
 * tags:
 *   name: TTS
 *   description: 通用文字转语音接口
 */

/**
 * @swagger
 * /api/tts/voices:
 *   get:
 *     summary: 获取可用的语音列表
 *     tags: [TTS]
 *     parameters:
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [all, microsoft, microsoft-api, google, google-genai]
 *           default: all
 *         description: TTS提供商
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [all, zh-CN, en-US]
 *           default: all
 *         description: 语言类型
 *     responses:
 *       200:
 *         description: 成功返回语音列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     microsoft:
 *                       type: object
 *                       properties:
 *                         grouped:
 *                           type: object
 *                           description: 按语言分组的语音列表
 *                         list:
 *                           type: array
 *                           description: 原始语音列表
 *                           items:
 *                             type: object
 *                             properties:
 *                               key:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               sex:
 *                                 type: string
 *                               lang:
 *                                 type: string
 *                               en_lang:
 *                                 type: string
 *                               example_voice_url:
 *                                 type: string
 *                               level:
 *                                 type: number
 */
export const getVoices = async (req, res) => {
  try {
    const { provider = 'all', language = 'all' } = req.query

    const voices = await ttsService.getVoiceList(provider, language)

    res.json({
      success: true,
      data: voices
    })
  } catch (error) {
    console.error('Get voices error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * @swagger
 * /api/tts/synthesize:
 *   post:
 *     summary: 合成语音
 *     tags: [TTS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - voiceId
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [microsoft, microsoft-api, google-genai]
 *                 default: microsoft-api
 *                 description: TTS提供商
 *               text:
 *                 type: string
 *                 description: 要合成的文本
 *                 example: "你好，这是一个语音合成测试"
 *               voiceId:
 *                 type: string
 *                 description: 语音ID
 *                 example: "zh-CN-XiaoxiaoNeural"
 *               speed:
 *                 type: number
 *                 minimum: 0.5
 *                 maximum: 2.0
 *                 default: 1.0
 *                 description: 语速
 *               pitch:
 *                 type: number
 *                 minimum: 0.5
 *                 maximum: 2.0
 *                 default: 1.0
 *                 description: 音调
 *               volume:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 1.0
 *                 description: 音量
 *               format:
 *                 type: string
 *                 enum: [mp3, wav, ogg, webm]
 *                 default: mp3
 *                 description: 输出格式
 *               stylePrompt:
 *                 type: string
 *                 description: 语音风格提示词（仅Google GenAI支持）
 *                 example: "活泼有趣,语速稍快,带有笑意"
 *     responses:
 *       200:
 *         description: 成功生成语音
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: 音频文件URL
 *                     filename:
 *                       type: string
 *                       description: 文件名
 *                     format:
 *                       type: string
 *                       description: 音频格式
 *                     size:
 *                       type: number
 *                       description: 文件大小（字节）
 *                     duration:
 *                       type: number
 *                       nullable: true
 *                       description: 音频时长（秒）
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
export const synthesizeSpeech = async (req, res) => {
  try {
    const { provider = 'microsoft', text, voiceId, speed = 1.0, pitch = 1.0, volume = 1.0, format = 'mp3', stylePrompt } = req.body

    // 参数验证
    if (!text || !voiceId) {
      return res.status(400).json({
        success: false,
        message: 'Text and voiceId are required'
      })
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Text length cannot exceed 5000 characters'
      })
    }

    // 调用TTS服务
    const result = await ttsService.synthesize({
      provider,
      text,
      voiceId,
      speed,
      pitch,
      volume,
      format,
      stylePrompt
    })

    res.json(result)
  } catch (error) {
    console.error('Synthesize speech error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * @swagger
 * /api/tts/providers:
 *   get:
 *     summary: 获取支持的TTS提供商列表
 *     tags: [TTS]
 *     responses:
 *       200:
 *         description: 成功返回提供商列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [active, inactive]
 */
export const getProviders = async (req, res) => {
  try {
    const providers = [
      {
        id: 'microsoft',
        name: 'Microsoft Azure TTS',
        status: process.env.MICROSOFT_SPEECH_KEY ? 'active' : 'inactive'
      },
      {
        id: 'microsoft-api',
        name: 'Microsoft TTS API',
        status: 'active'  // 始终可用的微软TTS API
      },
      {
        id: 'google-genai',
        name: 'Google GenAI TTS',
        status: process.env.GOOGLE_API_KEY ? 'active' : 'inactive'
      }
    ]

    res.json({
      success: true,
      data: providers
    })
  } catch (error) {
    console.error('Get providers error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}