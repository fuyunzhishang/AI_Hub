import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { transcodeAudio, extractAudioData, checkFFmpegStatus } from '../controllers/audioController.js';



/**
 * @swagger
 * /api/rest/transcode:
 *   post:
 *     summary: 音频转码
 *     tags: [RESTAPI]
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
 *                 description: 音频文件 (支持 wav, mp3, ogg, m4a, aac, flac)
 *               format:
 *                 type: string
 *                 enum: [mp3, wav, ogg, m4a, aac, flac]
 *                 default: mp3
 *                 description: 输出格式
 *               bitrate:
 *                 type: string
 *                 default: 128k
 *                 description: 输出比特率
 *             required:
 *               - audio
 *     responses:
 *       200:
 *         description: 转码成功
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
 *                     originalFile:
 *                       type: string
 *                     outputFile:
 *                       type: string
 *                     format:
 *                       type: string
 *                     bitrate:
 *                       type: string
 *                     url:
 *                       type: string
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/transcode', upload.single('audio'), transcodeAudio);

/**
 * @swagger
 * /api/rest/extract:
 *   post:
 *     summary: 提取音频数据
 *     tags: [RESTAPI]
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
 *                 description: 音频文件 (支持 wav, mp3, ogg, m4a, aac, flac)
 *               type:
 *                 type: string
 *                 enum: [all, metadata, waveform, spectrum]
 *                 default: all
 *                 description: 提取类型
 *             required:
 *               - audio
 *     responses:
 *       200:
 *         description: 提取成功
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
 *                     metadata:
 *                       type: object
 *                       description: 音频元数据
 *                     waveform:
 *                       type: string
 *                       description: 波形图URL
 *                     spectrum:
 *                       type: string
 *                       description: 频谱图URL
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/extract', upload.single('audio'), extractAudioData);

/**
 * @swagger
 * /api/rest/ffmpeg-status:
 *   get:
 *     summary: 检查FFmpeg安装状态
 *     tags: [RESTAPI]
 *     responses:
 *       200:
 *         description: 成功获取FFmpeg状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 status:
 *                   type: object
 *                 userFriendlyMessage:
 *                   type: string
 */
// FFmpeg 状态检查路由
router.get('/ffmpeg-status', checkFFmpegStatus);

/**
 * @swagger
 * /api/rest/files:
 *   get:
 *     summary: 获取已处理文件列表
 *     tags: [RESTAPI]
 *     responses:
 *       200:
 *         description: 成功获取文件列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/files', (req, res) => {
  // 此路由后续实现
  res.status(200).json({ message: '文件列表功能将在后续实现' });
});

export default router;