import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import { getAuthenticatedUser } from '../../../lib/teamUp/auth';
import { TeamNeed } from '../../../lib/teamUp/types';

initializeApi();

const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * API端點：獲取指定用戶創建的所有找隊友需求
 * GET /api/team-up/user-needs?userId={userId}
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 認證用戶
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      console.log('[user-needs] 未認證用戶');
      return res.status(401).json({ success: false, message: '未認證，請先登入' });
    }

    // 檢查權限（只有管理員或用戶本人可以查看）
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      console.log('[user-needs] userId 缺失');
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    console.log('[user-needs] 請求用戶:', currentUser.uid, '查詢用戶:', userId);
    console.log('[user-needs] 用戶權限:', currentUser.permissions);

    const isAdmin =
      currentUser.permissions.includes('admin') || currentUser.permissions.includes('super_admin');
    const isSelf = currentUser.uid === userId;

    console.log('[user-needs] isAdmin:', isAdmin, 'isSelf:', isSelf);

    if (!isAdmin && !isSelf) {
      console.log('[user-needs] 無權限訪問');
      return res.status(403).json({ success: false, message: '無權限訪問' });
    }

    // 從 Firestore 獲取用戶創建的所有需求
    console.log('[user-needs] 查詢 teamNeeds，ownerUserId:', userId);
    const needsSnapshot = await db
      .collection('teamNeeds')
      .where('ownerUserId', '==', userId)
      .where('isHidden', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    console.log('[user-needs] 找到需求數量:', needsSnapshot.size);

    const needs: TeamNeed[] = [];
    needsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      console.log('[user-needs] 需求:', doc.id, '標題:', data.title);
      needs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
        updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
      });
    });

    console.log('[user-needs] 返回', needs.length, '個需求');
    return res.status(200).json({
      success: true,
      data: needs,
      total: needs.length,
    });
  } catch (error: any) {
    console.error('[user-needs] Error fetching user needs:', error);
    return res.status(500).json({
      success: false,
      message: '服務器錯誤',
      error: error.message,
    });
  }
}
