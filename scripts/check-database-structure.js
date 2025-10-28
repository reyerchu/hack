#!/usr/bin/env node
/**
 * 检查数据库结构 - registrations vs users collections
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

async function checkDatabaseStructure() {
  console.log('========================================');
  console.log('🔍 檢查數據庫結構');
  console.log('========================================\n');

  // 检查 registrations collection
  const registrationsSnapshot = await db.collection('registrations').limit(1).get();
  console.log('📁 registrations collection:');
  console.log(`   文檔數量: ${registrationsSnapshot.size > 0 ? '有數據' : '空'}`);
  if (!registrationsSnapshot.empty) {
    const sampleDoc = registrationsSnapshot.docs[0];
    console.log(`   樣本文檔 ID: ${sampleDoc.id}`);
    console.log(`   樣本字段: ${Object.keys(sampleDoc.data()).join(', ')}`);
  }
  console.log('');

  // 检查 users collection
  const usersSnapshot = await db.collection('users').limit(1).get();
  console.log('📁 users collection:');
  console.log(`   文檔數量: ${usersSnapshot.size > 0 ? '有數據' : '空'}`);
  if (!usersSnapshot.empty) {
    const sampleDoc = usersSnapshot.docs[0];
    console.log(`   樣本文檔 ID: ${sampleDoc.id}`);
    console.log(`   樣本字段: ${Object.keys(sampleDoc.data()).join(', ')}`);
  }
  console.log('');

  // 统计总数
  const regCount = (await db.collection('registrations').get()).size;
  const usersCount = (await db.collection('users').get()).size;

  console.log('========================================');
  console.log('📊 數據庫統計：');
  console.log('========================================');
  console.log(`registrations: ${regCount} 個文檔`);
  console.log(`users: ${usersCount} 個文檔`);
  console.log('');

  if (usersCount > 0) {
    console.log('⚠️  users collection 存在數據！');
    console.log('');
    console.log('❓ 這是原本就有的，還是新創建的？');
  }
}

checkDatabaseStructure()
  .then(() => {
    console.log('\n✅ 檢查完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
