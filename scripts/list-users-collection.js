#!/usr/bin/env node
/**
 * 列出 users collection 中的所有文档
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 读取 .env.local 文件
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    value = value.replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: envVars.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: envVars.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: envVars.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: envVars.STORAGE_BUCKET,
  });
}

const db = admin.firestore();

async function listUsersCollection() {
  console.log('========================================');
  console.log('📋 users collection 中的所有文檔');
  console.log('========================================\n');

  const usersSnapshot = await db.collection('users').get();

  console.log(`總共 ${usersSnapshot.size} 個文檔\n`);

  usersSnapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. ID: ${doc.id}`);
    console.log(`   Email: ${data.email || data.preferredEmail || '未知'}`);
    console.log(`   姓名: ${data.firstName || ''} ${data.lastName || ''}`);
    if (data.createdAt) {
      const date = new Date(data.createdAt._seconds * 1000);
      console.log(`   創建時間: ${date.toLocaleString('zh-TW')}`);
    }
    if (data.timestamp) {
      const date = new Date(data.timestamp);
      console.log(`   Timestamp: ${date.toLocaleString('zh-TW')}`);
    }
    console.log('');
  });

  console.log('========================================');
  console.log('❌ 這些是重複數據，應該刪除！');
  console.log('✅ 正確的數據在 registrations collection');
  console.log('========================================');
}

listUsersCollection()
  .then(() => {
    console.log('\n✅ 完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
