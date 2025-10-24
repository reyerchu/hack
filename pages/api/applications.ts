/**
 * API: /api/applications
 *
 * POST - 保存用户注册资料到 Firestore
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from 'firebase-admin';
import initializeApi from '../../lib/admin/init';
import { ApiResponse } from '../../lib/sponsor/middleware';

initializeApi();
const db = firestore();

const MISC_COLLECTION = '/miscellaneous';

/**
 * 更新 miscellaneous/allusers 文档（用于缓存所有用户列表）
 */
async function updateAllUsersDoc(userId: string, profile: any) {
  try {
    const docRef = db.collection(MISC_COLLECTION).doc('allusers');
    const userData = await docRef.get();

    const newUser = {
      id: profile.id || userId,
      user: {
        firstName: profile.user?.firstName || profile.firstName || '',
        lastName: profile.user?.lastName || profile.lastName || '',
        permissions: profile.user?.permissions || profile.permissions || ['hacker'],
      },
    };

    if (!userData.exists) {
      // Create the document if it doesn't exist
      await docRef.set({
        users: [newUser],
      });
      console.log('[updateAllUsersDoc] ✅ Created allusers doc with first user:', userId);
    } else {
      // Append to existing users array
      const existingUsers = userData.data()?.users || [];
      // Check if user already exists
      const userExists = existingUsers.some((u: any) => u.id === userId);
      if (!userExists) {
        await docRef.set({
          users: [...existingUsers, newUser],
        });
        console.log('[updateAllUsersDoc] ✅ Added user to allusers:', userId);
      } else {
        console.log('[updateAllUsersDoc] ℹ️  User already exists in allusers:', userId);
      }
    }
  } catch (error) {
    console.error('[updateAllUsersDoc] ❌ Failed to update miscellaneous/allusers:', error);
    // Don't throw - this is not critical for registration
  }
}

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

  console.log('[/api/applications] 🔐 BACKEND STEP 2: 驗證 token（允許新用戶）...');

  // 验证 token（不要求用户已存在，因为这是注册 API）
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    console.error('[/api/applications] ❌ Missing token');
    return ApiResponse.unauthorized(res, 'Missing authorization token');
  }

  let userId: string;
  let userEmail: string;

  try {
    const decodedToken = await auth().verifyIdToken(token);
    userId = decodedToken.uid;
    userEmail = decodedToken.email || '';

    console.log('[/api/applications] ✅ Token 驗證成功');
    console.log('[/api/applications] Firebase UID:', userId);
    console.log('[/api/applications] Email:', userEmail);
  } catch (error: any) {
    console.error('[/api/applications] ❌ Token 驗證失敗:', error.message);
    return ApiResponse.unauthorized(res, 'Invalid or expired token');
  }

  console.log('========================================');
  console.log('[/api/applications] 👤 BACKEND STEP 3: 用戶資訊（新用戶註冊）');
  console.log('[/api/applications] userId:', userId);
  console.log('[/api/applications] userEmail:', userEmail);
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
      timestamp: Date.now(), // 用於 admin 頁面顯示註冊時間
      updatedAt: firestore.FieldValue.serverTimestamp(),
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    console.log('[/api/applications] Data to save keys:', Object.keys(dataToSave));
    console.log('[/api/applications] User ID for document:', userId);
    console.log('[/api/applications] Email:', dataToSave.email);

    console.log('[/api/applications] 📝 BACKEND STEP 6: 保存到 registrations collection');
    // 保存到 registrations collection (唯一数据源)
    await db.collection('registrations').doc(userId).set(dataToSave, { merge: true });

    console.log('[/api/applications] ✅ 注册数据已保存');

    console.log('[/api/applications] 📝 BACKEND STEP 7: 更新 miscellaneous/allusers');
    // 更新 allusers 缓存文档
    await updateAllUsersDoc(userId, dataToSave);

    console.log('========================================');
    console.log('[/api/applications] ✅✅✅ BACKEND STEP 8: 註冊成功！');
    console.log('[/api/applications] User ID:', userId);
    console.log('[/api/applications] Email:', dataToSave.email);
    console.log('========================================');

    return ApiResponse.success(res, {
      message: '注册成功',
      userId: userId,
      profile: dataToSave,
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
