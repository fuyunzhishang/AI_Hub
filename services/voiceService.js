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
      language: params.language,
      model_type: params.modelType
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
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} 训练状态结果
 */
export const getVoiceTrainingStatus = async (params) => {
  try {
    // 验证配置
    if (!APP_ID || !ACCESS_TOKEN) {
      throw new Error('字节跳动API配置不完整，请检查BYTE_DANCE_APP_ID和BYTE_DANCE_ACCESS_TOKEN环境变量');
    }

    // 构建请求数据
    const requestData = {
      appid: APP_ID,
      speaker_id: params.speakerId
    };

    // 发送请求
    const response = await axios.post('https://openspeech.bytedance.com/api/v1/mega_tts/status', requestData, {
      headers: {
        'Authorization': `Bearer; ${ACCESS_TOKEN}`,
        'Resource-Id': 'volc.megatts.voiceclone',
        'Content-Type': 'application/json'
      }
    });

    // 处理响应
    if (response.data && response.data.BaseResp && response.data.BaseResp.StatusCode === 0) {
      // 状态映射
      const statusMap = {
        0: 'NotFound',
        1: 'Training',
        2: 'Success',
        3: 'Failed',
        4: 'Active'
      };

      return {
        speaker_id: response.data.speaker_id,
        status: statusMap[response.data.status] || 'Unknown',
        statusCode: response.data.status,
        create_time: new Date(response.data.create_time * 1000).toISOString(),
        version: response.data.version || '',
        demo_audio: response.data.demo_audio || '',
        requestId: response.headers['x-request-id'] || ''
      };
    } else {
      handleApiError(response);
    }
  } catch (error) {
    console.error(`[音色训练状态查询] 错误: ${error.message}`);
    if (error.response) {
      handleApiError(error.response);
    } else {
      throw error;
    }
  }
};

/**
 * 文本转语音合成
 * @param {Object} params - 请求参数
 * @returns {Promise<Buffer>} 合成的音频数据
 */
export const textToSpeech = async (params) => {
  const { text, voiceType, audioFormat = 'mp3', sampleRate = 24000, bitrate = 64000 } = params;

  // 验证配置
  if (!APP_ID || !ACCESS_TOKEN) {
    throw new Error('字节跳动API配置不完整，请检查BYTE_DANCE_APP_ID和BYTE_DANCE_ACCESS_TOKEN环境变量');
  }

  if (!text || !voiceType) {
    throw new Error('缺少必填参数：text和voiceType');
  }

  const client = new TTSSocketClient();

  try {
    // 连接到WebSocket服务
    await client.connect({
      url: 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary',
      token: ACCESS_TOKEN
    });

    // 发送合成请求并获取音频数据
    const audioBuffer = await client.sendSynthesisRequest({
      appid: APP_ID,
      text: text,
      voiceType: voiceType,
      audioFormat: audioFormat,
      sampleRate: sampleRate,
      bitrate: bitrate
    });

    return {
      audioData: audioBuffer,
      format: audioFormat,
      sampleRate: sampleRate,
      bitrate: bitrate
    };
  } finally {
    // 确保资源被清理
    client.destroy();
  }
};

/**
 * 音色下单接口
 * @param {Object} params - 下单参数
 * @returns {Promise<Object>} - 订单信息
 */
export const orderVoiceResourcePacks = async (params) => {
  const { times, quantity, autoUseCoupon, couponID, resourceTag } = params;
  const accessKey = process.env.VOLC_ACCESS_KEY;
  const secretKey = process.env.VOLC_SECRET_KEY;
  const appid = process.env.VOLC_APP_ID;

  // 验证必要配置和参数
  if (!accessKey || !secretKey || !appid) {
    throw new Error('火山引擎API配置不完整，请检查VOLC_ACCESS_KEY、VOLC_SECRET_KEY和VOLC_APP_ID');
  }
  if (!times || !quantity) {
    throw new Error('时长(Times)和数量(Quantity)为必填参数');
  }
  if (quantity > 2000) {
    throw new Error('单次下单数量不能超过2000个音色');
  }

  // 创建签名器
  const signer = new VolcengineSigner(accessKey, secretKey);

  // 构造请求体
  const requestBody = {
    AppID: appid,
    ResourceID: 'volc.megatts.voiceclone', // 固定资源标识
    Code: 'Model_storage', // 固定计费项标识
    Times: times,
    Quantity: quantity,
    ...(autoUseCoupon !== undefined && { AutoUseCoupon: autoUseCoupon }),
    ...(couponID && { CouponID: couponID }),
    ...(resourceTag && { ResourceTag: resourceTag })
  };

  // 生成签名
  const { headers, url } = signer.sign('OrderAccessResourcePacks', requestBody);

  try {
    const response = await axios.post(url, requestBody, { headers });

    // 处理错误响应
    if (response.data.ResponseMetadata && response.data.ResponseMetadata.Error) {
      const error = response.data.ResponseMetadata.Error;
      throw new Error(`[${error.Code}] ${error.Message}`);
    }

    return response.data.Result || {};
  } catch (error) {
    console.error('音色下单失败:', error);
    throw error;
  }
};
/**
 * 查询音色训练状态
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} - 音色状态列表
 */
