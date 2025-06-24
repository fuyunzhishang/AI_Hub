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

// 简化的文件过滤器 - 只检查扩展名
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.wav', '.mp3', '.m4a', '.flv', '.mp4', '.wma', '.3gp', '.amr', '.aac', '.ogg', '.opus', '.flac'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  console.log(`文件上传 - 文件名: ${file.originalname}, 扩展名: ${fileExt}`);
  
  if (allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件格式 ${fileExt}。支持的格式: ${allowedExtensions.join(', ')}`));
  }
};

// 配置 multer
const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB
});

router.post('/recognize', upload.single('audio'), recognizeAudio);
router.post('/cleanup-cos', cleanupCOSFile);

export default router;