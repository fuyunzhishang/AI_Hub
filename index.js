// 引入所需模块
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import audioRoutes from './routes/audio.js';
import speechRoutes from './routes/speech.js';
import stsRoutes from './routes/sts.js';
import credentialRoutes from './routes/credential.js';
import tencentcloud from "tencentcloud-sdk-nodejs";

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

// 路由设置
app.use('/api/audio', audioRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/sts', stsRoutes);
app.use('/api/credential', credentialRoutes);

app.get('/api/test', async (req, res) => {
  const CvmClient = tencentcloud.cvm.v20170312.Client
  // 实例化要请求产品(以cvm为例)的client对象
  const client = new CvmClient({
    // 从环境变量中获取密钥
    credential: {
      secretId: process.env.TENCENTCLOUD_SECRET_ID,
      secretKey: process.env.TENCENTCLOUD_SECRET_KEY,
    },
    // 产品地域
    region: "ap-shanghai",
    // 可选配置实例
    profile: {
      signMethod: "TC3-HMAC-SHA256", // 签名方法
      httpProfile: {
        reqMethod: "POST", // 请求方法
        reqTimeout: 30, // 请求超时时间，默认60s
        headers: {
          // 自定义 header
        },
        // proxy: "http://127.0.0.1:8899" // http请求代理
      },
    },
  })

  try {
    // 使用await替代Promise链式调用
    const data = await client.DescribeZones();
    // 将API返回值作为JSON响应返回给客户端
    res.json(data);
  } catch (err) {
    console.error("error", err);
    res.status(500).json({ error: err.message || '请求腾讯云API失败' });
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
