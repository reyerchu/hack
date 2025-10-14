import { firestore } from 'firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import { userIsAuthorized } from '../../../lib/authorization/check-authorization';

initializeApi();

const SCHEDULE_EVENTS = '/schedule-events';

/**
 *
 * API endpoint to get data of keynote speakers from backend for the keynote speakers section in home page
 *
 * @param req HTTP request object
 * @param res HTTP response object
 *
 *
 */
async function getScheduleEvents(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 检查 Firebase 是否已初始化
    try {
      const db = firestore();
      if (!db) {
        console.warn('Firebase not initialized, returning mock data for schedule events');
        return res.json(getMockScheduleEvents());
      }
    } catch (error) {
      console.warn('Firebase not initialized, returning mock data for schedule events');
      return res.json(getMockScheduleEvents());
    }

    const db = firestore();
    const snapshot = await db.collection(SCHEDULE_EVENTS).get();
    let data = [];
    snapshot.forEach((doc) => {
      const currentEvent = doc.data();
      data.push({
        ...currentEvent,
        startTimestamp: currentEvent.startDate,
        endTimestamp: currentEvent.endDate,
        startDate: currentEvent.startDate.toDate(),
        endDate: currentEvent.endDate.toDate(),
      });
    });
    
    // 如果數據庫為空，返回 mock 數據
    if (data.length === 0) {
      console.log('No events in database, returning mock data for schedule events');
      return res.json(getMockScheduleEvents());
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching schedule events:', error);
    return res.json(getMockScheduleEvents());
  }
}

function getMockScheduleEvents() {
  return [
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
      startTimestamp: { _seconds: new Date('2025-10-16T20:00:00+08:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2025-10-16T21:00:00+08:00').getTime() / 1000 },
    },
    {
      title: '意圖導向程式的機會與挑戰',
      Event: 3,
      track: 'Technical',
      location: '線上',
      speakers: ['Ping'],
      description: '探討意圖導向程式設計在區塊鏈領域的機會與面臨的挑戰',
      page: 'RWA 黑客松',
      status: 'confirmed',
      tags: ['熱門賽道', '技術'],
      startDate: new Date('2025-10-17T20:00:00+08:00'),
      endDate: new Date('2025-10-17T21:30:00+08:00'),
      startTimestamp: { _seconds: new Date('2025-10-17T20:00:00+08:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2025-10-17T21:30:00+08:00').getTime() / 1000 },
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
      startDate: new Date('2025-10-20T20:00:00+08:00'),
      endDate: new Date('2025-10-20T20:30:00+08:00'),
      startTimestamp: { _seconds: new Date('2025-10-20T20:00:00+08:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2025-10-20T20:30:00+08:00').getTime() / 1000 },
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
      tags: ['熱門賽道'],
      startDate: new Date('2025-10-21T20:00:00+08:00'),
      endDate: new Date('2025-10-21T21:00:00+08:00'),
      startTimestamp: { _seconds: new Date('2025-10-21T20:00:00+08:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2025-10-21T21:00:00+08:00').getTime() / 1000 },
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
      startDate: new Date('2025-10-22T19:00:00+08:00'),
      endDate: new Date('2025-10-22T21:00:00+08:00'),
      startTimestamp: { _seconds: new Date('2025-10-22T19:00:00+08:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2025-10-22T21:00:00+08:00').getTime() / 1000 },
    },
    {
      title: 'imToken',
      Event: 2,
      track: 'Sponsor',
      location: '線下+線上',
      speakers: ['imToken'],
      description: 'imToken 贊助商活動',
      page: 'RWA 黑客松',
      status: 'unconfirmed',
      tags: ['黑客松'],
      startDate: new Date('2025-10-23T19:00:00+08:00'),
      endDate: new Date('2025-10-23T21:00:00+08:00'),
      startTimestamp: { _seconds: new Date('2025-10-23T19:00:00+08:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2025-10-23T21:00:00+08:00').getTime() / 1000 },
    },
    {
      title: 'AI Agent & Blockchain/ERC-8004',
      Event: 3,
      track: 'Technical',
      location: '線下+線上',
      speakers: ['Reyer'],
      description: '探討 AI Agent 與區塊鏈結合，介紹 ERC-8004 標準',
      page: 'RWA 黑客松',
      status: 'unconfirmed',
      tags: [],
      startDate: new Date('2025-10-24T19:00:00+08:00'),
      endDate: new Date('2025-10-24T20:00:00+08:00'),
      startTimestamp: { _seconds: new Date('2025-10-24T19:00:00+08:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2025-10-24T20:00:00+08:00').getTime() / 1000 },
    },
    {
      title: 'DeFi Chit-chat + RWA 黑客松現場組隊',
      Event: 5,
      track: 'Social',
      location: '線下',
      speakers: ['XueDAO'],
      description: 'DeFi 主題聊天與 RWA 黑客松現場組隊活動\n報名連結：https://luma.com/cmy4qjmz?tk=0FYhD',
      page: 'RWA 黑客松',
      status: 'confirmed',
      tags: ['熱門賽道', '技術'],
      startDate: new Date('2025-10-26T19:00:00+08:00'),
      endDate: new Date('2025-10-26T21:30:00+08:00'),
      startTimestamp: { _seconds: new Date('2025-10-26T19:00:00+08:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2025-10-26T21:30:00+08:00').getTime() / 1000 },
    },
    {
      title: '黑客松經驗分享',
      Event: 3,
      track: 'Technical',
      location: '線下+線上',
      speakers: ['imToken'],
      description: '參加黑客松的經驗分享與技巧',
      page: 'RWA 黑客松',
      status: 'unconfirmed',
      tags: ['黑客松'],
      startDate: new Date('2025-10-27T19:00:00+08:00'),
      endDate: new Date('2025-10-27T21:00:00+08:00'),
      startTimestamp: { _seconds: new Date('2025-10-27T19:00:00+08:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2025-10-27T21:00:00+08:00').getTime() / 1000 },
    },
  ];
}

