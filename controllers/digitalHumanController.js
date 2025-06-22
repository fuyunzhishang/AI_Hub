import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createDigitalHumanService } from '../services/digitalHumanService.js';
import digitalHumanConfig from '../config/digitalHuman.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 获取Bearer Token的辅助函数
 */
const getBearerToken = (req) => {
  // 优先使用请求头中的token，如果没有则使用配置的默认token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 使用配置文件中的石榴token
  if (digitalHumanConfig.pomegranateToken) {
    return digitalHumanConfig.pomegranateToken.replace('Bearer ', '');
  }
  
  throw new Error('缺少有效的Bearer Token');
};

/**
 * 创建数字人服务实例的辅助函数
 */
const createServiceInstance = (req) => {
  const token = getBearerToken(req);
  return createDigitalHumanService(token);
};

// ============================
// Avatar API - 数字人模型管理
// ============================

/**
 * 训练数字人模型
 */
export const createAvatar = async (req, res) => {
  try {
    const { title, videoUrl, speakerId, object, authId } = req.body;

    // 验证必要参数
    if (!videoUrl && !object) {
      return res.status(400).json({ 
        success: false, 
        error: '必须提供videoUrl或object参数之一' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.createAvatar({
      title,
      videoUrl,
      speakerId,
      object,
      authId
    });

    console.log(`[数字人训练] 成功提交训练任务, Avatar ID: ${result.data.avatarId}`);

    return res.status(200).json({
      success: true,
      message: '数字人模型训练任务已提交',
      data: result.data
    });
  } catch (error) {
    console.error('[数字人训练] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '数字人模型训练失败',
      details: error.message
    });
  }
};

/**
 * 通过图片训练数字人模型
 */
export const createAvatarByImage = async (req, res) => {
  try {
    const { imageUrl, title, speakerId, object, authId } = req.body;

    // 验证必要参数
    if (!imageUrl) {
      return res.status(400).json({ 
        success: false, 
        error: '必须提供imageUrl参数' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.createAvatarByImage({
      imageUrl,
      title,
      speakerId,
      object,
      authId
    });

    console.log(`[图片数字人训练] 成功提交训练任务, Avatar ID: ${result.data.avatarId}`);

    return res.status(200).json({
      success: true,
      message: '图片数字人模型训练任务已提交',
      data: result.data
    });
  } catch (error) {
    console.error('[图片数字人训练] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '图片数字人模型训练失败',
      details: error.message
    });
  }
};

/**
 * 查询数字人训练状态
 */
export const getAvatarStatus = async (req, res) => {
  try {
    const { avatarId } = req.body;

    if (!avatarId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少avatarId参数' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.getAvatarStatus(avatarId);

    console.log(`[查询数字人状态] Avatar ID: ${avatarId}, 状态: ${result.data.status}, 进度: ${result.data.progress}%`);

    return res.status(200).json({
      success: true,
      message: '数字人状态查询成功',
      data: result.data
    });
  } catch (error) {
    console.error('[查询数字人状态] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '数字人状态查询失败',
      details: error.message
    });
  }
};

/**
 * 获取数字人列表
 */
export const listAvatars = async (req, res) => {
  try {
    const service = createServiceInstance(req);
    const result = await service.listAvatars();

    console.log(`[数字人列表] 成功获取 ${result.data.length} 个数字人`);

    return res.status(200).json({
      success: true,
      message: '数字人列表获取成功',
      data: result.data
    });
  } catch (error) {
    console.error('[数字人列表] 获取失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '数字人列表获取失败',
      details: error.message
    });
  }
};

/**
 * 删除数字人模型
 */
export const deleteAvatar = async (req, res) => {
  try {
    const { avatarId } = req.body;

    if (!avatarId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少avatarId参数' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.deleteAvatar(avatarId);

    console.log(`[删除数字人] Avatar ID: ${avatarId} 删除成功`);

    return res.status(200).json({
      success: true,
      message: '数字人模型删除成功',
      data: result.data
    });
  } catch (error) {
    console.error('[删除数字人] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '数字人模型删除失败',
      details: error.message
    });
  }
};

/**
 * 批量查询数字人状态
 */
export const batchGetAvatarStatus = async (req, res) => {
  try {
    const { avatarIds } = req.body;

    if (!avatarIds || !Array.isArray(avatarIds) || avatarIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'avatarIds必须是非空数组' 
      });
    }

    const service = createServiceInstance(req);
    const results = await service.batchGetAvatarStatus(avatarIds);

    console.log(`[批量查询数字人状态] 查询 ${avatarIds.length} 个数字人完成`);

    return res.status(200).json({
      success: true,
      message: '批量数字人状态查询成功',
      data: results
    });
  } catch (error) {
    console.error('[批量查询数字人状态] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '批量数字人状态查询失败',
      details: error.message
    });
  }
};

