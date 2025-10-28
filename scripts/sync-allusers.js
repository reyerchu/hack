#!/usr/bin/env node
/**
 * 同步所有用户到 miscellaneous/allusers
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

async function syncAllUsers() {
  console.log('========================================');
  console.log('🔄 同步所有用戶到 miscellaneous/allusers');
  console.log('========================================\n');

  try {
    // 获取所有注册用户
    const registrationsSnapshot = await db.collection('registrations').get();

    console.log(`📊 找到 ${registrationsSnapshot.size} 個註冊用戶\n`);

    // 构建用户列表
    const users = [];
    registrationsSnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        user: {
          firstName: data.user?.firstName || data.firstName || '',
          lastName: data.user?.lastName || data.lastName || '',
          permissions: data.user?.permissions || data.permissions || ['hacker'],
        },
      });
    });

    console.log('📝 準備更新 miscellaneous/allusers...\n');

    // 更新 allusers 文档
    await db.collection('miscellaneous').doc('allusers').set({
      users: users,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      totalUsers: users.length,
    });

    console.log('========================================');
    console.log('✅ 同步完成！');
    console.log('========================================');
    console.log(`總用戶數: ${users.length}`);
    console.log('');

    // 显示前 5 个用户
    console.log('前 5 個用戶：');
    users.slice(0, 5).forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.user.firstName} ${user.user.lastName} (${
          user.id
        }) - ${user.user.permissions.join(', ')}`,
      );
    });
    console.log('========================================');
  } catch (error) {
    console.error('❌ 同步失敗:', error);
    throw error;
  }
}

syncAllUsers()
  .then(() => {
    console.log('\n✅ 腳本執行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
