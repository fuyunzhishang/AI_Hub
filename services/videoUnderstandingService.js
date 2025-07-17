import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import axios from 'axios';

class VideoUnderstandingService {
  constructor() {
    this.genAI = null;
    this.fileManager = null;
  }

  getApiKey() {
    if (!this._apiKey) {
      this._apiKey = process.env.GOOGLE_API_KEY;
      if (!this._apiKey) {
        console.warn('GOOGLE_API_KEY not found in environment variables');
      }
    }
    return this._apiKey;
  }

  getGenAI() {
    const apiKey = this.getApiKey();
    if (!this.genAI && apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  getFileManager() {
    const apiKey = this.getApiKey();
    if (!this.fileManager && apiKey) {
      this.fileManager = new GoogleAIFileManager(apiKey);
    }
    return this.fileManager;
  }

  async analyzeVideo(videoSource, prompt, samplingRate = 1) {
    const genAI = this.getGenAI();
    if (!genAI) {
      throw new Error('Google API key not configured. Please set GOOGLE_API_KEY environment variable.');
    }

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash'
      });

      let contents = [];

      if (videoSource.type === 'file') {
        if (videoSource.size > 20 * 1024 * 1024) {
          const uploadedFile = await this.uploadLargeVideo(videoSource.path, videoSource.mimeType);
          contents.push({
            fileData: {
              mimeType: videoSource.mimeType,
              fileUri: uploadedFile.uri
            }
          });
        } else {
          const videoData = await fs.readFile(videoSource.path);
          contents.push({
            inlineData: {
              mimeType: videoSource.mimeType,
              data: videoData.toString('base64')
            }
          });
        }
      } else if (videoSource.type === 'uri') {
        contents.push({
          fileData: {
            mimeType: 'video/mp4',
            fileUri: videoSource.uri
          }
        });
      } else if (videoSource.type === 'youtube') {
        contents.push({
          text: `Analyze this YouTube video: ${videoSource.url}`
        });
      }

      contents.push({
        text: prompt
      });

      const result = await model.generateContent({
        contents: [{
          parts: contents
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 65536,
        },
      });

      const response = result.response;
      return {
        text: response.text(),
        videoSource: videoSource.type,
        samplingRate: samplingRate
      };

    } catch (error) {
      console.error('Error analyzing video:', error);
      throw new Error(`Failed to analyze video: ${error.message}`);
    }
  }

  async uploadLargeVideo(filePath, mimeType) {
    const fileManager = this.getFileManager();
    if (!fileManager) {
      throw new Error('Google API key not configured');
    }

    try {
      const uploadResponse = await fileManager.uploadFile(filePath, {
        mimeType: mimeType,
        displayName: path.basename(filePath),
      });

      console.log(`Uploaded file: ${uploadResponse.file.displayName} (${uploadResponse.file.uri})`);

      let file = await fileManager.getFile(uploadResponse.file.name);
      while (file.state === 'PROCESSING') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        file = await fileManager.getFile(uploadResponse.file.name);
      }

      if (file.state !== 'ACTIVE') {
        throw new Error(`File processing failed: ${file.state}`);
      }

      return file;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw new Error(`Failed to upload video: ${error.message}`);
    }
  }

  async getVideoMetadata(videoSource) {
    try {
      if (videoSource.type === 'file') {
        return await this.getLocalVideoMetadata(videoSource.path);
      } else if (videoSource.type === 'uri') {
        return {
          type: 'remote',
          uri: videoSource.uri,
          message: 'Metadata extraction for remote URIs requires downloading the file first'
        };
      } else if (videoSource.type === 'youtube') {
        return {
          type: 'youtube',
          url: videoSource.url,
          message: 'YouTube metadata can be extracted through the video understanding API'
        };
      }
    } catch (error) {
      console.error('Error getting video metadata:', error);
      throw error;
    }
  }

  getLocalVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        const result = {
          format: {
            filename: metadata.format.filename,
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitRate: metadata.format.bit_rate,
            formatName: metadata.format.format_name,
          },
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            frameRate: eval(videoStream.r_frame_rate),
            duration: videoStream.duration || metadata.format.duration,
            bitRate: videoStream.bit_rate,
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels,
            channelLayout: audioStream.channel_layout,
            bitRate: audioStream.bit_rate,
          } : null
        };

        resolve(result);
      });
    });
  }

  async downloadVideo(url, destPath) {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const writer = createWriteStream(destPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
}

export default new VideoUnderstandingService();