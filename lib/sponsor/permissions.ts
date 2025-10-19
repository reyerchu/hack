/**
 * Track Sponsor Feature - Permission System
 * 
 * 赛道级别的权限控制和数据隔离
 */

import { firestore } from 'firebase-admin';
import initializeApi from '../admin/init';
import { SPONSOR_COLLECTIONS } from './collections';

// 确保 Firebase Admin 已初始化
initializeApi();
const db = firestore();

/**
 * 获取用户数据（支持多个 collection）
 * 
 * @param userId - Firebase Auth UID 或 Firestore document ID
 * @returns 用户数据和文档引用
 */
async function getUserData(userId: string): Promise<{
  exists: boolean;
  data: any;
  ref: FirebaseFirestore.DocumentReference;
} | null> {
  try {
    // 1. 先尝试 registrations collection（主要用于黑客松报名用户）
    let userDoc = await db.collection('registrations').doc(userId).get();
    if (userDoc.exists) {
      return { exists: true, data: userDoc.data(), ref: userDoc.ref };
    }

    // 2. 尝试通过 email 查询 registrations
    const regByEmail = await db.collection('registrations').where('email', '==', userId).limit(1).get();
    if (!regByEmail.empty) {
      const doc = regByEmail.docs[0];
      return { exists: true, data: doc.data(), ref: doc.ref };
    }

    // 3. 尝试 users collection（向后兼容）
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
 * 检查用户是否有赞助商权限
 * 
 * @param userId - 用户 ID
 * @param sponsorId - 赞助商 ID
 * @returns 是否有权限
 */
export async function checkSponsorPermission(
  userId: string,
  sponsorId: string,
): Promise<boolean> {
  try {
    // 1. 检查是否是 super_admin 或 admin
    const userData = await getUserData(userId);
    
    if (!userData || !userData.exists) {
      return false;
    }
    
    const user = userData.data;
    const permissions = user?.permissions || [];
    
    // Admin 有所有权限
    if (permissions.includes('super_admin') || permissions.includes('admin')) {
      return true;
    }
    
    // 2. 检查 sponsor-user-mappings (使用 document ID)
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
 * 检查用户是否可以访问特定赛道
 * 
 * @param userId - 用户 ID
 * @param trackId - 赛道 ID
 * @returns 是否可以访问
 */
export async function checkTrackAccess(
  userId: string,
  trackId: string,
): Promise<boolean> {
  try {
    // 1. 获取用户权限
    const userData = await getUserData(userId);
    
    if (!userData || !userData.exists) {
      return false;
    }
    
    const user = userData.data;
    const permissions = user?.permissions || [];
    
    // Admin 可以访问所有赛道
    if (permissions.includes('super_admin') || permissions.includes('admin')) {
      return true;
    }
    
    // 2. 获取用户的 sponsor mappings (使用 document ID)
    const docId = userData.ref.id;
    const mappingsSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.SPONSOR_USER_MAPPINGS)
      .where('userId', '==', docId)
      .get();
    
    if (mappingsSnapshot.empty) {
      return false;
    }
    
    const sponsorIds = mappingsSnapshot.docs.map((doc) => doc.data().sponsorId);
    
    // 3. 检查这些 sponsors 是否赞助该 track
    const challengeSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .where('trackId', '==', trackId)
      .where('sponsorId', 'in', sponsorIds)
      .limit(1)
      .get();
    
    return !challengeSnapshot.empty;
  } catch (error) {
    console.error('Error checking track access:', error);
    return false;
  }
}

/**
 * 检查用户是否可以访问特定挑战
 * 
 * @param userId - 用户 ID
 * @param challengeId - 挑战 ID
 * @returns 是否可以访问
 */
export async function checkChallengeAccess(
  userId: string,
  challengeId: string,
): Promise<boolean> {
  try {
    // 1. 获取挑战信息
    const challengeDoc = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .doc(challengeId)
      .get();
    
    if (!challengeDoc.exists) {
      return false;
    }
    
    const challenge = challengeDoc.data();
    
    // 2. 检查用户是否可以访问该赛道
    return checkTrackAccess(userId, challenge?.trackId || '');
  } catch (error) {
    console.error('Error checking challenge access:', error);
    return false;
  }
}

/**
 * 获取用户可访问的所有赛道
 * 
 * @param userId - 用户 ID
 * @returns 赛道 ID 列表
 */
export async function getUserAccessibleTracks(userId: string): Promise<string[]> {
  try {
    // 1. 获取用户权限
    const userData = await getUserData(userId);
    
    if (!userData || !userData.exists) {
      return [];
    }
    
    const user = userData.data;
    const permissions = user?.permissions || [];
    
    // Admin 可以访问所有赛道
    if (permissions.includes('super_admin') || permissions.includes('admin')) {
      const allChallenges = await db
        .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
        .get();
      
      const trackIds = new Set<string>();
      allChallenges.docs.forEach((doc) => {
        const trackId = doc.data().trackId;
        if (trackId) {
          trackIds.add(trackId);
        }
      });
      
      return Array.from(trackIds);
    }
    
    // 2. 获取用户的 sponsor mappings (使用 document ID)
    const docId = userData.ref.id;
    const mappingsSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.SPONSOR_USER_MAPPINGS)
      .where('userId', '==', docId)
      .get();
    
    if (mappingsSnapshot.empty) {
      return [];
    }
    
    const sponsorIds = mappingsSnapshot.docs.map((doc) => doc.data().sponsorId);
    
    // 3. 获取这些 sponsors 赞助的所有 tracks
    const challengesSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .where('sponsorId', 'in', sponsorIds)
      .get();
    
    const trackIds = new Set<string>();
    challengesSnapshot.docs.forEach((doc) => {
      const trackId = doc.data().trackId;
      if (trackId) {
        trackIds.add(trackId);
      }
    });
    
    return Array.from(trackIds);
  } catch (error) {
    console.error('Error getting user accessible tracks:', error);
    return [];
  }
}

/**
 * 获取用户在指定赞助商的角色
 * 
 * @param userId - 用户 ID
 * @param sponsorId - 赞助商 ID
 * @returns 角色 ('admin' | 'viewer' | 'judge' | null)
 */
export async function getUserSponsorRole(
  userId: string,
  sponsorId: string,
): Promise<'admin' | 'viewer' | 'judge' | null> {
  try {
    // 1. 检查是否是系统 admin
    const userData = await getUserData(userId);
    
    if (!userData || !userData.exists) {
      return null;
    }
    
    const user = userData.data;
    const permissions = user?.permissions || [];
    
    if (permissions.includes('super_admin') || permissions.includes('admin')) {
      return 'admin';
    }
    
    // 2. 查询 sponsor-user-mappings (使用 document ID)
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
 * 检查用户是否有指定的赞助商角色
 * 
 * @param userId - 用户 ID
 * @param sponsorId - 赞助商 ID
 * @param requiredRoles - 所需角色列表
 * @returns 是否有权限
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
 * 获取用户所属的所有赞助商
 * 
 * @param userId - 用户 ID
 * @returns 赞助商 ID 列表
 */
export async function getUserSponsors(userId: string): Promise<string[]> {
  try {
    // 获取用户数据以获取 document ID
    const userData = await getUserData(userId);
    
    if (!userData || !userData.exists) {
      return [];
    }
    
    // 使用 document ID 查询
    const docId = userData.ref.id;
    const mappingsSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.SPONSOR_USER_MAPPINGS)
      .where('userId', '==', docId)
      .get();
    
    return mappingsSnapshot.docs.map((doc) => doc.data().sponsorId);
  } catch (error) {
    console.error('Error getting user sponsors:', error);
    return [];
  }
}

/**
 * 检查用户是否可以查看指定的提交
 * 
 * @param userId - 用户 ID
 * @param submissionId - 提交 ID
 * @returns 是否可以查看
 */
export async function canViewSubmission(
  userId: string,
  submissionId: string,
): Promise<boolean> {
  try {
    // 1. 获取提交信息
    const submissionDoc = await db
      .collection(SPONSOR_COLLECTIONS.TEAM_SUBMISSIONS)
      .doc(submissionId)
      .get();
    
    if (!submissionDoc.exists) {
      return false;
    }
    
    const submission = submissionDoc.data();
    
    // 2. 检查是否是队伍成员
    const teamMemberIds = (submission?.teamMembers || []).map((m: any) => m.userId);
    if (teamMemberIds.includes(userId)) {
      return true;
    }
    
    // 3. 检查是否可以访问该赛道
    return checkTrackAccess(userId, submission?.projectTrack || '');
  } catch (error) {
    console.error('Error checking submission view permission:', error);
    return false;
  }
}

/**
 * 检查用户是否可以编辑指定的提交
 * 
 * @param userId - 用户 ID
 * @param submissionId - 提交 ID
 * @returns 是否可以编辑
 */
export async function canEditSubmission(
  userId: string,
  submissionId: string,
): Promise<boolean> {
  try {
    // 1. 检查是否是系统 admin
    const userData = await getUserData(userId);
    
    if (!userData || !userData.exists) {
      return false;
    }
    
    const user = userData.data;
    const permissions = user?.permissions || [];
    
    if (permissions.includes('super_admin') || permissions.includes('admin')) {
      return true;
    }
    
    // 2. 获取提交信息
    const submissionDoc = await db
      .collection(SPONSOR_COLLECTIONS.TEAM_SUBMISSIONS)
      .doc(submissionId)
      .get();
    
    if (!submissionDoc.exists) {
      return false;
    }
    
    const submission = submissionDoc.data();
    
    // 3. 只有队伍成员可以编辑（赞助商不能编辑）
    // 使用 document ID 进行比对
    const docId = userData.ref.id;
    const teamMemberIds = (submission?.teamMembers || []).map((m: any) => m.userId);
    return teamMemberIds.includes(docId);
  } catch (error) {
    console.error('Error checking submission edit permission:', error);
    return false;
  }
}

