// 引入所需模块
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'
import audioRoutes from './routes/audio.js'
import speechRoutes from './routes/speech.js'
import stsRoutes from './routes/sts.js'
import googleFilesRoutes from './routes/googleFiles.js'
import credentialRoutes from './routes/credential.js'
import digitalHumanRoutes from './routes/digitalHuman.js'
import authVideoRoutes from './routes/authVideo.js'
import videoUnderstandingRoutes from './routes/videoUnderstandingRoutes.js'
import voiceRouter from './routes/voice.js'
import ttsRoutes from './routes/tts.js'
import tencentcloud from "tencentcloud-sdk-nodejs"
import logger from './utils/logger.js'
import requestLogger, { responseLogger } from './middleware/requestLogger.js'

// 加载环境变量
dotenv.config()

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保必要的目录存在
import fs from 'fs'
const ensureDirectories = () => {
  const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'voice'),
    path.join(__dirname, 'public'),
    path.join(__dirname, 'logs')
  ]
  
  dirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`✅ 创建目录成功: ${dir}`)
      }
    } catch (error) {
      if (error.code === 'EACCES') {
        console.warn(`⚠️  权限不足，无法创建目录: ${dir}`)
        console.warn(`请确保容器有写权限，或在启动前预创建此目录`)
      } else {
        console.error(`❌ 创建目录失败: ${dir}`, error.message)
      }
      // 不要因为目录创建失败就终止应用启动
      // 继续运行，让用户知道问题所在
    }
  })
}

// 在应用启动时创建必要目录
ensureDirectories()

// 创建Express应用
const app = express()
const PORT = process.env.PORT || 3099

// CORS配置 - 解决跨域问题
const corsOptions = {
  origin: function (origin, callback) {
    // 允许所有来源（开发环境）
    // 生产环境建议配置具体的域名
    callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

app.use(cors(corsOptions))

// 中间件设置
// 注意：对于文件上传路由，不要预先解析请求体，让 multer 处理
app.use(express.static(path.join(__dirname, 'public')))

// 只对非文件上传的路由使用 JSON 和 URL 编码解析
app.use((req, res, next) => {
  // 如果是文件上传相关的路由，跳过 JSON 和 URL 编码解析
  if (req.path.includes('/speech/recognize') || 
      req.path.includes('/voice/train') || 
      req.path.includes('/audio/') ||
      req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }
  
  // 对其他路由应用 JSON 和 URL 编码解析
  express.json()(req, res, () => {
    express.urlencoded({ extended: true })(req, res, next);
  });
})

// 设置上传文件的目录为静态资源
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 添加请求日志中间件（在body解析之后，路由之前）
app.use(requestLogger)
app.use(responseLogger)

// Swagger API 文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// 提供 OpenAPI 规范的 JSON 格式
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// 路由设置
app.use('/api/audio', audioRoutes)
app.use('/api/speech', speechRoutes)
app.use('/api/sts', stsRoutes)
app.use('/v1/voice', voiceRouter) // 确认此行存在
app.use('/api/google-files', googleFilesRoutes)
app.use('/api/credential', credentialRoutes)
app.use('/api/digital-human', digitalHumanRoutes)
app.use('/api/auth-video', authVideoRoutes)
app.use('/api/video-understanding', videoUnderstandingRoutes)
app.use('/api/tts', ttsRoutes)

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: 测试腾讯云API连接
 *     tags: [测试]
 *     responses:
 *       200:
 *         description: API连接正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 zones:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: API连接失败
 */
app.get('/api/test', async (req, res) => {
  // 首先检查是否配置了腾讯云密钥
  const secretId = process.env.TENCENTCLOUD_SECRET_ID
  const secretKey = process.env.TENCENTCLOUD_SECRET_KEY
  // 如果没有配置密钥或使用的是默认占位符，返回基础健康检查
  if (!secretId || !secretKey ||
    secretId === 'your_secret_id_here' ||
    secretId === 'your_secret_id' ||
    secretKey === 'your_secret_key_here' ||
    secretKey === 'your_secret_key') {
    return res.json({
      status: 'ok',
      message: 'Service is running (Tencent Cloud not configured)',
      timestamp: new Date().toISOString(),
      tencentCloudConfigured: false
    })
  }

  // 如果配置了密钥，测试腾讯云连接
  try {
    const CvmClient = tencentcloud.cvm.v20170312.Client
    // 实例化要请求产品(以cvm为例)的client对象
    const client = new CvmClient({
      credential: {
        secretId: secretId,
        secretKey: secretKey,
      },
      region: "ap-shanghai",
      profile: {
        signMethod: "TC3-HMAC-SHA256",
        httpProfile: {
          reqMethod: "POST",
          reqTimeout: 30,
        },
      },
    })

    const data = await client.DescribeZones();

    res.json({
      status: 'ok',
      message: 'Service is running (Tencent Cloud connected)',
      timestamp: new Date().toISOString(),
      tencentCloudConfigured: true,
      tencentCloudResponse: data
    });
  } catch (err) {
    console.error("Tencent Cloud API error:", err);
    // 即使腾讯云连接失败，服务本身仍然是健康的
    res.json({
      status: 'ok',
      message: 'Service is running (Tencent Cloud connection failed)',
      timestamp: new Date().toISOString(),
      tencentCloudConfigured: true,
      tencentCloudError: err.message
    });
  }
});

// 首页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// COS演示页面路由
app.get('/cos-demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cos-demo.html'));
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  // 使用 logger 记录错误
  logger.error(`全局错误处理: ${error.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    headers: req.headers,
    body: req.body,
    stack: error.stack
  });
  
  // 处理 Multer 相关错误
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: '文件大小超出限制',
      details: '文件大小不能超过1GB'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: '意外的文件字段',
      details: '请检查文件上传字段名称'
    });
  }
  
  if (error.message && error.message.includes('Multipart: Boundary not found')) {
    return res.status(400).json({
      success: false,
      error: 'Multipart 数据格式错误',
      details: '请确保使用正确的 Content-Type: multipart/form-data 格式上传文件',
      suggestion: '如果使用 curl，请添加 -F 参数；如果使用 Postman，请选择 form-data 格式'
    });
  }
  
  // 其他错误
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    details: process.env.NODE_ENV === 'production' ? '请联系管理员' : error.message
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /cos-demo',
      'GET /api-docs',
      'GET /api/test',
      'POST /api/speech/recognize',
      'POST /v1/voice/train'
    ]
  });
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`🚀 服务器已启动，端口号：${PORT}`);
  logger.info(`📖 API 文档: http://localhost:${PORT}/api-docs`);
  logger.info(`🎤 语音识别演示: http://localhost:${PORT}/cos-demo`);
  logger.info(`🔍 服务测试: http://localhost:${PORT}/api/test`);
  logger.info(`📁 日志目录: ${path.join(__dirname, 'logs')}`);
  logger.info(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
});