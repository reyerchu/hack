#!/usr/bin/env node

/**
 * 將 mock schedule events 導入到 Firestore
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// 初始化 Firebase Admin (使用環境變量)
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

// Mock events data (從 API 中複製)
const mockEvents = [
  {
    title: '流動性質押/再質押/流動性再質押',
    Event: 3,
    track: 'Technical',
    location: '線上',
    speakers: ['Reyer'],
    description: '深入探討流動性質押、再質押及流動性再質押的機制與應用',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['熱門賽道'],
    startDate: new Date('2025-10-16T20:00:00+08:00'),
    endDate: new Date('2025-10-16T21:00:00+08:00'),
  },
  {
    title: '意圖導向程式的機會與挑戰',
    Event: 4,
    track: 'Technical',
    location: '線上',
    speakers: ['Yuriy'],
    description: 'Intent-Based programming 的商業邏輯應用探討，從 web3 應用到 智能合約 zkML',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['熱門賽道'],
    startDate: new Date('2025-10-17T20:00:00+08:00'),
    endDate: new Date('2025-10-17T21:00:00+08:00'),
  },
  {
    title: 'RWA 101',
    Event: 5,
    track: 'Technical',
    location: '線上',
    speakers: ['Reyer'],
    description: 'RWA 基礎介紹與應用案例分享',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['熱門賽道'],
    startDate: new Date('2025-10-19T14:00:00+08:00'),
    endDate: new Date('2025-10-19T15:00:00+08:00'),
  },
  {
    title: 'Pelith 贊助商活動',
    Event: 6,
    track: 'Sponsor',
    location: 'Pelith 台北市大安區復興南路一段 293 號 6 樓',
    speakers: ['Pelith'],
    description: 'Pelith 贊助商分享活動',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['贊助商', '組隊社交'],
    startDate: new Date('2025-10-22T10:00:00+08:00'),
    endDate: new Date('2025-10-22T12:00:00+08:00'),
  },
  {
    title: 'imKey 贊助商活動',
    Event: 7,
    track: 'Sponsor',
    location: 'imKey Pro 台北市大安區敦化南路二段 105 號 10 樓',
    speakers: ['imKey'],
    description: 'imKey Pro 贊助商分享活動',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['贊助商', '組隊社交'],
    startDate: new Date('2025-10-22T14:00:00+08:00'),
    endDate: new Date('2025-10-22T16:00:00+08:00'),
  },
  {
    title: 'SparkLands 贊助商活動',
    Event: 8,
    track: 'Sponsor',
    location: 'SparkLands 台北市大安區復興南路二段 200 號 12 樓',
    speakers: ['SparkLands'],
    description: 'SparkLands 贊助商分享活動',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['贊助商', '組隊社交'],
    startDate: new Date('2025-10-23T10:00:00+08:00'),
    endDate: new Date('2025-10-23T12:00:00+08:00'),
  },
  {
    title: '黑客松開幕',
    Event: 9,
    track: 'Main',
    location: '清華大學台積館 1 樓',
    speakers: ['主辦方'],
    description: 'RWA 黑客松正式開幕典禮',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['重要活動'],
    startDate: new Date('2025-10-25T09:00:00+08:00'),
    endDate: new Date('2025-10-25T10:00:00+08:00'),
  },
  {
    title: '團隊組建時間',
    Event: 10,
    track: 'Main',
    location: '清華大學台積館',
    speakers: [],
    description: '自由組隊與討論時間',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['組隊社交'],
    startDate: new Date('2025-10-25T10:00:00+08:00'),
    endDate: new Date('2025-10-25T12:00:00+08:00'),
  },
  {
    title: '午餐時間',
    Event: 11,
    track: 'Main',
    location: '清華大學台積館',
    speakers: [],
    description: '午餐供應',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: [],
    startDate: new Date('2025-10-25T12:00:00+08:00'),
    endDate: new Date('2025-10-25T13:00:00+08:00'),
  },
  {
    title: 'Hacking 時間',
    Event: 12,
    track: 'Main',
    location: '清華大學台積館',
    speakers: [],
    description: '專注開發時間',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: [],
    startDate: new Date('2025-10-25T13:00:00+08:00'),
    endDate: new Date('2025-10-25T18:00:00+08:00'),
  },
  {
    title: '晚餐時間',
    Event: 13,
    track: 'Main',
    location: '清華大學台積館',
    speakers: [],
    description: '晚餐供應',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: [],
    startDate: new Date('2025-10-25T18:00:00+08:00'),
    endDate: new Date('2025-10-25T19:00:00+08:00'),
  },
  {
    title: '持續 Hacking',
    Event: 14,
    track: 'Main',
    location: '清華大學台積館',
    speakers: [],
    description: '繼續開發您的專案',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: [],
    startDate: new Date('2025-10-25T19:00:00+08:00'),
    endDate: new Date('2025-10-26T08:00:00+08:00'),
  },
  {
    title: '早餐時間',
    Event: 15,
    track: 'Main',
    location: '清華大學台積館',
    speakers: [],
    description: '早餐供應',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: [],
    startDate: new Date('2025-10-26T08:00:00+08:00'),
    endDate: new Date('2025-10-26T09:00:00+08:00'),
  },
  {
    title: '最後衝刺',
    Event: 16,
    track: 'Main',
    location: '清華大學台積館',
    speakers: [],
    description: '完成專案的最後時刻',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: [],
    startDate: new Date('2025-10-26T09:00:00+08:00'),
    endDate: new Date('2025-10-26T12:00:00+08:00'),
  },
  {
    title: '專案提交截止',
    Event: 17,
    track: 'Main',
    location: '清華大學台積館',
    speakers: [],
    description: '所有專案必須在此時間前提交',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['重要活動'],
    startDate: new Date('2025-10-26T12:00:00+08:00'),
    endDate: new Date('2025-10-26T12:30:00+08:00'),
  },
  {
    title: '午餐時間',
    Event: 18,
    track: 'Main',
    location: '清華大學台積館',
    speakers: [],
    description: '午餐供應',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: [],
    startDate: new Date('2025-10-26T12:30:00+08:00'),
    endDate: new Date('2025-10-26T13:30:00+08:00'),
  },
  {
    title: '專案展示與評審',
    Event: 19,
    track: 'Main',
    location: '清華大學台積館',
    speakers: ['評審團'],
    description: '各團隊進行專案展示，評審進行評分',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['重要活動'],
    startDate: new Date('2025-10-26T13:30:00+08:00'),
    endDate: new Date('2025-10-26T16:00:00+08:00'),
  },
  {
    title: '頒獎典禮',
    Event: 20,
    track: 'Main',
    location: '清華大學台積館',
    speakers: ['主辦方', '贊助商'],
    description: 'RWA 黑客松頒獎典禮',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['重要活動'],
    startDate: new Date('2025-10-26T16:00:00+08:00'),
    endDate: new Date('2025-10-26T17:00:00+08:00'),
  },
  {
    title: '閉幕與合影',
    Event: 21,
    track: 'Main',
    location: '清華大學台積館',
    speakers: ['主辦方'],
    description: '黑客松閉幕與大合照',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['重要活動'],
    startDate: new Date('2025-10-26T17:00:00+08:00'),
    endDate: new Date('2025-10-26T17:30:00+08:00'),
  },
  {
    title: '國泰 Cathay x imToken 工作坊',
    Event: 1,
    track: 'Sponsor',
    location: '國泰金控大樓 B1 國泰創新中心',
    speakers: ['國泰', 'imToken'],
    description: '國泰金控與 imToken 聯合舉辦的區塊鏈技術工作坊',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['贊助商', '組隊社交'],
    startDate: new Date('2025-10-21T14:00:00+08:00'),
    endDate: new Date('2025-10-21T17:00:00+08:00'),
  },
];

async function importEvents() {
  try {
    console.log('開始導入 mock schedule events...');

    const batch = db.batch();
    const scheduleRef = db.collection('schedule-events');

    for (const event of mockEvents) {
      // 使用標題來查詢是否已存在（標題才是唯一的）
      const existingEvent = await scheduleRef.where('title', '==', event.title).get();

      if (existingEvent.empty) {
        // 如果不存在，創建新的
        const docRef = scheduleRef.doc();
        batch.set(docRef, event);
        console.log(`準備導入: Event ${event.Event} - ${event.title}`);
      } else {
        console.log(`跳過已存在的: Event ${event.Event} - ${event.title}`);
      }
    }

    await batch.commit();
    console.log('\n✅ Mock schedule events 導入完成！');
    console.log(`總共處理了 ${mockEvents.length} 個事件`);

    // 驗證導入結果
    const allEvents = await scheduleRef.get();
    console.log(`\n數據庫中現有 ${allEvents.size} 個事件`);
  } catch (error) {
    console.error('導入失敗:', error);
    process.exit(1);
  }

  process.exit(0);
}

importEvents();
