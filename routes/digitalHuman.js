import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  // Avatar API
  createAvatar,
  createAvatarByImage,
  getAvatarStatus,
  listAvatars,
  deleteAvatar,
  batchGetAvatarStatus,
  // Video API
  getVideoStatus,
  createVideoByVoice,
  createVideoByAudioFile,
  createVideoByText,
  batchGetVideoStatus,
  // Speaker API
  createSpeaker,
  textToSpeech,
  listSpeakers,
  getSpeakerStatus,
  recreateSpeaker,
  deleteSpeaker,
  getSpeakerRecreatedRecord,
  getUploadUrl,
  // Asset API
  getAsset,
  getRecords,
  // Tool API
  waitForTaskCompletion,
  healthCheck
} from '../controllers/digitalHumanController.js';

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
const audioFileFilter = (req, file, cb) => {
  const allowedTypes = /wav|mp3|silk|m4a|aac|flac|ogg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.includes('audio');
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传音频文件!'));
  }
};

// 配置 multer
const uploadAudio = multer({ 
  storage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 限制文件大小为 10MB
});

// ============================
// Avatar API - 数字人模型管理
// ============================

/**
 * @swagger
 * /api/digital-human/avatar/create:
 *   post:
 *     summary: 训练数字人模型
 *     tags: [数字人-模型管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 数字人标题
 *               videoUrl:
 *                 type: string
 *                 description: 视频链接 (推荐，支持mp4/mov，h264编码，最大200MB，5秒-5分钟)
 *               speakerId:
 *                 type: integer
 *                 description: 声音ID
 *               object:
 *                 type: string
 *                 description: 视频对象路径
 *               authId:
 *                 type: string
 *                 description: 授权视频ID
 *             required:
 *               - videoUrl
 *     responses:
 *       200:
 *         description: 训练任务提交成功
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
 *                     avatarId:
 *                       type: integer
 *                       description: 数字人ID
 */
router.post('/avatar/create', createAvatar);

/**
 * @swagger
 * /api/digital-human/avatar/create-by-image:
 *   post:
 *     summary: 通过图片训练数字人模型
 *     tags: [数字人-模型管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: 图片链接 (支持jpg/jpeg/png，最大10MB，最小300x300px)
 *               title:
 *                 type: string
 *                 description: 数字人标题
 *               speakerId:
 *                 type: integer
 *                 description: 声音ID
 *               object:
 *                 type: string
 *                 description: 视频对象路径
 *               authId:
 *                 type: string
 *                 description: 授权视频ID
 *             required:
 *               - imageUrl
 *     responses:
 *       200:
 *         description: 训练任务提交成功
 */
router.post('/avatar/create-by-image', createAvatarByImage);

/**
 * @swagger
 * /api/digital-human/avatar/status:
 *   post:
 *     summary: 查询数字人训练状态
 *     tags: [数字人-模型管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatarId:
 *                 type: integer
 *                 description: 数字人ID
 *             required:
 *               - avatarId
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     progress:
 *                       type: integer
 *                       description: 训练进度 (0-100)
 *                     status:
 *                       type: string
 *                       enum: [ready, pending, failed, init]
 *                       description: 训练状态
 *                     title:
 *                       type: string
 *                       description: 数字人标题
 */
router.post('/avatar/status', getAvatarStatus);

/**
 * @swagger
 * /api/digital-human/avatar/list:
 *   post:
 *     summary: 获取数字人列表
 *     tags: [数字人-模型管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       avatarId:
 *                         type: integer
 *                       title:
 *                         type: string
 */
router.post('/avatar/list', listAvatars);

/**
 * @swagger
 * /api/digital-human/avatar/delete:
 *   post:
 *     summary: 删除数字人模型
 *     tags: [数字人-模型管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatarId:
 *                 type: integer
 *                 description: 数字人ID
 *             required:
 *               - avatarId
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.post('/avatar/delete', deleteAvatar);

/**
 * @swagger
 * /api/digital-human/avatar/batch-status:
 *   post:
 *     summary: 批量查询数字人状态
 *     tags: [数字人-模型管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatarIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 数字人ID数组
 *             required:
 *               - avatarIds
 *     responses:
 *       200:
 *         description: 查询成功
 */
