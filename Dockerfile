# 使用 Node.js 20 LTS 版本
FROM node:20-alpine

# 安装 ffmpeg
RUN apk add --no-cache ffmpeg

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p uploads logs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3099

# 暴露端口
EXPOSE 3099

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3099/api/test', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# 启动应用
CMD ["node", "index.js"]