// ============================
// Video API - 视频生成管理
// ============================

/**
 * 查询视频生成状态
 */
export const getVideoStatus = async (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少videoId参数' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.getVideoStatus(videoId);

    console.log(`[查询视频状态] Video ID: ${videoId}, 状态: ${result.data.status}, 进度: ${result.data.progress}%`);

    return res.status(200).json({
      success: true,
      message: '视频状态查询成功',
      data: result.data
    });
  } catch (error) {
    console.error('[查询视频状态] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '视频状态查询失败',
      details: error.message
    });
  }
};

/**
 * 通过音频URL生成数字人视频
 */
export const createVideoByVoice = async (req, res) => {
  try {
    const { avatarId, audioUrl, title, object } = req.body;

    // 验证必要参数
    if (!avatarId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少avatarId参数' 
      });
    }

    if (!audioUrl && !object) {
      return res.status(400).json({ 
        success: false, 
        error: '必须提供audioUrl或object参数之一' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.createVideoByVoice({
      avatarId,
      audioUrl,
      title,
      object
    });

    console.log(`[音频生成视频] 成功提交任务, Video ID: ${result.data.videoId}, 时长: ${result.data.length}ms`);

    return res.status(200).json({
      success: true,
      message: '音频生成数字人视频任务已提交',
      data: result.data
    });
  } catch (error) {
    console.error('[音频生成视频] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '音频生成数字人视频失败',
      details: error.message
    });
  }
};

/**
 * 通过音频文件生成数字人视频
 */
export const createVideoByAudioFile = async (req, res) => {
  try {
    const { avatarId, title } = req.body;

    // 验证必要参数
    if (!avatarId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少avatarId参数' 
      });
    }

    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: '没有上传音频文件' 
      });
    }

    const { file } = req;
    
    console.log(`[音频文件生成视频] 开始处理, 文件: ${file.originalname}, 大小: ${file.size} bytes`);

    // 检查文件是否存在
    if (!fs.existsSync(file.path)) {
      console.error(`[音频文件生成视频] 文件不存在: ${file.path}`);
      return res.status(400).json({ 
        success: false, 
        error: '上传的音频文件无法访问' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.createVideoByAudioFile({
      avatarId: parseInt(avatarId),
      audioFilePath: file.path,
      title
    });

    console.log(`[音频文件生成视频] 成功提交任务, Video ID: ${result.data.videoId}, 时长: ${result.data.length}ms`);

    return res.status(200).json({
      success: true,
      message: '音频文件生成数字人视频任务已提交',
      originalFile: {
        filename: file.filename,
        originalname: file.originalname,
        path: `/uploads/${file.filename}`,
        size: file.size,
        sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      },
      data: result.data
    });
  } catch (error) {
    console.error('[音频文件生成视频] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '音频文件生成数字人视频失败',
      details: error.message
    });
  }
};

/**
 * 通过文本生成数字人视频
 */
