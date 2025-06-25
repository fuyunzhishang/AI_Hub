import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 定义日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// 定义日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`,
  ),
);

// 定义日志文件格式（不带颜色）
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`,
  ),
);

// 定义日志存储路径
const logsDir = path.join(__dirname, '..', 'logs');

// 创建日志传输器
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format,
  }),
  // 错误日志文件
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
    format: fileFormat,
  }),
  // 所有日志文件
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
  }),
];

// 创建 logger 实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  transports,
});

// HTTP 请求日志格式化
export const httpLogFormat = (req, res, responseTime) => {
  const { method, originalUrl, ip, headers } = req;
  const { statusCode } = res;
  
  // 获取请求体（如果有）
  let requestBody = '';
  if (req.body && Object.keys(req.body).length > 0) {
    // 过滤敏感信息
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '***';
    if (safeBody.secretKey) safeBody.secretKey = '***';
    requestBody = ` - Body: ${JSON.stringify(safeBody)}`;
  }
  
  // 获取客户端 IP
  const clientIp = headers['x-forwarded-for'] || headers['x-real-ip'] || ip;
  
  return `${method} ${originalUrl} - ${statusCode} - ${responseTime}ms - IP: ${clientIp}${requestBody}`;
};

// 错误日志格式化
export const errorLogFormat = (error, req) => {
  const { method, originalUrl, ip, headers, body } = req || {};
  
  let message = `Error: ${error.message}\n`;
  if (req) {
    message += `Request: ${method} ${originalUrl}\n`;
    message += `IP: ${headers?.['x-forwarded-for'] || headers?.['x-real-ip'] || ip}\n`;
    if (body && Object.keys(body).length > 0) {
      const safeBody = { ...body };
      if (safeBody.password) safeBody.password = '***';
      if (safeBody.secretKey) safeBody.secretKey = '***';
      message += `Body: ${JSON.stringify(safeBody)}\n`;
    }
  }
  message += `Stack: ${error.stack}`;
  
  return message;
};

export default logger;