router.post('/avatar/batch-status', batchGetAvatarStatus);

// ============================
// Video API - 视频生成管理
// ============================

/**
 * @swagger
 * /api/digital-human/video/status:
 *   post:
 *     summary: 查询视频生成状态
 *     tags: [数字人-视频生成]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoId:
 *                 type: integer
 *                 description: 视频ID
 *             required:
 *               - videoId
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     progress:
 *                       type: integer
 *                       description: 生成进度 (0-100)
 *                     status:
 *                       type: string
 *                       enum: [ready, pending, fail]
 *                       description: 生成状态
 *                     title:
 *                       type: string
 *                       description: 视频标题
 *                     videoUrl:
 *                       type: string
 *                       description: 视频URL (有效期24小时)
 */
router.post('/video/status', getVideoStatus);

/**
 * @swagger
 * /api/digital-human/video/create-by-voice:
 *   post:
 *     summary: 通过音频URL生成数字人视频
 *     tags: [数字人-视频生成]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatarId:
 *                 type: integer
 *                 description: 数字人ID
 *               audioUrl:
 *                 type: string
 *                 description: 音频文件URL (至少2秒)
 *               title:
 *                 type: string
 *                 description: 视频标题
 *               object:
 *                 type: string
 *                 description: 音频对象路径
 *             required:
 *               - avatarId
 *               - audioUrl
 *     responses:
 *       200:
 *         description: 生成任务提交成功
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
 *                     videoId:
 *                       type: integer
 *                     length:
 *                       type: integer
 *                       description: 视频时长(毫秒)
 */
router.post('/video/create-by-voice', createVideoByVoice);

/**
 * @swagger
 * /api/digital-human/video/create-by-audio-file:
 *   post:
 *     summary: 通过音频文件生成数字人视频
 *     tags: [数字人-视频生成]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatarId:
 *                 type: integer
 *                 description: 数字人ID
 *               audioFile:
 *                 type: string
 *                 format: binary
 *                 description: 音频文件 (最大10MB，至少2秒)
 *               title:
 *                 type: string
 *                 description: 视频标题
 *             required:
 *               - avatarId
 *               - audioFile
 *     responses:
 *       200:
 *         description: 生成任务提交成功
 */
router.post('/video/create-by-audio-file', uploadAudio.single('audioFile'), createVideoByAudioFile);

/**
 * @swagger
 * /api/digital-human/video/create-by-text:
 *   post:
 *     summary: 通过文本生成数字人视频
 *     tags: [数字人-视频生成]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatarId:
 *                 type: integer
 *                 description: 数字人ID
 *               speakerId:
 *                 type: integer
 *                 description: 声音ID
 *               text:
 *                 type: string
 *                 description: 文本内容 (至少10个字符)
 *                 minLength: 10
 *               title:
 *                 type: string
 *                 description: 视频标题
 *               speedRatio:
 *                 type: number
 *                 description: 语速比例 (0.2-3.0，默认1.0)
 *                 minimum: 0.2
 *                 maximum: 3.0
 *                 default: 1.0
 *             required:
 *               - avatarId
 *               - speakerId
 *               - text
 *     responses:
 *       200:
 *         description: 生成任务提交成功
 */
router.post('/video/create-by-text', createVideoByText);

/**
 * @swagger
 * /api/digital-human/video/batch-status:
 *   post:
 *     summary: 批量查询视频状态
 *     tags: [数字人-视频生成]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 视频ID数组
 *             required:
 *               - videoIds
 *     responses:
 *       200:
 *         description: 查询成功
 */
router.post('/video/batch-status', batchGetVideoStatus);

// ============================
// Speaker API - 音色管理
// ============================