async function updateEventDatabase(req: NextApiRequest, res: NextApiResponse) {
  const { startTimestamp, endTimestamp, ...eventData } = JSON.parse(req.body);

  const userToken = req.headers['authorization'] as string;
  const isAuthorized = await userIsAuthorized(userToken, ['super_admin', 'admin']);
  if (!isAuthorized) {
    return res.status(403).json({
      statusCode: 403,
      msg: 'Request is not authorized to perform admin functionality',
    });
  }
  const db = firestore();
  const event = await db.collection(SCHEDULE_EVENTS).where('Event', '==', eventData.Event).get();
  if (event.empty) {
    await db.collection(SCHEDULE_EVENTS).add({
      ...eventData,
      startDate: new Date(eventData.startDate),
      endDate: new Date(eventData.endDate),
    });
    return res.status(201).json({
      msg: 'Event created',
    });
  }
  event.forEach(async (doc) => {
    await db
      .collection(SCHEDULE_EVENTS)
      .doc(doc.id)
      .update({
        ...eventData,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
      });
  });

  return res.status(200).json({
    msg: 'Event updated',
  });
}

async function deleteEvent(req: NextApiRequest, res: NextApiResponse) {
  const userToken = req.headers['authorization'] as string;
  const isAuthorized = await userIsAuthorized(userToken, ['super_admin']);

  if (!isAuthorized) {
    return res.status(403).json({
      statusCode: 403,
      msg: 'Request is not authorized to perform admin functionality',
    });
  }

  const eventData = JSON.parse(req.body);
  const db = firestore();
  const eventDoc = await db.collection(SCHEDULE_EVENTS).where('Event', '==', eventData.Event).get();
  eventDoc.forEach(async (doc) => {
    await db.collection(SCHEDULE_EVENTS).doc(doc.id).delete();
  });
  return res.json({
    msg: 'Event deleted',
  });
}

function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  return getScheduleEvents(req, res);
}

function handlePostRequest(req: NextApiRequest, res: NextApiResponse) {
  return updateEventDatabase(req, res);
}

function handleDeleteRequest(req: NextApiRequest, res: NextApiResponse) {
  return deleteEvent(req, res);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  switch (method) {
    case 'GET': {
      return handleGetRequest(req, res);
    }
    case 'POST': {
      return handlePostRequest(req, res);
    }
    case 'DELETE': {
      return handleDeleteRequest(req, res);
    }
    default: {
      return res.status(404).json({
        msg: 'Route not found',
      });
    }
  }
}
