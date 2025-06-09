import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { recognizeAudio } from '../controllers/speechController.js';

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
  const allowedTypes = /wav|mp3|silk|m4a|aac|flac/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.includes('audio');
  
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
  limits: { fileSize: 10 * 1024 * 1024 } // 限制文件大小为 10MB（腾讯云语音识别有大小限制）
});

/**
 * @swagger
 * /api/speech/recognize:
 *   post:
 *     summary: 语音识别
 *     tags: [语音服务]
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
 *                 description: 音频文件 (支持 wav, mp3, silk, m4a, aac, flac，最大10MB)
 *               engineType:
 *                 type: string
 *                 enum: [16k_zh, 16k_zh_dialect, 16k_en, 16k_ca]
 *                 default: 16k_zh
 *                 description: |
 *                   识别引擎类型:
 *                   - 16k_zh: 普通话
 *                   - 16k_zh_dialect: 中文方言
 *                   - 16k_en: 英语
 *                   - 16k_ca: 粤语
 *             required:
 *               - audio
 *     responses:
 *       200:
 *         description: 识别成功
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
 *                     text:
 *                       type: string
 *                       description: 识别出的文本
 *                     duration:
 *                       type: number
 *                       description: 音频时长（秒）
 *                     words:
 *                       type: array
 *                       description: 详细的词级别信息
 *                       items:
 *                         type: object
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/recognize', upload.single('audio'), recognizeAudio);

export default router;
