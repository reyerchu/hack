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
      
      // Prevent crazy restart loops
      max_restarts: 5,           // Max 5 restarts
      min_uptime: '10s',          // Must run 10s to be considered stable
      restart_delay: 4000,        // Wait 4s between restarts
      
      // Graceful shutdown
      kill_timeout: 5000,         // Wait 5s for graceful shutdown
      wait_ready: true,           // Wait for app.listen()
      listen_timeout: 10000,      // Max 10s to start listening
      
      // Exponential backoff for restarts
      exp_backoff_restart_delay: 100,
      
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3008,
      },
      error_file: '/var/log/pm2/hackportal-error.log',
      out_file: '/var/log/pm2/hackportal-out.log',
      log_file: '/var/log/pm2/hackportal-combined.log',
      time: true,
      
      // Merge logs from different instances
      merge_logs: true,
      
      // Log date format
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'hackportal-dev',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/reyerchu/hack/hack-dev',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Prevent crazy restart loops
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Exponential backoff for restarts
      exp_backoff_restart_delay: 100,
      
      env: {
        NODE_ENV: 'development',
        PORT: 3009,
      },
      error_file: '/var/log/pm2/hackportal-dev-error.log',
      out_file: '/var/log/pm2/hackportal-dev-out.log',
      log_file: '/var/log/pm2/hackportal-dev-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
