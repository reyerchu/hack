/**
 * API: 獲取贊助商通知列表
 * 
 * GET /api/sponsor/notifications
 * 
 * Query参数：
 * - unreadOnly: boolean - 只返回未读通知
 * - limit: number - 限制返回數量
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';
import { requireSponsorAuth } from '../../../../lib/sponsor/middleware';
import { SPONSOR_NOTIFICATIONS } from '../../../../lib/sponsor/collections';
import type { SponsorNotification } from '../../../../lib/sponsor/types';

initializeApi();
const db = firestore();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = (req as any).user;
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = parseInt(req.query.limit as string) || 50;

    // 构建查詢
    let query = db
      .collection(SPONSOR_NOTIFICATIONS)
      .where('recipientId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (unreadOnly) {
      query = query.where('isRead', '==', false) as any;
    }

    const snapshot = await query.get();

    const notifications: SponsorNotification[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SponsorNotification[];

    // 統計未读數量
    const unreadCountSnapshot = await db
      .collection(SPONSOR_NOTIFICATIONS)
      .where('recipientId', '==', userId)
      .where('isRead', '==', false)
      .get();

    return res.status(200).json({
      notifications,
      unreadCount: unreadCountSnapshot.size,
      total: snapshot.size,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireSponsorAuth(handler);

