# 多阶段构建 - 构建阶段
FROM node:20-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev \
    linux-headers

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制应用代码
COPY . .

# 生产阶段
FROM node:20-alpine

# 只安装运行时依赖
RUN apk add --no-cache ffmpeg

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# 设置工作目录
WORKDIR /app

# 从构建阶段复制 node_modules
COPY --from=builder /app/node_modules ./node_modules

# 复制应用代码
COPY --chown=nodejs:nodejs . .

# 复制生产环境配置文件（如果存在）
COPY --chown=nodejs:nodejs production.env* ./

# 创建必要的目录并设置权限
RUN mkdir -p uploads uploads/voice public logs && \
    chown -R nodejs:nodejs uploads public logs && \
    chmod -R 755 uploads public logs

# 切换到非 root 用户
USER nodejs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3099

# 注意：其他环境变量将通过 docker-compose.yml 的 env_file 加载

# 暴露端口
EXPOSE 3099

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3099/api/test', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# 启动应用
CMD ["node", "index.js"]