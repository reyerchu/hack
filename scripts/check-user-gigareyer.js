#!/usr/bin/env node
/**
 * 检查 gigareyer@gmail.com 的注册数据
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
    // 去除引号
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

async function checkUser() {
  const email = 'gigareyer@gmail.com';
  const uid = 'WHayuQFmKpgpIsd5hN36PoWNBNr1';

  console.log('========================================');
  console.log('🔍 檢查用戶: gigareyer@gmail.com');
  console.log('Firebase UID:', uid);
  console.log('========================================\n');

  // 1. 检查 registrations collection (by UID)
  console.log('1️⃣ 檢查 registrations collection (by UID)...');
  const regByUID = await db.collection('registrations').doc(uid).get();
  if (regByUID.exists) {
    console.log('✅ 找到記錄！');
    console.log('文檔 ID:', regByUID.id);
    console.log('數據:', JSON.stringify(regByUID.data(), null, 2));
  } else {
    console.log('❌ 沒有找到');
  }
  console.log('');

  // 2. 检查 registrations collection (by email)
  console.log('2️⃣ 檢查 registrations collection (by email)...');
  const regByEmail = await db
    .collection('registrations')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (!regByEmail.empty) {
    console.log('✅ 找到記錄！');
    regByEmail.docs.forEach((doc) => {
      console.log('文檔 ID:', doc.id);
      console.log('數據:', JSON.stringify(doc.data(), null, 2));
    });
  } else {
    console.log('❌ 沒有找到');
  }
  console.log('');

  // 3. 检查 registrations collection (by preferredEmail)
  console.log('3️⃣ 檢查 registrations collection (by preferredEmail)...');
  const regByPrefEmail = await db
    .collection('registrations')
    .where('preferredEmail', '==', email)
    .limit(1)
    .get();

  if (!regByPrefEmail.empty) {
    console.log('✅ 找到記錄！');
    regByPrefEmail.docs.forEach((doc) => {
      console.log('文檔 ID:', doc.id);
      console.log('數據:', JSON.stringify(doc.data(), null, 2));
    });
  } else {
    console.log('❌ 沒有找到');
  }
  console.log('');

  // 4. 检查 users collection (by UID)
  console.log('4️⃣ 檢查 users collection (by UID)...');
  const userByUID = await db.collection('users').doc(uid).get();
  if (userByUID.exists) {
    console.log('✅ 找到記錄！');
    console.log('文檔 ID:', userByUID.id);
    console.log('數據:', JSON.stringify(userByUID.data(), null, 2));
  } else {
    console.log('❌ 沒有找到');
  }
  console.log('');

  // 5. 检查 users collection (by email)
  console.log('5️⃣ 檢查 users collection (by email)...');
  const userByEmail = await db.collection('users').where('email', '==', email).limit(1).get();

  if (!userByEmail.empty) {
    console.log('✅ 找到記錄！');
    userByEmail.docs.forEach((doc) => {
      console.log('文檔 ID:', doc.id);
      console.log('數據:', JSON.stringify(doc.data(), null, 2));
    });
  } else {
    console.log('❌ 沒有找到');
  }
  console.log('');

  console.log('========================================');
  console.log('✅ 檢查完成');
  console.log('========================================');
}

checkUser()
  .then(() => {
    console.log('\n✅ 腳本執行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
