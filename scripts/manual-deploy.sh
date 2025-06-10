#!/bin/bash
# 手动部署脚本（在服务器上运行）

set -e

# 配置
APP_DIR="/var/www/ai-hub"
REPO_URL="https://github.com/your-username/AI_Hub.git"  # 替换为你的仓库地址
BRANCH="master"

echo "=== AI Hub 手动部署脚本 ==="

# 检查目录是否存在
if [ ! -d "$APP_DIR" ]; then
    echo "错误：应用目录不存在，请先运行 server-setup.sh"
    exit 1
fi

# 进入应用目录
cd $APP_DIR

# 创建新的发布目录
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$APP_DIR/releases/$TIMESTAMP"
echo "创建发布目录: $RELEASE_DIR"
mkdir -p $RELEASE_DIR

# 克隆代码
echo "克隆代码..."
git clone -b $BRANCH --depth 1 $REPO_URL $RELEASE_DIR

# 进入发布目录
cd $RELEASE_DIR

# 复制环境变量文件
echo "复制环境变量文件..."
if [ -f "$APP_DIR/.env" ]; then
    cp $APP_DIR/.env $RELEASE_DIR/.env
else
    echo "警告：.env 文件不存在！"
    if [ -f "$RELEASE_DIR/.env.example" ]; then
        cp $RELEASE_DIR/.env.example $RELEASE_DIR/.env
        echo "已复制 .env.example，请更新配置！"
    fi
fi

# 创建软链接到共享目录
echo "创建软链接..."
ln -sfn $APP_DIR/uploads $RELEASE_DIR/uploads
ln -sfn $APP_DIR/logs $RELEASE_DIR/logs

# 安装依赖
echo "安装依赖..."
npm ci --production

# 更新当前版本软链接
echo "更新当前版本..."
ln -sfn $RELEASE_DIR $APP_DIR/current

# 重启应用
echo "重启应用..."
cd $APP_DIR/current

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "PM2 未安装，正在安装..."
    npm install -g pm2
fi

# 重启 PM2
pm2 delete ai-hub 2>/dev/null || true
pm2 start ecosystem.config.js --name ai-hub --env production
pm2 save

# 清理旧版本（保留最近5个）
echo "清理旧版本..."
cd $APP_DIR/releases
ls -t | tail -n +6 | xargs -r rm -rf

# 显示状态
echo ""
echo "=== 部署完成 ==="
pm2 status
echo ""
echo "查看日志: pm2 logs ai-hub"
echo "监控状态: pm2 monit"

# 健康检查
echo ""
echo "执行健康检查..."
sleep 5
if curl -f -s -o /dev/null -w "%{http_code}" http://localhost:3099/api/test | grep -q "200"; then
    echo "✅ 服务健康检查通过！"
else
    echo "❌ 健康检查失败，请查看日志"
    pm2 logs ai-hub --lines 20
fi