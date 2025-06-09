import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  uploadToGoogleFiles,
  getGoogleFileInfo,
  listGoogleFiles,
  deleteGoogleFile,
  batchUploadToGoogleFiles
} from '../controllers/googleFilesController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    // 生成唯一的文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `google-upload-${uniqueSuffix}${extension}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件大小（2GB限制）
  const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
  
  // 支持的文件类型
  const supportedTypes = [
    // 音频文件
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac', 'audio/aac',
    // 图片文件
    'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
    // 视频文件
    'video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-ms-wmv', 'video/x-matroska',
    // 文档文件
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'application/rtf'
  ];
  
  // 检查文件类型
  if (supportedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
  }
};

// 单文件上传配置
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB
    files: 1
  }
});

// 多文件上传配置
const batchUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB per file
    files: 10 // 最多10个文件
  }
});

/**
 * @swagger
 * /api/google-files/upload:
 *   post:
 *     summary: 上传单个文件到Google Files API
 *     tags: [Google Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 要上传的文件（最大2GB）
 *               mimeType:
 *                 type: string
 *                 description: 文件MIME类型（可选，会自动检测）
 *               displayName:
 *                 type: string
 *                 description: 显示名称（可选）
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: 上传成功
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
 *                     fileId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     mimeType:
 *                       type: string
 *                     sizeBytes:
 *                       type: string
 *                     uri:
 *                       type: string
 *                     expirationTime:
 *                       type: string
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/upload', upload.single('file'), uploadToGoogleFiles);

/**
 * @swagger
 * /api/google-files/batch-upload:
 *   post:
 *     summary: 批量上传文件到Google Files API
 *     tags: [Google Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 要上传的文件数组（最多10个，每个最大2GB）
 *               mimeTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 文件MIME类型数组（可选）
 *               displayNames:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 显示名称数组（可选）
 *             required:
 *               - files
 *     responses:
 *       200:
 *         description: 批量上传成功
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
 *                     succeeded:
 *                       type: array
 *                       items:
 *                         type: object
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/batch-upload', batchUpload.array('files', 10), batchUploadToGoogleFiles);

/**
 * @swagger
 * /api/google-files/{fileId}:
 *   get:
 *     summary: 获取Google Files中的文件信息
 *     tags: [Google Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 文件ID
 *     responses:
 *       200:
 *         description: 成功获取文件信息
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
 *                     fileId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     mimeType:
 *                       type: string
 *                     sizeBytes:
 *                       type: string
 *                     uri:
 *                       type: string
 *                     state:
 *                       type: string
 *       404:
 *         description: 文件不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:fileId', getGoogleFileInfo);

/**
 * @swagger
 * /api/google-files/list:
 *   get:
 *     summary: 列出Google Files中的所有文件
 *     tags: [Google Files]
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 页面大小
 *       - in: query
 *         name: pageToken
 *         schema:
 *           type: string
 *         description: 分页令牌
 *     responses:
 *       200:
 *         description: 成功获取文件列表
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
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fileId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           mimeType:
 *                             type: string
 *                           sizeBytes:
 *                             type: string
 *                     nextPageToken:
 *                       type: string
 *       500:
 *         description: 服务器错误
 */
router.get('/list', listGoogleFiles);

/**
 * @swagger
 * /api/google-files/{fileId}:
 *   delete:
 *     summary: 删除Google Files中的文件
 *     tags: [Google Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 要删除的文件ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: 文件不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:fileId', deleteGoogleFile);

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '文件大小超过2GB限制'
      });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: '文件数量超过限制（最多10个文件）'
      });
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: '意外的文件字段'
      });
    }
  }
  
  if (error.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  console.error('Google Files路由错误:', error);
  return res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

export default router;