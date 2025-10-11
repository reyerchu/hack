/**
 * 找隊友功能 - 數據庫操作
 */

import { firestore } from 'firebase-admin';
import type { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from './constants';
import { TeamNeed, TeamApplication, GetNeedsQueryParams, ApplicationStatus } from './types';

const db = firestore();

// ============================================================================
// TeamNeeds 操作
// ============================================================================

/**
 * 創建需求
 * @param data 需求數據
 * @returns 創建的需求 ID
 */
export async function createTeamNeed(
  data: Omit<
    TeamNeed,
    'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'applicationCount' | 'isFlagged' | 'isHidden'
  >,
): Promise<string> {
  const now = firestore.Timestamp.now();

  const needData: any = {
    ...data,
    viewCount: 0,
    applicationCount: 0,
    isFlagged: false,
    isHidden: false,
    createdAt: now,
    updatedAt: now,
  };

  // 移除所有 undefined 字段，Firestore 不接受 undefined
  Object.keys(needData).forEach((key) => {
    if (needData[key] === undefined) {
      delete needData[key];
    }
  });

  const docRef = await db.collection(COLLECTIONS.TEAM_NEEDS).add(needData);
  return docRef.id;
}

/**
 * 獲取單個需求
 * @param needId 需求 ID
 * @returns 需求資料
 */
export async function getTeamNeed(needId: string): Promise<TeamNeed | null> {
  try {
    const doc = await db.collection(COLLECTIONS.TEAM_NEEDS).doc(needId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as TeamNeed;
  } catch (error) {
    console.error('Error getting team need:', error);
    return null;
  }
}

/**
 * 獲取需求列表
 * @param params 查詢參數
 * @returns 需求列表和分頁資訊
 */
export async function getTeamNeeds(params: GetNeedsQueryParams): Promise<{
  needs: TeamNeed[];
  total: number;
  hasMore: boolean;
}> {
  try {
    let query: firestore.Query = db.collection(COLLECTIONS.TEAM_NEEDS);

    // 基礎篩選：不顯示隱藏的需求
    query = query.where('isHidden', '==', false);

    // 是否開放篩選
    if (params.isOpen !== undefined) {
      query = query.where('isOpen', '==', params.isOpen);
    }

    // ⚠️ 賽道和階段篩選已移至客戶端進行
    // 只在 Firestore 使用角色篩選（最重要的條件）
    // 這樣可以大幅減少所需的索引數量

    // 角色篩選 (使用 array-contains-any，最多 10 個)
    const hasRoleFilter = params.roles && params.roles.length > 0;
    if (hasRoleFilter) {
      // 擴展角色映射：將新的大類角色映射到舊的詳細角色
      const roleMapping: Record<string, string[]> = {
        工程師: ['工程師', '全端工程師', '前端工程師', '後端工程師', '智能合約工程師'],
        設計師: ['設計師', 'UI/UX 設計師'],
        產品經理: ['產品經理'],
        市場行銷: ['市場行銷', '商業分析'],
        其他: ['其他'],
      };

      // 展開所有選中的角色
      const expandedRoles: string[] = [];
      for (const role of params.roles) {
        const mappedRoles = roleMapping[role] || [role];
        expandedRoles.push(...mappedRoles);
      }

      // 去重並限制為最多 10 個（Firestore array-contains-any 的限制）
      const uniqueRoles = Array.from(new Set(expandedRoles)).slice(0, 10);
      query = query.where('rolesNeeded', 'array-contains-any', uniqueRoles);
    }

    // 排序：只有在沒有角色篩選時才使用 orderBy
    // 因為 array-contains-any + orderBy 需要額外的複合索引
    // 有角色篩選時，排序在客戶端進行
    if (!hasRoleFilter) {
      const sortField =
        params.sort === 'popular'
          ? 'viewCount'
          : params.sort === 'applications'
          ? 'applicationCount'
          : 'updatedAt';
      query = query.orderBy(sortField, 'desc');
    } else {
      // 有角色篩選時，按 updatedAt 排序（需要索引）
      query = query.orderBy('updatedAt', 'desc');
    }

    // 獲取總數（在應用 limit/offset 之前）
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // 分頁
    const limit = Math.min(params.limit || 20, 50);
    const offset = params.offset || 0;

    if (offset > 0) {
      query = query.offset(offset);
    }
    query = query.limit(limit);

    // 執行查詢
    const snapshot = await query.get();

    const needs: TeamNeed[] = [];
    snapshot.forEach((doc) => {
      needs.push({
        id: doc.id,
        ...doc.data(),
      } as TeamNeed);
    });

    // 關鍵詞搜索（客戶端過濾，因為 Firestore 不支持全文搜索）
    let filteredNeeds = needs;
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredNeeds = needs.filter(
        (need) =>
          need.title.toLowerCase().includes(searchLower) ||
          need.brief.toLowerCase().includes(searchLower),
      );
    }

    return {
      needs: filteredNeeds,
      total: params.search ? filteredNeeds.length : total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error('Error getting team needs:', error);
    return { needs: [], total: 0, hasMore: false };
  }
}

/**
 * 獲取用戶的需求列表
 * @param userId 用戶 ID
 * @returns 需求列表
 */
export async function getUserTeamNeeds(userId: string): Promise<TeamNeed[]> {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.TEAM_NEEDS)
      .where('ownerUserId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const needs: TeamNeed[] = [];
    snapshot.forEach((doc) => {
      needs.push({
        id: doc.id,
        ...doc.data(),
      } as TeamNeed);
    });

    return needs;
  } catch (error) {
    console.error('Error getting user team needs:', error);
    return [];
  }
}

/**
 * 更新需求
 * @param needId 需求 ID
 * @param data 要更新的數據
 * @returns 是否成功
 */
export async function updateTeamNeed(
  needId: string,
  data: Partial<Omit<TeamNeed, 'id' | 'ownerUserId' | 'createdAt' | 'updatedAt'>>,
): Promise<boolean> {
  try {
    await db
      .collection(COLLECTIONS.TEAM_NEEDS)
      .doc(needId)
      .update({
        ...data,
        updatedAt: firestore.Timestamp.now(),
      });
    return true;
  } catch (error) {
    console.error('Error updating team need:', error);
    return false;
  }
}

/**
 * 刪除需求
 * @param needId 需求 ID
 * @returns 是否成功
 */
export async function deleteTeamNeed(needId: string): Promise<boolean> {
  try {
    // 刪除需求
    await db.collection(COLLECTIONS.TEAM_NEEDS).doc(needId).delete();

    // 刪除相關的應徵（批次刪除）
    const applicationsSnapshot = await db
      .collection(COLLECTIONS.TEAM_APPLICATIONS)
      .where('teamNeedId', '==', needId)
      .get();

    const batch = db.batch();
    applicationsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return true;
  } catch (error) {
    console.error('Error deleting team need:', error);
    return false;
  }
}

/**
 * 增加瀏覽次數
 * @param needId 需求 ID
 * @returns 新的瀏覽次數
 */
export async function incrementViewCount(needId: string): Promise<number> {
  try {
    const needRef = db.collection(COLLECTIONS.TEAM_NEEDS).doc(needId);
    await needRef.update({
      viewCount: firestore.FieldValue.increment(1),
    });

    const doc = await needRef.get();
    return (doc.data()?.viewCount || 0) as number;
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return 0;
  }
}

/**
 * 增加應徵次數
 * @param needId 需求 ID
 * @returns 是否成功
 */
export async function incrementApplicationCount(needId: string): Promise<boolean> {
  try {
    await db
      .collection(COLLECTIONS.TEAM_NEEDS)
      .doc(needId)
      .update({
        applicationCount: firestore.FieldValue.increment(1),
      });
    return true;
  } catch (error) {
    console.error('Error incrementing application count:', error);
    return false;
  }
}

/**
 * 減少應徵次數
 * @param needId 需求 ID
 * @returns 是否成功
 */
export async function decrementApplicationCount(needId: string): Promise<boolean> {
  try {
    await db
      .collection(COLLECTIONS.TEAM_NEEDS)
      .doc(needId)
      .update({
        applicationCount: firestore.FieldValue.increment(-1),
      });
    return true;
  } catch (error) {
    console.error('Error decrementing application count:', error);
    return false;
  }
}

// ============================================================================
// TeamApplications 操作
// ============================================================================

/**
 * 創建應徵
 * @param data 應徵數據
 * @returns 創建的應徵 ID
 */
export async function createApplication(
  data: Omit<TeamApplication, 'id' | 'createdAt' | 'updatedAt' | 'isFlagged' | 'isReadByOwner'>,
): Promise<string> {
  const now = firestore.Timestamp.now();

  const applicationData: Omit<TeamApplication, 'id'> = {
    ...data,
    isReadByOwner: false,
    isFlagged: false,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(COLLECTIONS.TEAM_APPLICATIONS).add(applicationData);
  return docRef.id;
}

/**
 * 獲取單個應徵
 * @param applicationId 應徵 ID
 * @returns 應徵資料
 */
export async function getApplication(applicationId: string): Promise<TeamApplication | null> {
  try {
    const doc = await db.collection(COLLECTIONS.TEAM_APPLICATIONS).doc(applicationId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as TeamApplication;
  } catch (error) {
    console.error('Error getting application:', error);
    return null;
  }
}

/**
 * 檢查用戶是否已應徵過某需求
 * @param needId 需求 ID
 * @param userId 用戶 ID
 * @returns 應徵資料或 null
 */
export async function getExistingApplication(
  needId: string,
  userId: string,
): Promise<TeamApplication | null> {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.TEAM_APPLICATIONS)
      .where('teamNeedId', '==', needId)
      .where('applicantUserId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as TeamApplication;
  } catch (error) {
    console.error('Error checking existing application:', error);
    return null;
  }
}

/**
 * 獲取需求的應徵列表
 * @param needId 需求 ID
 * @param status 篩選狀態（可選）
 * @returns 應徵列表
 */
export async function getNeedApplications(
  needId: string,
  status?: ApplicationStatus,
): Promise<TeamApplication[]> {
  try {
    console.log(
      '[getNeedApplications] Fetching applications for needId:',
      needId,
      'status:',
      status,
    );

    let query: firestore.Query = db
      .collection(COLLECTIONS.TEAM_APPLICATIONS)
      .where('teamNeedId', '==', needId);

    if (status) {
      query = query.where('status', '==', status);
    }

    // 嘗試先不排序，避免索引問題
    let snapshot;
    try {
      query = query.orderBy('createdAt', 'desc');
      snapshot = await query.get();
    } catch (orderError: any) {
      console.warn(
        '[getNeedApplications] OrderBy failed, trying without sorting:',
        orderError.message,
      );
      // 如果排序失敗（可能是索引問題），重試不排序
      query = db.collection(COLLECTIONS.TEAM_APPLICATIONS).where('teamNeedId', '==', needId);
      if (status) {
        query = query.where('status', '==', status);
      }
      snapshot = await query.get();
    }

    const applications: TeamApplication[] = [];
    snapshot.forEach((doc) => {
      applications.push({
        id: doc.id,
        ...doc.data(),
      } as TeamApplication);
    });

    console.log('[getNeedApplications] Found', applications.length, 'applications');

    // 手動在內存中排序
    applications.sort((a, b) => {
      const aTime = (a.createdAt as any)?.seconds || 0;
      const bTime = (b.createdAt as any)?.seconds || 0;
      return bTime - aTime;
    });

    return applications;
  } catch (error) {
    console.error('[getNeedApplications] Error getting need applications:', error);
    return [];
  }
}

/**
 * 獲取用戶的應徵列表
 * @param userId 用戶 ID
 * @returns 應徵列表
 */
export async function getUserApplications(userId: string): Promise<TeamApplication[]> {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.TEAM_APPLICATIONS)
      .where('applicantUserId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const applications: TeamApplication[] = [];
    snapshot.forEach((doc) => {
      applications.push({
        id: doc.id,
        ...doc.data(),
      } as TeamApplication);
    });

    return applications;
  } catch (error) {
    console.error('Error getting user applications:', error);
    return [];
  }
}

/**
 * 更新應徵狀態
 * @param applicationId 應徵 ID
 * @param status 新狀態
 * @returns 是否成功
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<boolean> {
  try {
    await db.collection(COLLECTIONS.TEAM_APPLICATIONS).doc(applicationId).update({
      status,
      statusChangedAt: firestore.Timestamp.now(),
      updatedAt: firestore.Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating application status:', error);
    return false;
  }
}

/**
 * 標記應徵為已讀
 * @param applicationId 應徵 ID
 * @returns 是否成功
 */
export async function markApplicationAsRead(applicationId: string): Promise<boolean> {
  try {
    await db.collection(COLLECTIONS.TEAM_APPLICATIONS).doc(applicationId).update({
      isReadByOwner: true,
    });
    return true;
  } catch (error) {
    console.error('Error marking application as read:', error);
    return false;
  }
}

/**
 * 刪除應徵
 * @param applicationId 應徵 ID
 * @returns 是否成功
 */
export async function deleteApplication(applicationId: string): Promise<boolean> {
  try {
    await db.collection(COLLECTIONS.TEAM_APPLICATIONS).doc(applicationId).delete();
    return true;
  } catch (error) {
    console.error('Error deleting application:', error);
    return false;
  }
}

// ============================================================================
// 統計查詢
// ============================================================================

/**
 * 獲取統計數據
 * @returns 統計數據
 */
export async function getTeamUpStats(): Promise<{
  totalNeeds: number;
  openNeeds: number;
  totalApplications: number;
  successfulMatches: number;
}> {
  try {
    // 總需求數
    const totalNeedsSnapshot = await db
      .collection(COLLECTIONS.TEAM_NEEDS)
      .where('isHidden', '==', false)
      .count()
      .get();

    // 開放需求數
    const openNeedsSnapshot = await db
      .collection(COLLECTIONS.TEAM_NEEDS)
      .where('isOpen', '==', true)
      .where('isHidden', '==', false)
      .count()
      .get();

    // 總應徵數
    const totalApplicationsSnapshot = await db
      .collection(COLLECTIONS.TEAM_APPLICATIONS)
      .count()
      .get();

    // 成功配對數 (accepted)
    const successfulMatchesSnapshot = await db
      .collection(COLLECTIONS.TEAM_APPLICATIONS)
      .where('status', '==', 'accepted')
      .count()
      .get();

    return {
      totalNeeds: totalNeedsSnapshot.data().count,
      openNeeds: openNeedsSnapshot.data().count,
      totalApplications: totalApplicationsSnapshot.data().count,
      successfulMatches: successfulMatchesSnapshot.data().count,
    };
  } catch (error) {
    console.error('Error getting team-up stats:', error);
    return {
      totalNeeds: 0,
      openNeeds: 0,
      totalApplications: 0,
      successfulMatches: 0,
    };
  }
}
