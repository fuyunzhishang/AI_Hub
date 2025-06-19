import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadAudio,
  queryStatus,
  healthCheck
} from '../controllers/volcanoTTSController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/volcano-tts/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedMimes = [
      'audio/wav', 
      'audio/mp3', 
      'audio/mpeg', 
      'audio/flac', 
      'audio/aac',
      'audio/m4a',
      'audio/ogg'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      console.log('Uploading audio file:', file.originalname, 'Type:', file.mimetype);
      cb(null, true);
    } else {
      cb(new Error('不支持的音频文件格式'), false);
    }
  }
});

router.get('/health', healthCheck);

router.post('/mega-tts/audio/upload', upload.single('audio'), uploadAudio);

router.get('/mega-tts/status', queryStatus);

export default router;