# 音频处理服务

这是一个基于Express的Node.js服务器，提供音频转码和音频数据提取功能。

## 功能特点

- **音频转码**：支持多种音频格式之间的转换（MP3, WAV, OGG, M4A, FLAC等）
- **比特率调整**：可以自定义输出音频的比特率
- **元数据提取**：从音频文件中提取详细的元数据信息
- **波形生成**：生成音频文件的波形图
- **频谱生成**：生成音频文件的频谱图

## 安装要求

- Node.js 14.0+
- FFmpeg（用于音频处理）

## 安装FFmpeg

请参考 [FFMPEG_INSTALL.md](./FFMPEG_INSTALL.md) 文件获取详细的FFmpeg安装指南。

## 安装和启动

1. 克隆或下载此项目
2. 安装依赖：
   ```
   npm install
   ```
3. 启动服务器：
   ```
   npm start
   ```
   或者使用开发模式（自动重启）：
   ```
   npm run dev
   ```
4. 访问 http://localhost:3000 使用Web界面

## API接口

### 音频转码

**POST /api/audio/transcode**

参数：
- `audio`: 音频文件（multipart/form-data）
- `format`: 输出格式（可选，默认为 'mp3'）
- `bitrate`: 输出比特率（可选，默认为 '128k'）

### 音频数据提取

**POST /api/audio/extract**

参数：
- `audio`: 音频文件（multipart/form-data）
- `type`: 提取类型（可选，默认为 'all'）
  - 'metadata': 仅提取元数据
  - 'waveform': 仅生成波形图
  - 'spectrum': 仅生成频谱图
  - 'all': 提取所有数据

## 文件结构

```
├── controllers/          # 控制器文件
├── public/               # 静态文件
├── routes/               # 路由定义
├── services/             # 业务逻辑服务
├── uploads/              # 上传和处理后的文件
├── utils/                # 工具函数
├── index.js              # 应用入口文件
├── package.json          # 项目依赖和脚本
└── README.md             # 项目说明
```

## 许可证

ISC
