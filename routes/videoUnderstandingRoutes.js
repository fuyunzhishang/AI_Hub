import express from 'express';
import { videoUnderstandingController, uploadVideo } from '../controllers/videoUnderstandingController.js';

const router = express.Router();

/**
 * @swagger
 * /api/video-understanding/analyze:
 *   post:
 *     summary: 分析视频内容
 *     description: 使用 Google Gemini API 分析视频内容，支持文件上传、视频URL和YouTube链接
 *     tags: [视频理解]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: 视频文件（最大2GB，支持MP4、MPEG、MOV、AVI、FLV、MPG、WEBM、WMV、3GPP格式）
 *               prompt:
 *                 type: string
 *                 description: 分析提示词（必填）
 *                 example: "请详细描述这个视频的内容，包括场景、人物动作和对话"
 *               videoUri:
 *                 type: string
 *                 description: 远程视频文件URL（与video和youtubeUrl三选一）
 *                 example: "https://example.com/video.mp4"
 *               youtubeUrl:
 *                 type: string
 *                 description: YouTube视频URL（与video和videoUri三选一）
 *                 example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *               samplingRate:
 *                 type: number
 *                 description: 视频采样率（帧/秒），默认为1
 *                 example: 1
 *                 default: 1
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: 分析提示词（必填）
 *                 example: "请详细描述这个视频的内容"
 *               videoUri:
 *                 type: string
 *                 description: 远程视频文件URL
 *                 example: "https://example.com/video.mp4"
 *               youtubeUrl:
 *                 type: string
 *                 description: YouTube视频URL
 *                 example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *               samplingRate:
 *                 type: number
 *                 description: 视频采样率（帧/秒）
 *                 example: 1
 *                 default: 1
 *     responses:
 *       200:
 *         description: 分析成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       description: 视频分析结果文本
 *                     videoSource:
 *                       type: string
 *                       enum: [file, uri, youtube]
 *                       description: 视频来源类型
 *                     samplingRate:
 *                       type: number
 *                       description: 使用的采样率
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Prompt is required"
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post('/analyze', uploadVideo, videoUnderstandingController.analyzeVideo);

/**
 * @swagger
 * /api/video-understanding/metadata:
 *   post:
 *     summary: 获取视频元数据
 *     description: 提取视频文件的元数据信息，包括格式、时长、分辨率、编码等
 *     tags: [视频理解]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: 视频文件
 *               videoUri:
 *                 type: string
 *                 description: 远程视频文件URL
 *               youtubeUrl:
 *                 type: string
 *                 description: YouTube视频URL
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoUri:
 *                 type: string
 *                 description: 远程视频文件URL
 *               youtubeUrl:
 *                 type: string
 *                 description: YouTube视频URL
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     format:
 *                       type: object
 *                       properties:
 *                         filename:
 *                           type: string
 *                         duration:
 *                           type: number
 *                           description: 视频时长（秒）
 *                         size:
 *                           type: integer
 *                           description: 文件大小（字节）
 *                         bitRate:
 *                           type: string
 *                           description: 比特率
 *                         formatName:
 *                           type: string
 *                           description: 格式名称
 *                     video:
 *                       type: object
 *                       properties:
 *                         codec:
 *                           type: string
 *                           description: 视频编码
 *                         width:
 *                           type: integer
 *                           description: 视频宽度
 *                         height:
 *                           type: integer
 *                           description: 视频高度
 *                         frameRate:
 *                           type: number
 *                           description: 帧率
 *                         duration:
 *                           type: number
 *                           description: 视频流时长
 *                         bitRate:
 *                           type: string
 *                           description: 视频比特率
 *                     audio:
 *                       type: object
 *                       properties:
 *                         codec:
 *                           type: string
 *                           description: 音频编码
 *                         sampleRate:
 *                           type: string
 *                           description: 采样率
 *                         channels:
 *                           type: integer
 *                           description: 声道数
 *                         channelLayout:
 *                           type: string
 *                           description: 声道布局
 *                         bitRate:
 *                           type: string
 *                           description: 音频比特率
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/metadata', uploadVideo, videoUnderstandingController.getVideoMetadata);

export default router;