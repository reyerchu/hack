#!/usr/bin/env node

/**
 * 清空所有 schedule events，恢復到原始 mock data 狀態
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// 初始化 Firebase Admin
if (!admin.apps.length) {
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ SERVICE_ACCOUNT_PRIVATE_KEY 未設置');
    process.exit(1);
  }

  // 處理私鑰格式
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'hackathon-rwa-nexus.firebasestorage.app',
  });
  console.log('✅ Firebase Admin SDK 初始化成功');
}

const db = admin.firestore();

async function clearAllEvents() {
  try {
    console.log('開始清空所有 schedule events...');

    const scheduleRef = db.collection('schedule-events');
    const allEvents = await scheduleRef.get();

    if (allEvents.empty) {
      console.log('數據庫已經是空的');
      process.exit(0);
    }

    console.log(`找到 ${allEvents.size} 個事件，準備刪除...`);

    const batch = db.batch();
    allEvents.forEach((doc) => {
      const data = doc.data();
      console.log(`刪除: Event ${data.Event} - ${data.title}`);
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log('\n✅ 所有事件已清空！');
    console.log('✅ 現在 API 會返回原始 mock data（不保存到數據庫）');

    // 驗證結果
    const verification = await scheduleRef.get();
    console.log(`\n驗證：數據庫中現有 ${verification.size} 個事件`);
  } catch (error) {
    console.error('刪除失敗:', error);
    process.exit(1);
  }

  process.exit(0);
}

clearAllEvents();
