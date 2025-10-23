/**
 * API: /api/applications
 *
 * POST - 保存用户注册资料到 Firestore
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../lib/admin/init';
import { requireAuth, ApiResponse, AuthenticatedRequest } from '../../lib/sponsor/middleware';

initializeApi();
const db = firestore();

/**
 * POST - 保存用户注册资料
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  console.log('========================================');
  console.log('[/api/applications] 🚀 BACKEND STEP 1: POST 请求开始');
  console.log('[/api/applications] Request method:', req.method);
  console.log('[/api/applications] Request headers:', JSON.stringify(req.headers, null, 2));
  console.log(
    '[/api/applications] Authorization header:',
    req.headers.authorization?.substring(0, 100),
  );
  console.log('========================================');

  console.log('[/api/applications] 🔐 BACKEND STEP 2: 驗證 token...');
  if (!(await requireAuth(req, res))) {
    console.error('[/api/applications] ❌ Token 驗證失敗');
    return;
  }
  console.log('[/api/applications] ✅ Token 驗證成功');

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const userEmail = authReq.userEmail;

  console.log('========================================');
  console.log('[/api/applications] 👤 BACKEND STEP 3: 用戶資訊');
  console.log('[/api/applications] userId:', userId);
  console.log('[/api/applications] userEmail:', userEmail);
  console.log('[/api/applications] userPermissions:', authReq.userPermissions);
  console.log('========================================');

  try {
    console.log('[/api/applications] 📦 BACKEND STEP 4: 處理註冊資料');
    const registrationData = req.body;

    if (!registrationData) {
      console.error('[/api/applications] ❌ 缺少注册数据');
      return ApiResponse.error(res, '缺少注册数据', 400);
    }

    console.log('[/api/applications] Registration data keys:', Object.keys(registrationData));
    console.log(
      '[/api/applications] Registration data:',
      JSON.stringify(registrationData, null, 2),
    );

    console.log('[/api/applications] 💾 BACKEND STEP 5: 準備數據');
    // 准备要保存的数据
    const dataToSave = {
      ...registrationData,
      id: userId,
      email: userEmail || registrationData.email || registrationData.preferredEmail,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    console.log('[/api/applications] Data to save keys:', Object.keys(dataToSave));
    console.log('[/api/applications] User ID for document:', userId);
    console.log('[/api/applications] Email:', dataToSave.email);

    console.log('[/api/applications] 📝 BACKEND STEP 6: 保存到 registrations collection');
    // 保存到 registrations collection
    await db.collection('registrations').doc(userId).set(dataToSave, { merge: true });

    console.log('[/api/applications] ✅ 注册数据已保存到 registrations collection');

    console.log('[/api/applications] 📝 BACKEND STEP 7: 保存到 users collection');
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

    console.log('[/api/applications] User data keys:', Object.keys(userData));
    await db.collection('users').doc(userId).set(userData, { merge: true });

    console.log('[/api/applications] ✅ 用户数据已保存到 users collection');

    console.log('========================================');
    console.log('[/api/applications] ✅✅✅ BACKEND STEP 8: 註冊成功！');
    console.log('[/api/applications] User ID:', userId);
    console.log('[/api/applications] Email:', dataToSave.email);
    console.log('========================================');

    return ApiResponse.success(res, {
      message: '注册成功',
      userId: userId,
      profile: userData,
    });
  } catch (error: any) {
    console.error('========================================');
    console.error('[/api/applications] ❌❌❌ BACKEND ERROR ❌❌❌');
    console.error('[/api/applications] Error name:', error.name);
    console.error('[/api/applications] Error message:', error.message);
    console.error('[/api/applications] Error stack:', error.stack);
    console.error(
      '[/api/applications] Full error:',
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    );
    console.error('========================================');
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
