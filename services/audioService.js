import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 检查 FFmpeg 是否已安装
 * @returns {Promise<boolean>} - FFmpeg 是否可用
 */
const checkFFmpegAvailability = async () => {
  try {
    await execPromise('ffmpeg -version');
    await execPromise('ffprobe -version');
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 获取基本文件信息（不依赖 FFmpeg）
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>} - 基本文件信息
 */
const getBasicFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return {
      filename: path.basename(filePath),
      extension: ext,
      size: stats.size,
      sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      created: stats.birthtime,
      modified: stats.mtime,
      type: 'audio',
      note: 'FFmpeg 未安装，仅显示基本文件信息'
    };
  } catch (error) {
    throw new Error(`获取文件信息失败: ${error.message}`);
  }
};

/**
 * 使用 FFmpeg 命令行处理音频转码
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputFormat - 输出格式
 * @param {string} bitrate - 比特率
 * @returns {Promise<Object>} - 转码结果
 */
export const processTranscode = async (inputPath, outputFormat, bitrate) => {
  try {
    // 检查 FFmpeg 是否可用
    const ffmpegAvailable = await checkFFmpegAvailability();
    if (!ffmpegAvailable) {
      throw new Error('FFmpeg 未安装或不可用。请参考 FFMPEG_INSTALL.md 文件安装 FFmpeg。');
    }

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
    // 检查 FFmpeg 是否可用
    const ffmpegAvailable = await checkFFmpegAvailability();

    if (!ffmpegAvailable) {
      // FFmpeg 不可用时，返回基本文件信息
      console.warn('FFmpeg 未安装，返回基本文件信息');
      const basicInfo = await getBasicFileInfo(inputPath);

      return {
        metadata: basicInfo,
        ffmpegNotAvailable: true,
        installGuide: {
          message: 'FFmpeg 未安装，无法提取详细音频数据',
          instructions: [
            '1. 请参考项目根目录的 FFMPEG_INSTALL.md 文件',
            '2. 下载并安装 FFmpeg',
            '3. 将 FFmpeg 添加到系统环境变量 PATH 中',
            '4. 重启应用程序'
          ],
          downloadUrl: 'https://ffmpeg.org/download.html'
        }
      };
    }

    const result = {};

    // 提取元数据
    if (extractType === 'metadata' || extractType === 'all') {
      const { stdout } = await execPromise(`ffprobe -v quiet -print_format json -show_format -show_streams "${inputPath}"`);
      result.metadata = JSON.parse(stdout);
    }

    // 提取波形数据
    if (extractType === 'waveform' || extractType === 'all') {
      const waveformFilename = `waveform_${Date.now()}.png`;
      const waveformPath = path.join(__dirname, '..', 'uploads', waveformFilename);

      // 使用 FFmpeg 提取音频波形数据
      await execPromise(`ffmpeg -i "${inputPath}" -filter_complex "aformat=channel_layouts=mono,showwavespic=s=1000x200:colors=blue" -frames:v 1 "${waveformPath}"`);

      result.waveform = {
        filename: waveformFilename,
        path: `/uploads/${waveformFilename}`
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