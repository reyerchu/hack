/**
 * 我的申請列表 API
 * GET /api/team-up/my-applications - 獲取當前用戶提交的所有申請
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedUser, checkUserRegistration } from '../../../lib/teamUp/auth';
import { ERROR_CODES, ERROR_MESSAGES, COLLECTIONS } from '../../../lib/teamUp/constants';
import { TeamApplication, TeamNeed } from '../../../lib/teamUp/types';

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
    const status = req.query.status as string | undefined;

    // 4. 查詢我的申請
    const admin = await import('firebase-admin');
    const db = admin.firestore();
    let query = db
      .collection(COLLECTIONS.TEAM_APPLICATIONS)
      .where('applicantUserId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc');

    // 如果指定了状态，则过滤
    if (status && ['pending', 'accepted', 'rejected', 'withdrawn'].includes(status)) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const applications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TeamApplication[];

    // 5. 獲取每個申請關聯的需求信息
    const applicationsWithNeeds = await Promise.all(
      applications.map(async (application) => {
        const needDoc = await db
          .collection(COLLECTIONS.TEAM_NEEDS)
          .doc(application.teamNeedId)
          .get();

        const need = needDoc.exists ? ({ id: needDoc.id, ...needDoc.data() } as TeamNeed) : null;

        return {
          ...application,
          need,
        };
      }),
    );

    // 6. 统计信息
    const stats = {
      total: applications.length,
      pending: applications.filter((app) => app.status === 'pending').length,
      accepted: applications.filter((app) => app.status === 'accepted').length,
      rejected: applications.filter((app) => app.status === 'rejected').length,
      withdrawn: applications.filter((app) => app.status === 'withdrawn').length,
    };

    return res.status(200).json({
      success: true,
      data: {
        applications: applicationsWithNeeds,
        stats,
      },
    });
  } catch (error: any) {
    console.error('Error fetching my applications:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      },
    });
  }
}
