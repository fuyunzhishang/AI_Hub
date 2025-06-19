import WebSocket from 'ws';
import VolcanoTTSService from './volcanoTTSService.js';

class WebSocketTTSServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/api/volcano-tts/ws'
    });

    this.wssBinary = new WebSocket.Server({ 
      server,
      path: '/api/volcano-tts/ws-binary'
    });
    
    this.setupWebSocketServer();
    this.setupBinaryWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('[WebSocket TTS] New JSON connection established');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleTTSRequest(ws, data);
        } catch (error) {
          console.error('[WebSocket TTS] Message parsing error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: '消息格式错误',
            details: error.message
          }));
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket TTS] JSON connection closed');
      });

      ws.on('error', (error) => {
        console.error('[WebSocket TTS] JSON WebSocket error:', error);
      });

      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket TTS JSON服务已连接'
      }));
    });

    console.log('[WebSocket TTS] JSON WebSocket server started on path: /api/volcano-tts/ws');
  }

  setupBinaryWebSocketServer() {
    this.wssBinary.on('connection', (ws, req) => {
      console.log('[WebSocket TTS] New Binary connection established');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleBinaryTTSRequest(ws, data);
        } catch (error) {
          console.error('[WebSocket TTS] Binary message parsing error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: '消息格式错误',
            details: error.message
          }));
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket TTS] Binary connection closed');
      });

      ws.on('error', (error) => {
        console.error('[WebSocket TTS] Binary WebSocket error:', error);
      });

      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket TTS Binary服务已连接',
        endpoint: 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary'
      }));
    });

    console.log('[WebSocket TTS] Binary WebSocket server started on path: /api/volcano-tts/ws-binary');
  }

  async handleTTSRequest(ws, data) {
    try {
      const { type, text, options = {} } = data;

      if (type !== 'tts_request') {
        ws.send(JSON.stringify({
          type: 'error',
          message: '不支持的请求类型',
          supportedTypes: ['tts_request']
        }));
        return;
      }

      if (!text) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'text参数必须提供'
        }));
        return;
      }

      ws.send(JSON.stringify({
        type: 'processing',
        message: '正在处理HTTP TTS请求...',
        reqid: options.reqid
      }));

      const ttsService = new VolcanoTTSService();
      
      const result = await ttsService.synthesizeSpeechHTTP(text, {
        voice: options.voice,
        encoding: options.encoding || 'mp3',
        speed: options.speed,
        volume: options.volume,
        pitch: options.pitch,
        speakerId: options.speakerId,
        sampleRate: options.sampleRate
      });

      if (result.success) {
        const audioBase64 = result.audioData instanceof Buffer ? 
          result.audioData.toString('base64') : 
          Buffer.from(result.audioData, 'base64').toString('base64');
          
        const chunkSize = 1024 * 64; // 64KB chunks
        
        for (let i = 0; i < audioBase64.length; i += chunkSize) {
          const chunk = audioBase64.slice(i, i + chunkSize);
          const isLast = i + chunkSize >= audioBase64.length;
          
          ws.send(JSON.stringify({
            type: 'audio_chunk',
            data: chunk,
            isLast: isLast,
            chunkIndex: Math.floor(i / chunkSize),
            reqid: options.reqid
          }));
        }

        ws.send(JSON.stringify({
          type: 'completed',
          message: 'HTTP TTS合成完成',
          reqid: options.reqid,
          totalLength: audioBase64.length
        }));
      }

    } catch (error) {
      console.error('[WebSocket TTS] Request handling error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'TTS处理失败',
        details: error.message
      }));
    }
  }

  async handleBinaryTTSRequest(ws, data) {
    try {
      const { type, text, options = {} } = data;

      if (type !== 'tts_binary_request') {
        ws.send(JSON.stringify({
          type: 'error',
          message: '不支持的请求类型',
          supportedTypes: ['tts_binary_request']
        }));
        return;
      }

      if (!text) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'text参数必须提供'
        }));
        return;
      }

      ws.send(JSON.stringify({
        type: 'processing',
        message: '正在处理Binary WebSocket TTS请求...',
        reqid: options.reqid,
        endpoint: 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary'
      }));

      const ttsService = new VolcanoTTSService();
      
      const result = await ttsService.synthesizeSpeechWebSocketBinary(text, {
        voice: options.voice,
        encoding: options.encoding || 'mp3',
        speed: options.speed,
        volume: options.volume,
        pitch: options.pitch,
        speakerId: options.speakerId,
        sampleRate: options.sampleRate,
        reqid: options.reqid
      });

      if (result.success) {
        ws.send(JSON.stringify({
          type: 'metadata',
          message: '开始传输二进制音频数据',
          reqid: result.reqid,
          audioLength: result.audioLength,
          encoding: result.encoding
        }));

        const chunkSize = 1024 * 32; // 32KB binary chunks
        
        for (let i = 0; i < result.audioData.length; i += chunkSize) {
          const chunk = result.audioData.slice(i, i + chunkSize);
          const isLast = i + chunkSize >= result.audioData.length;
          
          ws.send(chunk);
          
          if (!isLast) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }

        ws.send(JSON.stringify({
          type: 'completed',
          message: 'Binary WebSocket TTS合成完成',
          reqid: result.reqid,
          totalBytes: result.audioLength
        }));
      }

    } catch (error) {
      console.error('[WebSocket TTS] Binary request handling error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Binary TTS处理失败',
        details: error.message
      }));
    }
  }

  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  broadcastBinary(data) {
    this.wssBinary.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  close() {
    this.wss.close();
    this.wssBinary.close();
  }
}

export default WebSocketTTSServer;