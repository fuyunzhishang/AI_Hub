import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { processTranscode, processExtract } from '../services/audioService.js';

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
    
    // 处理音频转码
    const result = await processTranscode(file.path, outputFormat, outputBitrate);
    
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
    console.error('音频转码错误:', error);
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
    
    // 处理音频数据提取
    const result = await processExtract(file.path, extractType);
    
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
    console.error('音频数据提取错误:', error);
    return res.status(500).json({ 
      error: '音频数据提取过程中发生错误', 
      details: error.message 
    });
  }
};
