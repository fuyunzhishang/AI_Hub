import fs from 'fs';
import path from 'path';
// 在文件顶部添加导入语句
import * as voiceService from '../services/voiceService.js';
import { trainVoice as trainVoiceService } from '../services/voiceService.js';

/**
 * 处理音色训练请求
 */
export const trainVoice = async (req, res) => {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({ error: '没有上传音频文件' });
    }

    const { speaker_id, text, language, model_type } = req.body;

    // 验证必填参数
    if (!speaker_id) {
      return res.status(400).json({ error: '缺少必填参数speaker_id' });
    }

    const file = req.file;
    console.log(`[音色训练] 开始处理: speaker_id=${speaker_id}, 文件=${file.originalname}, 大小=${file.size} bytes`);

    // 调用服务层处理
    const result = await trainVoiceService({
      filePath: file.path,
      speakerId: speaker_id,
      text: text || '',
      language: language ? parseInt(language) : 0,
      modelType: model_type ? parseInt(model_type) : 0,
      audioFormat: path.extname(file.originalname).replace('.', '').toLowerCase()
    });

    // 删除临时文件
    fs.unlinkSync(file.path);

    return res.status(200).json({
      success: true,
      message: '音色训练请求提交成功',
      data: result
    });
  } catch (error) {
    console.error(`[音色训练] 处理失败: ${error.message}`);
    // 尝试删除临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      error: '音色训练请求处理失败',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
};

/**
 * 查询音色训练状态
 */
export const listVoiceStatus = async (req, res) => {
  try {
    const { speakerIDs, state, orderTimeStart, orderTimeEnd, expireTimeStart, expireTimeEnd } = req.query;

    // 处理数组参数
    const parsedSpeakerIDs = speakerIDs ? speakerIDs.split(',') : undefined;

    // 调用服务层
    const result = await voiceService.listVoiceStatus({
      speakerIDs: parsedSpeakerIDs,
      state,
      orderTimeStart: orderTimeStart ? parseInt(orderTimeStart) : undefined,
      orderTimeEnd: orderTimeEnd ? parseInt(orderTimeEnd) : undefined,
      expireTimeStart: expireTimeStart ? parseInt(expireTimeStart) : undefined,
      expireTimeEnd: expireTimeEnd ? parseInt(expireTimeEnd) : undefined
    });

    res.json({
      code: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    console.error('查询音色状态接口异常:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '查询音色状态失败'
    });
  }
};

/**
 * HTTP方式文本转语音
 */
export const synthesizeVoiceHttp = async (req, res) => {
  try {
    const { text, voice_type, encoding, speed_ratio, explicit_language } = req.body;
    const { appid, token } = req.user;  // 假设从认证中获取，或从环境变量读取

    // 参数验证
    if (!text) {
      return res.status(400).json({ code: 400, message: '文本内容不能为空' });
    }
    if (!voice_type || !voice_type.startsWith('S_')) {
      return res.status(400).json({ code: 400, message: '无效的音色ID，必须以S_开头' });
    }

    // 调用服务层
    const audioBuffer = await textToSpeechHttp({
      text,
      voiceType: voice_type,
      appid: appid || process.env.BYTE_DANCE_APPID,
      token: token || process.env.BYTE_DANCE_TOKEN,
      encoding,
      speedRatio: speed_ratio,
      explicitLanguage: explicit_language
    });

    // 设置响应头并返回音频
    res.setHeader('Content-Type', `audio/${encoding === 'pcm' ? 'x-wav' : encoding}`);
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('X-Tt-Logid', req.body.reqid || uuidv4());  // 返回logid便于追踪
    res.send(audioBuffer);
  } catch (error) {
    console.error('语音合成失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '语音合成服务异常'
    });
  }
};

/**
 * 音色下单
 */
