import tencentcloud from "tencentcloud-sdk-nodejs";
import fs from 'fs';
import path from 'path';
import { getValidTencentCloudCredentials } from '../utils/credentialManager.js';

// 导入腾讯云语音识别客户端
const AsrClient = tencentcloud.asr.v20190614.Client;

/**
 * 等待语音识别任务完成
 * @param {Object} client - 腾讯云语音识别客户端
 * @param {string} taskId - 任务ID
 * @param {number} maxRetries - 最大重试次数
 * @param {number} retryInterval - 重试间隔(毫秒)
 * @returns {Promise<Object>} - 任务结果
 */
const waitForTaskCompletion = async (client, taskId, maxRetries = 30, retryInterval = 2000) => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // 查询任务状态
      const params = {
        TaskId: taskId
      };

      const response = await client.DescribeTaskStatus(params);

      // 任务完成
      if (response.Data.Status === 2) {
        return response;
      }
      // 任务失败
      else if (response.Data.Status === 3) {
        throw new Error(`任务执行失败: ${response.Data.ErrorMsg}`);
      }
      // 任务进行中，继续等待
      else {
        retries++;
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    } catch (error) {
      retries++;
      // 如果错误是由于任务查询失败而不是任务本身失败，继续等待
      if (!error.message.includes('任务执行失败')) {
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      } else {
        throw error;
      }
    }
  }

  throw new Error(`语音识别任务等待超时，请稍后查询结果。任务ID: ${taskId}`);
};

/**
 * 语音识别服务
 * 使用腾讯云的语音识别服务来识别音频文件内容
 */
export const recognizeSpeech = async (filePath, EngineModelType = '16k_zh') => {
  try {
    // 读取音频文件并转为Base64
    const fileContent = fs.readFileSync(filePath);
    const base64Audio = fileContent.toString('base64');

    // 获取有效的腾讯云密钥
    const credentials = await getValidTencentCloudCredentials();

    // 实例化语音识别客户端
    const client = new AsrClient({
      credential: {
        secretId: credentials.secretId,
        secretKey: credentials.secretKey,
      },
      region: "ap-shanghai",
      profile: {
        httpProfile: {
          reqTimeout: 60, // 超时时间
        },
      },
    });

    // 获取文件扩展名
    const fileExt = path.extname(filePath).replace('.', '');
    // 构造请求参数
    const params = {
      EngineModelType: EngineModelType, // 引擎服务类型，必需参数
      ChannelNum: 1, // 声道数
      ResTextFormat: 0, // 文本格式，0：纯文本
      SourceType: 1, // 音频数据来源，1：语音数据来自Base64编码
      Data: base64Audio, // Base64编码的音频数据
      DataLen: fileContent.length, // 语音数据长度
      FilterDirty: 0, // 是否过滤脏话，0：不过滤，1：过滤
      FilterModal: 0, // 是否过滤语气词，0：不过滤，1：过滤
      FilterPunc: 0, // 是否过滤标点符号，0：不过滤，1：过滤
      ConvertNumMode: 0, // 是否进行阿拉伯数字智能转换，0：不转换，1：转换
    };
    // console.log(`发送语音识别请求，引擎类型: ${engineType}, 服务类型: ${engSerViceType}, 音频格式: ${params.AudioFormat}, 文件大小: ${fileContent.length}字节`);
    const data = await client.CreateRecTask(params);
    // console.log('语音识别请求响应:', JSON.stringify(data));

    // CreateRecTask返回的是任务ID，需要等待任务完成并获取结果
    if (data && data.Data && data.Data.TaskId) {
      // 等待任务完成
      const taskResult = await waitForTaskCompletion(client, data.Data.TaskId);

      return {
        success: true,
        result: taskResult,
        text: taskResult.Data && taskResult.Data.ResultDetail ?
          taskResult.Data.ResultDetail.map(item => item.FinalSentence).join('') : '',
        taskId: data.Data.TaskId,
        wordCount: taskResult.Data && taskResult.Data.ResultDetail ?
          taskResult.Data.ResultDetail.reduce((acc, item) => acc + (item.FinalSentence ? item.FinalSentence.length : 0), 0) : 0,
        audioFormat: params.AudioFormat,
      };
    } else {
      return {
        success: true,
        result: data,
        text: '',
        taskId: data.Data ? data.Data.TaskId : '',
        wordCount: 0,
        audioFormat: params.AudioFormat,
      };
    }
  } catch (error) {
    console.error('语音识别错误:', error);
    throw new Error(`语音识别失败: ${error.message}`);
  }
};

