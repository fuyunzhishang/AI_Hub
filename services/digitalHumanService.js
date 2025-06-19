import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE_URL = 'https://api.16ai.chat/api/v1';

/**
 * 数字人API服务类
 * 提供数字人模型训练、视频生成、资产查询等服务
 */
class DigitalHumanService {
  constructor(bearerToken) {
    this.bearerToken = bearerToken;
    this.headers = {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * 创建axios实例
   */
  createAxiosInstance(contentType = 'application/json') {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Content-Type': contentType
      },
      timeout: 60000
    });
  }

  // ============================
  // Avatar API - 数字人模型管理
  // ============================

  /**
   * 训练数字人模型
   * @param {Object} params - 训练参数
   * @param {string} params.title - 数字人标题(可选)
   * @param {string} params.videoUrl - 视频链接(推荐)
   * @param {number} params.speakerId - 声音ID(可选)
   * @param {string} params.object - 视频对象路径(可选)
   * @param {string} params.authId - 授权视频ID(可选)
   * @returns {Promise<Object>} 返回包含avatarId的结果
   */
  async createAvatar(params) {
    try {
      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/avatar/create', params);
      return response.data;
    } catch (error) {
      console.error('训练数字人模型失败:', error.response?.data || error.message);
      throw new Error(`训练数字人模型失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 通过图片训练数字人模型
   * @param {Object} params - 训练参数
   * @param {string} params.imageUrl - 图片链接
   * @param {string} params.title - 数字人标题(可选)
   * @param {number} params.speakerId - 声音ID(可选)
   * @param {string} params.object - 视频对象路径(可选)
   * @param {string} params.authId - 授权视频ID(可选)
   * @returns {Promise<Object>} 返回包含avatarId的结果
   */
  async createAvatarByImage(params) {
    try {
      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/avatar/createByImage', params);
      return response.data;
    } catch (error) {
      console.error('通过图片训练数字人模型失败:', error.response?.data || error.message);
      throw new Error(`通过图片训练数字人模型失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 查询数字人训练状态
   * @param {number} avatarId - 数字人ID
   * @returns {Promise<Object>} 返回训练状态信息
   */
  async getAvatarStatus(avatarId) {
    try {
      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/avatar/status', { avatarId });
      return response.data;
    } catch (error) {
      console.error('查询数字人训练状态失败:', error.response?.data || error.message);
      throw new Error(`查询数字人训练状态失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 获取数字人列表
   * @returns {Promise<Object>} 返回数字人列表
   */
  async listAvatars() {
    try {
      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/avatar/list');
      return response.data;
    } catch (error) {
      console.error('获取数字人列表失败:', error.response?.data || error.message);
      throw new Error(`获取数字人列表失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 删除数字人模型
   * @param {number} avatarId - 数字人ID
   * @returns {Promise<Object>} 返回删除结果
   */
  async deleteAvatar(avatarId) {
    try {
      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/avatar/delete', { avatarId });
      return response.data;
    } catch (error) {
      console.error('删除数字人模型失败:', error.response?.data || error.message);
      throw new Error(`删除数字人模型失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  // ============================
  // Video API - 视频生成管理
  // ============================

  /**
   * 查询视频生成状态
   * @param {number} videoId - 视频ID
   * @returns {Promise<Object>} 返回视频状态信息
   */
  async getVideoStatus(videoId) {
    try {
      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/video/status', { videoId });
      return response.data;
    } catch (error) {
      console.error('查询视频生成状态失败:', error.response?.data || error.message);
      throw new Error(`查询视频生成状态失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 通过音频URL生成数字人视频
   * @param {Object} params - 生成参数
   * @param {number} params.avatarId - 数字人ID
   * @param {string} params.audioUrl - 音频文件URL
   * @param {string} params.title - 视频标题(可选)
   * @param {string} params.object - 音频对象路径(可选)
   * @returns {Promise<Object>} 返回包含videoId和length的结果
   */
  async createVideoByVoice(params) {
    try {
      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/video/createByVoice', params);
      return response.data;
    } catch (error) {
      console.error('通过音频URL生成数字人视频失败:', error.response?.data || error.message);
      throw new Error(`通过音频URL生成数字人视频失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 通过音频文件生成数字人视频
   * @param {Object} params - 生成参数
   * @param {number} params.avatarId - 数字人ID
   * @param {string} params.audioFilePath - 音频文件路径
   * @param {string} params.title - 视频标题(可选)
   * @returns {Promise<Object>} 返回包含videoId和length的结果
   */
  async createVideoByAudioFile(params) {
    try {
      const { avatarId, audioFilePath, title } = params;
      
      // 检查文件是否存在
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`音频文件不存在: ${audioFilePath}`);
      }

      // 检查文件大小(10MB限制)
      const stats = fs.statSync(audioFilePath);
      if (stats.size > 10 * 1024 * 1024) {
        throw new Error('音频文件大小不能超过10MB');
      }

      // 创建FormData
      const formData = new FormData();
      formData.append('avatarId', avatarId.toString());
      formData.append('audioFile', fs.createReadStream(audioFilePath));
      if (title) {
        formData.append('title', title);
      }

      // 创建带有multipart/form-data的axios实例
      const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          ...formData.getHeaders()
        },
        timeout: 120000 // 增加超时时间用于文件上传
      });

      const response = await axiosInstance.post('/video/createByAudioFile', formData);
      return response.data;
    } catch (error) {
      console.error('通过音频文件生成数字人视频失败:', error.response?.data || error.message);
      throw new Error(`通过音频文件生成数字人视频失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 通过文本生成数字人视频
   * @param {Object} params - 生成参数
   * @param {number} params.avatarId - 数字人ID
   * @param {number} params.speakerId - 声音ID
   * @param {string} params.text - 文本内容(最少10个字符)
   * @param {string} params.title - 视频标题(可选)
   * @param {number} params.speedRatio - 语速比例[0.2-3.0](可选，默认1.0)
   * @returns {Promise<Object>} 返回包含videoId和length的结果
   */
  async createVideoByText(params) {
    try {
      const { text } = params;
      
      // 验证文本长度
      if (!text || text.length < 10) {
        throw new Error('文本内容不能少于10个字符');
      }

      // 验证语速比例
      if (params.speedRatio && (params.speedRatio < 0.2 || params.speedRatio > 3.0)) {
        throw new Error('语速比例必须在0.2-3.0之间');
      }

      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/video/createByText', params);
      return response.data;
    } catch (error) {
      console.error('通过文本生成数字人视频失败:', error.response?.data || error.message);
      throw new Error(`通过文本生成数字人视频失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  // ============================
  // Speaker API - 音色管理
  // ============================

  /**
   * 创建音色
   * @param {Object} params - 创建参数
   * @param {string} params.audioUrl - 音频链接(与object互斥，优先级高)
   * @param {string} params.object - 音频对象路径(与audioUrl互斥)
   * @param {string} params.title - 音色标题(可选)
   * @param {string} params.model - 模型版本(V1.0|V2.0，默认V1.0)
   * @returns {Promise<Object>} 返回包含speakerId的结果
   */
  async createSpeaker(params) {
    try {
      const { audioUrl, object, title, model = 'V1.0' } = params;
      
      if (!audioUrl && !object) {
        throw new Error('audioUrl或object至少需要提供一个');
      }

      const requestData = {
        title: title || `未命名音色-${Date.now()}`,
        model
      };

      if (audioUrl) {
        requestData.audioUrl = audioUrl;
      } else {
        requestData.object = object;
      }

      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/speaker/create', requestData);
      return response.data;
    } catch (error) {
      console.error('创建音色失败:', error.response?.data || error.message);
      throw new Error(`创建音色失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 语音合成(文本转语音)
   * @param {Object} params - 合成参数
   * @param {string} params.text - 待合成文本
   * @param {number} params.speakerId - 音色ID
   * @param {number} params.speedRatio - 语速比例[0.2-3.0](可选，默认1.0)
   * @param {number} params.volumeRatio - 音量比例[0.1-3](可选，默认1.0)
   * @param {number} params.pitchRatio - 音调比例[0.1-3](可选，默认1.0)
   * @returns {Promise<Object>} 返回Base64编码的MP3音频和时长
   */
  async textToSpeech(params) {
    try {
      const { text, speakerId, speedRatio = 1.0, volumeRatio = 1.0, pitchRatio = 1.0 } = params;
      
      if (!text || !speakerId) {
        throw new Error('text和speakerId是必需参数');
      }

      if (speedRatio < 0.2 || speedRatio > 3.0) {
        throw new Error('speedRatio必须在0.2-3.0之间');
      }

      if (volumeRatio < 0.1 || volumeRatio > 3) {
        throw new Error('volumeRatio必须在0.1-3之间');
      }

      if (pitchRatio < 0.1 || pitchRatio > 3) {
        throw new Error('pitchRatio必须在0.1-3之间');
      }

      const requestData = {
        text,
        speakerId,
        speedRatio,
        volumeRatio,
        pitchRatio
      };

      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/speaker/tts', requestData);
      return response.data;
    } catch (error) {
      console.error('语音合成失败:', error.response?.data || error.message);
      throw new Error(`语音合成失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 查询音色列表
   * @returns {Promise<Object>} 返回音色列表
   */
  async listSpeakers() {
    try {
      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/speaker/list');
      return response.data;
    } catch (error) {
      console.error('查询音色列表失败:', error.response?.data || error.message);
      throw new Error(`查询音色列表失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 查询音色克隆任务状态
   * @param {number} speakerId - 音色ID
   * @returns {Promise<Object>} 返回音色状态信息
   */
  async getSpeakerStatus(speakerId) {
    try {
      if (!speakerId) {
        throw new Error('speakerId是必需参数');
      }

      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/speaker/status', { speakerId });
      return response.data;
    } catch (error) {
      console.error('查询音色状态失败:', error.response?.data || error.message);
      throw new Error(`查询音色状态失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 重新创建音色
   * @param {Object} params - 重建参数
   * @param {number} params.speakerId - 音色ID
   * @param {string} params.audioUrl - 音频链接(与object互斥，优先级高)
   * @param {string} params.object - 音频对象路径(与audioUrl互斥)
   * @returns {Promise<Object>} 返回剩余重建次数
   */
  async recreateSpeaker(params) {
    try {
      const { speakerId, audioUrl, object } = params;
      
      if (!speakerId) {
        throw new Error('speakerId是必需参数');
      }

      if (!audioUrl && !object) {
        throw new Error('audioUrl或object至少需要提供一个');
      }

      const requestData = { speakerId };
      
      if (audioUrl) {
        requestData.audioUrl = audioUrl;
      } else {
        requestData.object = object;
      }

      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/speaker/recreate', requestData);
      return response.data;
    } catch (error) {
      console.error('重新创建音色失败:', error.response?.data || error.message);
      throw new Error(`重新创建音色失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 删除音色
   * @param {number} speakerId - 音色ID
   * @returns {Promise<Object>} 返回删除结果
   */
  async deleteSpeaker(speakerId) {
    try {
      if (!speakerId) {
        throw new Error('speakerId是必需参数');
      }

      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/speaker/delete', { speakerId });
      return response.data;
    } catch (error) {
      console.error('删除音色失败:', error.response?.data || error.message);
      throw new Error(`删除音色失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 查询音色重新训练记录
   * @param {number} speakerId - 音色ID
   * @returns {Promise<Object>} 返回重训练记录时间戳数组
   */
  async getSpeakerRecreatedRecord(speakerId) {
    try {
      if (!speakerId) {
        throw new Error('speakerId是必需参数');
      }

      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/speaker/getRecreatedRecord', { speakerId });
      return response.data;
    } catch (error) {
      console.error('查询音色重训练记录失败:', error.response?.data || error.message);
      throw new Error(`查询音色重训练记录失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 生成文件上传预签名URL
   * @param {Object} params - 上传参数
   * @param {string} params.type - 文件类型(video|audio)
   * @param {string} params.suffix - 文件后缀名
   * @returns {Promise<Object>} 返回上传URL和相关信息
   */
  async getUploadUrl(params) {
    try {
      const { type, suffix } = params;
      
      if (!type || !suffix) {
        throw new Error('type和suffix是必需参数');
      }

      const validTypes = ['video', 'audio'];
      if (!validTypes.includes(type)) {
        throw new Error('type必须是video或audio');
      }

      const validVideoSuffixes = ['mp4', 'mov', 'webm'];
      const validAudioSuffixes = ['mp3', 'm4a', 'wav'];
      
      if (type === 'video' && !validVideoSuffixes.includes(suffix)) {
        throw new Error('无效的视频格式，支持: mp4, mov, webm');
      }
      
      if (type === 'audio' && !validAudioSuffixes.includes(suffix)) {
        throw new Error('无效的音频格式，支持: mp3, m4a, wav');
      }

      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/upload/getPutUrl', { type, suffix });
      return response.data;
    } catch (error) {
      console.error('获取上传URL失败:', error.response?.data || error.message);
      throw new Error(`获取上传URL失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  // ============================
  // Asset API - 资产查询管理
  // ============================

  /**
   * 查询账号剩余权益
   * @returns {Promise<Object>} 返回账号权益信息
   */
  async getAsset() {
    try {
      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/asset/get');
      return response.data;
    } catch (error) {
      console.error('查询账号剩余权益失败:', error.response?.data || error.message);
      throw new Error(`查询账号剩余权益失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  /**
   * 查询账号积分变动记录
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.size - 每页记录数
   * @returns {Promise<Object>} 返回积分记录列表
   */
  async getRecords(params) {
    try {
      const { page = 1, size = 10 } = params;
      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.post('/asset/getRecords', { page, size });
      return response.data;
    } catch (error) {
      console.error('查询账号积分变动记录失败:', error.response?.data || error.message);
      throw new Error(`查询账号积分变动记录失败: ${error.response?.data?.msg || error.message}`);
    }
  }

  // ============================
  // 工具方法
  // ============================

  /**
   * 等待任务完成(用于训练和视频生成)
   * @param {string} taskType - 任务类型('avatar'|'video')
   * @param {number} taskId - 任务ID
   * @param {number} maxRetries - 最大重试次数
   * @param {number} retryInterval - 重试间隔(毫秒)
   * @returns {Promise<Object>} 任务结果
   */
  async waitForTaskCompletion(taskType, taskId, maxRetries = 60, retryInterval = 5000) {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        let response;
        if (taskType === 'avatar') {
          response = await this.getAvatarStatus(taskId);
        } else if (taskType === 'video') {
          response = await this.getVideoStatus(taskId);
        } else {
          throw new Error(`不支持的任务类型: ${taskType}`);
        }

        const { status, progress } = response.data;

        // 任务完成
        if (status === 'ready') {
          return response;
        }
        // 任务失败
        else if (status === 'failed' || status === 'fail') {
          throw new Error(`${taskType}任务执行失败`);
        }
        // 任务进行中，继续等待
        else {
          console.log(`${taskType}任务进行中，进度: ${progress}%, 重试次数: ${retries + 1}/${maxRetries}`);
          retries++;
          await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        console.warn(`查询${taskType}任务状态失败，重试中... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }

    throw new Error(`${taskType}任务等待超时，请稍后查询结果。任务ID: ${taskId}`);
  }

  /**
   * 批量查询数字人状态
   * @param {Array<number>} avatarIds - 数字人ID数组
   * @returns {Promise<Array>} 状态结果数组
   */
  async batchGetAvatarStatus(avatarIds) {
    const results = await Promise.allSettled(
      avatarIds.map(id => this.getAvatarStatus(id))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { avatarId: avatarIds[index], ...result.value };
      } else {
        return { 
          avatarId: avatarIds[index], 
          error: result.reason.message,
          code: -1
        };
      }
    });
  }

  /**
   * 批量查询视频状态
   * @param {Array<number>} videoIds - 视频ID数组
   * @returns {Promise<Array>} 状态结果数组
   */
  async batchGetVideoStatus(videoIds) {
    const results = await Promise.allSettled(
      videoIds.map(id => this.getVideoStatus(id))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { videoId: videoIds[index], ...result.value };
      } else {
        return { 
          videoId: videoIds[index], 
          error: result.reason.message,
          code: -1
        };
      }
    });
  }
}

/**
 * 创建数字人服务实例
 * @param {string} bearerToken - API令牌
 * @returns {DigitalHumanService} 数字人服务实例
 */
export const createDigitalHumanService = (bearerToken) => {
  if (!bearerToken) {
    throw new Error('Bearer token is required');
  }
  return new DigitalHumanService(bearerToken);
};

/**
 * 导出服务类
 */
export { DigitalHumanService };

/**
 * 默认导出便捷方法
 */
export default {
  createDigitalHumanService,
  DigitalHumanService
};