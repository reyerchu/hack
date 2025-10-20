module.exports = {
  apps: [{
    name: 'hackportal-main',
    script: 'node_modules/.bin/next',
    args: 'start -p 3008',
    cwd: '/home/reyerchu/hack/hack',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3008
    },
    error_file: '/home/reyerchu/.pm2/logs/hackportal-main-error.log',
    out_file: '/home/reyerchu/.pm2/logs/hackportal-main-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true
  }]
};
