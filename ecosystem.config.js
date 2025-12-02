// Load environment variables from .env.local using fs
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  const env = {};
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) continue;

      const equalIndex = line.indexOf('=');
      if (equalIndex === -1) continue;

      const key = line.substring(0, equalIndex).trim();
      let value = line.substring(equalIndex + 1).trim();

      // Remove surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Replace escaped newlines with actual newlines
      value = value.replace(/\\n/g, '\n');

      env[key] = value;
    }
  } catch (e) {
    console.error('Failed to load env file:', e.message);
  }
  return env;
}

const envVars = loadEnvFile('/home/reyerchu/hack/hack/.env.local');

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
        // Firebase Service Account
        SERVICE_ACCOUNT_PROJECT_ID: envVars.SERVICE_ACCOUNT_PROJECT_ID,
        SERVICE_ACCOUNT_CLIENT_EMAIL: envVars.SERVICE_ACCOUNT_CLIENT_EMAIL,
        SERVICE_ACCOUNT_PRIVATE_KEY: envVars.SERVICE_ACCOUNT_PRIVATE_KEY,
        // Firebase Client
        NEXT_PUBLIC_FIREBASE_API_KEY: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: envVars.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      },
      max_memory_restart: '500M',
      error_file: '/home/reyerchu/.pm2/logs/hackathon-error.log',
      out_file: '/home/reyerchu/.pm2/logs/hackathon-out.log',
      time: true,
    },
  ],
};
