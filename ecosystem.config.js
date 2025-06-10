module.exports = {
  apps: [{
    name: 'ai-hub',
    script: './index.js',
    instances: 'max', // 使用所有可用的 CPU 核心
    exec_mode: 'cluster', // 集群模式
    env: {
      NODE_ENV: 'production',
      PORT: 3099
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3099
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true, // 在日志中添加时间戳
    merge_logs: true,
    max_memory_restart: '1G', // 内存超过 1G 时重启
    watch: false, // 生产环境不监听文件变化
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_restarts: 10,
    min_uptime: '10s',
    // 优雅关闭
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    // 自动重启策略
    cron_restart: '0 0 * * *', // 每天凌晨重启
    autorestart: true,
    // 环境变量从 .env 文件加载
    node_args: '-r dotenv/config'
  }]
};