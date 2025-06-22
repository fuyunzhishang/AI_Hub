import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Hub API',
      version: '1.0.0',
      description: '音频处理、语音识别和云存储服务 API 文档',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3099',
        description: '开发服务器'
      },
      {
        url: 'https://api.example.com',
        description: '生产服务器'
      }
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    tags: [
      {
        name: '音频处理',
        description: '音频转码、数据提取等功能'
      },
      {
        name: '语音服务',
        description: '语音识别和语音合成功能'
      },
      {
        name: 'Google Files',
        description: 'Google Files API 文件管理'
      },
      {
        name: '腾讯云 STS',
        description: '腾讯云临时密钥生成'
      },
      {
        name: '视频理解',
        description: '基于 Google Gemini 的视频内容分析'
      },
      {
        name: 'TTS',
        description: '通用文字转语音服务'
      }
    ]
  },
  apis: [
    './routes/*.js',          // 保留路由文件扫描
    './controllers/*.js'      // 添加控制器文件扫描
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;