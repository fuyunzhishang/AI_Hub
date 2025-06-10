# AI Hub 部署指南

## 前置要求

### 系统要求
- Node.js 16+ 
- FFmpeg（音频处理必需）
- 2GB+ 可用内存
- 10GB+ 磁盘空间（用于文件上传）

### 可选要求
- PM2（进程管理）
- Docker & Docker Compose（容器化部署）
- Nginx（反向代理）

## 快速部署

### 1. 克隆代码
```bash
git clone <repository-url>
cd AI_Hub
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入实际的配置值
vim .env
```

### 3. 运行部署脚本
```bash
chmod +x deploy.sh
./deploy.sh
```

## 部署方式详解

### 方式一：PM2 部署（推荐）

PM2 提供进程管理、自动重启、负载均衡等功能。

```bash
# 安装 PM2
npm install -g pm2

# 使用配置文件启动
pm2 start ecosystem.config.js --env production

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

PM2 常用命令：
```bash
pm2 status          # 查看状态
pm2 logs ai-hub     # 查看日志
pm2 restart ai-hub  # 重启服务
pm2 stop ai-hub     # 停止服务
pm2 monit           # 监控面板
```

### 方式二：Docker 部署

使用 Docker 可以确保环境一致性。

```bash
# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方式三：直接运行

适合开发测试环境。

```bash
# 安装依赖
npm install

# 启动服务
NODE_ENV=production node index.js
```

## Nginx 反向代理配置

1. 复制配置文件：
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/ai-hub
sudo ln -s /etc/nginx/sites-available/ai-hub /etc/nginx/sites-enabled/
```

2. 修改配置：
- 替换 `your-domain.com` 为实际域名
- 配置 SSL 证书路径

3. 重启 Nginx：
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 服务器安全建议

### 1. 防火墙配置
```bash
# 只开放必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. 文件权限
```bash
# 设置合适的文件权限
chmod 755 /app
chmod 755 /app/uploads
chmod 644 /app/.env
```

### 3. 环境变量安全
- 不要将 `.env` 文件提交到版本控制
- 使用强密码和密钥
- 定期轮换密钥

## 监控和维护

### 1. 健康检查
服务提供健康检查端点：
```bash
curl http://localhost:3099/api/test
```

### 2. 日志管理
日志文件位置：
- PM2 日志：`./logs/pm2-*.log`
- 应用日志：控制台输出

建议使用日志轮转：
```bash
# 安装 logrotate
sudo apt-get install logrotate

# 配置日志轮转
sudo vim /etc/logrotate.d/ai-hub
```

### 3. 备份策略
定期备份：
- 上传的文件：`./uploads/`
- 环境配置：`.env`
- 数据库（如果有）

### 4. 性能优化
- 使用 CDN 加速静态文件
- 启用 Nginx 缓存
- 配置合适的 PM2 实例数
- 定期清理旧的上传文件

## 故障排查

### 常见问题

1. **端口被占用**
```bash
# 查找占用端口的进程
lsof -i :3099
# 或
netstat -tlnp | grep 3099
```

2. **FFmpeg 未安装**
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg

# Alpine (Docker)
apk add ffmpeg
```

3. **内存不足**
- 增加服务器内存
- 调整 PM2 配置中的 `max_memory_restart`
- 减少 PM2 实例数

4. **文件上传失败**
- 检查 `uploads` 目录权限
- 确认磁盘空间充足
- 检查 Nginx `client_max_body_size` 配置

## 更新部署

```bash
# 1. 备份当前版本
tar -czf backup-$(date +%Y%m%d).tar.gz . --exclude=node_modules --exclude=uploads

# 2. 拉取最新代码
git pull origin master

# 3. 安装新依赖
npm install

# 4. 重启服务
pm2 restart ai-hub
# 或
docker-compose restart
```

## 支持

如有问题，请查看：
- 项目 README.md
- API 文档：http://your-domain.com/api-docs
- 提交 Issue 到项目仓库