import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  uploadFile, 
  getFileInfo, 
  listFiles, 
  deleteFile, 
  getMimeTypeFromFilename 
} from '../services/googleFilesService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 处理文件上传到Google Files API
 */
export const uploadToGoogleFiles = async (req, res) => {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: '没有上传文件' 
      });
    }

    const { file } = req;
    
    // 获取MIME类型，优先使用用户指定的，否则根据文件扩展名推断
    let mimeType = req.body.mimeType;
    if (!mimeType) {
      mimeType = getMimeTypeFromFilename(file.originalname);
    }

    // 获取显示名称，优先使用用户指定的，否则使用原始文件名
    const displayName = req.body.displayName || file.originalname;

    // 记录上传开始
    console.log(`[上传开始] 文件: ${file.originalname}, 大小: ${file.size} bytes, 类型: ${mimeType}`);

    // 上传文件到Google Files API
    const result = await uploadFile(file.path, mimeType, displayName);
    
    // 记录上传成功
    console.log(`[上传成功] 文件: ${file.originalname}, FileID: ${result.data.fileId}`);
    
    // 清理临时文件
    try {
      fs.unlinkSync(file.path);
    } catch (cleanupError) {
      console.warn('清理临时文件失败:', cleanupError.message);
    }

    return res.status(200).json({
      success: true,
      message: '文件上传成功',
      data: result.data,
      originalFile: {
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      }
    });
  } catch (error) {
    // 记录上传失败
    console.error(`[上传失败] 文件: ${req.file?.originalname || '未知'}, 错误: ${error.message}`);
    
    // 清理临时文件（如果存在）
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('清理临时文件失败:', cleanupError.message);
      }
    }

    return res.status(500).json({
      success: false,
      error: error.message || '上传文件失败'
    });
  }
};

/**
 * 获取Google Files中的文件信息
 */
export const getGoogleFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: '缺少文件ID参数'
      });
    }

    const result = await getFileInfo(fileId);
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('获取Google Files文件信息失败:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || '获取文件信息失败'
    });
  }
};

/**
 * 列出Google Files中的所有文件
 */
export const listGoogleFiles = async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize) || 10;
    const pageToken = req.query.pageToken || null;
    
    // 验证页面大小
    if (pageSize < 1 || pageSize > 100) {
      return res.status(400).json({
        success: false,
        error: '页面大小必须在1-100之间'
      });
    }

    const result = await listFiles(pageSize, pageToken);
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('获取Google Files文件列表失败:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || '获取文件列表失败'
    });
  }
};

/**
 * 删除Google Files中的文件
 */
export const deleteGoogleFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: '缺少文件ID参数'
      });
    }

    const result = await deleteFile(fileId);
    
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('删除Google Files文件失败:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || '删除文件失败'
    });
  }
};

/**
 * 批量上传文件到Google Files API
 */
export const batchUploadToGoogleFiles = async (req, res) => {
  try {
    // 检查是否有文件上传
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: '没有上传文件' 
      });
    }

    const { files } = req;
    const results = [];
    const errors = [];

    // 并发上传所有文件
    const uploadPromises = files.map(async (file, index) => {
      try {
        // 获取MIME类型
        let mimeType = req.body.mimeTypes && req.body.mimeTypes[index];
        if (!mimeType) {
          mimeType = getMimeTypeFromFilename(file.originalname);
        }

        // 获取显示名称
        const displayName = (req.body.displayNames && req.body.displayNames[index]) || file.originalname;

        // 上传文件
        const result = await uploadFile(file.path, mimeType, displayName);
        
        results.push({
          index,
          originalFile: {
            filename: file.originalname,
            size: file.size,
            mimeType: file.mimetype
          },
          googleFile: result.data
        });

        // 清理临时文件
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.warn('清理临时文件失败:', cleanupError.message);
        }
      } catch (error) {
        errors.push({
          index,
          filename: file.originalname,
          error: error.message
        });

        // 清理临时文件
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.warn('清理临时文件失败:', cleanupError.message);
        }
      }
    });

    await Promise.all(uploadPromises);

    return res.status(200).json({
      success: true,
      message: '批量上传完成',
      data: {
        successful: results,
        failed: errors,
        totalFiles: files.length,
        successCount: results.length,
        failureCount: errors.length
      }
    });
  } catch (error) {
    console.error('批量上传文件到Google Files失败:', error);
    
    // 清理所有临时文件
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.warn('清理临时文件失败:', cleanupError.message);
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || '批量上传文件失败'
    });
  }
};