export const listVoiceStatus = async (params) => {
  const { speakerIDs, state, orderTimeStart, orderTimeEnd, expireTimeStart, expireTimeEnd } = params;
  const accessKey = process.env.VOLC_ACCESS_KEY;
  const secretKey = process.env.VOLC_SECRET_KEY;
  const appid = process.env.VOLC_APP_ID;

  // 验证必要配置
  if (!accessKey || !secretKey || !appid) {
    throw new Error('火山引擎API配置不完整，请检查VOLC_ACCESS_KEY、VOLC_SECRET_KEY和VOLC_APP_ID');
  }

  // 创建签名器
  const signer = new VolcengineSigner(accessKey, secretKey);

  // 构造请求体
  const requestBody = {
    AppID: appid,
    ...(speakerIDs && { SpeakerIDs: speakerIDs }),
    ...(state && { State: state }),
    ...(orderTimeStart && { OrderTimeStart: orderTimeStart }),
    ...(orderTimeEnd && { OrderTimeEnd: orderTimeEnd }),
    ...(expireTimeStart && { ExpireTimeStart: expireTimeStart }),
    ...(expireTimeEnd && { ExpireTimeEnd: expireTimeEnd })
  };

  // 生成签名
  const { headers, url } = signer.sign('ListMegaTTSTrainStatus', requestBody);

  try {
    const response = await axios.post(url, requestBody, { headers });

    // 处理错误响应
    if (response.data.ResponseMetadata && response.data.ResponseMetadata.Error) {
      const error = response.data.ResponseMetadata.Error;
      throw new Error(`[${error.Code}] ${error.Message}`);
    }

    return response.data.Result || {};
  } catch (error) {
    console.error('查询音色状态失败:', error);
    throw error;
  }
};

/**
 * 文本转语音(HTTP方式)
 * @param {Object} params - 请求参数
 * @returns {Promise<Buffer>} - 合成的音频Buffer
 */
export const textToSpeechHttp = async (params) => {
  const { text, voiceType, appid, token, encoding = 'mp3', speedRatio = 1, explicitLanguage } = params;

  // 验证必要参数
  if (!text || !voiceType || !appid || !token) {
    throw new Error('缺少必要参数');
  }

  // 生成唯一reqid
  const reqid = uuidv4();

  try {
    const response = await axios.post('https://openspeech.bytedance.com/api/v1/tts', {
      app: {
        appid,
        token,
        cluster: 'volcano_icl'  // 按要求替换为volcano_icl
      },
      user: {
        uid: 'ai_hub_user'  // 可配置为实际用户ID
      },
      audio: {
        voice_type: voiceType,  // 传入声音id
        encoding,
        speed_ratio: speedRatio,
        ...(explicitLanguage && { explicit_language: explicitLanguage })
      },
      request: {
        reqid,
        text,
        operation: 'query',  // HTTP方式固定为query
        text_type: 'plain'
      }
    }, {
      headers: {
        'Authorization': `Bearer;${token}`,  // 注意分号分隔
        'Content-Type': 'application/json'
      }
    });

    // 处理响应
    const result = response.data;
    if (result.code !== 3000) {
      throw new Error(`合成失败: ${result.message || '未知错误'} (错误码: ${result.code})`);
    }

    // 解码base64音频数据
    return Buffer.from(result.data, 'base64');
  } catch (error) {
    console.error('TTS HTTP请求失败:', error);
    throw error;
  }
};
/**
 * 音色续费接口
 * @param {Object} params - 续费参数
 * @returns {Promise<Object>} - 订单信息
 */
export const renewVoiceResourcePacks = async (params) => {
    const { times, speakerIDs, autoUseCoupon, couponID } = params;
    const accessKey = process.env.VOLC_ACCESS_KEY;
    const secretKey = process.env.VOLC_SECRET_KEY;
    const appid = process.env.VOLC_APP_ID;

    // 添加签名器实例创建
    const signer = new VolcengineSigner(accessKey, secretKey);

  // 构造请求体
  const requestBody = {
    AppID: appid,
    Times: times,
    ...(speakerIDs && speakerIDs.length > 0 && { SpeakerIDs: speakerIDs }),
    ...(autoUseCoupon !== undefined && { AutoUseCoupon: autoUseCoupon }),
    ...(couponID && { CouponID: couponID })
  };

  // 生成签名
  const { headers, url } = signer.sign('RenewAccessResourcePacks', requestBody);

  try {
    const response = await axios.post(url, requestBody, { headers });

    // 处理错误响应
    if (response.data.ResponseMetadata && response.data.ResponseMetadata.Error) {
      const error = response.data.ResponseMetadata.Error;
      throw new Error(`[${error.Code}] ${error.Message}`);
    }

    return response.data.Result || {};
  } catch (error) {
    console.error('音色续费失败:', error);
    throw error;
  }
};