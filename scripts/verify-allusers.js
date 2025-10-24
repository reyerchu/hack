#!/usr/bin/env node
/**
 * 验证 miscellaneous/allusers 的数据
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
  console.log('✅ 驗證 miscellaneous/allusers');
  console.log('========================================\n');

  try {
    const allusersDoc = await db.collection('miscellaneous').doc('allusers').get();

    if (!allusersDoc.exists) {
      console.log('❌ miscellaneous/allusers 文檔不存在！');
      return;
    }

    const data = allusersDoc.data();
    const users = data.users || [];

    console.log('📊 統計信息：');
    console.log(`   總用戶數: ${users.length}`);
    console.log(
      `   最後更新: ${
        data.lastUpdated
          ? new Date(data.lastUpdated._seconds * 1000).toLocaleString('zh-TW')
          : '未知'
      }`,
    );
    console.log('');

    // 检查最近注册的用户是否在列表中
    const recentUsers = [
      'ball12312323@gmail.com',
      'rayincosmos@gmail.com',
      'gigareyer@gmail.com',
      'etincelle_hikari@gapp.nthu.edu.tw',
    ];

    console.log('🔍 檢查最近註冊的用戶：');
    for (const email of recentUsers) {
      // 从 registrations 获取用户 ID
      let querySnapshot = await db
        .collection('registrations')
        .where('email', '==', email)
        .limit(1)
        .get();
      if (querySnapshot.empty) {
        querySnapshot = await db
          .collection('registrations')
          .where('preferredEmail', '==', email)
          .limit(1)
          .get();
      }

      if (querySnapshot.empty) {
        console.log(`   ❌ ${email} - 在 registrations 中找不到`);
        continue;
      }

      const userId = querySnapshot.docs[0].id;
      const userData = querySnapshot.docs[0].data();
      const inAllusers = users.some((u) => u.id === userId);

      if (inAllusers) {
        const allusersUser = users.find((u) => u.id === userId);
        console.log(`   ✅ ${email}`);
        console.log(`      ID: ${userId}`);
        console.log(`      姓名: ${allusersUser.user.firstName} ${allusersUser.user.lastName}`);
        console.log(`      權限: ${allusersUser.user.permissions.join(', ')}`);
      } else {
        console.log(`   ❌ ${email} - 不在 allusers 中！`);
        console.log(`      ID: ${userId}`);
        console.log(
          `      姓名: ${userData.user?.firstName || userData.firstName} ${
            userData.user?.lastName || userData.lastName
          }`,
        );
      }
    }

    console.log('\n========================================');
    console.log('✅ 驗證完成');
    console.log('========================================');
  } catch (error) {
    console.error('❌ 驗證失敗:', error);
    throw error;
  }
}

verifyAllUsers()
  .then(() => {
    console.log('\n✅ 腳本執行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
