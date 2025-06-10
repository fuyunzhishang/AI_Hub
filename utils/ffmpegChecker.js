import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * 检查 FFmpeg 和 FFprobe 是否已安装并可用
 * @returns {Promise<Object>} - 检查结果
 */
export const checkFFmpegInstallation = async () => {
    const result = {
        ffmpeg: { installed: false, version: null, error: null },
        ffprobe: { installed: false, version: null, error: null },
        overall: { ready: false, message: '' }
    };

    // 检查 ffmpeg
    try {
        const { stdout: ffmpegOutput } = await execPromise('ffmpeg -version');
        result.ffmpeg.installed = true;
        // 提取版本信息
        const versionMatch = ffmpegOutput.match(/ffmpeg version ([^\s]+)/);
        result.ffmpeg.version = versionMatch ? versionMatch[1] : 'Unknown';
    } catch (error) {
        result.ffmpeg.error = error.message;
    }

    // 检查 ffprobe
    try {
        const { stdout: ffprobeOutput } = await execPromise('ffprobe -version');
        result.ffprobe.installed = true;
        // 提取版本信息
        const versionMatch = ffprobeOutput.match(/ffprobe version ([^\s]+)/);
        result.ffprobe.version = versionMatch ? versionMatch[1] : 'Unknown';
    } catch (error) {
        result.ffprobe.error = error.message;
    }

    // 综合评估
    if (result.ffmpeg.installed && result.ffprobe.installed) {
        result.overall.ready = true;
        result.overall.message = `FFmpeg 已正确安装 (版本: ${result.ffmpeg.version})`;
    } else {
        result.overall.ready = false;
        if (!result.ffmpeg.installed && !result.ffprobe.installed) {
            result.overall.message = 'FFmpeg 和 FFprobe 都未安装';
        } else if (!result.ffmpeg.installed) {
            result.overall.message = 'FFmpeg 未安装';
        } else {
            result.overall.message = 'FFprobe 未安装';
        }
    }

    return result;
};

/**
 * 获取 FFmpeg 安装指南
 * @returns {Object} - 安装指南
 */
export const getFFmpegInstallGuide = () => {
    return {
        windows: {
            title: 'Windows 安装指南',
            steps: [
                '1. 访问 FFmpeg 官方网站: https://ffmpeg.org/download.html',
                '2. 选择 "Windows" 下的链接',
                '3. 下载 "ffmpeg-release-essentials" 包',
                '4. 解压到目录，例如 C:\\ffmpeg',
                '5. 将 C:\\ffmpeg\\bin 添加到系统环境变量 PATH',
                '6. 重启命令提示符/PowerShell',
                '7. 运行 "ffmpeg -version" 验证安装'
            ]
        },
        macos: {
            title: 'macOS 安装指南',
            steps: [
                '1. 安装 Homebrew: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
                '2. 运行: brew install ffmpeg',
                '3. 运行 "ffmpeg -version" 验证安装'
            ]
        },
        linux: {
            title: 'Linux 安装指南',
            steps: [
                'Ubuntu/Debian:',
                '  sudo apt update',
                '  sudo apt install ffmpeg',
                '',
                'CentOS/RHEL:',
                '  sudo yum install epel-release',
                '  sudo yum install ffmpeg ffmpeg-devel',
                '',
                '验证: ffmpeg -version'
            ]
        },
        troubleshooting: {
            title: '常见问题',
            issues: [
                {
                    problem: 'command not found 或 不是内部或外部命令',
                    solution: '确保 FFmpeg 的 bin 目录已添加到系统 PATH 环境变量中'
                },
                {
                    problem: 'PATH 已添加但仍然无法识别',
                    solution: '重启命令提示符/终端，或重启计算机'
                },
                {
                    problem: '权限错误',
                    solution: '确保对 FFmpeg 安装目录有读取和执行权限'
                }
            ]
        }
    };
};

/**
 * 生成用户友好的错误信息
 * @param {Object} checkResult - 检查结果
 * @returns {string} - 友好的错误信息
 */
export const generateUserFriendlyError = (checkResult) => {
    if (checkResult.overall.ready) {
        return null;
    }

    const guide = getFFmpegInstallGuide();
    const platform = process.platform;

    let message = `FFmpeg 未正确安装。\n\n`;
    message += `${checkResult.overall.message}\n\n`;

    if (platform === 'win32') {
        message += `Windows 安装步骤:\n`;
        message += guide.windows.steps.join('\n') + '\n\n';
    } else if (platform === 'darwin') {
        message += `macOS 安装步骤:\n`;
        message += guide.macos.steps.join('\n') + '\n\n';
    } else {
        message += `Linux 安装步骤:\n`;
        message += guide.linux.steps.join('\n') + '\n\n';
    }

    message += `如果仍有问题，请参考项目根目录的 FFMPEG_INSTALL.md 文件。`;

    return message;
};
