import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyAlSdP6v4b-WA38sY_kL-iqSHuf1jx4XSE';

// 初始化 Google AI
const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

/**
 * 上传文件到 Google Files API
 * @param {string} filePath - 本地文件路径
 * @param {string} mimeType - 文件MIME类型
 * @param {string} displayName - 显示名称（可选）
 * @returns {Promise<Object>} 上传结果
 */
export const uploadFile = async (filePath, mimeType, displayName) => {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }

    // 获取文件大小
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    
    // 检查文件大小限制 (2GB)
    const maxSizeInBytes = 2 * 1024 * 1024 * 1024; // 2GB
    if (fileSizeInBytes > maxSizeInBytes) {
      throw new Error('文件大小超过2GB限制');
    }

    // 如果没有提供displayName，使用文件名
    const fileName = displayName || path.basename(filePath);

    // 上传文件到 Google Files API
    const uploadResult = await ai.files.upload({
      file: filePath,
      config: { 
        mimeType: mimeType,
        displayName: fileName
      }
    });

    return {
      success: true,
      data: {
        fileId: uploadResult.name,
        name: uploadResult.displayName || fileName,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        createTime: uploadResult.createTime,
        updateTime: uploadResult.updateTime,
        uri: uploadResult.uri,
        state: uploadResult.state,
        sha256Hash: uploadResult.sha256Hash,
        expirationTime: uploadResult.expirationTime
      }
    };
  } catch (error) {
    console.error('上传文件到Google Files API失败:', error);
    throw new Error(`上传失败: ${error.message}`);
  }
};

/**
 * 获取文件信息
 * @param {string} fileId - 文件ID
 * @returns {Promise<Object>} 文件信息
 */
export const getFileInfo = async (fileId) => {
  try {
    const fileInfo = await ai.files.retrieve(fileId);
    
    return {
      success: true,
      data: {
        fileId: fileInfo.name,
        name: fileInfo.displayName,
        mimeType: fileInfo.mimeType,
        sizeBytes: fileInfo.sizeBytes,
        createTime: fileInfo.createTime,
        updateTime: fileInfo.updateTime,
        uri: fileInfo.uri,
        state: fileInfo.state,
        sha256Hash: fileInfo.sha256Hash,
        expirationTime: fileInfo.expirationTime
      }
    };
  } catch (error) {
    console.error('获取文件信息失败:', error);
    throw new Error(`获取文件信息失败: ${error.message}`);
  }
};

/**
 * 列出所有文件
 * @param {number} pageSize - 页面大小（可选，默认10）
 * @param {string} pageToken - 页面令牌（可选）
 * @returns {Promise<Object>} 文件列表
 */
export const listFiles = async (pageSize = 10, pageToken = null) => {
  try {
    const options = {
      pageSize: pageSize
    };
    
    if (pageToken) {
      options.pageToken = pageToken;
    }

    const listResult = await ai.files.list(options);
    
    // 处理异步迭代器
    const files = [];
    for await (const file of listResult) {
      files.push({
        fileId: file.name,
        name: file.displayName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        createTime: file.createTime,
        updateTime: file.updateTime,
        uri: file.uri,
        state: file.state,
        sha256Hash: file.sha256Hash,
        expirationTime: file.expirationTime
      });
    }
    
    return {
      success: true,
      data: {
        files: files,
        nextPageToken: listResult.nextPageToken || null
      }
    };
  } catch (error) {
    console.error('获取文件列表失败:', error);
    throw new Error(`获取文件列表失败: ${error.message}`);
  }
};

/**
 * 删除文件
 * @param {string} fileId - 文件ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteFile = async (fileId) => {
  try {
    await ai.files.delete(fileId);
    
    return {
      success: true,
      message: '文件删除成功'
    };
  } catch (error) {
    console.error('删除文件失败:', error);
    throw new Error(`删除文件失败: ${error.message}`);
  }
};

/**
 * 根据文件扩展名获取MIME类型
 * @param {string} filename - 文件名
 * @returns {string} MIME类型
 */
export const getMimeTypeFromFilename = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    // 音频文件
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    // 图片文件
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    // 视频文件
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.mkv': 'video/x-matroska',
    // 文档文件
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.rtf': 'application/rtf'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};