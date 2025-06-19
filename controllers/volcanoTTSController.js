import VolcanoTTSService from '../services/volcanoTTSService.js';

export const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请提供要上传的音频文件'
      });
    }

    const { speakerName, description } = req.body;
    
    if (!speakerName) {
      return res.status(400).json({
        success: false,
        error: 'speakerName参数必须提供'
      });
    }

    const ttsService = new VolcanoTTSService();
    const result = await ttsService.uploadAudio(req.file.path, speakerName, description);
    
    res.json({
      success: true,
      data: result.data,
      taskId: result.taskId,
      fileInfo: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Audio upload error:', error.message);
    res.status(500).json({
      success: false,
      error: '音频上传失败',
      details: error.message
    });
  }
};

export const queryStatus = async (req, res) => {
  try {
    const { taskId } = req.query;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'taskId参数必须提供'
      });
    }

    const ttsService = new VolcanoTTSService();
    const result = await ttsService.queryStatus(taskId);
    
    res.json({
      success: true,
      data: result.data,
      status: result.status,
      progress: result.progress
    });
  } catch (error) {
    console.error('Status query error:', error.message);
    res.status(500).json({
      success: false,
      error: '状态查询失败',
      details: error.message
    });
  }
};

export const synthesizeSpeechHTTP = async (req, res) => {
  try {
    const { text, voice, encoding, speed, volume, pitch, speakerId, sampleRate } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'text参数必须提供'
      });
    }

    const options = {
      voice,
      encoding,
      speed: speed ? parseFloat(speed) : undefined,
      volume: volume ? parseFloat(volume) : undefined,
      pitch: pitch ? parseFloat(pitch) : undefined,
      speakerId,
      sampleRate: sampleRate ? parseInt(sampleRate) : undefined
    };

    const ttsService = new VolcanoTTSService();
    const result = await ttsService.synthesizeSpeechHTTP(text, options);
    
    if (options.encoding === 'binary') {
      res.set({
        'Content-Type': result.contentType || 'audio/mpeg',
        'Content-Length': result.audioLength,
        'Content-Disposition': 'attachment; filename="tts_audio.mp3"'
      });
      res.send(result.audioData);
    } else {
      res.json({
        success: true,
        data: result.data,
        audioData: result.audioData,
        audioUrl: result.audioUrl
      });
    }
  } catch (error) {
    console.error('HTTP TTS synthesis error:', error.message);
    res.status(500).json({
      success: false,
      error: 'HTTP语音合成失败',
      details: error.message
    });
  }
};

export const synthesizeSpeechWebSocketBinary = async (req, res) => {
  try {
    const { text, voice, encoding, speed, volume, pitch, speakerId, sampleRate, reqid } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'text参数必须提供'
      });
    }

    const options = {
      voice,
      encoding,
      speed: speed ? parseFloat(speed) : undefined,
      volume: volume ? parseFloat(volume) : undefined,
      pitch: pitch ? parseFloat(pitch) : undefined,
      speakerId,
      sampleRate: sampleRate ? parseInt(sampleRate) : undefined,
      reqid
    };

    const ttsService = new VolcanoTTSService();
    const result = await ttsService.synthesizeSpeechWebSocketBinary(text, options);
    
    res.json({
      success: true,
      audioData: result.audioData.toString('base64'),
      reqid: result.reqid,
      audioLength: result.audioLength,
      encoding: result.encoding
    });
  } catch (error) {
    console.error('WebSocket Binary TTS synthesis error:', error.message);
    res.status(500).json({
      success: false,
      error: 'WebSocket Binary语音合成失败',
      details: error.message
    });
  }
};

export const synthesizeSpeechWebSocketBinaryStream = async (req, res) => {
  try {
    const { text, voice, encoding, speed, volume, pitch, speakerId, sampleRate, reqid } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'text参数必须提供'
      });
    }

    const options = {
      voice,
      encoding,
      speed: speed ? parseFloat(speed) : undefined,
      volume: volume ? parseFloat(volume) : undefined,
      pitch: pitch ? parseFloat(pitch) : undefined,
      speakerId,
      sampleRate: sampleRate ? parseInt(sampleRate) : undefined,
      reqid
    };

    const ttsService = new VolcanoTTSService();
    const result = await ttsService.synthesizeSpeechWebSocketBinary(text, options);
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': result.audioLength,
      'Content-Disposition': 'attachment; filename="tts_audio_ws.mp3"',
      'X-Request-ID': result.reqid
    });
    res.send(result.audioData);
  } catch (error) {
    console.error('WebSocket Binary TTS stream error:', error.message);
    res.status(500).json({
      success: false,
      error: 'WebSocket Binary音频流失败',
      details: error.message
    });
  }
};

export const healthCheck = async (req, res) => {
  try {
    const ttsService = new VolcanoTTSService();
    const isHealthy = await ttsService.healthCheck();
    
    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'Volcano TTS',
        endpoints: [
          'HTTP: https://openspeech.bytedance.com/api/v1/tts',
          'WebSocket Binary: wss://openspeech.bytedance.com/api/v1/tts/ws_binary'
        ]
      }
    });
  } catch (error) {
    console.error('TTS health check error:', error.message);
    res.status(500).json({
      success: false,
      error: 'TTS健康检查失败',
      details: error.message
    });
  }
};