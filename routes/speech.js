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

// 语音识别路由
router.post('/recognize', upload.single('audio'), recognizeAudio);

export default router;
