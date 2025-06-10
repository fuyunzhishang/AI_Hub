#!/bin/bash

# 修复文件权限脚本

echo "修复 AI Hub 文件权限..."

# 获取 nodejs 用户的 UID 和 GID（在容器中是 1001）
NODEJS_UID=1001
NODEJS_GID=1001

# 修复 uploads 目录权限
if [ -d "uploads" ]; then
    echo "修复 uploads 目录权限..."
    sudo chown -R ${NODEJS_UID}:${NODEJS_GID} uploads/
    sudo chmod -R 755 uploads/
    echo "✓ uploads 目录权限已修复"
else
    echo "创建 uploads 目录..."
    mkdir -p uploads
    sudo chown -R ${NODEJS_UID}:${NODEJS_GID} uploads/
    sudo chmod -R 755 uploads/
    echo "✓ uploads 目录已创建"
fi

# 修复 logs 目录权限
if [ -d "logs" ]; then
    echo "修复 logs 目录权限..."
    sudo chown -R ${NODEJS_UID}:${NODEJS_GID} logs/
    sudo chmod -R 755 logs/
    echo "✓ logs 目录权限已修复"
else
    echo "创建 logs 目录..."
    mkdir -p logs
    sudo chown -R ${NODEJS_UID}:${NODEJS_GID} logs/
    sudo chmod -R 755 logs/
    echo "✓ logs 目录已创建"
fi

# 重启容器
echo "重启容器..."
docker-compose restart

echo "✅ 权限修复完成！"

# 显示当前权限
echo ""
echo "当前目录权限："
ls -la uploads/ logs/