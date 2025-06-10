# GitHub Actions 配置指南

本项目使用 GitHub Actions 实现自动化 CI/CD 流程。

## 工作流介绍

### 1. CI 工作流 (`.github/workflows/ci.yml`)
- **触发条件**: 推送到主分支或 PR
- **功能**:
  - 代码检查 (Lint)
  - 多版本 Node.js 测试 (16.x, 18.x, 20.x)
  - 安全扫描
  - API 集成测试

### 2. Docker 构建工作流 (`.github/workflows/docker-build.yml`)
- **触发条件**: 推送到主分支或创建标签
- **功能**:
  - 多平台构建 (amd64, arm64)
  - 推送到多个镜像仓库
  - 漏洞扫描

### 3. 部署工作流 (`.github/workflows/deploy.yml`)
- **触发条件**: 推送到主分支或手动触发
- **功能**:
  - 自动测试
  - VPS 部署 (PM2)
  - Docker 部署
  - 部署通知

## 必需的 Secrets 配置

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中配置：

### 服务器相关
- `SERVER_HOST`: 服务器 IP 或域名
- `SERVER_USER`: SSH 用户名
- `SERVER_SSH_KEY`: SSH 私钥（完整内容）
- `SERVER_PORT`: SSH 端口（可选，默认 22）

### Docker 相关
- `DOCKER_USERNAME`: Docker Hub 用户名
- `DOCKER_PASSWORD`: Docker Hub 密码或访问令牌

### 阿里云容器镜像服务（可选）
- `ALIYUN_REGISTRY_USERNAME`: 阿里云容器镜像服务用户名
- `ALIYUN_REGISTRY_PASSWORD`: 阿里云容器镜像服务密码
- `ALIYUN_NAMESPACE`: 命名空间

### 其他（可选）
- `SLACK_WEBHOOK`: Slack 通知 Webhook URL
- `SNYK_TOKEN`: Snyk 安全扫描令牌

## 服务器准备

### 1. 创建部署用户
```bash
# 在服务器上执行
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo su - deploy
```

### 2. 配置 SSH 密钥
```bash
# 生成 SSH 密钥对（在本地执行）
ssh-keygen -t ed25519 -f deploy_key -C "github-actions"

# 将公钥添加到服务器
ssh-copy-id -i deploy_key.pub deploy@your-server.com

# 将私钥内容复制到 GitHub Secrets (SERVER_SSH_KEY)
cat deploy_key
```

### 3. 准备服务器环境
```bash
# 安装必要软件
sudo apt update
sudo apt install -y nodejs npm ffmpeg nginx

# 安装 PM2
sudo npm install -g pm2

# 创建应用目录
sudo mkdir -p /var/www/ai-hub/{shared,releases}
sudo chown -R deploy:deploy /var/www/ai-hub

# 配置环境变量
cp .env.example /var/www/ai-hub/shared/.env
# 编辑 .env 文件填入实际配置
```

### 4. 配置 systemd 服务（可选）
```bash
# 创建服务文件
sudo vim /etc/systemd/system/ai-hub.service
```

内容：
```ini
[Unit]
Description=AI Hub Service
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/ai-hub/current
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=ai-hub
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启用服务：
```bash
sudo systemctl enable ai-hub
sudo systemctl start ai-hub
```

## 使用说明

### 自动部署
1. 推送代码到 `main` 或 `master` 分支
2. GitHub Actions 自动运行测试和部署
3. 查看 Actions 页面监控部署进度

### 手动部署
1. 进入 Actions 页面
2. 选择 "Deploy to Production" 工作流
3. 点击 "Run workflow"
4. 选择部署环境

### 版本回滚
服务器上保留了最近 3 个版本，可以快速回滚：
```bash
# SSH 到服务器
ssh deploy@your-server.com

# 查看版本
ls -la /var/www/ai-hub/releases/

# 回滚到上一版本
ln -sfn /var/www/ai-hub/backup /var/www/ai-hub/current
pm2 restart ai-hub
```

## 监控和日志

### GitHub Actions
- 在仓库的 Actions 标签页查看所有工作流运行状态
- 点击具体运行查看详细日志

### 服务器日志
```bash
# PM2 日志
pm2 logs ai-hub

# 系统日志
sudo journalctl -u ai-hub -f

# 应用日志
tail -f /var/www/ai-hub/shared/logs/*.log
```

## 故障排查

### Actions 失败
1. 检查 Secrets 配置是否正确
2. 查看具体步骤的错误日志
3. 确认服务器网络和权限

### 部署失败
1. SSH 权限问题：确认密钥和用户权限
2. 端口占用：检查 3099 端口
3. 依赖问题：确认 Node.js 和 FFmpeg 已安装

### 健康检查失败
1. 检查 `.env` 配置
2. 查看应用日志
3. 测试 API 端点：`curl http://localhost:3099/api/test`

## 最佳实践

1. **分支策略**
   - `main/master`: 生产环境
   - `develop`: 开发环境
   - `feature/*`: 功能分支

2. **标签版本**
   - 使用语义化版本：`v1.0.0`
   - 创建标签自动触发 Docker 构建

3. **安全建议**
   - 定期更新 Secrets
   - 使用最小权限原则
   - 启用 GitHub 安全扫描

4. **性能优化**
   - 使用 Actions 缓存
   - 并行运行测试
   - 优化 Docker 镜像大小