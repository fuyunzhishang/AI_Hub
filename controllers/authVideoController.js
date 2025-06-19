import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createAuthVideo, queryAuthVideo, createAuthVideoByUrl } from '../services/authVideoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 创建授权视频任务
 */
export const createAuthVideoTask = async (req, res) => {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: '没有上传视频文件' 
      });
    }

    const { file } = req;
    const { content, ...options } = req.body;
    
    // 验证授权文案
    if (!content) {
      return res.status(400).json({ 
        success: false,
        error: '授权文案不能为空' 
      });
    }

    console.log(`[AuthVideo] 开始创建授权视频任务: ${file.originalname}, 大小: ${file.size} bytes`);
    
    // 检查文件是否存在
    if (!fs.existsSync(file.path)) {
      console.error(`[AuthVideo] 文件不存在: ${file.path}`);
      return res.status(400).json({ 
        success: false,
        error: '上传的视频文件无法访问' 
      });
    }

    // 调用服务创建任务
    const result = await createAuthVideo(file.path, content, options);
    
    console.log(`[AuthVideo] 任务创建成功: ${result.authId}`);
    
    return res.status(200).json({
      success: true,
      message: '授权视频任务创建成功',
      data: {
        authId: result.authId,
        originalFile: {
          filename: file.filename,
          originalname: file.originalname,
          path: `/uploads/${file.filename}`,
          size: file.size,
          sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`
        },
        content: content,
        apiResponse: result.data
      }
    });

  } catch (error) {
    console.error(`[AuthVideo] 创建任务失败: ${error.message}`);
    return res.status(500).json({ 
      success: false,
      error: '创建授权视频任务失败', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

/**
 * 通过URL创建授权视频任务
 */
export const createAuthVideoTaskByUrl = async (req, res) => {
  try {
    const { videoUrl, content, ...options } = req.body;
    
    // 验证必要参数
    if (!videoUrl) {
      return res.status(400).json({ 
        success: false,
        error: '视频URL不能为空' 
      });
    }

    if (!content) {
      return res.status(400).json({ 
        success: false,
        error: '授权文案不能为空' 
      });
    }

    console.log(`[AuthVideo] 开始通过URL创建授权视频任务: ${videoUrl}`);
    
    // 调用服务创建任务
    const result = await createAuthVideoByUrl(videoUrl, content, options);
    
    console.log(`[AuthVideo] URL任务创建成功: ${result.authId}`);
    
    return res.status(200).json({
      success: true,
      message: '通过URL创建授权视频任务成功',
      data: {
        authId: result.authId,
        videoUrl: videoUrl,
        content: content,
        apiResponse: result.data
      }
    });

  } catch (error) {
    console.error(`[AuthVideo] 通过URL创建任务失败: ${error.message}`);
    return res.status(500).json({ 
      success: false,
      error: '通过URL创建授权视频任务失败', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

/**
 * 查询授权视频任务状态
 */
export const queryAuthVideoTask = async (req, res) => {
  try {
    const { authId } = req.params;
    
    if (!authId) {
      return res.status(400).json({ 
        success: false,
        error: '授权任务ID不能为空' 
      });
    }

    console.log(`[AuthVideo] 查询任务状态: ${authId}`);
    
    // 调用服务查询状态
    const result = await queryAuthVideo(authId);
    
    console.log(`[AuthVideo] 任务状态查询成功: ${authId} - ${result.status}`);
    
    return res.status(200).json({
      success: true,
      message: '查询授权视频任务状态成功',
      data: {
        authId: authId,
        status: result.status,
        apiResponse: result.data
      }
    });

  } catch (error) {
    console.error(`[AuthVideo] 查询任务状态失败: ${error.message}`);
    return res.status(500).json({ 
      success: false,
      error: '查询授权视频任务状态失败', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};