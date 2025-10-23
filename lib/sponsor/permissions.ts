/**
 * Track Sponsor Feature - Permission System
 *
 * 賽道級別的權限控制和數據隔離
 */

import { firestore } from 'firebase-admin';
import initializeApi from '../admin/init';
import { SPONSOR_COLLECTIONS } from './collections';

// 确保 Firebase Admin 已初始化
initializeApi();
const db = firestore();

/**
 * 獲取用戶數據（支持多個 collection）
 *
 * @param userId - Firebase Auth UID 或 Firestore document ID
 * @returns 用戶數據和文檔引用
 */
async function getUserData(userId: string): Promise<{
  exists: boolean;
  data: any;
  ref: FirebaseFirestore.DocumentReference;
} | null> {
  try {
    // 1. 先嘗試 registrations collection（主要用於黑客松報名用戶）
    let userDoc = await db.collection('registrations').doc(userId).get();
    if (userDoc.exists) {
      return { exists: true, data: userDoc.data(), ref: userDoc.ref };
    }

    // 2. 嘗試透過 email 查詢 registrations
    const regByEmail = await db
      .collection('registrations')
      .where('email', '==', userId)
      .limit(1)
      .get();
    if (!regByEmail.empty) {
      const doc = regByEmail.docs[0];
      return { exists: true, data: doc.data(), ref: doc.ref };
    }

    // 3. 嘗試 users collection（向後兼容）
    userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      return { exists: true, data: userDoc.data(), ref: userDoc.ref };
    }

    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * 檢查用戶是否有贊助商權限
 *
 * @param userId - 用戶 ID
 * @param sponsorId - 贊助商 ID
 * @returns 是否有權限
 */
export async function checkSponsorPermission(userId: string, sponsorId: string): Promise<boolean> {
  try {
    // 1. 檢查是否是 super_admin 或 admin
    const userData = await getUserData(userId);

    if (!userData || !userData.exists) {
      return false;
    }

    const user = userData.data;
    // 支持兩種數據結構：扁平和嵌套
    const permissions = user?.permissions || user?.user?.permissions || [];

    // Admin 有所有權限
    if (
      permissions.includes('super_admin') ||
      permissions.includes('admin') ||
      permissions[0] === 'super_admin' ||
      permissions[0] === 'admin'
    ) {
      return true;
    }

    // 2. 檢查 sponsor-user-mappings (使用 document ID)
    const docId = userData.ref.id;
    const mappingQuery = await db
      .collection(SPONSOR_COLLECTIONS.SPONSOR_USER_MAPPINGS)
      .where('userId', '==', docId)
      .where('sponsorId', '==', sponsorId)
      .limit(1)
      .get();

    return !mappingQuery.empty;
  } catch (error) {
    console.error('Error checking sponsor permission:', error);
    return false;
  }
}

/**
 * 檢查用戶是否可以访问特定賽道
 *
 * @param userId - 用戶 ID
 * @param trackId - 賽道 ID
 * @returns 是否可以访问
 */
export async function checkTrackAccess(userId: string, trackId: string): Promise<boolean> {
  try {
    console.log('[checkTrackAccess] 開始檢查, userId:', userId, 'trackId:', trackId);

    // 1. 獲取用戶權限
    const userData = await getUserData(userId);
    console.log('[checkTrackAccess] userData exists:', userData?.exists);

    if (!userData || !userData.exists) {
      console.log('[checkTrackAccess] ❌ 用戶不存在');
      return false;
    }

    const user = userData.data;
    console.log('[checkTrackAccess] user.permissions:', user?.permissions);
    console.log('[checkTrackAccess] user.user?.permissions:', user?.user?.permissions);

    // 處理不同的數據結構
    const permissions = user?.permissions || user?.user?.permissions || [];
    console.log('[checkTrackAccess] 最終 permissions:', permissions);

    // Admin 可以访问所有賽道
    if (
      permissions.includes('super_admin') ||
      permissions.includes('admin') ||
      permissions[0] === 'super_admin' ||
      permissions[0] === 'admin'
    ) {
      console.log('[checkTrackAccess] ✅ 用戶是 admin，允許訪問');
      return true;
    }

    console.log('[checkTrackAccess] 用戶不是 admin，檢查 sponsor mappings...');

    // 2. 獲取用戶的 sponsor mappings (使用 document ID)
    const docId = userData.ref.id;
    console.log('[checkTrackAccess] docId:', docId);
    const mappingsSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.SPONSOR_USER_MAPPINGS)
      .where('userId', '==', docId)
      .get();

    console.log('[checkTrackAccess] mappings 數量:', mappingsSnapshot.size);

    if (mappingsSnapshot.empty) {
      console.log('[checkTrackAccess] ❌ 沒有 sponsor mappings');
      return false;
    }

    const sponsorIds = mappingsSnapshot.docs.map((doc) => doc.data().sponsorId);
    console.log('[checkTrackAccess] sponsorIds:', sponsorIds);

    // 3. 檢查這些 sponsors 是否擁有該 track
    const trackSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.TRACKS)
      .where('trackId', '==', trackId)
      .where('sponsorId', 'in', sponsorIds)
      .limit(1)
      .get();

    console.log('[checkTrackAccess] 找到 tracks:', trackSnapshot.size);

    const hasAccess = !trackSnapshot.empty;
    console.log('[checkTrackAccess] 最終結果:', hasAccess ? '✅ 允許訪問' : '❌ 拒絕訪問');

    return hasAccess;
  } catch (error: any) {
    console.error('[checkTrackAccess] ❌ Error:', error.message, error);
    return false;
  }
}

