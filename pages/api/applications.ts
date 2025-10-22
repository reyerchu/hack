/**
 * API: /api/applications
 * 
 * POST - 保存用户注册资料到 Firestore
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../lib/admin/init';
import {
  requireAuth,
  ApiResponse,
  AuthenticatedRequest,
} from '../../lib/sponsor/middleware';

initializeApi();
const db = firestore();

/**
 * POST - 保存用户注册资料
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  console.log('[/api/applications] ========== POST 请求开始 ==========');
  
  if (!(await requireAuth(req, res))) {
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const userEmail = authReq.userEmail;

  console.log('[/api/applications] userId:', userId);
  console.log('[/api/applications] userEmail:', userEmail);

  try {
    const registrationData = req.body;
    
    if (!registrationData) {
      return ApiResponse.error(res, '缺少注册数据', 400);
    }

    console.log('[/api/applications] Registration data:', registrationData);

    // 准备要保存的数据
    const dataToSave = {
      ...registrationData,
      id: userId,
      email: userEmail || registrationData.email || registrationData.preferredEmail,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    // 保存到 registrations collection
    await db.collection('registrations').doc(userId).set(dataToSave, { merge: true });
    
    console.log('[/api/applications] ✅ 注册数据已保存到 registrations collection');

    // 同时保存到 users collection（兼容旧系统）
    const userData = {
      id: userId,
      email: dataToSave.email,
      firstName: registrationData.firstName || '',
      lastName: registrationData.lastName || '',
      preferredEmail: registrationData.preferredEmail || dataToSave.email,
      preferredName: registrationData.preferredName || '',
      permissions: registrationData.permissions || ['hacker'],
      // 保存完整的用户数据
      user: {
        ...registrationData,
        id: userId,
        email: dataToSave.email,
        permissions: registrationData.permissions || ['hacker'],
      },
      updatedAt: firestore.FieldValue.serverTimestamp(),
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(userId).set(userData, { merge: true });
    
    console.log('[/api/applications] ✅ 用户数据已保存到 users collection');

    return ApiResponse.success(res, {
      message: '注册成功',
      userId: userId,
      profile: userData,
    });
  } catch (error: any) {
    console.error('[/api/applications] ❌ Error:', error);
    return ApiResponse.error(res, error.message || '保存注册数据失败', 500);
  }
}

/**
 * Main handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

