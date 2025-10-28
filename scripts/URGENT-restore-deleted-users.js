#!/usr/bin/env node
/**
 * 紧急恢复被删除的用户数据
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

async function restoreUsers() {
  console.log('========================================');
  console.log('🚨 緊急恢復被刪除的用戶數據');
  console.log('========================================\n');

  // 被删除的用户数据（从之前的日志中获取）
  const deletedUsers = [
    {
      id: 'SWHweef1mwNDuQ2b0vp13nE0bhh1',
      email: 'ball12312323@gmail.com',
      createdAt_seconds: 1761228487,
      timestamp: 1761228487000,
    },
    {
      id: 'W43kcvxZOgOdkJCjERzGQvCxzYI2',
      email: 'rayincosmos@gmail.com',
      createdAt_seconds: 1761232425, // 2025/10/23 下午10:43:45
    },
    {
      id: 'WHayuQFmKpgpIsd5hN36PoWNBNr1',
      email: 'gigareyer@gmail.com',
      createdAt_seconds: 1761227949,
      timestamp: 1761227949000,
    },
    {
      id: 'dtme8WIIOVgEQ56RQO1Ua32DWZ53',
      email: 'etincelle_hikari@gapp.nthu.edu.tw',
      createdAt_seconds: 1761229121, // 2025/10/23 下午10:18:41
    },
  ];

  console.log('檢查這些用戶是否存在於 registrations collection...\n');

  let restoredCount = 0;
  let alreadyExistsCount = 0;

  for (const user of deletedUsers) {
    try {
      // 检查是否已经存在于 registrations
      const regDoc = await db.collection('registrations').doc(user.id).get();

      if (regDoc.exists) {
        console.log(`✅ ${user.email} - 已存在於 registrations (無需恢復)`);
        alreadyExistsCount++;

        // 但要确保有 timestamp
        const data = regDoc.data();
        if (!data.timestamp && user.timestamp) {
          await regDoc.ref.update({ timestamp: user.timestamp });
          console.log(`   ✅ 已添加 timestamp: ${user.timestamp}`);
        }
      } else {
        console.log(`❌ ${user.email} - 不存在！需要從日誌中恢復...`);
        console.log(`   這個用戶的完整數據需要從 Firebase 日誌或備份中恢復`);
      }
    } catch (error) {
      console.error(`❌ 檢查 ${user.email} 失敗:`, error.message);
    }
  }

  console.log('\n========================================');
  console.log('📊 統計：');
  console.log('========================================');
  console.log(`✅ 已存在: ${alreadyExistsCount} 個`);
  console.log(`❌ 需要恢復: ${deletedUsers.length - alreadyExistsCount} 個`);
  console.log('========================================');
}

restoreUsers()
  .then(() => {
    console.log('\n✅ 檢查完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
