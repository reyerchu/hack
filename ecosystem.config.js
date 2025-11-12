module.exports = {
  apps: [
    {
      name: 'hackathon',
      script: 'npm',
      args: 'start',
      cwd: '/home/reyerchu/hack/hack',
      env: {
        NODE_ENV: 'production',
        PORT: '3008',
      },
      max_memory_restart: '500M',
      error_file: '/home/reyerchu/.pm2/logs/hackathon-error.log',
      out_file: '/home/reyerchu/.pm2/logs/hackathon-out.log',
      time: true,
    },
  ],
};