export const orderVoiceResource = async (req, res) => {
  try {
    const { times, quantity, autoUseCoupon, couponID, resourceTag } = req.body;

    // 参数验证
    if (!times || !quantity) {
      return res.status(400).json({
        code: 400,
        message: '时长(Times)和数量(Quantity)为必填参数'
      });
    }

    if (!Number.isInteger(times) || times <= 0) {
      return res.status(400).json({
        code: 400,
        message: '时长(Times)必须为正整数'
      });
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 2000) {
      return res.status(400).json({
        code: 400,
        message: '数量(Quantity)必须为1-2000之间的整数'
      });
    }

    // 调用服务层
    const result = await voiceService.orderVoiceResourcePacks({
      times,
      quantity,
      autoUseCoupon,
      couponID,
      resourceTag
    });

    res.json({
      code: 200,
      message: '下单成功',
      data: result
    });
  } catch (error) {
    console.error('音色下单接口异常:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '音色下单失败'
    });
  }
};

/**
 * 音色续费
 */
export const renewVoiceResource = async (req, res) => {
  try {
    const { times, speakerIDs, autoUseCoupon, couponID } = req.body;

    // 参数验证
    if (times === undefined || !Number.isInteger(times) || times <= 0) {
      return res.status(400).json({
        code: 400,
        message: '续费时长(Times)必须为正整数'
      });
    }

    if (speakerIDs && (!Array.isArray(speakerIDs) || speakerIDs.length === 0 || speakerIDs.length > 2000)) {
      return res.status(400).json({
        code: 400,
        message: 'SpeakerID列表必须为非空数组且长度不超过2000'
      });
    }

    // 调用服务层
    const result = await voiceService.renewVoiceResourcePacks({
      times,
      speakerIDs,
      autoUseCoupon,
      couponID
    });

    res.json({
      code: 200,
      message: '续费成功',
      data: result
    });
  } catch (error) {
    console.error('音色续费接口异常:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '音色续费失败'
    });
  }
};

/**
 * 火山引擎原生接口 - 查询音色训练状态
 */
export const megaTtsStatus = async (req, res) => {
  try {
    const { AppID, SpeakerIDs, State, OrderTimeStart, OrderTimeEnd, ExpireTimeStart, ExpireTimeEnd } = req.body;

    // 参数验证
    if (!AppID) {
      return res.status(400).json({
        ResponseMetadata: {
          Error: {
            Code: "OperationDenied.InvalidParameter",
            Message: "缺少必填参数 AppID"
          }
        }
      });
    }

    // 调用服务层
    const result = await voiceService.listVoiceStatus({
      appid: AppID,
      speakerIDs: SpeakerIDs,
      state: State,
      orderTimeStart: OrderTimeStart,
      orderTimeEnd: OrderTimeEnd,
      expireTimeStart: ExpireTimeStart,
      expireTimeEnd: ExpireTimeEnd
    });

    res.json({
      ResponseMetadata: {
        RequestId: req.headers['x-request-id'] || '',
        Action: 'ListMegaTTSTrainStatus',
        Version: '2023-11-07',
        Service: 'speech_saas_prod',
        Region: 'cn-north-1'
      },
      Result: result
    });
  } catch (error) {
    console.error('查询音色状态接口异常:', error);
    res.status(500).json({
      ResponseMetadata: {
        Error: {
          Code: error.code || 'InternalError.NotCaptured',
          Message: error.message || '未知错误'
        }
      }
    });
  }
};

/**
 * 批量查询音色训练状态
 */
export const batchListMegaTTSTrainStatus = async (req, res) => {
  try {
    const { speakerIDs, state } = req.body;

    // 参数验证
    if (!speakerIDs || !Array.isArray(speakerIDs) || speakerIDs.length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'speakerIDs必须是非空数组'
      });
    }

    if (speakerIDs.length > 100) {
      return res.status(400).json({
        code: 400,
        message: '批量查询最多支持100个speakerID'
      });
    }

    // 调用服务层
    const result = await voiceService.listVoiceStatus({
      speakerIDs,
      state
    });

    res.json({
      code: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    console.error('批量查询音色状态接口异常:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '批量查询音色状态失败'
    });
  }
};

// 在默认导出中添加 batchListMegaTTSTrainStatus 方法
export default {
    trainVoice,
    listVoiceStatus,
    orderVoiceResource,
    renewVoiceResource,
    synthesizeVoiceHttp,
    batchListMegaTTSTrainStatus,
    megaTtsStatus  // 添加此行
};
