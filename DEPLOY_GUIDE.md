# AI Hub 部署指南

## 快速开始

### 1. 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

| Secret 名称 | 说明 | 示例 |
|------------|------|------|
| `DEPLOY_HOST` | 服务器 IP 地址 | `123.456.789.0` |
| `DEPLOY_USER` | SSH 用户名 | `root` 或 `deploy` |
| `DEPLOY_PASS` | SSH 密码 | `your-password` |
| `DEPLOY_PORT` | SSH 端口（可选） | `22` |
| `NOTIFICATION_WEBHOOK` | 通知 Webhook（可选） | 企业微信/钉钉 Webhook URL |

### 2. 初始化服务器

将 `scripts/init-server.sh` 上传到服务器并执行：

```bash
# 上传脚本到服务器
scp scripts/init-server.sh root@your-server:/tmp/

# SSH 登录服务器
ssh root@your-server

# 执行初始化脚本
chmod +x /tmp/init-server.sh
/tmp/init-server.sh
```

脚本会自动安装：
- Node.js 18.x
- FFmpeg
- PM2
- Nginx（可选）

### 3. 配置环境变量

编辑服务器上的 `/var/www/ai-hub/.env` 文件：

```bash
vim /var/www/ai-hub/.env
```

填入实际的配置值：
```env
# 腾讯云配置
TENCENTCLOUD_SECRET_ID=你的密钥ID
TENCENTCLOUD_SECRET_KEY=你的密钥

# Google AI 配置
GOOGLE_API_KEY=你的API密钥
```

### 4. 首次部署

推送代码到 main/master 分支，GitHub Actions 会自动部署。

或手动触发部署：
1. 进入 GitHub 仓库的 Actions 页面
2. 选择 "Deploy to Production" 工作流
3. 点击 "Run workflow"

## 部署流程说明

1. **代码推送** → GitHub Actions 触发
2. **安装依赖** → 构建项目
3. **创建部署包** → 排除不必要文件
4. **上传到服务器** → 通过 SSH
5. **备份旧版本** → 保留最近 5 个备份
6. **解压新版本** → 安装生产依赖
7. **PM2 重启** → 零停机部署
8. **健康检查** → 确认服务正常

## 常用命令

### 在服务器上

```bash
# 查看 PM2 状态
pm2 status

# 查看日志
pm2 logs ai-hub

# 重启服务
pm2 restart ai-hub

# 查看服务详情
pm2 show ai-hub

# 监控面板
pm2 monit
```

### 版本回滚

如果新版本有问题，可以快速回滚：

```bash
# 查看备份
ls -la /var/www/ai-hub/backups/

# 回滚到指定备份
cd /var/www/ai-hub
tar -xzf backups/backup_20240109_120000.tar.gz -C current/
pm2 restart ai-hub
```

## 故障排查

### 1. 部署失败

检查 GitHub Actions 日志：
- Secrets 配置是否正确
- 服务器连接是否正常
- 磁盘空间是否充足

### 2. 服务无法启动

SSH 到服务器检查：
```bash
# 查看 PM2 错误日志
pm2 logs ai-hub --err

# 检查端口占用
lsof -i :3099

# 手动启动测试
cd /var/www/ai-hub/current
node index.js
```

### 3. 健康检查失败

```bash
# 测试 API
curl http://localhost:3099/api/test

# 检查环境变量
cat /var/www/ai-hub/current/.env

# 检查 FFmpeg
ffmpeg -version
```

## 监控建议

1. **使用 PM2 Plus**（免费版够用）
   ```bash
   pm2 install pm2-server-monit
   pm2 install pm2-auto-pull
   ```

2. **设置日志轮转**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

3. **配置告警**
   - 使用企业微信/钉钉 Webhook
   - 监控 CPU、内存、磁盘使用率

## 安全建议

1. **使用 SSH 密钥**（而非密码）
2. **限制 SSH 访问 IP**
3. **定期更新依赖**
4. **使用 HTTPS**
5. **配置防火墙规则**

## 性能优化

1. **PM2 集群模式**
   - 已配置为使用所有 CPU 核心
   - 自动负载均衡

2. **Nginx 缓存**
   - 静态文件已配置 30 天缓存
   - 可添加 API 响应缓存

3. **定期清理**
   - 旧的上传文件
   - 日志文件
   - 备份文件