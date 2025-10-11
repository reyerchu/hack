/**
 * 找隊友功能 - 認證與權限輔助函數
 */

import { auth, firestore } from 'firebase-admin';
import { NextApiRequest } from 'next';

const REGISTRATION_COLLECTION = '/registrations';

/**
 * 從請求中獲取認證用戶
 * @param req NextApiRequest
 * @returns 用戶資料或 null
 */
export async function getAuthenticatedUser(req: NextApiRequest): Promise<{
  uid: string;
  email: string;
  name: string;
  permissions: string[];
} | null> {
  try {
    let token = req.headers['authorization'] as string;

    if (!token) {
      console.log('[Auth] No authorization header provided');
      return null;
    }

    // 移除 "Bearer " 前缀（如果有的话）
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    // 检查 token 是否为空或无效
    if (!token || token.length < 10) {
      console.log('[Auth] Invalid token format:', token?.substring(0, 20) + '...');
      return null;
    }

    // 驗證 Firebase ID Token
    console.log('[Auth] Verifying token for request...');
    const payload = await auth().verifyIdToken(token);
    console.log('[Auth] Token verified for user:', payload.uid);

    // 從 registrations 獲取用戶資料
    const snapshot = await firestore()
      .collection(REGISTRATION_COLLECTION)
      .where('id', '==', payload.uid)
      .get();

    if (snapshot.empty) {
      console.log('[Auth] User not found in registrations:', payload.uid);
      return null;
    }

    const userData = snapshot.docs[0].data();

    return {
      uid: payload.uid,
      email: payload.email || userData.user?.email || '',
      name:
        `${userData.user?.firstName || ''} ${userData.user?.lastName || ''}`.trim() ||
        payload.email ||
        'Unknown',
      permissions: userData.user?.permissions || [],
    };
  } catch (error: any) {
    console.error('[Auth] Error authenticating user:', error.message);
    if (error.code === 'auth/argument-error') {
      console.error('[Auth] Token format is invalid');
    } else if (error.code === 'auth/id-token-expired') {
      console.error('[Auth] Token has expired');
    }
    return null;
  }
}

/**
 * 檢查用戶是否已完成報名
 * @param uid 用戶 UID
 * @returns 是否已報名
 */
export async function checkUserRegistration(uid: string): Promise<boolean> {
  try {
    const snapshot = await firestore()
      .collection(REGISTRATION_COLLECTION)
      .where('id', '==', uid)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking user registration:', error);
    return false;
  }
}

/**
 * 檢查用戶是否為管理員
 * @param permissions 用戶權限列表
 * @returns 是否為管理員
 */
export function isAdmin(permissions: string[]): boolean {
  return permissions.includes('admin') || permissions.includes('super_admin');
}

/**
 * 檢查用戶是否有特定權限
 * @param permissions 用戶權限列表
 * @param requiredRoles 需要的角色
 * @returns 是否有權限
 */
export function hasPermission(permissions: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some((role) => permissions.includes(role));
}
