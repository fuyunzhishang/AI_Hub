import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import crypto from 'crypto';

class VolcanoTTSService {
  constructor() {
    this.accessKey = process.env.VOLCANO_ENGINE_ACCESS_KEY;
    this.secretKey = process.env.VOLCANO_ENGINE_SECRET_KEY;
    this.baseURL = 'https://openspeech.bytedance.com';
    
    if (!this.accessKey || !this.secretKey) {
      throw new Error('VOLCANO_ENGINE_ACCESS_KEY and VOLCANO_ENGINE_SECRET_KEY environment variables are required');
    }

    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.httpClient.interceptors.request.use(
      (config) => {
        config.headers = this.generateAuthHeaders(config);
        console.log(`[Volcano TTS] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Volcano TTS] Request error:', error);
        return Promise.reject(error);
      }
    );

    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(`[Volcano TTS] Response status: ${response.status}`);
        return response;
      },
      (error) => {
        console.error('[Volcano TTS] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  generateAuthHeaders(config) {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');
    
    const signString = `${config.method?.toUpperCase()}\n${config.url}\n${timestamp}\n${nonce}`;
    const signature = crypto.createHmac('sha256', this.secretKey).update(signString).digest('hex');
    
    return {
      ...config.headers,
      'X-Timestamp': timestamp.toString(),
      'X-Nonce': nonce,
      'X-Signature': signature,
      'Authorization': `HMAC-SHA256 Credential=${this.accessKey}, SignedHeaders=x-timestamp;x-nonce, Signature=${signature}`
    };
  }

  async uploadAudio(audioFilePath, speakerName, description = '') {
    try {
      const formData = new FormData();
      formData.append('audio', fs.createReadStream(audioFilePath));
      formData.append('speaker_name', speakerName);
      if (description) {
        formData.append('description', description);
      }

      const response = await axios({
        method: 'POST',
        url: `${this.baseURL}/api/v1/mega_tts/audio/upload`,
        data: formData,
        headers: {
          ...this.generateAuthHeaders({ method: 'POST', url: '/api/v1/mega_tts/audio/upload' }),
          ...formData.getHeaders()
        },
        timeout: 120000
      });

      return {
        success: true,
        data: response.data,
        taskId: response.data.task_id || response.data.taskId
      };
    } catch (error) {
      console.error('Audio upload error:', error.response?.data || error.message);
      throw new Error(`音频上传失败: ${error.response?.data?.message || error.message}`);
    }
  }

  async queryStatus(taskId) {
    try {
      const response = await this.httpClient.get('/api/v1/mega_tts/status', {
        params: { task_id: taskId }
      });

      return {
        success: true,
        data: response.data,
        status: response.data.status,
        progress: response.data.progress || 0
      };
    } catch (error) {
      console.error('Status query error:', error.response?.data || error.message);
      throw new Error(`状态查询失败: ${error.response?.data?.message || error.message}`);
    }
  }

  async healthCheck() {
    try {
      const response = await this.httpClient.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('TTS health check failed:', error.message);
      return false;
    }
  }
}

export default VolcanoTTSService;