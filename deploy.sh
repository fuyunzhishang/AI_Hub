#!/bin/bash

# AI Hub 部署脚本
set -e

echo "=== AI Hub 部署脚本 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 部署方式选择
echo "请选择部署方式："
echo "1) PM2 部署"
echo "2) Docker 部署"
echo "3) 直接运行"
read -p "请输入选项 (1-3): " deploy_option

# 检查环境变量文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}警告：.env 文件不存在，正在从模板创建...${NC}"
    cp .env.example .env
    echo -e "${RED}请编辑 .env 文件填入正确的配置信息！${NC}"
    exit 1
fi

# 安装依赖
echo -e "${GREEN}安装依赖...${NC}"
npm install

# 创建必要的目录
mkdir -p uploads logs

case $deploy_option in
    1)
        echo -e "${GREEN}使用 PM2 部署...${NC}"
        
        # 检查 PM2 是否安装
        if ! command -v pm2 &> /dev/null; then
            echo "PM2 未安装，正在安装..."
            npm install -g pm2
        fi
        
        # 停止旧的实例
        pm2 stop ai-hub 2>/dev/null || true
        pm2 delete ai-hub 2>/dev/null || true
        
        # 启动新实例
        pm2 start ecosystem.config.js --env production
        
        # 保存 PM2 配置
        pm2 save
        
        # 设置开机自启
        pm2 startup
        
        echo -e "${GREEN}部署完成！使用以下命令管理：${NC}"
        echo "查看状态: pm2 status"
        echo "查看日志: pm2 logs ai-hub"
        echo "重启服务: pm2 restart ai-hub"
        echo "停止服务: pm2 stop ai-hub"
        ;;
        
    2)
        echo -e "${GREEN}使用 Docker 部署...${NC}"
        
        # 检查 Docker 是否安装
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}错误：Docker 未安装！${NC}"
            exit 1
        fi
        
        # 构建镜像
        echo "构建 Docker 镜像..."
        docker-compose build
        
        # 启动容器
        echo "启动容器..."
        docker-compose up -d
        
        echo -e "${GREEN}部署完成！使用以下命令管理：${NC}"
        echo "查看状态: docker-compose ps"
        echo "查看日志: docker-compose logs -f"
        echo "停止服务: docker-compose down"
        echo "重启服务: docker-compose restart"
        ;;
        
    3)
        echo -e "${GREEN}直接运行服务...${NC}"
        
        # 设置生产环境
        export NODE_ENV=production
        
        # 运行服务
        node index.js
        ;;
        
    *)
        echo -e "${RED}无效的选项！${NC}"
        exit 1
        ;;
esac