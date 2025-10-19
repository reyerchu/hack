/**
 * Track Sponsor Feature - Activity Logging
 * 
 * 记录赞助商的所有操作（Audit Trail）
 */

import { firestore } from 'firebase-admin';
import initializeApi from '../admin/init';
import { SPONSOR_COLLECTIONS } from './collections';
import type { SponsorActivityLog, SponsorActivityAction } from './types';

// 确保 Firebase Admin 已初始化
initializeApi();
const db = firestore();

/**
 * 记录赞助商活动
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
    
    // 日志记录失败不应该影响主要业务逻辑，所以不抛出错误
  } catch (error) {
    console.error('Failed to log sponsor activity:', error);
  }
}

/**
 * 获取赞助商的活动日志
 * 
 * @param sponsorId - 赞助商 ID
 * @param options - 查询选项
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
    
    // 添加筛选条件
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
    
    // 按时间倒序排列
    query = query.orderBy('timestamp', 'desc');
    
    // 限制数量
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as SponsorActivityLog));
  } catch (error) {
    console.error('Failed to get sponsor activity logs:', error);
    return [];
  }
}

/**
 * 获取用户的活动日志
 * 
 * @param userId - 用户 ID
 * @param options - 查询选项
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
    
    // 添加筛选条件
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
    
    // 按时间倒序排列
    query = query.orderBy('timestamp', 'desc');
    
    // 限制数量
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as SponsorActivityLog));
  } catch (error) {
    console.error('Failed to get user activity logs:', error);
    return [];
  }
}

/**
 * 活动类型描述映射（用于UI显示）
 */
export const ACTIVITY_ACTION_LABELS: Record<SponsorActivityAction, string> = {
  view_submission: '查看提交',
  edit_challenge: '编辑挑战',
  score_team: '评分队伍',
  update_track: '更新赛道',
  contact_team: '联系队伍',
  export_report: '导出报告',
};

/**
 * 获取活动描述文本
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
      return `${log.userName} 编辑了挑战 ${log.targetId}`;
    
    case 'score_team':
      return `${log.userName} 为提交 ${log.targetId} 打分`;
    
    case 'update_track':
      return `${log.userName} 更新了赛道 ${log.targetId}`;
    
    case 'contact_team':
      return `${log.userName} 联系了队伍 ${log.targetId}`;
    
    case 'export_report':
      return `${log.userName} 导出了报告 ${log.targetId}`;
    
    default:
      return `${log.userName} 执行了 ${actionLabel}`;
  }
}

/**
 * 批量删除旧的活动日志（用于数据清理）
 * 
 * @param beforeDate - 删除此日期之前的日志
 * @returns 删除的数量
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
    
    // 批量删除
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

