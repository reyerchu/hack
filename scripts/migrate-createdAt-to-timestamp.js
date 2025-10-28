#!/usr/bin/env node
/**
 * 将使用 createdAt 的新用户迁移到统一的 timestamp 格式
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

async function migrateUsers() {
  console.log('========================================');
  console.log('🔄 將 createdAt 轉換為 timestamp 格式');
  console.log('========================================\n');

  // 查询所有注册用户
  const registrationsSnapshot = await db.collection('registrations').get();

  console.log(`總共檢查 ${registrationsSnapshot.docs.length} 個用戶\n`);

  const usersToMigrate = [];

  for (const doc of registrationsSnapshot.docs) {
    const data = doc.data();
    const hasTimestamp = !!data.timestamp;
    const hasCreatedAt = !!data.createdAt;

    // 找到有 createdAt 但没有 timestamp 的用户
    if (!hasTimestamp && hasCreatedAt) {
      usersToMigrate.push({
        id: doc.id,
        email: data.email || data.preferredEmail || data.user?.preferredEmail || '未知',
        firstName: data.firstName || data.user?.firstName || '',
        lastName: data.lastName || data.user?.lastName || '',
        nickname: data.nickname || data.user?.nickname || '',
        createdAt: data.createdAt,
      });
    }
  }

  console.log('========================================');
  console.log(`📋 找到 ${usersToMigrate.length} 個需要遷移的用戶：`);
  console.log('========================================\n');

  if (usersToMigrate.length === 0) {
    console.log('✅ 所有用戶都已經使用 timestamp 格式！');
    return;
  }

  // 显示要迁移的用户
  usersToMigrate.forEach((user, index) => {
    const timestampValue = user.createdAt._seconds * 1000;
    const dateStr = new Date(timestampValue).toLocaleString('zh-TW');

    console.log(`${index + 1}. ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   姓名: ${user.firstName} ${user.lastName}`);
    console.log(`   暱稱: ${user.nickname || '-'}`);
    console.log(`   createdAt._seconds: ${user.createdAt._seconds}`);
    console.log(`   將轉換為 timestamp: ${timestampValue}`);
    console.log(`   日期: ${dateStr}`);
    console.log('');
  });

  console.log('========================================');
  console.log('🔄 開始遷移...');
  console.log('========================================\n');

  let successCount = 0;
  let errorCount = 0;

  for (const user of usersToMigrate) {
    try {
      const timestamp = user.createdAt._seconds * 1000;

      // 更新 registrations collection (唯一数据源)
      await db.collection('registrations').doc(user.id).update({
        timestamp: timestamp,
        // 保留 createdAt 作为历史记录
        // 不删除 createdAt，以防需要回滚
      });

      console.log(`✅ ${user.email} - 已更新 timestamp`);

      successCount++;
    } catch (error) {
      console.error(`❌ ${user.email} - 更新失敗:`, error.message);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log('📊 遷移完成統計：');
  console.log('========================================');
  console.log(`✅ 成功: ${successCount} 個用戶`);
  console.log(`❌ 失敗: ${errorCount} 個用戶`);
  console.log(`📋 總計: ${usersToMigrate.length} 個用戶`);
  console.log('========================================');
}

migrateUsers()
  .then(() => {
    console.log('\n✅ 腳本執行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
