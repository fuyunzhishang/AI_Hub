import fs from 'fs';
import path from 'path';
// 在文件顶部添加导入语句
import * as voiceService from '../services/voiceService.js';
import { trainVoice as trainVoiceService } from '../services/voiceService.js';
import { getVoiceTrainingStatus } from '../services/voiceService.js';

/**
 * 处理音色训练请求
 */
/**
 * @swagger
 * /v1/voice/train:
 *   post:
 *     operationId: trainVoice
 *     summary: 提交音色训练任务
 *     description: 上传音频文件并提交音色训练任务
 *     tags:
 *       - 语音服务
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *               - speaker_id
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: 音频文件 (支持wav、mp3、ogg、m4a、aac、pcm格式，最大10MB)
 *               speaker_id:
 *                 type: string
 *                 pattern: ^S_\w+$
 *                 description: 音色ID（必须以S_开头）
 *               text:
 *                 type: string
 *                 description: 训练文本
 *               language:
 *                 type: integer
 *                 default: 0
 *                 description: 语言类型（0:中文, 1:英文）
 *               model_type:
 *                 type: integer
 *                 default: 0
 *                 description: 模型类型
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
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
export const trainVoice = async (req, res) => {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({ error: '没有上传音频文件' });
    }

    const { speaker_id, text, language, model_type } = req.body;

    // 验证必填参数
    if (!speaker_id) {
      return res.status(400).json({ error: '缺少必填参数speaker_id' });
    }

    const file = req.file;
    console.log(`[音色训练] 开始处理: speaker_id=${speaker_id}, 文件=${file.originalname}, 大小=${file.size} bytes`);

    // 调用服务层处理
    const result = await trainVoiceService({
      filePath: file.path,
      speakerId: speaker_id,
      text: text || '',
      language: language ? parseInt(language) : 0,
      modelType: model_type ? parseInt(model_type) : 0,
      audioFormat: path.extname(file.originalname).replace('.', '').toLowerCase()
    });

    // 删除临时文件
    fs.unlinkSync(file.path);

    return res.status(200).json({
      success: true,
      message: '音色训练请求提交成功',
      data: result
    });
  } catch (error) {
    console.error(`[音色训练] 处理失败: ${error.message}`);
    // 尝试删除临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      error: '音色训练请求处理失败',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
};


/**
 * @swagger
 * /v1/voice/training/status:
 *   get:
 *     operationId: getVoiceTrainingStatus
 *     summary: 查询音色训练状态
 *     description: 根据 speaker_id 查询字节跳动音色训练任务的实时状态
 *     tags:
 *       - 语音服务
 *     parameters:
 *       - in: query
 *         name: speaker_id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^S_\w+$
 *         description: 音色 ID（必须以 S_ 开头）
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, description: "状态码" }
 *                 message: { type: string, description: "提示信息" }
 *                 data: { type: object, description: "训练状态数据" }
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
export const getVoiceTrainingStatusHandler = async (req, res) => {
  try {
    const { speaker_id } = req.query;

    // 参数验证
    if (!speaker_id || typeof speaker_id !== 'string' || !speaker_id.startsWith('S_')) {
      return res.status(400).json({
        code: 400,
        message: '无效的speaker_id参数，必须提供以S_开头的字符串类型音色ID'
      });
    }

    // 调用service层方法 - 传递speaker_id参数
    const result = await getVoiceTrainingStatus({ speakerId: speaker_id });

    // 处理字节跳动API标准响应格式
    if (result.BaseResp && result.BaseResp.StatusCode !== 0) {
      return res.status(400).json({
        code: result.BaseResp.StatusCode,
        message: result.BaseResp.StatusMessage || '查询训练状态失败'
      });
    }

    // 返回成功响应
    return res.status(200).json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    console.error('获取语音训练状态失败:', error);
    return res.status(500).json({
      code: 500,
      message: '获取训练状态失败: ' + error.message
    });
  }
};

// 在函数声明后再导出
export default {
  trainVoice,
  getVoiceTrainingStatusHandler  // 现在函数已声明，可以安全引用
};



