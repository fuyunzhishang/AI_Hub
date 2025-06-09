# AI Hub API 接口文档

## 概述

AI Hub 是一个基于 Node.js 和腾讯云服务的音频处理和语音识别平台，提供音频转码、数据提取、语音识别等功能。

- **版本**: 1.0.0
- **基础URL**: `http://localhost:3099`
- **文档更新时间**: 2025年6月9日

## 目录

1. [认证与凭证管理](#认证与凭证管理)
2. [音频处理](#音频处理)
3. [语音识别](#语音识别)
4. [临时密钥服务](#临时密钥服务)
5. [系统测试](#系统测试)
6. [错误码说明](#错误码说明)

---

## 认证与凭证管理

### 1. 检查凭证状态

**接口地址**: `GET /api/credential/status`

**功能描述**: 检查当前腾讯云API密钥的状态和有效性

**请求参数**: 无

**响应示例**:
```json
{
  "success": true,
  "configured": true,
  "lastValidated": "2025-06-09T10:30:00.000Z",
  "status": "valid",
  "cacheExpiry": "2025-06-09T11:00:00.000Z",
  "message": "凭证状态正常"
}
```

**响应字段说明**:
- `configured`: 是否已配置密钥
- `lastValidated`: 最后验证时间
- `status`: 密钥状态 (valid/invalid/expired/unknown)
- `cacheExpiry`: 缓存过期时间

### 2. 验证凭证

**接口地址**: `POST /api/credential/validate`

**功能描述**: 验证指定的腾讯云API密钥是否有效

**请求体**:
```json
{
  "secretId": "your_secret_id",
  "secretKey": "your_secret_key",
  "forceRefresh": false
}
```

**请求参数说明**:
- `secretId`: 腾讯云密钥ID (可选，不提供则使用环境变量)
- `secretKey`: 腾讯云密钥Key (可选，不提供则使用环境变量)
- `forceRefresh`: 是否强制刷新缓存

**响应示例**:
```json
{
  "success": true,
  "valid": true,
  "message": "密钥验证成功",
  "details": {
    "testResult": "通过账户信息查询测试"
  }
}
```

### 3. 更新凭证配置

**接口地址**: `POST /api/credential/update`

**功能描述**: 临时更新运行时的腾讯云API密钥配置

**请求体**:
```json
{
  "secretId": "new_secret_id",
  "secretKey": "new_secret_key"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "凭证配置更新成功",
  "note": "此更新仅影响当前会话，重启服务器后将恢复环境变量配置"
}
```

---

## 音频处理

### 1. 音频格式转码

**接口地址**: `POST /api/audio/transcode`

**功能描述**: 将音频文件转换为指定格式和比特率

**请求类型**: `multipart/form-data`

**请求参数**:
- `audio`: 音频文件 (file) - 必填
- `format`: 目标格式 (string) - 可选，默认 mp3
- `bitrate`: 比特率 (string) - 可选，默认 128k

**支持的音频格式**: wav, mp3, ogg, m4a, aac, flac

**文件大小限制**: 100MB

**响应示例**:
```json
{
  "success": true,
  "message": "音频转码成功",
  "originalFile": {
    "filename": "1749355250616-213950998.m4a",
    "path": "/uploads/1749355250616-213950998.m4a",
    "size": 1048576,
    "sizeFormatted": "1.00MB"
  },
  "convertedFile": {
    "filename": "converted_1749355250616-213950998.mp3",
    "path": "/uploads/converted_1749355250616-213950998.mp3",
    "size": 853424,
    "sizeFormatted": "0.81MB",
    "format": "mp3",
    "bitrate": "128k"
  },
  "processingTime": "2.34s"
}
```

### 2. 音频数据提取

**接口地址**: `POST /api/audio/extract`

**功能描述**: 提取音频文件的元数据、波形数据或频谱数据

**请求类型**: `multipart/form-data`

**请求参数**:
- `audio`: 音频文件 (file) - 必填
- `type`: 提取类型 (string) - 可选，默认 all
  - `all`: 全部数据
  - `metadata`: 仅元数据
  - `waveform`: 仅波形数据
  - `spectrum`: 仅频谱数据

**响应示例**:
```json
{
  "success": true,
  "message": "音频数据提取成功",
  "originalFile": {
    "filename": "1749355250616-213950998.m4a",
    "path": "/uploads/1749355250616-213950998.m4a",
    "size": 1048576,
    "sizeFormatted": "1.00MB"
  },
  "extractedData": {
    "metadata": {
      "duration": "00:01:30.25",
      "format": "m4a",
      "sampleRate": "44100 Hz",
      "channels": 2,
      "bitrate": "128 kb/s"
    },
    "waveform": {
      "samples": [0.1, 0.2, -0.1, ...],
      "length": 133056
    },
    "spectrum": {
      "frequencies": [440.0, 880.0, ...],
      "amplitudes": [0.8, 0.6, ...]
    }
  },
  "extractionType": "all",
  "processingTime": "1.23s"
}
```

### 3. FFmpeg 状态检查

**接口地址**: `GET /api/audio/ffmpeg-status`

**功能描述**: 检查系统FFmpeg安装状态和版本信息

**请求参数**: 无

**响应示例**:
```json
{
  "success": true,
  "ffmpegInstalled": true,
  "version": "4.4.2",
  "path": "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
  "message": "FFmpeg 已正确安装"
}
```

**FFmpeg未安装时响应**:
```json
{
  "success": false,
  "ffmpegInstalled": false,
  "error": "FFmpeg 未安装",
  "installationGuide": {
    "platform": "Windows",
    "steps": [
      "访问 https://ffmpeg.org/download.html",
      "下载 Windows 版本的 FFmpeg",
      "解压到 C:\\Program Files\\ffmpeg\\",
      "将 C:\\Program Files\\ffmpeg\\bin 添加到系统 PATH 环境变量",
      "重新启动命令行工具验证安装"
    ],
    "testCommand": "ffmpeg -version"
  }
}
```

---

## 语音识别

### 1. 语音识别

**接口地址**: `POST /api/speech/recognize`

**功能描述**: 使用腾讯云语音识别服务识别音频内容，支持自动文件大小检测和COS上传

**请求类型**: `multipart/form-data`

**请求参数**:
- `audio`: 音频文件 (file) - 必填
- `engineType`: 识别引擎类型 (string) - 可选，默认 16k_zh

**支持的引擎类型**:
- `16k_zh`: 中文普通话 16kHz
- `8k_zh`: 中文普通话 8kHz  
- `16k_en`: 英文 16kHz
- `8k_en`: 英文 8kHz

**支持的音频格式**: wav, mp3, silk, m4a, aac, flac

**文件大小处理**:
- ≤ 5MB: 直接使用Base64编码识别
- \> 5MB: 自动上传到腾讯云COS后使用URL识别

**响应示例** (小文件):
```json
{
  "success": true,
  "message": "语音识别成功",
  "originalFile": {
    "filename": "1749355250616-213950998.m4a",
    "path": "/uploads/1749355250616-213950998.m4a",
    "size": 1048576,
    "sizeFormatted": "1.00MB"
  },
  "recognitionResult": {
    "text": "这是识别出的文字内容",
    "wordCount": 8,
    "engineType": "16k_zh",
    "taskId": "task_123456789",
    "requestId": "req_987654321",
    "sourceType": "base64",
    "uploadInfo": {
      "uploaded": false,
      "reason": "文件大小未超过5MB限制"
    }
  }
}
```

**响应示例** (大文件):
```json
{
  "success": true,
  "message": "语音识别成功",
  "originalFile": {
    "filename": "large_audio.wav",
    "path": "/uploads/large_audio.wav",
    "size": 8388608,
    "sizeFormatted": "8.00MB"
  },
  "recognitionResult": {
    "text": "这是大文件识别出的文字内容",
    "wordCount": 12,
    "engineType": "16k_zh",
    "taskId": "task_123456789",
    "requestId": "req_987654321",
    "sourceType": "url",
    "uploadInfo": {
      "uploaded": true,
      "cosUrl": "https://your-bucket.cos.ap-shanghai.myqcloud.com/speech/1749355250616-large_audio.wav",
      "cosKey": "speech/1749355250616-large_audio.wav",
      "bucket": "your-bucket",
      "region": "ap-shanghai"
    }
  }
}
```

### 2. 清理COS文件

**接口地址**: `POST /api/speech/cleanup-cos`

**功能描述**: 清理语音识别后在COS上的临时文件

**请求体**:
```json
{
  "cosKey": "speech/1749355250616-large_audio.wav"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "COS文件清理成功",
  "deletedKey": "speech/1749355250616-large_audio.wav"
}
```

---

## 临时密钥服务

### 1. 获取STS临时密钥

**接口地址**: `POST /api/sts/get-credential`

**功能描述**: 获取腾讯云STS临时访问密钥，用于前端直传COS

**请求体**:
```json
{
  "allowActions": ["cos:PutObject", "cos:GetObject"],
  "allowPrefixes": ["uploads/*"],
  "durationSeconds": 3600
}
```

**请求参数说明**:
- `allowActions`: 允许的操作权限数组 (可选)
- `allowPrefixes`: 允许访问的路径前缀 (可选)
- `durationSeconds`: 密钥有效期秒数 (可选，默认3600)

**响应示例**:
```json
{
  "success": true,
  "credentials": {
    "secretId": "temp_secret_id",
    "secretKey": "temp_secret_key",
    "sessionToken": "temp_session_token",
    "expiration": "2025-06-09T12:30:00Z"
  },
  "cosConfig": {
    "bucket": "your-bucket",
    "region": "ap-shanghai"
  }
}
```

---

## 系统测试

### 1. 腾讯云连接测试

**接口地址**: `GET /api/test`

**功能描述**: 测试腾讯云API连接状态，查询可用区信息

**请求参数**: 无

**响应示例**:
```json
{
  "ZoneSet": [
    {
      "Zone": "ap-shanghai-1",
      "ZoneName": "上海一区",
      "ZoneId": "200001",
      "ZoneState": "AVAILABLE"
    }
  ],
  "RequestId": "12345678-1234-1234-1234-123456789012"
}
```

---

## 错误码说明

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 认证失败 |
| 403 | 权限不足 |
| 404 | 接口不存在 |
| 500 | 服务器内部错误 |

### 业务错误码

#### 文件上传相关

```json
{
  "success": false,
  "error": "没有上传文件"
}
```

```json
{
  "success": false,
  "error": "只允许上传音频文件!"
}
```

```json
{
  "success": false,
  "error": "文件大小超过100MB限制"
}
```

#### FFmpeg相关

```json
{
  "success": false,
  "error": "FFmpeg 未安装",
  "details": "音频处理功能需要安装FFmpeg",
  "installationGuide": {
    "platform": "Windows",
    "steps": [...]
  }
}
```

#### 语音识别相关

```json
{
  "success": false,
  "error": "语音识别失败",
  "details": "任务执行失败: 音频格式不支持"
}
```

```json
{
  "success": false,
  "error": "文件上传到COS失败",
  "details": "网络连接超时"
}
```

#### 凭证相关

```json
{
  "success": false,
  "error": "腾讯云密钥未配置或无效",
  "details": "请检查环境变量中的TENCENTCLOUD_SECRET_ID和TENCENTCLOUD_SECRET_KEY"
}
```

---

## 使用示例

### JavaScript 示例

#### 音频转码

```javascript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('format', 'mp3');
formData.append('bitrate', '192k');

fetch('/api/audio/transcode', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('转码成功:', data.convertedFile);
  } else {
    console.error('转码失败:', data.error);
  }
});
```

#### 语音识别

```javascript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('engineType', '16k_zh');

fetch('/api/speech/recognize', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('识别结果:', data.recognitionResult.text);
    
    // 如果是大文件且上传到了COS，可以选择清理
    if (data.recognitionResult.uploadInfo.uploaded) {
      cleanupCOSFile(data.recognitionResult.uploadInfo.cosKey);
    }
  } else {
    console.error('识别失败:', data.error);
  }
});

function cleanupCOSFile(cosKey) {
  fetch('/api/speech/cleanup-cos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cosKey: cosKey })
  })
  .then(response => response.json())
  .then(data => {
    console.log('COS文件清理结果:', data.message);
  });
}
```

#### 凭证状态检查

```javascript
// 检查凭证状态
fetch('/api/credential/status')
.then(response => response.json())
.then(data => {
  if (data.configured && data.status === 'valid') {
    console.log('凭证状态正常');
  } else {
    console.log('需要配置或更新凭证');
  }
});

// 更新凭证
function updateCredentials(secretId, secretKey) {
  fetch('/api/credential/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      secretId: secretId,
      secretKey: secretKey
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('凭证更新结果:', data.message);
  });
}
```

---

## 注意事项

1. **文件大小限制**: 
   - 单个文件最大100MB
   - 语音识别超过5MB的文件会自动上传到COS

2. **FFmpeg依赖**: 
   - 音频转码和数据提取功能需要安装FFmpeg
   - 系统会自动检测FFmpeg安装状态

3. **腾讯云配置**:
   - 需要在环境变量中配置腾讯云密钥
   - 支持运行时临时更新密钥配置

4. **文件清理**:
   - 上传的文件存储在 `/uploads` 目录
   - COS上的临时文件需要手动调用清理接口

5. **错误处理**:
   - 所有接口都包含详细的错误信息
   - 建议根据错误码进行相应的错误处理

---

*最后更新: 2025年6月9日*
