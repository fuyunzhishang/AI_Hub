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

export const healthCheck = async (req, res) => {
  try {
    const ttsService = new VolcanoTTSService();
    const isHealthy = await ttsService.healthCheck();
    
    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'Volcano TTS'
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