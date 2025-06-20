import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export class TTSSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.audioChunks = [];
    this.resolve = null;
    this.reject = null;
    this.reqId = null;
  }

  /**
   * 构建WebSocket请求头
   * @param {Object} options - 请求选项
   * @returns {Buffer} 二进制请求头
   */
  buildHeader(options) {
    const header = Buffer.alloc(4);
    let headerValue = 0;

    // 协议版本 (4 bits)
    headerValue |= (options.version & 0x0F) << 28;
    // 报头大小 (4 bits)
    headerValue |= (options.headerSize & 0x0F) << 24;
    // 消息类型 (4 bits)
    headerValue |= (options.messageType & 0x0F) << 20;
    // flags (4 bits)
    headerValue |= (options.flags & 0x0F) << 16;
    // 序列化方法 (4 bits)
    headerValue |= (options.serialization & 0x0F) << 12;
    // 压缩方法 (4 bits)
    headerValue |= (options.compression & 0x0F) << 8;
    // 保留字段 (8 bits)
    headerValue |= options.reserved & 0xFF;

    header.writeUInt32BE(headerValue, 0);
    return header;
  }

  /**
   * 解析WebSocket响应头
   * @param {Buffer} header - 二进制响应头
   * @returns {Object} 解析后的头信息
   */
  parseHeader(header) {
    const headerValue = header.readUInt32BE(0);
    return {
      version: (headerValue >> 28) & 0x0F,
      headerSize: (headerValue >> 24) & 0x0F,
      messageType: (headerValue >> 20) & 0x0F,
      flags: (headerValue >> 16) & 0x0F,
      serialization: (headerValue >> 12) & 0x0F,
      compression: (headerValue >> 8) & 0x0F,
      reserved: headerValue & 0xFF
    };
  }

  /**
   * 连接到TTS WebSocket服务
   * @param {Object} config - 连接配置
   * @returns {Promise} 连接结果
   */
  connect(config) {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(config.url, {
        headers: {
          'Authorization': `Bearer; ${config.token}`,
          'Resource-Id': 'volc.megatts.voiceclone'
        }
      });

      this.socket.on('open', () => {
        console.log('WebSocket连接已建立');
        this.isConnected = true;
        resolve();
      });

      this.socket.on('message', (data) => {
        this.handleMessage(data);
      });

      this.socket.on('close', (code, reason) => {
        console.log(`WebSocket连接关闭: ${code}, ${reason}`);
        this.isConnected = false;
        if (this.resolve && this.audioChunks.length > 0) {
          this.resolve(Buffer.concat(this.audioChunks));
        } else if (this.reject && code !== 1000) {
          this.reject(new Error(`连接关闭: ${code}, ${reason}`));
        }
        this.cleanup();
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket错误:', error);
        this.reject(error);
        this.cleanup();
      });
    });
  }

  /**
   * 处理接收到的消息
   * @param {Buffer} data - 消息数据
   */
  handleMessage(data) {
    if (data.length < 4) {
      console.error('无效的消息数据，长度不足');
      return;
    }

    // 解析消息头
    const header = this.parseHeader(data.slice(0, 4));
    const payload = data.slice(4);

    // 音频数据响应
    if (header.messageType === 0b1011) {
      // 检查是否是最后一条消息
      const isFinal = (header.flags & 0b0010) !== 0 || (header.flags & 0b0011) !== 0;
      this.audioChunks.push(payload);

      if (isFinal) {
        console.log('接收到所有音频数据，共', this.audioChunks.length, '个片段');
        if (this.resolve) {
          this.resolve(Buffer.concat(this.audioChunks));
        }
        this.socket.close();
      }
    }
    // 错误消息
    else if (header.messageType === 0b1111) {
      let errorInfo = 'WebSocket错误响应';
      try {
        errorInfo = JSON.parse(payload.toString());
      } catch (e) {
        errorInfo = payload.toString();
      }
      this.reject(new Error(`服务器错误: ${JSON.stringify(errorInfo)}`));
      this.socket.close();
    }
  }

  /**
   * 发送TTS合成请求
   * @param {Object} params - 请求参数
   * @returns {Promise<Buffer>} 合成的音频数据
   */
  sendSynthesisRequest(params) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('WebSocket连接未建立'));
        return;
      }

      this.reqId = uuidv4();
      this.resolve = resolve;
      this.reject = reject;
      this.audioChunks = [];

      // 构建请求payload
      const payload = JSON.stringify({
        appid: params.appid,
        reqid: this.reqId,
        text: params.text,
        voice_type: params.voiceType,
        cluster: 'volcano_icl',
        operation: 'submit',
        audio: {
          format: params.audioFormat || 'mp3',
          sample_rate: params.sampleRate || 24000,
          bitrate: params.bitrate || 64000
        }
      });

      // 构建请求头
      const header = this.buildHeader({
        version: 0b0001,
        headerSize: 0b0001,
        messageType: 0b0001,
        flags: 0b0000,
        serialization: 0b0001,
        compression: 0b0000,
        reserved: 0x00
      });

      // 发送请求 (header + payload)
      const requestData = Buffer.concat([header, Buffer.from(payload)]);
      this.socket.send(requestData);
      console.log(`已发送TTS合成请求，reqid: ${this.reqId}`);
    });
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.socket = null;
    this.isConnected = false;
    this.audioChunks = [];
    this.resolve = null;
    this.reject = null;
    this.reqId = null;
  }

  /**
   * 销毁WebSocket连接
   */
  destroy() {
    if (this.socket) {
      this.socket.close();
    }
    this.cleanup();
  }
}