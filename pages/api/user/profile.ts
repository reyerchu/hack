/**
 * API: /api/user/profile
 * 
 * GET - 獲取當前用戶的個人資料和權限
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';
import {
  requireAuth,
  ApiResponse,
  AuthenticatedRequest,
} from '../../../lib/sponsor/middleware';

initializeApi();
const db = firestore();

/**
 * 獲取用戶數據（支持多個 collection）
 */
async function getUserData(userId: string): Promise<{
  exists: boolean;
  data: any;
  ref: FirebaseFirestore.DocumentReference;
} | null> {
  try {
    // 1. 先嘗試 registrations collection
    let userDoc = await db.collection('registrations').doc(userId).get();
    if (userDoc.exists) {
      return { exists: true, data: userDoc.data(), ref: userDoc.ref };
    }

    // 2. 嘗試透過 email 查詢 registrations
    const regByEmail = await db.collection('registrations').where('email', '==', userId).limit(1).get();
    if (!regByEmail.empty) {
      const doc = regByEmail.docs[0];
      return { exists: true, data: doc.data(), ref: doc.ref };
    }

    // 3. 嘗試 users collection
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
 * GET - 獲取用戶資料
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  console.log('[/api/user/profile] ========== GET 請求開始 ==========');
  
  if (!(await requireAuth(req, res))) {
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const userEmail = authReq.userEmail;

  console.log('[/api/user/profile] userId:', userId);
  console.log('[/api/user/profile] userEmail:', userEmail);

  try {
    // 獲取用戶資料
    const userData = await getUserData(userId);
    
    if (!userData || !userData.exists) {
      console.log('[/api/user/profile] ❌ 用戶不存在');
      return ApiResponse.notFound(res, '找不到用戶資料');
    }

    const user = userData.data;
    console.log('[/api/user/profile] user.permissions:', user?.permissions);
    console.log('[/api/user/profile] user.user?.permissions:', user?.user?.permissions);

    // 處理不同的數據結構
    const permissions = user?.permissions || user?.user?.permissions || [];
    const email = user?.email || user?.user?.preferredEmail || user?.preferredEmail || userEmail;
    const firstName = user?.firstName || user?.user?.firstName || '';
    const lastName = user?.lastName || user?.user?.lastName || '';
    const preferredName = user?.preferredName || user?.user?.preferredName || '';

    // 返回統一格式的用戶資料
    const profile = {
      id: userData.ref.id,
      email: email,
      firstName: firstName,
      lastName: lastName,
      preferredName: preferredName,
      permissions: permissions,
      // 保持原始的嵌套結構（如果存在）以保持兼容性
      user: user?.user ? {
        ...user.user,
        permissions: permissions,
      } : undefined,
    };

    console.log('[/api/user/profile] ✅ 返回資料, permissions:', permissions);
    return ApiResponse.success(res, profile);
  } catch (error: any) {
    console.error('[/api/user/profile] ❌ Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch user profile', 500);
  }
}

/**
 * Main handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

