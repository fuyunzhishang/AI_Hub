import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import digitalHumanConfig from '../config/digitalHuman.js';

const API_BASE_URL = 'https://api.16ai.vip';
const BEARER_TOKEN = digitalHumanConfig.pomegranateToken;

/**
 * 创建授权视频验证任务
 * @param {string} videoPath - 视频文件路径
 * @param {string} content - 授权文案
 * @param {Object} options - 可选参数
 * @returns {Promise<Object>} - 任务结果
 */
export const createAuthVideo = async (videoPath, content, options = {}) => {
  try {
    // 检查视频文件是否存在
    if (!fs.existsSync(videoPath)) {
      throw new Error('视频文件不存在');
    }

    // 创建表单数据
    const formData = new FormData();
    
    // 添加视频文件
    const videoStream = fs.createReadStream(videoPath);
    formData.append('video', videoStream);
    
    // 添加授权文案
    formData.append('content', content);
    
    // 添加其他可选参数
    Object.keys(options).forEach(key => {
      if (options[key] !== undefined) {
        formData.append(key, options[key]);
      }
    });

    // 发送请求
    const response = await axios.post(`${API_BASE_URL}/api/auth-video`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data',
        'Authorization': BEARER_TOKEN
      },
      timeout: 30000, // 30秒超时
    });

    return {
      success: true,
      data: response.data,
      authId: response.data.authId || response.data.AuthID || response.data.taskId,
      message: '授权视频任务创建成功'
    };

  } catch (error) {
    console.error('创建授权视频任务失败:', error);
    
    // 处理不同类型的错误
    if (error.response) {
      // 服务器响应错误
      throw new Error(`API请求失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      // 网络错误
      throw new Error('网络请求失败，请检查网络连接');
    } else {
      // 其他错误
      throw new Error(`创建授权视频任务失败: ${error.message}`);
    }
  }
};

/**
 * 查询授权视频任务状态
 * @param {string} authId - 授权任务ID
 * @returns {Promise<Object>} - 查询结果
 */
export const queryAuthVideo = async (authId) => {
  try {
    if (!authId) {
      throw new Error('授权任务ID不能为空');
    }

    const response = await axios.get(`${API_BASE_URL}/api/auth-video/${authId}`, {
      headers: {
        'Authorization': BEARER_TOKEN
      },
      timeout: 10000, // 10秒超时
    });

    return {
      success: true,
      data: response.data,
      authId: authId,
      status: response.data.status,
      message: '查询授权视频任务状态成功'
    };

  } catch (error) {
    console.error('查询授权视频任务状态失败:', error);
    
    if (error.response) {
      throw new Error(`API请求失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('网络请求失败，请检查网络连接');
    } else {
      throw new Error(`查询授权视频任务状态失败: ${error.message}`);
    }
  }
};

/**
 * 通过URL创建授权视频任务
 * @param {string} videoUrl - 视频文件URL
 * @param {string} content - 授权文案
 * @param {Object} options - 可选参数
 * @returns {Promise<Object>} - 任务结果
 */
export const createAuthVideoByUrl = async (videoUrl, content, options = {}) => {
  try {
    if (!videoUrl) {
      throw new Error('视频URL不能为空');
    }

    if (!content) {
      throw new Error('授权文案不能为空');
    }

    // 创建请求数据
    const requestData = {
      videoUrl: videoUrl,
      content: content,
      ...options
    };

    // 发送请求
    const response = await axios.post(`${API_BASE_URL}/api/auth-video-url`, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': BEARER_TOKEN
      },
      timeout: 30000, // 30秒超时
    });

    return {
      success: true,
      data: response.data,
      authId: response.data.authId || response.data.AuthID || response.data.taskId,
      message: '通过URL创建授权视频任务成功'
    };

  } catch (error) {
    console.error('通过URL创建授权视频任务失败:', error);
    
    if (error.response) {
      throw new Error(`API请求失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('网络请求失败，请检查网络连接');
    } else {
      throw new Error(`通过URL创建授权视频任务失败: ${error.message}`);
    }
  }
};