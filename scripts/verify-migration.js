#!/usr/bin/env node
/**
 * 验证迁移后的用户数据
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

async function verifyMigration() {
  console.log('========================================');
  console.log('✅ 驗證遷移結果');
  console.log('========================================\n');

  const testUsers = [
    { id: 'SWHweef1mwNDuQ2b0vp13nE0bhh1', email: 'ball12312323@gmail.com' },
    { id: 'WHayuQFmKpgpIsd5hN36PoWNBNr1', email: 'gigareyer@gmail.com' },
  ];

  for (const testUser of testUsers) {
    console.log(`🔍 檢查: ${testUser.email}`);
    console.log('---');

    // 检查 registrations collection
    const regDoc = await db.collection('registrations').doc(testUser.id).get();
    if (regDoc.exists) {
      const data = regDoc.data();
      console.log(`✅ registrations collection:`);
      console.log(`   timestamp: ${data.timestamp}`);
      console.log(`   日期: ${new Date(data.timestamp).toLocaleString('zh-TW')}`);
      console.log(`   createdAt (保留): ${data.createdAt ? '存在' : '不存在'}`);
    } else {
      console.log(`❌ registrations collection: 找不到`);
    }

    // 检查 users collection
    const userDoc = await db.collection('users').doc(testUser.id).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      console.log(`✅ users collection:`);
      console.log(`   timestamp: ${data.timestamp}`);
      console.log(`   日期: ${new Date(data.timestamp).toLocaleString('zh-TW')}`);
    } else {
      console.log(`❌ users collection: 找不到`);
    }

    console.log('');
  }

  console.log('========================================');
  console.log('✅ 驗證完成！');
  console.log('========================================');
}

verifyMigration()
  .then(() => {
    console.log('\n✅ 腳本執行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
