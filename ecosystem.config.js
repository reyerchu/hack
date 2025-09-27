module.exports = {
  apps: [
    {
      name: 'hackportal',
      script: 'npm',
      args: 'start',
      cwd: '/home/reyerchu/hack/hack',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pm2/hackportal-error.log',
      out_file: '/var/log/pm2/hackportal-out.log',
      log_file: '/var/log/pm2/hackportal-combined.log',
      time: true,
    },
  ],
};
