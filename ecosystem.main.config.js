module.exports = {
  apps: [{
    name: 'hackportal-main',
    script: 'node_modules/.bin/next',
    args: 'start -p 3008',
    cwd: '/home/reyerchu/hack/hack',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3008
    }
  }]
}
