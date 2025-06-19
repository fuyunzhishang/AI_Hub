import axios from 'axios';
import WebSocket from 'ws';
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

  async synthesizeSpeechHTTP(text, options = {}) {
    try {
      const requestData = {
        text: text,
        voice: options.voice || 'zh_female_shuangkuaisisi_moon_bigtts',
        encoding: options.encoding || 'mp3',
        speed: options.speed || 1.0,
        volume: options.volume || 1.0,
        pitch: options.pitch || 1.0,
        speaker_id: options.speakerId,
        sample_rate: options.sampleRate || 16000,
        ...options
      };

      const response = await this.httpClient.post('/api/v1/tts', requestData, {
        responseType: options.encoding === 'binary' ? 'arraybuffer' : 'json'
      });

      if (options.encoding === 'binary') {
        return {
          success: true,
          audioData: Buffer.from(response.data),
          contentType: response.headers['content-type'],
          audioLength: response.data.byteLength
        };
      } else {
        return {
          success: true,
          data: response.data,
          audioData: response.data.data || response.data.audio,
          audioUrl: response.data.url
        };
      }
    } catch (error) {
      console.error('HTTP TTS synthesis error:', error.response?.data || error.message);
      throw new Error(`HTTP语音合成失败: ${error.response?.data?.message || error.message}`);
    }
  }

  async synthesizeSpeechWebSocketBinary(text, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary';
        const authHeaders = this.generateAuthHeaders({ method: 'GET', url: '/api/v1/tts/ws_binary' });
        
        const ws = new WebSocket(wsUrl, {
          headers: authHeaders
        });

        let audioBuffers = [];
        let isComplete = false;
        let totalBytes = 0;

        const request = {
          reqid: options.reqid || crypto.randomUUID(),
          text: text,
          voice: options.voice || 'zh_female_shuangkuaisisi_moon_bigtts',
          encoding: options.encoding || 'mp3',
          speed: options.speed || 1.0,
          volume: options.volume || 1.0,
          pitch: options.pitch || 1.0,
          speaker_id: options.speakerId,
          sample_rate: options.sampleRate || 16000,
          ...options
        };

        ws.on('open', () => {
          console.log('[Volcano TTS] Binary WebSocket connection opened');
          ws.send(JSON.stringify(request));
        });

        ws.on('message', (data) => {
          if (data instanceof Buffer) {
            if (data.length === 0) {
              isComplete = true;
              const finalAudioBuffer = Buffer.concat(audioBuffers);
              resolve({
                success: true,
                audioData: finalAudioBuffer,
                reqid: request.reqid,
                audioLength: totalBytes,
                encoding: options.encoding || 'mp3'
              });
              ws.close();
            } else {
              audioBuffers.push(data);
              totalBytes += data.length;
              console.log(`[Volcano TTS] Received audio chunk: ${data.length} bytes, Total: ${totalBytes} bytes`);
            }
          } else {
            try {
              const message = JSON.parse(data.toString());
              if (message.type === 'error') {
                reject(new Error(`TTS错误: ${message.message}`));
                ws.close();
              } else if (message.type === 'done') {
                isComplete = true;
                const finalAudioBuffer = Buffer.concat(audioBuffers);
                resolve({
                  success: true,
                  audioData: finalAudioBuffer,
                  reqid: message.reqid || request.reqid,
                  audioLength: totalBytes,
                  encoding: options.encoding || 'mp3'
                });
                ws.close();
              }
            } catch (parseError) {
              console.error('WebSocket message parse error:', parseError);
            }
          }
        });

        ws.on('error', (error) => {
          if (!isComplete) {
            console.error('[Volcano TTS] Binary WebSocket error:', error);
            reject(new Error(`WebSocket连接失败: ${error.message}`));
          }
        });

        ws.on('close', (code, reason) => {
          console.log(`[Volcano TTS] Binary WebSocket connection closed: ${code} ${reason}`);
          if (!isComplete && audioBuffers.length > 0) {
            const finalAudioBuffer = Buffer.concat(audioBuffers);
            resolve({
              success: true,
              audioData: finalAudioBuffer,
              reqid: request.reqid,
              audioLength: totalBytes,
              encoding: options.encoding || 'mp3'
            });
          } else if (!isComplete) {
            reject(new Error('WebSocket连接意外关闭'));
          }
        });

        setTimeout(() => {
          if (!isComplete) {
            ws.close();
            reject(new Error('TTS请求超时'));
          }
        }, 60000); // 60秒超时

      } catch (error) {
        reject(new Error(`WebSocket Binary TTS失败: ${error.message}`));
      }
    });
  }

  async createWebSocketBinaryConnection(options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary';
        const authHeaders = this.generateAuthHeaders({ method: 'GET', url: '/api/v1/tts/ws_binary' });
        
        const ws = new WebSocket(wsUrl, {
          headers: authHeaders
        });

        ws.on('open', () => {
          console.log('[Volcano TTS] Binary WebSocket connection opened');
          resolve(ws);
        });

        ws.on('error', (error) => {
          console.error('[Volcano TTS] Binary WebSocket error:', error);
          reject(new Error(`WebSocket连接失败: ${error.message}`));
        });

        ws.on('close', (code, reason) => {
          console.log(`[Volcano TTS] Binary WebSocket connection closed: ${code} ${reason}`);
        });

      } catch (error) {
        reject(new Error(`WebSocket初始化失败: ${error.message}`));
      }
    });
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