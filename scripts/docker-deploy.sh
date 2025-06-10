#!/bin/bash

# Docker 部署脚本
# 用于手动部署 AI Hub 应用

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] 错误:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] 警告:${NC} $1"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装！请先安装 Docker。"
        echo "安装指南: https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker 服务未运行或当前用户无权限访问 Docker。"
        echo "请确保 Docker 服务正在运行，并将当前用户添加到 docker 组。"
        exit 1
    fi
}

# 检查 Docker Compose
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose 未安装！"
        echo "请安装 Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
}

# 主函数
main() {
    print_message "开始部署 AI Hub..."
    
    # 检查依赖
    check_docker
    check_docker_compose
    
    # 检查必要文件
    if [ ! -f "Dockerfile" ]; then
        print_error "Dockerfile 不存在！请在项目根目录运行此脚本。"
        exit 1
    fi
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml 不存在！"
        exit 1
    fi
    
    # 检查 .env 文件
    if [ ! -f ".env" ]; then
        print_warning ".env 文件不存在！"
        if [ -f ".env.example" ]; then
            print_message "从 .env.example 创建 .env 文件..."
            cp .env.example .env
            print_warning "请编辑 .env 文件配置必要的环境变量！"
            read -p "按回车键继续，或 Ctrl+C 退出..." 
        else
            print_error "请创建 .env 文件并配置环境变量！"
            exit 1
        fi
    fi
    
    # 创建必要目录
    print_message "创建必要目录..."
    mkdir -p uploads logs
    
    # 构建镜像
    print_message "构建 Docker 镜像..."
    docker build -t ai-hub:latest .
    
    # 停止旧容器
    if docker ps -a | grep -q ai-hub; then
        print_message "停止并删除旧容器..."
        $COMPOSE_CMD down
    fi
    
    # 启动新容器
    print_message "启动新容器..."
    $COMPOSE_CMD up -d
    
    # 等待服务启动
    print_message "等待服务启动..."
    sleep 5
    
    # 健康检查
    print_message "执行健康检查..."
    MAX_ATTEMPTS=10
    ATTEMPT=1
    
    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        if curl -f -s -o /dev/null "http://localhost:3099/api/test"; then
            print_message "✅ 服务启动成功！"
            break
        else
            if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
                print_error "服务启动失败！"
                print_message "查看容器日志："
                docker logs --tail 50 ai-hub
                exit 1
            fi
            echo -n "."
            sleep 2
        fi
        ATTEMPT=$((ATTEMPT + 1))
    done
    
    # 显示容器状态
    print_message "容器状态："
    docker ps | grep ai-hub
    
    print_message "🎉 部署完成！"
    print_message "服务地址: http://localhost:3099"
    
    # 显示常用命令
    echo ""
    print_message "常用命令："
    echo "  查看日志: docker logs -f ai-hub"
    echo "  停止服务: $COMPOSE_CMD down"
    echo "  重启服务: $COMPOSE_CMD restart"
    echo "  查看状态: docker ps | grep ai-hub"
}

# 运行主函数
main