/**
 * @swagger
 * /api/digital-human/speaker/create:
 *   post:
 *     summary: 创建音色
 *     tags: [数字人-音色管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               audioUrl:
 *                 type: string
 *                 description: 音频链接 (与object互斥，优先级高)
 *               object:
 *                 type: string
 *                 description: 音频对象路径 (与audioUrl互斥)
 *               title:
 *                 type: string
 *                 description: 音色标题 (可选)
 *               model:
 *                 type: string
 *                 enum: [V1.0, V2.0]
 *                 description: 模型版本 (V1.0为精品模型，V2.0为情感模型支持25种语言，默认V1.0)
 *                 default: V1.0
 *             anyOf:
 *               - required: [audioUrl]
 *               - required: [object]
 *     responses:
 *       200:
 *         description: 音色创建任务提交成功
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
 *                     speakerId:
 *                       type: integer
 *                       description: 音色ID
 */
router.post('/speaker/create', createSpeaker);

/**
 * @swagger
 * /api/digital-human/speaker/tts:
 *   post:
 *     summary: 语音合成(文本转语音)
 *     tags: [数字人-音色管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: 待合成文本
 *               speakerId:
 *                 type: integer
 *                 description: 音色ID
 *               speedRatio:
 *                 type: number
 *                 description: 语速比例 (0.2-3.0，默认1.0)
 *                 minimum: 0.2
 *                 maximum: 3.0
 *                 default: 1.0
 *               volumeRatio:
 *                 type: number
 *                 description: 音量比例 (0.1-3，默认1.0)
 *                 minimum: 0.1
 *                 maximum: 3
 *                 default: 1.0
 *               pitchRatio:
 *                 type: number
 *                 description: 音调比例 (0.1-3，默认1.0)
 *                 minimum: 0.1
 *                 maximum: 3
 *                 default: 1.0
 *             required:
 *               - text
 *               - speakerId
 *     responses:
 *       200:
 *         description: 语音合成成功
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
 *                     audio:
 *                       type: string
 *                       description: Base64编码的MP3音频
 *                     length:
 *                       type: integer
 *                       description: 音频时长(毫秒)
 */
router.post('/speaker/tts', textToSpeech);

/**
 * @swagger
 * /api/digital-human/speaker/list:
 *   post:
 *     summary: 查询音色列表
 *     tags: [数字人-音色管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 音色列表获取成功
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       speakerId:
 *                         type: integer
 *                         description: 音色ID
 *                       title:
 *                         type: string
 *                         description: 音色标题
 */
router.post('/speaker/list', listSpeakers);

/**
 * @swagger
 * /api/digital-human/speaker/status:
 *   post:
 *     summary: 查询音色克隆任务状态
 *     tags: [数字人-音色管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               speakerId:
 *                 type: integer
 *                 description: 音色ID
 *             required:
 *               - speakerId
 *     responses:
 *       200:
 *         description: 音色状态查询成功
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
 *                     title:
 *                       type: string
 *                       description: 音色标题
 *                     progress:
 *                       type: integer
 *                       description: 任务进度 (0-100)
 *                     status:
 *                       type: string
 *                       enum: [ready, pending, failed, init]
 *                       description: 生成状态
 *                     frequency:
 *                       type: integer
 *                       description: 剩余克隆次数
 */
router.post('/speaker/status', getSpeakerStatus);

/**
 * @swagger
 * /api/digital-human/speaker/recreate:
 *   post:
 *     summary: 重新创建音色
 *     tags: [数字人-音色管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               speakerId:
 *                 type: integer
 *                 description: 音色ID
 *               audioUrl:
 *                 type: string
 *                 description: 音频链接 (与object互斥，优先级高)
 *               object:
 *                 type: string
 *                 description: 音频对象路径 (与audioUrl互斥)
 *             required:
 *               - speakerId
 *             anyOf:
 *               - required: [audioUrl]
 *               - required: [object]
 *     responses:
 *       200:
 *         description: 音色重建任务提交成功
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
 *                     frequency:
 *                       type: integer
 *                       description: 剩余重建次数
 */
router.post('/speaker/recreate', recreateSpeaker);

/**
 * @swagger
 * /api/digital-human/speaker/delete:
 *   post:
 *     summary: 删除音色
 *     tags: [数字人-音色管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               speakerId:
 *                 type: integer
 *                 description: 音色ID
 *             required:
 *               - speakerId
 *     responses:
 *       200:
 *         description: 音色删除成功
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
 *                   type: string
 *                   description: 删除结果
 */
router.post('/speaker/delete', deleteSpeaker);

