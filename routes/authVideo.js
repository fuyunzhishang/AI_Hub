import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAuthVideoTask, createAuthVideoTaskByUrl, queryAuthVideoTask } from '../controllers/authVideoController.js';

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

// 文件过滤器，只允许视频文件
const fileFilter = (req, file, cb) => {
  const allowedTypes = /mp4|avi|mov|wmv|flv|webm|mkv|m4v/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.includes('video');
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传视频文件!'));
  }
};

// 配置 multer
const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 限制文件大小为 500MB
});

/**
 * @swagger
 * /api/auth-video/create:
 *   post:
 *     summary: 创建授权视频验证任务
 *     tags: [授权视频]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: 视频文件 (支持 mp4, avi, mov, wmv, flv, webm, mkv, m4v，最大500MB)
 *               content:
 *                 type: string
 *                 description: 授权文案
 *             required:
 *               - video
 *               - content
 *     responses:
 *       200:
 *         description: 任务创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     authId:
 *                       type: string
 *                       description: 授权任务ID
 *                     originalFile:
 *                       type: object
 *                       description: 原始文件信息
 *                     content:
 *                       type: string
 *                       description: 授权文案
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/create', upload.single('video'), createAuthVideoTask);

/**
 * @swagger
 * /api/auth-video/create-by-url:
 *   post:
 *     summary: 通过URL创建授权视频验证任务
 *     tags: [授权视频]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoUrl:
 *                 type: string
 *                 description: 视频文件URL
 *               content:
 *                 type: string
 *                 description: 授权文案
 *             required:
 *               - videoUrl
 *               - content
 *     responses:
 *       200:
 *         description: 任务创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     authId:
 *                       type: string
 *                       description: 授权任务ID
 *                     videoUrl:
 *                       type: string
 *                       description: 视频文件URL
 *                     content:
 *                       type: string
 *                       description: 授权文案
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/create-by-url', createAuthVideoTaskByUrl);

/**
 * @swagger
 * /api/auth-video/query/{authId}:
 *   get:
 *     summary: 查询授权视频任务状态
 *     tags: [授权视频]
 *     parameters:
 *       - in: path
 *         name: authId
 *         required: true
 *         schema:
 *           type: string
 *         description: 授权任务ID
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     authId:
 *                       type: string
 *                       description: 授权任务ID
 *                     status:
 *                       type: string
 *                       description: 任务状态
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.get('/query/:authId', queryAuthVideoTask);

export default router;