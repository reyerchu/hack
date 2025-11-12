#!/usr/bin/env node
/**
 * 查找没有注册日期的用户
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

async function findUsersWithoutDate() {
  console.log('========================================');
  console.log('🔍 查找沒有註冊日期的用戶');
  console.log('========================================\n');

  // 查询所有注册用户
  const registrationsSnapshot = await db.collection('registrations').get();

  console.log(`總共找到 ${registrationsSnapshot.docs.length} 個用戶\n`);

  const usersWithoutDate = [];

  for (const doc of registrationsSnapshot.docs) {
    const data = doc.data();
    const hasTimestamp = !!data.timestamp;
    const hasCreatedAt = !!data.createdAt;

    if (!hasTimestamp && !hasCreatedAt) {
      usersWithoutDate.push({
        id: doc.id,
        email: data.email || data.preferredEmail || data.user?.preferredEmail || '未知',
        firstName: data.firstName || data.user?.firstName || '',
        lastName: data.lastName || data.user?.lastName || '',
        nickname: data.nickname || data.user?.nickname || '',
        data: data,
      });
    }
  }

  console.log('========================================');
  console.log(`❌ 找到 ${usersWithoutDate.length} 個沒有註冊日期的用戶：`);
  console.log('========================================\n');

  if (usersWithoutDate.length === 0) {
    console.log('✅ 所有用戶都有註冊日期！');
  } else {
    usersWithoutDate.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   姓名: ${user.firstName} ${user.lastName}`);
      console.log(`   暱稱: ${user.nickname || '-'}`);
      console.log(`   有 updatedAt: ${!!user.data.updatedAt}`);
      if (user.data.updatedAt) {
        console.log(
          `   updatedAt: ${new Date(user.data.updatedAt._seconds * 1000).toLocaleString('zh-TW')}`,
        );
      }
      console.log('');
    });

    console.log('\n========================================');
    console.log('💡 建議：使用 updatedAt 或當前時間作為 createdAt');
    console.log('========================================');
  }
}

findUsersWithoutDate()
  .then(() => {
    console.log('\n✅ 腳本執行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
