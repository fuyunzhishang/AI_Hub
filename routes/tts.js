import express from 'express'
import { getVoices, synthesizeSpeech, getProviders } from '../controllers/ttsController.js'

const router = express.Router()

// 获取可用的语音列表
router.get('/voices', getVoices)

// 获取支持的TTS提供商
router.get('/providers', getProviders)

// 合成语音
router.post('/synthesize', synthesizeSpeech)

export default router