/**
 * @swagger
 * /api/digital-human/speaker/recreated-record:
 *   post:
 *     summary: 查询音色重新训练记录
 *     tags: [数字人-音色管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               speakerId:
 *                 type: integer
 *                 description: 音色ID
 *             required:
 *               - speakerId
 *     responses:
 *       200:
 *         description: 音色重训练记录查询成功
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
 *                   type: array
 *                   items:
 *                     type: integer
 *                     description: 重训练创建时间戳(毫秒)
 */
router.post('/speaker/recreated-record', getSpeakerRecreatedRecord);

/**
 * @swagger
 * /api/digital-human/upload/get-put-url:
 *   post:
 *     summary: 生成文件上传预签名URL
 *     tags: [数字人-文件上传]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [video, audio]
 *                 description: 文件类型
 *               suffix:
 *                 type: string
 *                 description: 文件后缀名 (视频:mp4,mov,webm; 音频:mp3,m4a,wav)
 *             required:
 *               - type
 *               - suffix
 *     responses:
 *       200:
 *         description: 上传URL生成成功
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
 *                     method:
 *                       type: string
 *                       description: 上传方法 (PUT)
 *                     type:
 *                       type: string
 *                       description: 云存储类型 (0或1)
 *                     object:
 *                       type: string
 *                       description: 对象路径
 *                     url:
 *                       type: string
 *                       description: 上传URL (24小时有效)
 */
router.post('/upload/get-put-url', getUploadUrl);

// ============================
// Asset API - 资产查询管理
// ============================

/**
 * @swagger
 * /api/digital-human/asset/get:
 *   post:
 *     summary: 查询账号剩余权益
 *     tags: [数字人-资产管理]
 *     security:
 *       - bearerAuth: []
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     availableAvatar:
 *                       type: integer
 *                       description: 剩余数字人训练席位 (已废弃)
 *                     availableSpeaker:
 *                       type: integer
 *                       description: 剩余声音克隆次数 (已废弃)
 *                     validPoint:
 *                       type: integer
 *                       description: 剩余算力
 *                     validToTime:
 *                       type: string
 *                       description: 账号有效期
 */
router.post('/asset/get', getAsset);

/**
 * @swagger
 * /api/digital-human/asset/records:
 *   post:
 *     summary: 查询账号积分变动记录
 *     tags: [数字人-资产管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page:
 *                 type: integer
 *                 description: 页码 (默认1)
 *                 default: 1
 *                 minimum: 1
 *               size:
 *                 type: integer
 *                 description: 每页记录数 (默认10，最大100)
 *                 default: 10
 *                 minimum: 1
 *                 maximum: 100
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     size:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       point:
 *                         type: integer
 *                         description: 积分变动
 *                       createTime:
 *                         type: integer
 *                         description: 创建时间戳
 *                       status:
 *                         type: string
 *                         enum: [done, locked, canceled]
 *                         description: 记录状态
 *                       description:
 *                         type: string
 *                         description: 记录描述
 */
router.post('/asset/records', getRecords);

// ============================
// 工具接口
// ============================

/**
 * @swagger
 * /api/digital-human/tools/wait-task:
 *   post:
 *     summary: 等待任务完成
 *     tags: [数字人-工具接口]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskType:
 *                 type: string
 *                 enum: [avatar, video]
 *                 description: 任务类型
 *               taskId:
 *                 type: integer
 *                 description: 任务ID
 *               maxRetries:
 *                 type: integer
 *                 description: 最大重试次数 (默认60)
 *                 default: 60
 *               retryInterval:
 *                 type: integer
 *                 description: 重试间隔毫秒数 (默认5000)
 *                 default: 5000
 *             required:
 *               - taskType
 *               - taskId
 *     responses:
 *       200:
 *         description: 任务完成
 */
router.post('/tools/wait-task', waitForTaskCompletion);

/**
 * @swagger
 * /api/digital-human/health:
 *   get:
 *     summary: 健康检查
 *     tags: [数字人-工具接口]
 *     responses:
 *       200:
 *         description: 服务正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 version:
 *                   type: string
 */
router.get('/health', healthCheck);

export default router;