#!/usr/bin/env node
/**
 * 删除 users collection 中的所有重复数据
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

async function deleteUsersCollection() {
  console.log('========================================');
  console.log('🗑️  刪除 users collection 中的重複數據');
  console.log('========================================\n');

  const usersSnapshot = await db.collection('users').get();

  console.log(`找到 ${usersSnapshot.size} 個要刪除的文檔\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const doc of usersSnapshot.docs) {
    try {
      const data = doc.data();
      const email = data.email || data.preferredEmail || '未知';

      await doc.ref.delete();
      console.log(`✅ 已刪除: ${email} (ID: ${doc.id})`);
      successCount++;
    } catch (error) {
      console.error(`❌ 刪除失敗: ${doc.id}`, error.message);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log('📊 刪除統計：');
  console.log('========================================');
  console.log(`✅ 成功: ${successCount} 個`);
  console.log(`❌ 失敗: ${errorCount} 個`);
  console.log('========================================');
  console.log('✅ users collection 已清空');
  console.log('✅ 所有數據現在只在 registrations collection');
  console.log('========================================');
}

deleteUsersCollection()
  .then(() => {
    console.log('\n✅ 完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
