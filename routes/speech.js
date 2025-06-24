import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { recognizeAudio, cleanupCOSFile } from '../controllers/speechController.js';

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
  // 支持的文件扩展名
  const allowedExtensions = ['wav', 'mp3', 'm4a', 'flv', 'mp4', 'wma', '3gp', 'amr', 'aac', 'ogg', 'opus', 'flac'];
  const fileExt = path.extname(file.originalname).toLowerCase().replace('.', '');
  const hasValidExtension = allowedExtensions.includes(fileExt);
  
  // 日志输出，帮助调试
  console.log(`文件验证 - 文件名: ${file.originalname}, 扩展名: ${fileExt}, MIME: ${file.mimetype}`);
  
  // 只根据文件扩展名判断，忽略 MIME 类型（因为不同浏览器/客户端可能发送不同的 MIME）
  if (hasValidExtension) {
    return cb(null, true);
  } else {
    // 如果扩展名不在列表中，但文件名包含音频相关关键词，也允许通过
    const filenameLower = file.originalname.toLowerCase();
    const audioKeywords = ['audio', 'voice', 'sound', 'recording', 'speech'];
    const hasAudioKeyword = audioKeywords.some(keyword => filenameLower.includes(keyword));
    
    if (hasAudioKeyword) {
      console.log('文件名包含音频关键词，允许上传');
      return cb(null, true);
    }
    
    cb(new Error(`不支持的文件格式。支持的格式: ${allowedExtensions.join(', ')}`));
  }
};

// 配置 multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 * 1024 } // 限制文件大小为 1GB，大文件会自动上传到COS
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
 *                 description: 音频/视频文件 (支持 wav, mp3, m4a, flv, mp4, wma, 3gp, amr, aac, ogg-opus, flac，最大1GB，大于5MB自动上传到COS)
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

/**
 * @swagger
 * /api/speech/cleanup-cos:
 *   post:
 *     summary: 清理COS临时文件
 *     tags: [语音服务]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cosKey:
 *                 type: string
 *                 description: COS文件键值
 *             required:
 *               - cosKey
 *     responses:
 *       200:
 *         description: 清理成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedKey:
 *                   type: string
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/cleanup-cos', cleanupCOSFile);

export default router;