/**
 * 檢查用戶是否可以访问特定挑戰
 *
 * @param userId - 用戶 ID
 * @param challengeId - 挑戰 ID
 * @returns 是否可以访问
 */
export async function checkChallengeAccess(userId: string, challengeId: string): Promise<boolean> {
  try {
    // 1. 獲取挑戰資訊
    const challengeDoc = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .doc(challengeId)
      .get();

    if (!challengeDoc.exists) {
      return false;
    }

    const challenge = challengeDoc.data();

    // 2. 檢查用戶是否可以访问該賽道
    return checkTrackAccess(userId, challenge?.trackId || '');
  } catch (error) {
    console.error('Error checking challenge access:', error);
    return false;
  }
}

/**
 * 獲取用戶可访问的所有賽道
 *
 * @param userId - 用戶 ID
 * @returns 賽道 ID 列表
 */
export async function getUserAccessibleTracks(userId: string): Promise<string[]> {
  try {
    console.log('[getUserAccessibleTracks] 開始, userId:', userId);
    // 1. 獲取用戶權限
    const userData = await getUserData(userId);

    if (!userData || !userData.exists) {
      console.log('[getUserAccessibleTracks] 用戶不存在');
      return [];
    }

    const user = userData.data;
    const permissions = user?.permissions || user?.user?.permissions || [];
    console.log('[getUserAccessibleTracks] permissions:', permissions);

    // Admin 可以访问所有賽道
    if (
      permissions.includes('super_admin') ||
      permissions.includes('admin') ||
      permissions[0] === 'super_admin' ||
      permissions[0] === 'admin'
    ) {
      console.log('[getUserAccessibleTracks] 用戶是 admin，獲取所有賽道');
      const allTracks = await db.collection(SPONSOR_COLLECTIONS.TRACKS).get();

      console.log('[getUserAccessibleTracks] tracks 數量:', allTracks.size);

      const trackIds = allTracks.docs.map((doc) => doc.data().trackId).filter(Boolean);

      console.log('[getUserAccessibleTracks] 返回 trackIds:', trackIds);
      return trackIds;
    }

    // 2. 獲取用戶的 sponsor mappings (使用 document ID)
    const docId = userData.ref.id;
    const mappingsSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.SPONSOR_USER_MAPPINGS)
      .where('userId', '==', docId)
      .get();

    if (mappingsSnapshot.empty) {
      return [];
    }

    const sponsorIds = mappingsSnapshot.docs.map((doc) => doc.data().sponsorId);

    // 3. 獲取這些 sponsors 擁有的所有 tracks
    const tracksSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.TRACKS)
      .where('sponsorId', 'in', sponsorIds)
      .get();

    const trackIds = tracksSnapshot.docs.map((doc) => doc.data().trackId).filter(Boolean);

    return trackIds;
  } catch (error) {
    console.error('Error getting user accessible tracks:', error);
    return [];
  }
}

