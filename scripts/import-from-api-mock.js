#!/usr/bin/env node

/**
 * 從 API 的 getMockScheduleEvents 函數導入活動到 Firestore
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
  });
  console.log('✅ Firebase Admin SDK 初始化成功');
}

const db = admin.firestore();

// 這是從 API 中複製的完整 mock data
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
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-16T20:00:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-16T21:00:00+08:00')),
  },
  {
    title: '意圖導向程式的機會與挑戰',
    Event: 3,
    track: 'Technical',
    location: '線上',
    speakers: ['陳品'],
    description: '探討意圖導向程式設計在區塊鏈領域的機會與面臨的挑戰',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['熱門賽道', '技術'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-17T20:00:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-17T21:30:00+08:00')),
  },
  {
    title: 'DeFi 優化器',
    Event: 3,
    track: 'Technical',
    location: '線上',
    speakers: ['Reyer'],
    description: 'DeFi 優化器的設計原理與實踐應用',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['熱門賽道'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-20T20:00:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-20T20:30:00+08:00')),
  },
  {
    title: '股票代幣化與鏈上基金實務',
    Event: 3,
    track: 'Technical',
    location: '線上',
    speakers: ['清華大學'],
    description: '探討股票代幣化與鏈上基金的實務運作',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['熱門賽道', '技術'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-21T20:00:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-21T21:00:00+08:00')),
  },
  {
    title: 'Solidity – 以太坊智能合約基礎 實作練習',
    Event: 4,
    track: 'Workshop',
    location: '線上',
    speakers: [],
    description: 'Solidity 智能合約基礎課程與實作練習',
    page: 'RWA 黑客松',
    status: 'unconfirmed',
    tags: ['技術'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-22T19:00:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-22T21:00:00+08:00')),
  },
  {
    title: 'imToken',
    Event: 2,
    track: 'Sponsor',
    location: 'imToken 台北市中正區羅斯福路二段 9 號 9 樓',
    speakers: ['imToken'],
    description: 'imToken 贊助商活動',
    page: 'RWA 黑客松',
    status: 'unconfirmed',
    tags: ['贊助商', '組隊社交'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-23T19:00:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-23T21:00:00+08:00')),
  },
  {
    title: 'AI Agent & Blockchain/ERC-8004',
    Event: 3,
    track: 'Technical',
    location: 'imToken 台北市中正區羅斯福路二段 9 號 9 樓',
    speakers: ['Reyer'],
    description: '探討 AI Agent 與區塊鏈結合，介紹 ERC-8004 標準',
    page: 'RWA 黑客松',
    status: 'unconfirmed',
    tags: ['技術', '組隊社交'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-24T19:00:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-24T20:00:00+08:00')),
  },
  {
    title: 'DeFi Chit-chat + RWA 現場組隊',
    Event: 5,
    track: 'Social',
    location: 'Cozy Cowork Cafe',
    speakers: ['XueDAO'],
    description: 'DeFi 主題聊天與 RWA 現場組隊活動\n報名連結：https://luma.com/cmy4qjmz?tk=0FYhD',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['熱門賽道', '技術', '組隊社交'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-26T19:00:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-26T21:30:00+08:00')),
  },
  {
    title: '黑客松經驗分享',
    Event: 3,
    track: 'Technical',
    location: 'imToken 台北市中正區羅斯福路二段 9 號 9 樓',
    speakers: [],
    description: '參加黑客松的經驗分享與技巧',
    page: 'RWA 黑客松',
    status: 'unconfirmed',
    tags: ['技術', '組隊社交'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-27T19:00:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-27T21:00:00+08:00')),
  },
  {
    title: 'RWA 代幣化論壇',
    Event: 1,
    track: 'Conference',
    location: '政大公企 A747',
    speakers: [],
    description: 'RWA 代幣化論壇',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['熱門賽道'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-30T09:30:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-30T12:20:00+08:00')),
  },
  {
    title: 'RWA 技術應用與產業發展研討會',
    Event: 1,
    track: 'Conference',
    location: '政大公企 A747',
    speakers: [],
    description: 'RWA 技術應用與產業發展研討會',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['熱門賽道', '技術'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-30T13:30:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-30T16:30:00+08:00')),
  },
  {
    title: '黑客松 Day 1',
    Event: 6,
    track: 'Hackathon',
    location: '政大公企 A747',
    speakers: [],
    description: '黑客松第一天',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['黑客松'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-31T09:30:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-31T22:00:00+08:00')),
  },
  {
    title: '黑客松 Day 2',
    Event: 6,
    track: 'Hackathon',
    location: '政大公企 A747',
    speakers: [],
    description: '黑客松第二天',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['黑客松'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-01T09:00:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-01T11:30:00+08:00')),
  },
  {
    title: '黑客松 Demo Day｜評審｜頒獎',
    Event: 6,
    track: 'Hackathon',
    location: '政大公企 A645',
    speakers: [],
    description: '黑客松 Demo Day、評審與頒獎典禮',
    page: 'RWA 黑客松',
    status: 'confirmed',
    tags: ['黑客松'],
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-01T13:30:00+08:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-01T16:30:00+08:00')),
  },
];

async function importEvents() {
  try {
    console.log('開始導入活動...');

    const batch = db.batch();
    const scheduleRef = db.collection('schedule-events');

    for (const event of mockEvents) {
      const docRef = scheduleRef.doc();
      batch.set(docRef, event);
      console.log(`準備導入: Event ${event.Event} - ${event.title}`);
    }

    await batch.commit();
    console.log(`\n✅ 成功導入 ${mockEvents.length} 個活動！`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 導入失敗:', error);
    process.exit(1);
  }
}

importEvents();
