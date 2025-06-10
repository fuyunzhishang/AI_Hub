#!/bin/bash
# 服务器初始设置脚本

set -e

echo "=== AI Hub 服务器初始设置 ==="

# 检查是否以 root 或 sudo 权限运行
if [ "$EUID" -ne 0 ]; then 
   echo "请使用 sudo 运行此脚本"
   exit 1
fi

# 更新系统
echo "1. 更新系统包..."
apt update && apt upgrade -y

# 安装必要的软件
echo "2. 安装必要的软件..."
apt install -y curl git build-essential

# 安装 Node.js 20
echo "3. 安装 Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 验证 Node.js 安装
echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 安装 PM2
echo "4. 安装 PM2..."
npm install -g pm2

# 创建应用目录
echo "5. 创建应用目录..."
APP_DIR="/var/www/ai-hub"
mkdir -p $APP_DIR/{releases,logs,uploads}

# 设置权限
echo "6. 设置目录权限..."
chown -R $SUDO_USER:$SUDO_USER $APP_DIR

# 设置 PM2 开机自启
echo "7. 设置 PM2 开机自启..."
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

# 配置防火墙（如果使用 ufw）
echo "8. 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 3099/tcp  # 应用端口
    echo "防火墙规则已添加"
else
    echo "未检测到 ufw，跳过防火墙配置"
fi

# 创建环境变量模板
echo "9. 创建环境变量模板..."
cat > $APP_DIR/.env.example << 'EOF'
# 端口配置
PORT=3099

# 腾讯云配置
TENCENTCLOUD_SECRET_ID=your_secret_id_here
TENCENTCLOUD_SECRET_KEY=your_secret_key_here

# Google API 配置
GOOGLE_API_KEY=your_google_api_key_here

# 其他配置
NODE_ENV=production
EOF

chown $SUDO_USER:$SUDO_USER $APP_DIR/.env.example

echo ""
echo "=== 设置完成 ==="
echo ""
echo "下一步："
echo "1. 编辑环境变量文件: cp $APP_DIR/.env.example $APP_DIR/.env && nano $APP_DIR/.env"
echo "2. 配置 GitHub Secrets 中的部署凭据"
echo "3. 运行 GitHub Actions 部署工作流"
echo ""
echo "手动部署命令："
echo "cd $APP_DIR/current && pm2 start ecosystem.config.js --name ai-hub --env production"