/**
 * 通过URL进行语音识别
 * 适用于大文件，文件已上传到COS
 * @param {string} fileUrl - 音频文件的URL
 * @param {string} EngineModelType - 引擎类型
 * @returns {Promise<Object>} - 识别结果
 */
export const recognizeSpeechByUrl = async (fileUrl, EngineModelType = '16k_zh') => {
  try {
    // 导入URL验证函数
    const { validateUrl } = await import('./cosService.js');

    // 验证URL是否可访问
    console.log('验证COS文件URL是否可访问...');
    const urlValidation = await validateUrl(fileUrl);

    if (!urlValidation.accessible) {
      console.error('COS文件URL不可访问:', urlValidation);
      throw new Error(`COS文件无法访问: ${urlValidation.error} (状态码: ${urlValidation.status || 'N/A'})`);
    }

    console.log('COS文件URL验证成功:', {
      url: fileUrl,
      contentType: urlValidation.contentType,
      contentLength: urlValidation.contentLength
    });

    // 获取有效的腾讯云密钥
    const credentials = await getValidTencentCloudCredentials();

    // 实例化语音识别客户端
    const client = new AsrClient({
      credential: {
        secretId: credentials.secretId,
        secretKey: credentials.secretKey,
      },
      region: "ap-shanghai",
      profile: {
        httpProfile: {
          reqTimeout: 60, // 超时时间
        },
      },
    });

    // 构造请求参数 - 使用URL方式
    const params = {
      EngineModelType: EngineModelType, // 引擎服务类型，必需参数
      ChannelNum: 1, // 声道数
      ResTextFormat: 0, // 文本格式，0：纯文本
      SourceType: 0, // 音频数据来源，0：语音数据来自URL
      Url: fileUrl, // 音频文件的URL
      FilterDirty: 0, // 是否过滤脏话，0：不过滤，1：过滤
      FilterModal: 0, // 是否过滤语气词，0：不过滤，1：过滤
      FilterPunc: 0, // 是否过滤标点符号，0：不过滤，1：过滤
      ConvertNumMode: 0, // 是否进行阿拉伯数字智能转换，0：不转换，1：转换
    };

    console.log(`发送URL语音识别请求，引擎类型: ${EngineModelType}, 文件URL: ${fileUrl}`);
    const data = await client.CreateRecTask(params);
    console.log('URL语音识别请求响应:', JSON.stringify(data));

    // CreateRecTask返回的是任务ID，需要等待任务完成并获取结果
    if (data && data.Data && data.Data.TaskId) {
      // 等待任务完成
      const taskResult = await waitForTaskCompletion(client, data.Data.TaskId);

      return {
        success: true,
        result: taskResult,
        text: taskResult.Data && taskResult.Data.ResultDetail ?
          taskResult.Data.ResultDetail.map(item => item.FinalSentence).join('') : '',
        taskId: data.Data.TaskId,
        wordCount: taskResult.Data && taskResult.Data.ResultDetail ?
          taskResult.Data.ResultDetail.reduce((acc, item) => acc + (item.FinalSentence ? item.FinalSentence.length : 0), 0) : 0,
        sourceType: 'url',
        url: fileUrl,
        urlValidation: urlValidation
      };
    } else {
      return {
        success: true,
        result: data,
        text: '',
        taskId: data.Data ? data.Data.TaskId : '',
        wordCount: 0,
        sourceType: 'url',
        url: fileUrl,
        urlValidation: urlValidation
      };
    }
  } catch (error) {
    console.error('URL语音识别错误:', error);
    throw new Error(`URL语音识别失败: ${error.message}`);
  }
};