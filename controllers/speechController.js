import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { recognizeSpeech } from '../services/speechService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 处理语音识别请求
 */
export const recognizeAudio = async (req, res) => {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const { file } = req;
    const engineType = req.body.engineType || '16k_zh'; // 默认使用中文普通话识别引擎
    
    console.log(`[识别开始] 文件: ${file.originalname}, 大小: ${file.size} bytes, 引擎: ${engineType}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(file.path)) {
      console.error(`[识别失败] 文件不存在: ${file.path}`);
      return res.status(400).json({ error: '上传的文件无法访问' });
    }
    
    // 进行语音识别
    const result = await recognizeSpeech(file.path, engineType);
    
    console.log(`[识别成功] 文件: ${file.originalname}, 识别文本长度: ${result.text.length} 字符`);
    
    return res.status(200).json({
      success: true,
      message: '语音识别成功',
      originalFile: {
        filename: file.filename,
        path: `/uploads/${file.filename}`,
        size: file.size
      },
      recognitionResult: {
        text: result.text,
        wordCount: result.wordCount,
        engineType: engineType,
        audioFormat: result.audioFormat,
        taskId: result.taskId || '',
        requestId: result.result.RequestId || '',
        fullResult: result.result
      }
    });
  } catch (error) {
    console.error(`[识别失败] 文件: ${req.file?.originalname || '未知'}, 错误: ${error.message}`);
    return res.status(500).json({ 
      success: false,
      error: '语音识别过程中发生错误', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};