/**
 * 獲取用戶在指定贊助商的角色
 *
 * @param userId - 用戶 ID
 * @param sponsorId - 贊助商 ID
 * @returns 角色 ('admin' | 'viewer' | 'judge' | null)
 */
export async function getUserSponsorRole(
  userId: string,
  sponsorId: string,
): Promise<'admin' | 'viewer' | 'judge' | null> {
  try {
    // 1. 檢查是否是系统 admin
    const userData = await getUserData(userId);

    if (!userData || !userData.exists) {
      return null;
    }

    const user = userData.data;
    // 支持兩種數據結構：扁平和嵌套
    const permissions = user?.permissions || user?.user?.permissions || [];

    if (
      permissions.includes('super_admin') ||
      permissions.includes('admin') ||
      permissions[0] === 'super_admin' ||
      permissions[0] === 'admin'
    ) {
      return 'admin';
    }

    // 2. 查詢 sponsor-user-mappings (使用 document ID)
    const docId = userData.ref.id;
    const mappingQuery = await db
      .collection(SPONSOR_COLLECTIONS.SPONSOR_USER_MAPPINGS)
      .where('userId', '==', docId)
      .where('sponsorId', '==', sponsorId)
      .limit(1)
      .get();

    if (mappingQuery.empty) {
      return null;
    }

    const mapping = mappingQuery.docs[0].data();
    return mapping.role as 'admin' | 'viewer' | 'judge' | null;
  } catch (error) {
    console.error('Error getting user sponsor role:', error);
    return null;
  }
}

/**
 * 檢查用戶是否有指定的贊助商角色
 *
 * @param userId - 用戶 ID
 * @param sponsorId - 贊助商 ID
 * @param requiredRoles - 所需角色列表
 * @returns 是否有權限
 */
export async function hasSponsorRole(
  userId: string,
  sponsorId: string,
  requiredRoles: Array<'admin' | 'viewer' | 'judge'>,
): Promise<boolean> {
  const userRole = await getUserSponsorRole(userId, sponsorId);

  if (!userRole) {
    return false;
  }

  return requiredRoles.includes(userRole);
}

/**
 * 獲取用戶所属的所有贊助商
 *
 * @param userId - 用戶 ID
 * @param editableOnly - 是否只返回有編輯權限的 sponsors（默認：false）
 * @returns 贊助商 ID 列表
 */