export const createVideoByText = async (req, res) => {
  try {
    const { avatarId, speakerId, text, title, speedRatio } = req.body;

    // 验证必要参数
    if (!avatarId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少avatarId参数' 
      });
    }

    if (!speakerId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少speakerId参数' 
      });
    }

    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少text参数' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.createVideoByText({
      avatarId: parseInt(avatarId),
      speakerId: parseInt(speakerId),
      text,
      title,
      speedRatio: speedRatio ? parseFloat(speedRatio) : undefined
    });

    console.log(`[文本生成视频] 成功提交任务, Video ID: ${result.data.videoId}, 时长: ${result.data.length}ms`);
    console.log(`[文本生成视频] 文本内容: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);

    return res.status(200).json({
      success: true,
      message: '文本生成数字人视频任务已提交',
      inputText: {
        content: text,
        length: text.length,
        avatarId,
        speakerId,
        speedRatio: speedRatio || 1.0
      },
      data: result.data
    });
  } catch (error) {
    console.error('[文本生成视频] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '文本生成数字人视频失败',
      details: error.message
    });
  }
};

/**
 * 批量查询视频状态
 */
export const batchGetVideoStatus = async (req, res) => {
  try {
    const { videoIds } = req.body;

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'videoIds必须是非空数组' 
      });
    }

    const service = createServiceInstance(req);
    const results = await service.batchGetVideoStatus(videoIds);

    console.log(`[批量查询视频状态] 查询 ${videoIds.length} 个视频完成`);

    return res.status(200).json({
      success: true,
      message: '批量视频状态查询成功',
      data: results
    });
  } catch (error) {
    console.error('[批量查询视频状态] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '批量视频状态查询失败',
      details: error.message
    });
  }
};

// ============================
// Speaker API - 音色管理
// ============================

/**
 * 创建音色
 */
export const createSpeaker = async (req, res) => {
  try {
    const { audioUrl, object, title, model } = req.body;

    // 验证必要参数
    if (!audioUrl && !object) {
      return res.status(400).json({ 
        success: false, 
        error: '必须提供audioUrl或object参数之一' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.createSpeaker({
      audioUrl,
      object,
      title,
      model
    });

    console.log(`[创建音色] 成功提交训练任务, Speaker ID: ${result.data.speakerId}`);

    return res.status(200).json({
      success: true,
      message: '音色创建任务已提交',
      data: result.data
    });
  } catch (error) {
    console.error('[创建音色] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '音色创建失败',
      details: error.message
    });
  }
};

/**
 * 语音合成(文本转语音)
 */
export const textToSpeech = async (req, res) => {
  try {
    const { text, speakerId, speedRatio, volumeRatio, pitchRatio } = req.body;

    // 验证必要参数
    if (!text || !speakerId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少text或speakerId参数' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.textToSpeech({
      text,
      speakerId: parseInt(speakerId),
      speedRatio: speedRatio ? parseFloat(speedRatio) : undefined,
      volumeRatio: volumeRatio ? parseFloat(volumeRatio) : undefined,
      pitchRatio: pitchRatio ? parseFloat(pitchRatio) : undefined
    });

    console.log(`[语音合成] 成功生成音频, Speaker ID: ${speakerId}, 音频时长: ${result.data.length}ms`);

    return res.status(200).json({
      success: true,
      message: '语音合成成功',
      data: result.data
    });
  } catch (error) {
    console.error('[语音合成] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '语音合成失败',
      details: error.message
    });
  }
};

/**
 * 查询音色列表
 */
export const listSpeakers = async (req, res) => {
  try {
    const service = createServiceInstance(req);
    const result = await service.listSpeakers();

    console.log(`[音色列表] 成功获取 ${result.data.length} 个音色`);

    return res.status(200).json({
      success: true,
      message: '音色列表获取成功',
      data: result.data
    });
  } catch (error) {
    console.error('[音色列表] 获取失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '音色列表获取失败',
      details: error.message
    });
  }
};

/**
 * 查询音色状态
 */
export const getSpeakerStatus = async (req, res) => {
  try {
    const { speakerId } = req.body;

    if (!speakerId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少speakerId参数' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.getSpeakerStatus(parseInt(speakerId));

    console.log(`[查询音色状态] Speaker ID: ${speakerId}, 状态: ${result.data.status}, 进度: ${result.data.progress}%`);

    return res.status(200).json({
      success: true,
      message: '音色状态查询成功',
      data: result.data
    });
  } catch (error) {
    console.error('[查询音色状态] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '音色状态查询失败',
      details: error.message
    });
  }
};

/**
 * 重新创建音色
 */
export const recreateSpeaker = async (req, res) => {
  try {
    const { speakerId, audioUrl, object } = req.body;

    // 验证必要参数
    if (!speakerId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少speakerId参数' 
      });
    }

    if (!audioUrl && !object) {
      return res.status(400).json({ 
        success: false, 
        error: '必须提供audioUrl或object参数之一' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.recreateSpeaker({
      speakerId: parseInt(speakerId),
      audioUrl,
      object
    });

    console.log(`[重新创建音色] Speaker ID: ${speakerId}, 剩余重建次数: ${result.data.frequency}`);

    return res.status(200).json({
      success: true,
      message: '音色重建任务已提交',
      data: result.data
    });
  } catch (error) {
    console.error('[重新创建音色] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '音色重建失败',
      details: error.message
    });
  }
};

/**
 * 删除音色
 */
export const deleteSpeaker = async (req, res) => {
  try {
    const { speakerId } = req.body;

    if (!speakerId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少speakerId参数' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.deleteSpeaker(parseInt(speakerId));

    console.log(`[删除音色] Speaker ID: ${speakerId} 删除成功`);

    return res.status(200).json({
      success: true,
      message: '音色删除成功',
      data: result.data
    });
  } catch (error) {
    console.error('[删除音色] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '音色删除失败',
      details: error.message
    });
  }
};

/**
 * 查询音色重训练记录
 */
export const getSpeakerRecreatedRecord = async (req, res) => {
  try {
    const { speakerId } = req.body;

    if (!speakerId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少speakerId参数' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.getSpeakerRecreatedRecord(parseInt(speakerId));

    console.log(`[查询音色重训练记录] Speaker ID: ${speakerId}, 记录数: ${result.data.length}`);

    return res.status(200).json({
      success: true,
      message: '音色重训练记录查询成功',
      data: result.data
    });
  } catch (error) {
    console.error('[查询音色重训练记录] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '音色重训练记录查询失败',
      details: error.message
    });
  }
};

/**
 * 获取文件上传预签名URL
 */
export const getUploadUrl = async (req, res) => {
  try {
    const { type, suffix } = req.body;

    // 验证必要参数
    if (!type || !suffix) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少type或suffix参数' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.getUploadUrl({ type, suffix });

    console.log(`[获取上传URL] 类型: ${type}, 后缀: ${suffix}, URL有效期: 24小时`);

    return res.status(200).json({
      success: true,
      message: '上传URL生成成功',
      data: result.data
    });
  } catch (error) {
    console.error('[获取上传URL] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '上传URL生成失败',
      details: error.message
    });
  }
};

// ============================
// Asset API - 资产查询管理
// ============================

/**
 * 查询账号剩余权益
 */
export const getAsset = async (req, res) => {
  try {
    const service = createServiceInstance(req);
    const result = await service.getAsset();

    console.log(`[查询账号权益] 剩余算力: ${result.data.validPoint}, 有效期至: ${result.data.validToTime}`);

    return res.status(200).json({
      success: true,
      message: '账号权益查询成功',
      data: result.data
    });
  } catch (error) {
    console.error('[查询账号权益] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '账号权益查询失败',
      details: error.message
    });
  }
};

/**
 * 查询账号积分变动记录
 */
export const getRecords = async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.body;

    // 验证分页参数
    if (page < 1 || size < 1 || size > 100) {
      return res.status(400).json({ 
        success: false, 
        error: '分页参数无效，page >= 1, size 在 1-100 之间' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.getRecords({ page, size });

    console.log(`[查询积分记录] 页码: ${page}, 每页: ${size}, 总记录: ${result.data.total}`);

    return res.status(200).json({
      success: true,
      message: '积分记录查询成功',
      pagination: {
        page: result.data.page,
        size: result.data.size,
        pages: result.data.pages,
        total: result.data.total
      },
      data: result.data.list
    });
  } catch (error) {
    console.error('[查询积分记录] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '积分记录查询失败',
      details: error.message
    });
  }
};

// ============================
// 工具接口
// ============================

/**
 * 等待任务完成接口
 */
export const waitForTaskCompletion = async (req, res) => {
  try {
    const { taskType, taskId, maxRetries = 60, retryInterval = 5000 } = req.body;

    if (!taskType || !taskId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少taskType或taskId参数' 
      });
    }

    if (!['avatar', 'video'].includes(taskType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'taskType必须是avatar或video' 
      });
    }

    const service = createServiceInstance(req);
    const result = await service.waitForTaskCompletion(
      taskType, 
      taskId, 
      parseInt(maxRetries), 
      parseInt(retryInterval)
    );

    console.log(`[等待任务完成] ${taskType}任务 ${taskId} 已完成`);

    return res.status(200).json({
      success: true,
      message: `${taskType}任务已完成`,
      taskType,
      taskId,
      data: result.data
    });
  } catch (error) {
    console.error('[等待任务完成] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '等待任务完成失败',
      details: error.message
    });
  }
};

/**
 * 健康检查接口
 */
export const healthCheck = async (req, res) => {
  try {
    // 简单的健康检查，不需要实际调用API
    return res.status(200).json({
      success: true,
      message: '数字人API服务正常',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('[健康检查] 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: '数字人API服务异常',
      details: error.message
    });
  }
};