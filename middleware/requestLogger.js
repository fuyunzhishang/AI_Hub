import morgan from 'morgan';
import logger from '../utils/logger.js';
import onFinished from 'on-finished';

// 创建自定义请求日志中间件
const requestLogger = (req, res, next) => {
  // 记录请求开始时间
  req._startTime = Date.now();
  
  // 在响应结束时记录日志
  onFinished(res, () => {
    const responseTime = Date.now() - req._startTime;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;
    const contentLength = res.get('content-length') || '-';
    const userAgent = req.headers['user-agent'] || '-';
    const referrer = req.headers.referrer || req.headers.referer || '-';
    
    // 获取请求体（包括multer处理后的数据）
    let requestBody = '';
    if (req.body && Object.keys(req.body).length > 0) {
      const safeBody = { ...req.body };
      // 过滤敏感信息
      if (safeBody.password) safeBody.password = '***';
      if (safeBody.secretKey) safeBody.secretKey = '***';
      if (safeBody.secretId) safeBody.secretId = '***';
      requestBody = ` | Body: ${JSON.stringify(safeBody)}`;
    }
    
    // 获取文件信息（如果有）
    let fileInfo = '';
    if (req.file) {
      fileInfo = ` | File: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`;
    } else if (req.files && req.files.length > 0) {
      const fileNames = req.files.map(f => f.originalname).join(', ');
      const totalSize = req.files.reduce((sum, f) => sum + f.size, 0);
      fileInfo = ` | Files: ${fileNames} (${(totalSize / 1024 / 1024).toFixed(2)}MB total)`;
    }
    
    // 获取客户端 IP
    const clientIp = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection.remoteAddress || 
                    req.ip;
    
    const logMessage = `${method} ${url} - ${status} - ${responseTime}ms - ${contentLength}B | IP: ${clientIp} | UA: ${userAgent} | Ref: ${referrer}${requestBody}${fileInfo}`;
    
    // 根据状态码决定日志级别
    if (status >= 500) {
      logger.error(logMessage);
    } else if (status >= 400) {
      logger.warn(logMessage);
    } else {
      logger.http(logMessage);
    }
  });
  
  next();
};

// 保留原来的 Morgan 中间件（注释掉）
/*
const requestLoggerOld = morgan(
  function (tokens, req, res) {
    const method = tokens.method(req, res);
    const url = tokens.url(req, res);
    const status = tokens.status(req, res);
    const responseTime = tokens['response-time'](req, res);
    const contentLength = tokens.res(req, res, 'content-length') || '-';
    const userAgent = tokens['user-agent'](req, res);
    const referrer = tokens.referrer(req, res) || '-';
    
    // 获取请求体
    let requestBody = '';
    // 对于multipart/form-data请求，body和file可能还未被解析
    // 我们将在响应时记录这些信息
    if (req.body && Object.keys(req.body).length > 0) {
      const safeBody = { ...req.body };
      // 过滤敏感信息
      if (safeBody.password) safeBody.password = '***';
      if (safeBody.secretKey) safeBody.secretKey = '***';
      if (safeBody.secretId) safeBody.secretId = '***';
      requestBody = ` | Body: ${JSON.stringify(safeBody)}`;
    }
    
    // 获取文件信息（如果有）
    let fileInfo = '';
    if (req.file) {
      fileInfo = ` | File: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`;
    }
    
    // 获取客户端 IP
    const clientIp = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection.remoteAddress;
    
    return `${method} ${url} - ${status} - ${responseTime}ms - ${contentLength}B | IP: ${clientIp} | UA: ${userAgent} | Ref: ${referrer}${requestBody}${fileInfo}`;
  },
  {
    stream: {
      write: (message) => {
        // 根据状态码决定日志级别
        const statusCode = parseInt(message.match(/- (\d{3}) -/)?.[1] || '0');
        if (statusCode >= 500) {
          logger.error(message.trim());
        } else if (statusCode >= 400) {
          logger.warn(message.trim());
        } else {
          logger.http(message.trim());
        }
      },
    },
  }
);
*/

// 响应拦截器 - 记录响应数据
export const responseLogger = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  // 拦截 send 方法
  res.send = function(data) {
    res.locals.responseBody = data;
    logResponse(req, res, data);
    originalSend.call(this, data);
  };
  
  // 拦截 json 方法
  res.json = function(data) {
    res.locals.responseBody = data;
    logResponse(req, res, data);
    originalJson.call(this, data);
  };
  
  next();
};

// 记录响应日志
function logResponse(req, res, data) {
  // 只记录 API 接口的响应
  if (!req.originalUrl.startsWith('/api/')) return;
  
  try {
    let responseData = data;
    if (typeof data === 'string') {
      try {
        responseData = JSON.parse(data);
      } catch (e) {
        // 不是 JSON 格式，保持原样
      }
    }
    
    // 根据响应状态决定日志级别
    const logLevel = res.statusCode >= 400 ? 'error' : 'debug';
    
    // 过滤大型响应数据
    if (responseData && typeof responseData === 'object') {
      const safeResponse = { ...responseData };
      // 如果响应太大，只记录摘要
      const responseStr = JSON.stringify(safeResponse);
      if (responseStr.length > 1000) {
        logger[logLevel](`Response for ${req.method} ${req.originalUrl}: [Large response - ${responseStr.length} chars]`);
      } else {
        logger[logLevel](`Response for ${req.method} ${req.originalUrl}: ${responseStr}`);
      }
    }
  } catch (error) {
    logger.error(`Failed to log response: ${error.message}`);
  }
}

export default requestLogger;