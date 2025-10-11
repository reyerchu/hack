/**
 * 我的需求列表 API
 * GET /api/team-up/my-needs - 獲取當前用戶發布的所有需求
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedUser, checkUserRegistration } from '../../../lib/teamUp/auth';
import { ERROR_CODES, ERROR_MESSAGES, COLLECTIONS } from '../../../lib/teamUp/constants';
import { TeamNeed } from '../../../lib/teamUp/types';

// API Response type
type ApiResponse = {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  // 只允许 GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: ERROR_CODES.METHOD_NOT_ALLOWED,
        message: ERROR_MESSAGES[ERROR_CODES.METHOD_NOT_ALLOWED],
      },
    });
  }

  try {
    // 1. 身份验证
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED],
        },
      });
    }

    // 2. 检查用户是否已注册
    const isRegistered = await checkUserRegistration(currentUser.uid);
    if (!isRegistered) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.USER_NOT_REGISTERED,
          message: ERROR_MESSAGES[ERROR_CODES.USER_NOT_REGISTERED],
        },
      });
    }

    // 3. 獲取查詢參數
    const includeHidden = req.query.includeHidden === 'true';
    const includeClosed = req.query.includeClosed === 'true';

    // 4. 查询我的需求
    const admin = await import('firebase-admin');
    const db = admin.firestore();

    console.log('Fetching needs for user:', currentUser.uid);
    console.log('Include hidden:', includeHidden);
    console.log('Include closed:', includeClosed);

    let query = db
      .collection(COLLECTIONS.TEAM_NEEDS)
      .where('ownerUserId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc');

    // 如果不包括隐藏的，则过滤
    if (!includeHidden) {
      query = query.where('isHidden', '==', false);
    }

    const snapshot = await query.get();
    console.log('Found needs count:', snapshot.size);

    let needs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TeamNeed[];

    console.log('Needs before filter:', needs.length);
    if (needs.length > 0) {
      console.log('First need:', needs[0].id, needs[0].title);
    }

    // 如果不包括关闭的，则过滤
    if (!includeClosed) {
      needs = needs.filter((need) => need.isOpen);
      console.log('Needs after closed filter:', needs.length);
    }

    console.log('Final needs count:', needs.length);

    // 5. 獲取每個需求的申請統計
    const needsWithStats = await Promise.all(
      needs.map(async (need) => {
        const applicationsSnapshot = await db
          .collection(COLLECTIONS.TEAM_APPLICATIONS)
          .where('teamNeedId', '==', need.id)
          .get();

        const applications = applicationsSnapshot.docs.map((doc) => doc.data());
        const unreadCount = applications.filter((app: any) => !app.isReadByOwner).length;
        const pendingCount = applications.filter((app: any) => app.status === 'pending').length;

        return {
          ...need,
          stats: {
            totalApplications: applications.length,
            unreadApplications: unreadCount,
            pendingApplications: pendingCount,
          },
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: {
        needs: needsWithStats,
        total: needsWithStats.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching my needs:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      },
    });
  }
}
