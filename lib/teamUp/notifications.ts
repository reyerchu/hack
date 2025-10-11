/**
 * 站内通知服务
 * 将通知存储到 Firestore 中
 */

import { COLLECTIONS } from './constants';

// 通知類型定義
export interface Notification {
  id: string;
  userId: string;
  type: 'apply_received' | 'apply_accepted' | 'apply_rejected' | 'need_updated' | 'system';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'teamNeed' | 'application';
  actionUrl?: string;
  isRead: boolean;
  readAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
}

/**
 * 创建通知
 */
export async function createNotification(
  data: Omit<Notification, 'id' | 'createdAt'>,
): Promise<Notification> {
  try {
    const admin = await import('firebase-admin');
    const db = admin.firestore();
    const notificationRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc();

    const notification: Notification = {
      id: notificationRef.id,
      ...data,
      createdAt: admin.firestore.Timestamp.now(),
    };

    await notificationRef.set(notification);

    return notification;
  } catch (error) {
    console.error('[Notification] Failed to create notification:', error);
    throw error;
  }
}

/**
 * 获取用户的通知列表
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<Notification[]> {
  try {
    const admin = await import('firebase-admin');
    const db = admin.firestore();
    const snapshot = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map((doc) => doc.data() as Notification);
  } catch (error) {
    console.error('[Notification] Failed to get notifications:', error);
    throw error;
  }
}

/**
 * 获取用户的未读通知数量
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const admin = await import('firebase-admin');
    const db = admin.firestore();
    const snapshot = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error('[Notification] Failed to get unread count:', error);
    throw error;
  }
}

/**
 * 标记通知为已读
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const admin = await import('firebase-admin');
    const db = admin.firestore();
    await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).update({
      isRead: true,
      readAt: admin.firestore.Timestamp.now(),
    });
  } catch (error) {
    console.error('[Notification] Failed to mark as read:', error);
    throw error;
  }
}

/**
 * 标记所有通知为已读
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const admin = await import('firebase-admin');
    const db = admin.firestore();
    const batch = db.batch();

    const snapshot = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isRead: true,
        readAt: admin.firestore.Timestamp.now(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('[Notification] Failed to mark all as read:', error);
    throw error;
  }
}

/**
 * 删除通知
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const admin = await import('firebase-admin');
    const db = admin.firestore();
    await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).delete();
  } catch (error) {
    console.error('[Notification] Failed to delete notification:', error);
    throw error;
  }
}

/**
 * 创建新申请通知（给需求作者）
 */
export async function notifyNewApplication(
  authorId: string,
  needId: string,
  needTitle: string,
  applicationId: string,
): Promise<void> {
  await createNotification({
    userId: authorId,
    type: 'apply_received',
    title: '收到新的隊友應徵',
    message: `您的需求「${needTitle}」收到了新的應徵`,
    relatedId: needId,
    relatedType: 'teamNeed',
    actionUrl: `/team-up/${needId}/applications`,
    isRead: false,
  });
}

/**
 * 创建申请状态更新通知（给申请者）
 */
export async function notifyApplicationStatusUpdate(
  applicantId: string,
  needId: string,
  needTitle: string,
  status: 'accepted' | 'rejected',
): Promise<void> {
  const title = status === 'accepted' ? '應徵已接受' : '應徵未通過';
  const message =
    status === 'accepted'
      ? `恭喜！您對「${needTitle}」的應徵已被接受`
      : `您對「${needTitle}」的應徵未能通過`;

  await createNotification({
    userId: applicantId,
    type: status === 'accepted' ? 'apply_accepted' : 'apply_rejected',
    title,
    message,
    relatedId: needId,
    relatedType: 'teamNeed',
    actionUrl: `/team-up/${needId}`,
    isRead: false,
  });
}
