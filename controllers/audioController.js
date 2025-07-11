import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { processTranscode, processExtract } from '../services/audioService.js';
import { checkFFmpegInstallation, generateUserFriendlyError } from '../utils/ffmpegChecker.js';
// 保持默认导入语法
import digitalHumanConfig from '../config/digitalHuman.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 处理音频转码请求
 */
export const transcodeAudio = async (req, res) => {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const { file } = req;
    const outputFormat = req.body.format || 'mp3'; // 默认转为 mp3
    const outputBitrate = req.body.bitrate || '128k'; // 默认比特率
    
    console.log(`[转码开始] 文件: ${file.originalname}, 目标格式: ${outputFormat}, 比特率: ${outputBitrate}`);
    
    // 处理音频转码
    const result = await processTranscode(file.path, outputFormat, outputBitrate);
    
    console.log(`[转码成功] 输入: ${file.originalname} -> 输出: ${result.filename}`);
    
    return res.status(200).json({
      success: true,
      message: '音频转码成功',
      originalFile: {
        filename: file.filename,
        path: `/uploads/${file.filename}`,
        size: file.size
      },
      convertedFile: {
        filename: result.filename,
        path: `/uploads/${result.filename}`,
        format: outputFormat,
        bitrate: outputBitrate
      }
    });
  } catch (error) {
    console.error(`[转码失败] 文件: ${req.file?.originalname || '未知'}, 错误: ${error.message}`);
    
    // 检查是否是 FFmpeg 相关错误
    if (error.message.includes('FFmpeg') || error.message.includes('ffmpeg') ||
      error.message.includes('不是内部或外部命令') || error.message.includes('command not found')) {

      const ffmpegCheck = await checkFFmpegInstallation();
      const friendlyError = generateUserFriendlyError(ffmpegCheck);

      return res.status(500).json({
        error: 'FFmpeg 未安装或配置错误',
        details: friendlyError,
        installationStatus: ffmpegCheck,
        solution: '请安装 FFmpeg 后重试'
      });
    }

    return res.status(500).json({ 
      error: '音频转码过程中发生错误', 
      details: error.message 
    });
  }
};

/**
 * 处理音频数据提取请求
 */
export const extractAudioData = async (req, res) => {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const { file } = req;
    const extractType = req.body.type || 'all'; // 提取类型：metadata, waveform, spectrum, all
    
    console.log(`[提取开始] 文件: ${file.originalname}, 类型: ${extractType}`);
    
    // 处理音频数据提取
    const result = await processExtract(file.path, extractType);
    
    console.log(`[提取成功] 文件: ${file.originalname}`);
    
    return res.status(200).json({
      success: true,
      message: '音频数据提取成功',
      originalFile: {
        filename: file.filename,
        path: `/uploads/${file.filename}`,
        size: file.size
      },
      extractedData: result
    });
  } catch (error) {
    console.error(`[提取失败] 文件: ${req.file?.originalname || '未知'}, 错误: ${error.message}`);
    
    // 检查是否是 FFmpeg 相关错误
    if (error.message.includes('FFmpeg') || error.message.includes('ffmpeg') ||
      error.message.includes('不是内部或外部命令') || error.message.includes('command not found')) {

      const ffmpegCheck = await checkFFmpegInstallation();
      const friendlyError = generateUserFriendlyError(ffmpegCheck);

      return res.status(500).json({
        error: 'FFmpeg 未安装或配置错误',
        details: friendlyError,
        installationStatus: ffmpegCheck,
        solution: '请安装 FFmpeg 后重试'
      });
    }

    return res.status(500).json({ 
      error: '音频数据提取过程中发生错误', 
      details: error.message 
    });
  }
};

/**
 * 检查 FFmpeg 安装状态
 */
export const checkFFmpegStatus = async (req, res) => {
  try {
    const status = await checkFFmpegInstallation();

    return res.status(200).json({
      success: true,
      message: 'FFmpeg 状态检查完成',
      status,
      userFriendlyMessage: status.overall.ready ?
        'FFmpeg 已正确安装并可用' :
        generateUserFriendlyError(status)
    });
  } catch (error) {
    console.error('FFmpeg 状态检查错误:', error);
    return res.status(500).json({
      success: false,
      error: 'FFmpeg 状态检查失败',
      details: error.message
    });
  }
};