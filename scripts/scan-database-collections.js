#!/usr/bin/env node
/**
 * 扫描数据库所有集合，检查与用户注册相关的数据
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

async function scanDatabase() {
  console.log('========================================');
  console.log('🔍 掃描數據庫所有集合');
  console.log('========================================\n');

  try {
    // 获取所有集合
    const collections = await db.listCollections();

    console.log(`📊 找到 ${collections.length} 個集合：\n`);

    for (const collection of collections) {
      const collectionName = collection.id;
      const snapshot = await collection.limit(1).get();

      console.log(`📁 ${collectionName}`);
      console.log(`   文檔數量: ${(await collection.get()).size}`);

      if (!snapshot.empty) {
        const sampleDoc = snapshot.docs[0];
        const data = sampleDoc.data();
        const fields = Object.keys(data);

        // 检查是否有用户相关字段
        const userRelatedFields = fields.filter(
          (field) =>
            field.includes('user') ||
            field.includes('User') ||
            field.includes('email') ||
            field.includes('Email') ||
            field === 'id' ||
            field === 'uid' ||
            field === 'userId',
        );

        if (userRelatedFields.length > 0) {
          console.log(`   ⚠️  可能與用戶相關的字段: ${userRelatedFields.join(', ')}`);
        }

        console.log(`   樣本字段 (前10個): ${fields.slice(0, 10).join(', ')}`);
      }
      console.log('');
    }

    console.log('\n========================================');
    console.log('🔍 檢查特定用戶的數據分佈');
    console.log('========================================\n');

    // 检查一个最近注册的用户在各个集合中的数据
    const testUserId = 'WHayuQFmKpgpIsd5hN36PoWNBNr1'; // gigareyer@gmail.com
    const testUserEmail = 'gigareyer@gmail.com';

    console.log(`測試用戶: ${testUserEmail} (${testUserId})\n`);

    const userDataLocations = [];

    for (const collection of collections) {
      const collectionName = collection.id;

      // 检查是否有这个用户的数据
      const byId = await collection.doc(testUserId).get();
      if (byId.exists) {
        userDataLocations.push({
          collection: collectionName,
          method: 'by document ID',
          data: Object.keys(byId.data()).join(', '),
        });
      }

      // 尝试通过 email 查询
      try {
        const byEmail = await collection.where('email', '==', testUserEmail).limit(1).get();
        if (!byEmail.empty) {
          userDataLocations.push({
            collection: collectionName,
            method: 'by email field',
            data: Object.keys(byEmail.docs[0].data()).join(', '),
          });
        }
      } catch (error) {
        // 字段可能不存在，忽略
      }

      // 尝试通过 userId 字段查询
      try {
        const byUserId = await collection.where('userId', '==', testUserId).limit(1).get();
        if (!byUserId.empty) {
          userDataLocations.push({
            collection: collectionName,
            method: 'by userId field',
            data: Object.keys(byUserId.docs[0].data()).join(', '),
          });
        }
      } catch (error) {
        // 字段可能不存在，忽略
      }
    }

    console.log('📍 找到該用戶的數據位置：\n');
    if (userDataLocations.length === 0) {
      console.log('   ❌ 沒有找到該用戶的數據');
    } else {
      userDataLocations.forEach((loc) => {
        console.log(`   ✅ ${loc.collection}`);
        console.log(`      查找方式: ${loc.method}`);
        console.log(
          `      字段: ${loc.data.substring(0, 100)}${loc.data.length > 100 ? '...' : ''}`,
        );
        console.log('');
      });
    }

    console.log('========================================');
    console.log('📋 建議');
    console.log('========================================');
    console.log('註冊時需要更新的集合：');
    console.log('✅ registrations - 主數據源 (已處理)');
    console.log('✅ miscellaneous/allusers - 用戶緩存 (已處理)');

    // 检查是否有其他需要更新的集合
    const importantCollections = [
      'users',
      'profiles',
      'accounts',
      'user-data',
      'user-profiles',
      'user-settings',
    ];

    for (const collName of importantCollections) {
      const exists = collections.some((c) => c.id === collName);
      if (exists) {
        const count = (await db.collection(collName).get()).size;
        if (count > 0) {
          console.log(`⚠️  ${collName} - ${count} 個文檔 (需要檢查是否應該在註冊時更新)`);
        }
      }
    }

    console.log('========================================');
  } catch (error) {
    console.error('❌ 掃描失敗:', error);
    throw error;
  }
}

scanDatabase()
  .then(() => {
    console.log('\n✅ 掃描完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
