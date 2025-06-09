import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 使用 FFmpeg 命令行处理音频转码
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputFormat - 输出格式
 * @param {string} bitrate - 比特率
 * @returns {Promise<Object>} - 转码结果
 */
export const processTranscode = async (inputPath, outputFormat, bitrate) => {
  try {
    const outputFilename = `transcoded_${Date.now()}.${outputFormat}`;
    const outputPath = path.join(__dirname, '..', 'uploads', outputFilename);
    
    const command = `ffmpeg -i "${inputPath}" -b:a ${bitrate} "${outputPath}"`;
    
    // 执行 FFmpeg 命令
    await execPromise(command);
    
    return {
      filename: outputFilename,
      path: outputPath
    };
  } catch (error) {
    console.error('转码处理错误:', error);
    throw new Error(`转码处理失败: ${error.message}`);
  }
};

/**
 * 使用 FFmpeg 提取音频数据
 * @param {string} inputPath - 输入文件路径
 * @param {string} extractType - 提取类型
 * @returns {Promise<Object>} - 提取结果
 */
export const processExtract = async (inputPath, extractType) => {
  try {
    const result = {};
    
    // 提取元数据
    if (extractType === 'metadata' || extractType === 'all') {
      const { stdout } = await execPromise(`ffprobe -v quiet -print_format json -show_format -show_streams "${inputPath}"`);
      result.metadata = JSON.parse(stdout);
    }
    
    // 提取波形数据
    if (extractType === 'waveform' || extractType === 'all') {
      const waveformFilename = `waveform_${Date.now()}.json`;
      const waveformPath = path.join(__dirname, '..', 'uploads', waveformFilename);
      
      // 使用 FFmpeg 提取音频波形数据
      await execPromise(`ffmpeg -i "${inputPath}" -filter_complex "aformat=channel_layouts=mono,showwavespic=s=1000x200:colors=blue" -frames:v 1 "${path.join(__dirname, '..', 'uploads', `waveform_${Date.now()}.png`)}"`)
      
      result.waveform = {
        filename: `waveform_${Date.now()}.png`,
        path: `/uploads/waveform_${Date.now()}.png`
      };
    }
    
    // 提取频谱数据
    if (extractType === 'spectrum' || extractType === 'all') {
      const spectrumFilename = `spectrum_${Date.now()}.png`;
      const spectrumPath = path.join(__dirname, '..', 'uploads', spectrumFilename);
      
      // 使用 FFmpeg 生成频谱图
      await execPromise(`ffmpeg -i "${inputPath}" -lavfi showspectrumpic=s=1000x500:mode=combined:color=rainbow "${spectrumPath}"`);
      
      result.spectrum = {
        filename: spectrumFilename,
        path: `/uploads/${spectrumFilename}`
      };
    }
    
    return result;
  } catch (error) {
    console.error('音频数据提取错误:', error);
    throw new Error(`音频数据提取失败: ${error.message}`);
  }
};
