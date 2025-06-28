# Google TTS 扩展功能使用说明

## 📋 功能概述

已成功为语音合成服务添加了 Google GenAI TTS 支持，现在您可以同时使用 Microsoft Azure TTS 和 Google GenAI TTS 两个平台。

## 🚀 快速开始

### 1. 环境配置

在 `.env` 文件中添加 Google API 密钥：

```bash
# Google AI 配置
GOOGLE_API_KEY=your_google_api_key_here
```

### 2. 获取 Google API 密钥

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 注册或登录 Google 账号
3. 创建新的 API 密钥
4. 复制密钥到环境变量

### 3. 启动服务

```bash
npm run dev
```

## 🎯 API 使用方式

### 获取提供商列表

```bash
GET /api/tts/providers
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "id": "microsoft",
      "name": "Microsoft Azure TTS",
      "status": "active"
    },
    {
      "id": "google",
      "name": "Google GenAI TTS", 
      "status": "active"
    }
  ]
}
```

### 获取语音列表

```bash
GET /api/tts/voices?provider=google
GET /api/tts/voices?provider=all
```

### 语音合成 - Google TTS

```bash
POST /api/tts/synthesize
Content-Type: application/json

{
  "provider": "google",
  "text": "你好，这是Google TTS语音合成测试",
  "voiceId": "Kore",
  "speed": 1.0,
  "pitch": 1.0,
  "volume": 1.0,
  "format": "wav"
}
```

## 🎤 可用语音

Google TTS 目前支持以下语音角色：

| 语音ID | 名称 | 特点 | 试听链接 |
|--------|------|------|----------|
| Kore   | Kore (通用) | 多语言支持，自然语音 | [试听](https://aistudio.google.com/generate-speech) |
| Puck   | Puck (清晰) | 多语言支持，清晰发音 | [试听](https://aistudio.google.com/generate-speech) |
| Charon | Charon (沉稳) | 多语言支持，沉稳语音 | [试听](https://aistudio.google.com/generate-speech) |
| Fenrir | Fenrir (动感) | 多语言支持，动感语音 | [试听](https://aistudio.google.com/generate-speech) |

> **注意**: Google TTS 使用 Gemini AI 自动检测语言，支持 24 种语言的自动识别和合成。
> **试听**: 访问 [Google AI Studio](https://aistudio.google.com/generate-speech) 可以试听各种语音效果。

## 🌍 支持的语言

Google TTS 自动检测以下语言：

- 中文 (zh-CN)
- 英语 (en-US, en-IN)
- 日语 (ja-JP)
- 韩语 (ko-KR)
- 法语 (fr-FR)
- 德语 (de-DE)
- 西班牙语 (es-US)
- 意大利语 (it-IT)
- 俄语 (ru-RU)
- 阿拉伯语 (ar-EG)
- 印地语 (hi-IN)
- 葡萄牙语 (pt-BR)
- 荷兰语 (nl-NL)
- 波兰语 (pl-PL)
- 泰语 (th-TH)
- 土耳其语 (tr-TR)
- 越南语 (vi-VN)
- 罗马尼亚语 (ro-RO)
- 乌克兰语 (uk-UA)
- 孟加拉语 (bn-BD)
- 马拉地语 (mr-IN)
- 泰米尔语 (ta-IN)
- 泰卢固语 (te-IN)
- 印尼语 (id-ID)

## 🧪 测试功能

运行测试脚本验证功能：

```bash
node test_google_tts.js
```

## 📊 平台对比

| 特性 | Microsoft Azure TTS | Google GenAI TTS |
|------|---------------------|------------------|
| 语音数量 | 300+ | 4个通用语音 |
| 语言支持 | 50+ 语言 | 24 语言自动检测 |
| 音频质量 | 专业级 Neural TTS | AI 生成，自然流畅 |
| 参数控制 | 语速、音调、音量 | 基础参数支持 |
| 成本 | 按字符计费 | 按请求计费 |
| 适用场景 | 专业语音应用 | 多语言内容生成 |

## ⚠️ 注意事项

1. **API 限制**: Google GenAI 有请求频率限制，请适度使用
2. **音频格式**: Google TTS 输出为 WAV 格式（24kHz 16-bit PCM）
3. **文本长度**: 建议单次请求不超过 5000 字符
4. **语音参数**: Google TTS 的语速、音调参数目前不生效，将在未来版本中改进
5. **网络要求**: 需要稳定的互联网连接访问 Google AI 服务

## 🔧 故障排除

### 常见问题

1. **"Google API key not configured"**
   - 检查 `.env` 文件中是否正确设置了 `GOOGLE_API_KEY`
   - 确认 API 密钥有效且有足够配额

2. **"Google TTS synthesis failed"**
   - 检查网络连接
   - 验证 API 密钥权限
   - 确认输入文本格式正确

3. **Node.js 版本警告**
   - Google GenAI 要求 Node.js 20+，当前为 18.19.0
   - 功能可以正常使用，但建议升级到 Node.js 20+

## 🎉 完成的功能

✅ Google GenAI TTS 集成  
✅ 多平台提供商支持  
✅ 统一的 API 接口  
✅ 语音列表管理  
✅ 错误处理和日志  
✅ Swagger API 文档更新  
✅ 测试脚本和使用文档  

现在您可以同时使用 Microsoft 和 Google 两个平台的 TTS 服务了！