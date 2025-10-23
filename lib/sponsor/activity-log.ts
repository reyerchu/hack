/**
 * Track Sponsor Feature - Activity Logging
 *
 * 記錄贊助商的所有操作（Audit Trail）
 */

import { firestore } from 'firebase-admin';
import initializeApi from '../admin/init';
import { SPONSOR_COLLECTIONS } from './collections';
import type { SponsorActivityLog, SponsorActivityAction } from './types';

// 确保 Firebase Admin 已初始化
initializeApi();
const db = firestore();

/**
 * 記錄贊助商活动
 *
 * @param params - 活动参数
 */
export async function logSponsorActivity(params: {
  sponsorId: string;
  userId: string;
  userName: string;
  action: SponsorActivityAction;
  targetType: string;
  targetId: string;
  details?: any;
}): Promise<void> {
  try {
    const activityLog: Omit<SponsorActivityLog, 'id'> = {
      sponsorId: params.sponsorId,
      userId: params.userId,
      userName: params.userName,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: params.details || {},
      timestamp: firestore.Timestamp.now(),
    };

    await db.collection(SPONSOR_COLLECTIONS.SPONSOR_ACTIVITY_LOGS).add(activityLog);

    // 日志記錄失败不應該影响主要業务逻辑，所以不抛出错误
  } catch (error) {
    console.error('Failed to log sponsor activity:', error);
  }
}

/**
 * 獲取贊助商的活动日志
 *
 * @param sponsorId - 贊助商 ID
 * @param options - 查詢選項
 * @returns 活动日志列表
 */
export async function getSponsorActivityLogs(
  sponsorId: string,
  options: {
    limit?: number;
    action?: SponsorActivityAction;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {},
): Promise<SponsorActivityLog[]> {
  try {
    let query = db
      .collection(SPONSOR_COLLECTIONS.SPONSOR_ACTIVITY_LOGS)
      .where('sponsorId', '==', sponsorId);

    // 添加筛選条件
    if (options.action) {
      query = query.where('action', '==', options.action);
    }

    if (options.userId) {
      query = query.where('userId', '==', options.userId);
    }

    if (options.startDate) {
      query = query.where('timestamp', '>=', firestore.Timestamp.fromDate(options.startDate));
    }

    if (options.endDate) {
      query = query.where('timestamp', '<=', firestore.Timestamp.fromDate(options.endDate));
    }

    // 按時間倒序排列
    query = query.orderBy('timestamp', 'desc');

    // 限制數量
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as SponsorActivityLog),
    );
  } catch (error) {
    console.error('Failed to get sponsor activity logs:', error);
    return [];
  }
}

/**
 * 獲取用戶的活动日志
 *
 * @param userId - 用戶 ID
 * @param options - 查詢選項
 * @returns 活动日志列表
 */
export async function getUserActivityLogs(
  userId: string,
  options: {
    limit?: number;
    sponsorId?: string;
    action?: SponsorActivityAction;
    startDate?: Date;
    endDate?: Date;
  } = {},
): Promise<SponsorActivityLog[]> {
  try {
    let query = db
      .collection(SPONSOR_COLLECTIONS.SPONSOR_ACTIVITY_LOGS)
      .where('userId', '==', userId);

    // 添加筛選条件
    if (options.sponsorId) {
      query = query.where('sponsorId', '==', options.sponsorId);
    }

    if (options.action) {
      query = query.where('action', '==', options.action);
    }

    if (options.startDate) {
      query = query.where('timestamp', '>=', firestore.Timestamp.fromDate(options.startDate));
    }

    if (options.endDate) {
      query = query.where('timestamp', '<=', firestore.Timestamp.fromDate(options.endDate));
    }

    // 按時間倒序排列
    query = query.orderBy('timestamp', 'desc');

    // 限制數量
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as SponsorActivityLog),
    );
  } catch (error) {
    console.error('Failed to get user activity logs:', error);
    return [];
  }
}

/**
 * 活动類型描述映射（用於UI顯示）
 */
export const ACTIVITY_ACTION_LABELS: Record<SponsorActivityAction, string> = {
  view_submission: '查看提交',
  edit_challenge: '編輯挑戰',
  score_team: '評分隊伍',
  update_track: '更新賽道',
  contact_team: '聯繫隊伍',
  export_report: '導出報告',
  update_challenge: '更新挑戰',
  score_submission: '評分提交',
  download_report: '下載報告',
  other: '其他操作',
};

/**
 * 獲取活动描述文本
 *
 * @param log - 活动日志
 * @returns 可读的描述文本
 */
export function getActivityDescription(log: SponsorActivityLog): string {
  const actionLabel = ACTIVITY_ACTION_LABELS[log.action] || log.action;

  switch (log.action) {
    case 'view_submission':
      return `${log.userName} 查看了提交 ${log.targetId}`;

    case 'edit_challenge':
      return `${log.userName} 編輯了挑戰 ${log.targetId}`;

    case 'score_team':
      return `${log.userName} 為提交 ${log.targetId} 打分`;

    case 'update_track':
      return `${log.userName} 更新了賽道 ${log.targetId}`;

    case 'contact_team':
      return `${log.userName} 聯繫了隊伍 ${log.targetId}`;

    case 'export_report':
      return `${log.userName} 導出了報告 ${log.targetId}`;

    default:
      return `${log.userName} 執行了 ${actionLabel}`;
  }
}

/**
 * 批量刪除舊的活动日志（用於數據清理）
 *
 * @param beforeDate - 刪除此日期之前的日志
 * @returns 刪除的數量
 */
export async function deleteOldActivityLogs(beforeDate: Date): Promise<number> {
  try {
    const snapshot = await db
      .collection(SPONSOR_COLLECTIONS.SPONSOR_ACTIVITY_LOGS)
      .where('timestamp', '<', firestore.Timestamp.fromDate(beforeDate))
      .get();

    if (snapshot.empty) {
      return 0;
    }

    // 批量刪除
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return snapshot.size;
  } catch (error) {
    console.error('Failed to delete old activity logs:', error);
    return 0;
  }
}
