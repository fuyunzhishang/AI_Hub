// 引入所需模块
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import audioRoutes from './routes/audio.js';
import speechRoutes from './routes/speech.js';
import stsRoutes from './routes/sts.js';
import googleFilesRoutes from './routes/googleFiles.js';
import credentialRoutes from './routes/credential.js';
import digitalHumanRoutes from './routes/digitalHuman.js';
import authVideoRoutes from './routes/authVideo.js';
import tencentcloud from "tencentcloud-sdk-nodejs";
import voiceRoutes from './routes/voice.js';

// 加载环境变量
dotenv.config();

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3099;

// 中间件设置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 设置上传文件的目录为静态资源
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger API 文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 提供 OpenAPI 规范的 JSON 格式
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 路由设置
app.use('/api/audio', audioRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/sts', stsRoutes);
app.use('/api/voice', voiceRoutes); // 添加新路由
app.use('/api/google-files', googleFilesRoutes);
app.use('/api/credential', credentialRoutes);
app.use('/api/digital-human', digitalHumanRoutes);
app.use('/api/auth-video', authVideoRoutes);

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
  const secretId = process.env.TENCENTCLOUD_SECRET_ID;
  const secretKey = process.env.TENCENTCLOUD_SECRET_KEY;
  
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
    });
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

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，端口号：${PORT}`);
});