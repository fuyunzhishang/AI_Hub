import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { transcodeAudio, extractAudioData } from '../controllers/audioController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器，只允许音频文件
const fileFilter = (req, file, cb) => {
  const allowedTypes = /wav|mp3|ogg|m4a|aac|flac/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传音频文件!'));
  }
};

// 配置 multer
const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 限制文件大小为 100MB
});

/**
 * @swagger
 * /api/audio/transcode:
 *   post:
 *     summary: 音频转码
 *     tags: [音频处理]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: 音频文件 (支持 wav, mp3, ogg, m4a, aac, flac)
 *               format:
 *                 type: string
 *                 enum: [mp3, wav, ogg, m4a, aac, flac]
 *                 default: mp3
 *                 description: 输出格式
 *               bitrate:
 *                 type: string
 *                 default: 128k
 *                 description: 输出比特率
 *             required:
 *               - audio
 *     responses:
 *       200:
 *         description: 转码成功
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
 *                     originalFile:
 *                       type: string
 *                     outputFile:
 *                       type: string
 *                     format:
 *                       type: string
 *                     bitrate:
 *                       type: string
 *                     url:
 *                       type: string
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/transcode', upload.single('audio'), transcodeAudio);

/**
 * @swagger
 * /api/audio/extract:
 *   post:
 *     summary: 提取音频数据
 *     tags: [音频处理]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: 音频文件 (支持 wav, mp3, ogg, m4a, aac, flac)
 *               type:
 *                 type: string
 *                 enum: [all, metadata, waveform, spectrum]
 *                 default: all
 *                 description: 提取类型
 *             required:
 *               - audio
 *     responses:
 *       200:
 *         description: 提取成功
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
 *                     metadata:
 *                       type: object
 *                       description: 音频元数据
 *                     waveform:
 *                       type: string
 *                       description: 波形图URL
 *                     spectrum:
 *                       type: string
 *                       description: 频谱图URL
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/extract', upload.single('audio'), extractAudioData);

/**
 * @swagger
 * /api/audio/files:
 *   get:
 *     summary: 获取已处理文件列表
 *     tags: [音频处理]
 *     responses:
 *       200:
 *         description: 成功获取文件列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/files', (req, res) => {
  // 此路由后续实现
  res.status(200).json({ message: '文件列表功能将在后续实现' });
});

export default router;