export async function getUserSponsors(
  userId: string,
  editableOnly: boolean = false,
): Promise<string[]> {
  try {
    console.log('[getUserSponsors] 開始, userId:', userId, 'editableOnly:', editableOnly);
    // 獲取用戶數據以獲取 document ID 和 email
    const userData = await getUserData(userId);
    console.log('[getUserSponsors] userData exists:', userData?.exists);

    if (!userData || !userData.exists) {
      console.log('[getUserSponsors] 用戶不存在，返回空數組');
      return [];
    }

    const user = userData.data;
    const userEmail = user?.email || user?.user?.email || user?.user?.preferredEmail || '';
    const permissions = user?.permissions || user?.user?.permissions || [];
    console.log('[getUserSponsors] userEmail:', userEmail);
    console.log('[getUserSponsors] permissions:', permissions);

    // 如果是 super_admin 或 admin，返回特殊標記 '*' 表示所有權限
    if (
      permissions.includes('super_admin') ||
      permissions.includes('admin') ||
      permissions[0] === 'super_admin' ||
      permissions[0] === 'admin'
    ) {
      console.log('[getUserSponsors] 用戶是 admin/super_admin，返回 ["*"]');
      return ['*'];
    }

    // 使用 document ID 查詢 sponsor-user-mappings
    const docId = userData.ref.id;
    console.log('[getUserSponsors] docId:', docId);
    const mappingsSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.SPONSOR_USER_MAPPINGS)
      .where('userId', '==', docId)
      .get();

    // 如果只要可編輯的，過濾出 role === 'admin' 的 mappings
    const sponsorIdsFromMappings = editableOnly
      ? mappingsSnapshot.docs
          .filter((doc) => doc.data().role === 'admin')
          .map((doc) => doc.data().sponsorId)
      : mappingsSnapshot.docs.map((doc) => doc.data().sponsorId);
    console.log('[getUserSponsors] sponsorIds from mappings:', sponsorIdsFromMappings);

    // 查詢所有 sponsors，檢查 managers 字段
    const sponsorsSnapshot = await db.collection(SPONSOR_COLLECTIONS.EXTENDED_SPONSORS).get();

    const sponsorIdsFromManagers: string[] = [];
    if (userEmail) {
      const normalizedUserEmail = userEmail.toLowerCase();
      sponsorsSnapshot.docs.forEach((doc) => {
        const sponsorData = doc.data();
        const managers = sponsorData.managers || [];
        const isManager = managers.some((m: any) => {
          if (typeof m === 'string') {
            return m.toLowerCase() === normalizedUserEmail;
          }
          return m.email && m.email.toLowerCase() === normalizedUserEmail;
        });
        if (isManager) {
          sponsorIdsFromManagers.push(doc.id);
        }
      });
    }
    console.log('[getUserSponsors] sponsorIds from managers:', sponsorIdsFromManagers);

    // 合併兩個來源的 sponsor IDs（去重）
    const allSponsorIds = Array.from(
      new Set([...sponsorIdsFromMappings, ...sponsorIdsFromManagers]),
    );
    console.log('[getUserSponsors] 返回 allSponsorIds:', allSponsorIds);
    return allSponsorIds;
  } catch (error) {
    console.error('[getUserSponsors] ❌ Error:', error);
    return [];
  }
}

/**
 * 檢查用戶是否可以查看指定的提交
 *
 * @param userId - 用戶 ID
 * @param submissionId - 提交 ID
 * @returns 是否可以查看
 */
export async function canViewSubmission(userId: string, submissionId: string): Promise<boolean> {
  try {
    // 1. 獲取提交資訊
    const submissionDoc = await db
      .collection(SPONSOR_COLLECTIONS.TEAM_SUBMISSIONS)
      .doc(submissionId)
      .get();

    if (!submissionDoc.exists) {
      return false;
    }

    const submission = submissionDoc.data();

    // 2. 檢查是否是隊伍成员
    const teamMemberIds = (submission?.teamMembers || []).map((m: any) => m.userId);
    if (teamMemberIds.includes(userId)) {
      return true;
    }

    // 3. 檢查是否可以访问該賽道
    return checkTrackAccess(userId, submission?.projectTrack || '');
  } catch (error) {
    console.error('Error checking submission view permission:', error);
    return false;
  }
}

/**
 * 檢查用戶是否可以編輯指定的提交
 *
 * @param userId - 用戶 ID
 * @param submissionId - 提交 ID
 * @returns 是否可以編輯
 */
export async function canEditSubmission(userId: string, submissionId: string): Promise<boolean> {
  try {
    // 1. 檢查是否是系统 admin
    const userData = await getUserData(userId);

    if (!userData || !userData.exists) {
      return false;
    }

    const user = userData.data;
    // 支持兩種數據結構：扁平和嵌套
    const permissions = user?.permissions || user?.user?.permissions || [];

    if (
      permissions.includes('super_admin') ||
      permissions.includes('admin') ||
      permissions[0] === 'super_admin' ||
      permissions[0] === 'admin'
    ) {
      return true;
    }

    // 2. 獲取提交資訊
    const submissionDoc = await db
      .collection(SPONSOR_COLLECTIONS.TEAM_SUBMISSIONS)
      .doc(submissionId)
      .get();

    if (!submissionDoc.exists) {
      return false;
    }

    const submission = submissionDoc.data();

    // 3. 只有隊伍成员可以編輯（贊助商不能編輯）
    // 使用 document ID 進行比對
    const docId = userData.ref.id;
    const teamMemberIds = (submission?.teamMembers || []).map((m: any) => m.userId);
    return teamMemberIds.includes(docId);
  } catch (error) {
    console.error('Error checking submission edit permission:', error);
    return false;
  }
}
