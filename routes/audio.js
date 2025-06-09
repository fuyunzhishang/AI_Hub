import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { transcodeAudio, extractAudioData, checkFFmpegStatus } from '../controllers/audioController.js';

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

// 音频转码路由
router.post('/transcode', upload.single('audio'), transcodeAudio);

// 音频数据提取路由
router.post('/extract', upload.single('audio'), extractAudioData);

// FFmpeg 状态检查路由
router.get('/ffmpeg-status', checkFFmpegStatus);

// 获取已处理文件列表
router.get('/files', (req, res) => {
  // 此路由后续实现
  res.status(200).json({ message: '文件列表功能将在后续实现' });
});

export default router;
