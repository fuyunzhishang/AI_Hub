import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import { TTSSocketClient } from '../utils/websocketClient.js';
import { v4 as uuidv4 } from 'uuid';
import VolcengineSigner from '../utils/volcengineSigner.js';

dotenv.config();

// 字节跳动API配置
const BYTE_DANCE_API_URL = 'https://openspeech.bytedance.com/api/v1/mega_tts/audio/upload';
const APP_ID = process.env.BYTE_DANCE_APP_ID;
const ACCESS_TOKEN = process.env.BYTE_DANCE_ACCESS_TOKEN;


/**
 * 读取音频文件并转换为Base64
 * @param {string} filePath - 音频文件路径
 * @returns {string} Base64编码的音频数据
 */
const getAudioBase64 = (filePath) => {
  const fileContent = fs.readFileSync(filePath);
  return fileContent.toString('base64');
};

/**
 * 处理API错误响应
 * @param {Object} response - API响应对象
 * @throws {Error} 带有错误代码和消息的异常
 */
const handleApiError = (response) => {
  if (response.data && response.data.BaseResp) {
    const errorCode = response.data.BaseResp.StatusCode;
    const errorMsg = response.data.BaseResp.StatusMessage || '未知错误';
    const error = new Error(`API错误: ${errorMsg}`);
    error.code = errorCode;
    throw error;
  } else {
    throw new Error(`API请求失败: ${JSON.stringify(response.data)}`);
  }
};

/**
 * 调用字节跳动音色训练API
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} API响应结果
 */
export const trainVoice = async (params) => {
  try {
    // 验证配置
    if (!APP_ID || !ACCESS_TOKEN) {
      throw new Error('字节跳动API配置不完整，请检查BYTE_DANCE_APP_ID和BYTE_DANCE_ACCESS_TOKEN环境变量');
    }

    // 读取并编码音频文件
    const audioBytes = getAudioBase64(params.filePath);

    // 构建请求数据
    const requestData = {
      appid: APP_ID,
      speaker_id: params.speakerId,
      audios: [{
        audio_bytes: audioBytes,
        audio_format: params.audioFormat,
        text: params.text
      }],
      source: 2,
      language: params.language,  // 确保传递语种参数
      model_type: params.modelType  // 传递模型类型参数
    };

    // 发送请求
    const response = await axios.post(BYTE_DANCE_API_URL, requestData, {
      headers: {
        'Authorization': `Bearer; ${ACCESS_TOKEN}`,
        'Resource-Id': 'volc.megatts.voiceclone',
        'Content-Type': 'application/json'
      }
    });

    // 处理响应
    if (response.data && response.data.BaseResp && response.data.BaseResp.StatusCode === 0) {
      return {
        speaker_id: response.data.speaker_id,
        requestId: response.headers['x-request-id'] || '',
        message: '训练任务已提交'
      };
    } else {
      handleApiError(response);
    }
  } catch (error) {
    console.error(`[音色训练服务] 错误: ${error.message}`);
    // 如果是Axios错误，尝试提取更多信息
    if (error.response) {
      handleApiError(error.response);
    } else {
      throw error;
    }
  }
};

/**
 * 查询音色训练状态
 * @param {Object} params - 查询参数
 * @param {string} params.speakerId - 音色ID
 * @returns {Promise<Object>} 训练状态结果
 */
export const getVoiceTrainingStatus = async (params) => {
  try {
    if (!APP_ID || !ACCESS_TOKEN) {
      throw new Error('字节跳动API配置不完整，请检查BYTE_DANCE_APP_ID和BYTE_DANCE_ACCESS_TOKEN环境变量');
    }

    const response = await axios.post('https://openspeech.bytedance.com/api/v1/mega_tts/status', {
      appid: APP_ID,
      speaker_id: params.speakerId
    }, {
      headers: {
        'Authorization': `Bearer; ${ACCESS_TOKEN}`,
        'Resource-Id': 'volc.megatts.voiceclone',
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.BaseResp && response.data.BaseResp.StatusCode === 0) {
      return response.data;
    } else {
      handleApiError(response);
    }
  } catch (error) {
    console.error(`[查询音色训练状态] 错误: ${error.message}`);
    if (error.response) {
      handleApiError(error.response);
    } else {
      throw error;
    }
  }
};

/**
 * 获取合成配置（根据model_type选择cluster和resourceId）
 * @param {number} modelType - 模型类型
 * @param {boolean} isConcurrent - 是否并发版
 * @returns {Object} 合成配置
 */
const getSynthesisConfig = (modelType, isConcurrent = false) => {
  // model_type=1/2/3时需要替换cluster
  if ([1, 2, 3].includes(modelType)) {
    return {
      cluster: isConcurrent ? 'volcano_icl_concurr' : 'volcano_icl',
      resourceId: isConcurrent ? 'volc.megatts.concurr' : 'volc.megatts.default'
    };
  }
  // 默认配置
  return {
    cluster: isConcurrent ? 'volcano_mega_concurr' : 'volcano_mega',
    resourceId: 'volc.megatts.voiceclone'
  };
};


