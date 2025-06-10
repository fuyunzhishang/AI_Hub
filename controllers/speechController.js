import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { recognizeSpeech, recognizeSpeechByUrl } from '../services/speechService.js';
import { uploadToCOS, deleteFromCOS } from '../services/cosService.js';

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

    let result;
    let uploadResult = null;
    const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

    // 判断文件大小，决定使用哪种识别方式
    if (file.size > FILE_SIZE_LIMIT) {
      console.log(`文件大小${(file.size / 1024 / 1024).toFixed(2)}MB超过5MB限制，使用COS上传后URL识别`);

      try {
        // 上传到腾讯云COS
        uploadResult = await uploadToCOS(file.path, file.filename, {
          key: `speech/${Date.now()}-${file.filename}`
        });

        console.log('文件上传到COS成功:', uploadResult.url);

        // 使用URL方式进行语音识别
        result = await recognizeSpeechByUrl(uploadResult.url, engineType);

        // 添加上传信息到结果中
        result.uploadInfo = {
          uploaded: true,
          cosUrl: uploadResult.url,
          cosKey: uploadResult.key,
          bucket: uploadResult.bucket,
          region: uploadResult.region
        };

      } catch (uploadError) {
        console.error('COS上传失败:', uploadError);
        return res.status(500).json({
          success: false,
          error: '文件上传到COS失败',
          details: uploadError.message
        });
      }
    } else {
      console.log(`文件大小${(file.size / 1024 / 1024).toFixed(2)}MB未超过5MB限制，使用Base64直接识别`);

      // 文件较小，直接使用Base64方式识别
      result = await recognizeSpeech(file.path, engineType);
      result.uploadInfo = {
        uploaded: false,
        reason: '文件大小未超过5MB限制'
      };
    }
    
    console.log(`[识别成功] 文件: ${file.originalname}, 识别文本长度: ${result.text.length} 字符`);
    
    return res.status(200).json({
      success: true,
      message: '语音识别成功',
      originalFile: {
        filename: file.filename,
        path: `/uploads/${file.filename}`,
        size: file.size,
        sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      },
      recognitionResult: {
        text: result.text,
        wordCount: result.wordCount,
        engineType: engineType,
        audioFormat: result.audioFormat,
        taskId: result.taskId || '',
        requestId: result.result.RequestId || '',
        sourceType: result.sourceType || 'base64',
        uploadInfo: result.uploadInfo,
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

/**
 * 清理COS上的临时文件
 */
export const cleanupCOSFile = async (req, res) => {
  try {
    const { cosKey } = req.body;

    if (!cosKey) {
      return res.status(400).json({ error: '缺少COS文件键' });
    }

    // 删除COS上的文件
    const result = await deleteFromCOS(cosKey);

    return res.status(200).json({
      success: true,
      message: 'COS文件清理成功',
      deletedKey: cosKey
    });
  } catch (error) {
    console.error('COS文件清理错误:', error);
    return res.status(500).json({
      success: false,
      error: 'COS文件清理失败',
      details: error.message
    });
  }
};