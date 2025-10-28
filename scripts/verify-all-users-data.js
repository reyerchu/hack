#!/usr/bin/env node
/**
 * 验证所有用户数据完整性
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

async function verifyAllUsers() {
  console.log('========================================');
  console.log('✅ 驗證所有用戶數據完整性');
  console.log('========================================\n');

  const targetUsers = [
    'ball12312323@gmail.com',
    'rayincosmos@gmail.com',
    'gigareyer@gmail.com',
    'etincelle_hikari@gapp.nthu.edu.tw',
  ];

  for (const email of targetUsers) {
    console.log(`🔍 ${email}`);
    console.log('---');

    // 查找用户
    let querySnapshot = await db
      .collection('registrations')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      // 尝试 preferredEmail
      querySnapshot = await db
        .collection('registrations')
        .where('preferredEmail', '==', email)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        console.log('❌ 找不到用戶！\n');
        continue;
      }
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    console.log(`✅ 找到用戶: ${doc.id}`);
    console.log(
      `   姓名: ${data.firstName || data.user?.firstName || ''} ${
        data.lastName || data.user?.lastName || ''
      }`,
    );
    console.log(`   暱稱: ${data.nickname || data.user?.nickname || '-'}`);
    console.log(`   Email: ${data.email || data.preferredEmail || '-'}`);

    // 检查 timestamp
    if (data.timestamp) {
      console.log(
        `   ✅ timestamp: ${data.timestamp} (${new Date(data.timestamp).toLocaleString('zh-TW')})`,
      );
    } else if (data.createdAt) {
      const timestamp = data.createdAt._seconds * 1000;
      console.log(`   ⚠️  只有 createdAt，需要添加 timestamp: ${timestamp}`);

      // 添加 timestamp
      await doc.ref.update({ timestamp });
      console.log(`   ✅ 已添加 timestamp`);
    } else {
      console.log(`   ❌ 沒有 timestamp 或 createdAt！`);
    }

    // 检查其他重要字段
    const hasUser = !!data.user;
    const hasPermissions = !!(data.permissions || data.user?.permissions);
    const hasGender = !!(data.gender || data.user?.gender);
    const hasTeamStatus = !!(data.teamStatus || data.user?.teamStatus);

    console.log(`   user 對象: ${hasUser ? '✅' : '❌'}`);
    console.log(`   permissions: ${hasPermissions ? '✅' : '❌'}`);
    console.log(`   gender: ${hasGender ? '✅' : '❌'}`);
    console.log(`   teamStatus: ${hasTeamStatus ? '✅' : '❌'}`);
    console.log('');
  }

  console.log('========================================');
  console.log('✅ 驗證完成');
  console.log('========================================');
}

verifyAllUsers()
  .then(() => {
    console.log('\n✅ 完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
