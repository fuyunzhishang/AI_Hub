#!/bin/bash

# 定义目标服务器和路径
TARGETS=(
  "root@8.211.149.254:~/AI_Hub"
)

# 先构建
# echo "开始构建..."
# npm run build

# 遍历目标服务器数组
for TARGET in "${TARGETS[@]}"; do
  echo "正在同步到：$TARGET"
  rsync -avz --delete \
    --exclude '.git' \
    --exclude '.gitignore' \
    --exclude 'node_modules' \
    --exclude '*.log' \
    --exclude '.next' \
    ./ "$TARGET"
  
  # # 远程安装依赖并启动
  # SERVER=$(echo $TARGET | cut -d':' -f1)
  # REMOTE_PATH=$(echo $TARGET | cut -d':' -f2)
  
  # echo "在 $SERVER 上安装依赖..."
  # ssh $SERVER "cd $REMOTE_PATH && npm install --production"
  
  # echo "在 $SERVER 上重启应用..."
  # ssh $SERVER "cd $REMOTE_PATH && pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js"
done

echo "部署完成！"