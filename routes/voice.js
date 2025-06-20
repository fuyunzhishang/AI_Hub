// 在文件顶部添加voiceController导入
import express from 'express';
import multer from 'multer';
import { trainVoice } from '../controllers/voiceController.js';
import voiceController from '../controllers/voiceController.js';
import { getVoiceTrainingStatusHandler } from '../controllers/voiceController.js';

// 在文件顶部添加以下代码
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';


// 确保以下代码只出现一次
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 使用绝对路径并确保目录存在
    const uploadDir = path.join(__dirname, '../uploads/voice/');
    // 确保上传目录存在
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop();
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext);
  }
});

// 限制文件大小为10MB
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    // 允许的文件类型
    const allowedTypes = ['wav', 'mp3', 'ogg', 'm4a', 'aac', 'pcm'];
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowedTypes.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('不支持的文件类型，仅支持wav、mp3、ogg、m4a、aac、pcm格式'));
  }
});

// 音色训练路由
router.post('/train', upload.single('audio'), trainVoice);

// 查询训练状态路由
router.get('/training/status', getVoiceTrainingStatusHandler);

// 添加默认导出语句（关键修复）
export default router;

