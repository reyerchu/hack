/**
 * API: 單個通知操作
 * 
 * PATCH /api/sponsor/notifications/[id] - 標记為已读/未读
 * DELETE /api/sponsor/notifications/[id] - 刪除通知
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';
import { requireSponsorAuth } from '../../../../lib/sponsor/middleware';
import { SPONSOR_NOTIFICATIONS } from '../../../../lib/sponsor/collections';

initializeApi();
const db = firestore();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid notification ID' });
  }

  try {
    const { userId } = (req as any).user;

    // 獲取通知並驗證所有权
    const notificationRef = db.collection(SPONSOR_NOTIFICATIONS).doc(id);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = notificationDoc.data();

    if (notification?.recipientId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // PATCH: 標记為已读/未读
    if (req.method === 'PATCH') {
      const { isRead } = req.body;

      if (typeof isRead !== 'boolean') {
        return res.status(400).json({ error: 'Invalid isRead value' });
      }

      await notificationRef.update({
        isRead,
        readAt: isRead ? new Date() : null,
      });

      return res.status(200).json({
        id,
        isRead,
        message: 'Notification updated successfully',
      });
    }

    // DELETE: 刪除通知
    if (req.method === 'DELETE') {
      await notificationRef.delete();

      return res.status(200).json({
        id,
        message: 'Notification deleted successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireSponsorAuth(handler);

