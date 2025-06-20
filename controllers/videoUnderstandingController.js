import videoUnderstandingService from '../services/videoUnderstandingService.js';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';

const upload = multer({
  dest: './uploads/',
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/mpeg',
      'video/mov',
      'video/avi',
      'video/x-flv',
      'video/mpg',
      'video/webm',
      'video/wmv',
      'video/3gpp'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Supported formats: MP4, MPEG, MOV, AVI, FLV, MPG, WEBM, WMV, 3GPP'));
    }
  }
});

const videoUnderstandingController = {
  async analyzeVideo(req, res) {
    try {
      const { prompt, videoUri, youtubeUrl, samplingRate } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      let videoSource;
      let tempFilePath;

      if (req.file) {
        const fileExtension = path.extname(req.file.originalname) || '.mp4';
        tempFilePath = req.file.path + fileExtension;
        await fs.rename(req.file.path, tempFilePath);
        
        videoSource = {
          type: 'file',
          path: tempFilePath,
          mimeType: req.file.mimetype,
          size: req.file.size
        };
      } else if (videoUri) {
        videoSource = {
          type: 'uri',
          uri: videoUri
        };
      } else if (youtubeUrl) {
        videoSource = {
          type: 'youtube',
          url: youtubeUrl
        };
      } else {
        return res.status(400).json({ 
          error: 'Video source is required. Please provide either a file upload, video URI, or YouTube URL' 
        });
      }

      const result = await videoUnderstandingService.analyzeVideo(
        videoSource,
        prompt,
        samplingRate
      );

      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(err => {
          console.error('Error deleting temp file:', err);
        });
      }

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Video understanding error:', error);
      
      if (req.file && req.file.path) {
        await fs.unlink(req.file.path).catch(err => {
          console.error('Error deleting temp file on error:', err);
        });
      }

      res.status(500).json({
        error: 'Failed to analyze video',
        message: error.message
      });
    }
  },

  async getVideoMetadata(req, res) {
    try {
      const { videoUri, youtubeUrl } = req.body;
      
      let videoSource;
      let tempFilePath;

      if (req.file) {
        const fileExtension = path.extname(req.file.originalname) || '.mp4';
        tempFilePath = req.file.path + fileExtension;
        await fs.rename(req.file.path, tempFilePath);
        
        videoSource = {
          type: 'file',
          path: tempFilePath,
          mimeType: req.file.mimetype
        };
      } else if (videoUri) {
        videoSource = {
          type: 'uri',
          uri: videoUri
        };
      } else if (youtubeUrl) {
        videoSource = {
          type: 'youtube',
          url: youtubeUrl
        };
      } else {
        return res.status(400).json({ 
          error: 'Video source is required' 
        });
      }

      const metadata = await videoUnderstandingService.getVideoMetadata(videoSource);

      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(err => {
          console.error('Error deleting temp file:', err);
        });
      }

      res.json({
        success: true,
        data: metadata
      });

    } catch (error) {
      console.error('Get video metadata error:', error);
      
      if (req.file && req.file.path) {
        await fs.unlink(req.file.path).catch(err => {
          console.error('Error deleting temp file on error:', err);
        });
      }

      res.status(500).json({
        error: 'Failed to get video metadata',
        message: error.message
      });
    }
  }
};

const uploadVideo = upload.single('video');

export { videoUnderstandingController, uploadVideo };