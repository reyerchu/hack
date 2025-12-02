import admin from 'firebase-admin';

let apiInitialized = false;
//This path is a JSON object for the Firebase service account's private key
// let servAcc = require('../../private_keys/acmutd-hackportal-firebase-adminsdk-ev404-afcb7fdeb3.json');

/**
 * Initializes all services used to power API routes.
 *
 * Each API's route should must call this function before the handler takes
 * over. To add more services to the back-end API like database services or
 * other middleware, those services should be called in this function.
 */
export default function initializeApi() {
  // Always try to initialize Firebase if no apps exist
  if (admin.apps.length < 1) {
    initializeFirebase();
  }
  apiInitialized = true;
}

/**
 * Initializes Firebase admin APIs using environment variables.
 */
function initializeFirebase() {
  if (admin.apps.length < 1) {
    try {
      // 检查必要的环境变量
      if (
        !process.env.SERVICE_ACCOUNT_PROJECT_ID ||
        !process.env.SERVICE_ACCOUNT_CLIENT_EMAIL ||
        !process.env.SERVICE_ACCOUNT_PRIVATE_KEY ||
        process.env.SERVICE_ACCOUNT_PROJECT_ID === 'dummy-project' ||
        process.env.SERVICE_ACCOUNT_CLIENT_EMAIL ===
          'dummy@dummy-project.iam.gserviceaccount.com' ||
        process.env.SERVICE_ACCOUNT_PRIVATE_KEY === 'dummy-private-key'
      ) {
        console.warn(
          'Firebase Admin SDK: Missing or invalid environment variables. Skipping Firebase Admin initialization.',
        );
        return;
      }

      const storageBucketValue =
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        'hackathon-rwa-nexus.firebasestorage.app';

      // 處理私鑰格式：移除引號並替換轉義的換行符
      let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;

      if (!privateKey) {
        console.error('SERVICE_ACCOUNT_PRIVATE_KEY is missing or empty');
        return;
      }

      // 如果私鑰被引號包圍，移除引號
      if (
        (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
        (privateKey.startsWith("'") && privateKey.endsWith("'"))
      ) {
        privateKey = privateKey.slice(1, -1);
      }
      // 替換轉義的換行符為實際的換行符
      privateKey = privateKey.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
          clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        storageBucket: storageBucketValue,
      });
      console.log(
        'Firebase Admin SDK initialized successfully with storage bucket:',
        storageBucketValue,
      );
    } catch (error) {
      console.error('Firebase Admin SDK initialization failed:', error);
    }
  }
}
