/**
 * 需求申請列表 API
 * GET /api/team-up/needs/[id]/applications - 獲取某個需求的所有申請（需求作者）
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedUser, checkUserRegistration } from '../../../../../lib/teamUp/auth';
import { getNeedApplications, getTeamNeed } from '../../../../../lib/teamUp/db';
import { ERROR_CODES, ERROR_MESSAGES } from '../../../../../lib/teamUp/constants';

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
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid need ID',
      },
    });
  }

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

    // 3. 检查需求是否存在
    const need = await getTeamNeed(id);
    if (!need) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: '找不到此需求',
        },
      });
    }

    // 4. 檢查權限：只有需求作者可以查看申請列表
    if (need.ownerUserId !== currentUser.uid) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: '您沒有權限查看此需求的申請列表',
        },
      });
    }

    // 5. 獲取申請列表
    const applications = await getNeedApplications(id);

    return res.status(200).json({
      success: true,
      data: {
        needId: id,
        applications,
        total: applications.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching applications:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      },
    });
  }
}
