/**
 * 申請管理 API
 * GET /api/team-up/applications/[id] - 獲取單個申請詳情
 * PATCH /api/team-up/applications/[id] - 更新申請狀態（接受/拒絕/標記已讀）
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedUser, checkUserRegistration } from '../../../../lib/teamUp/auth';
import {
  getApplication,
  updateApplicationStatus,
  markApplicationAsRead,
  getTeamNeed,
} from '../../../../lib/teamUp/db';
import { ERROR_CODES, ERROR_MESSAGES } from '../../../../lib/teamUp/constants';
import { ApplicationStatus } from '../../../../lib/teamUp/types';

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
        message: 'Invalid application ID',
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

    // 3. 獲取申請
    const application = await getApplication(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: '找不到此申請',
        },
      });
    }

    // 4. 獲取相關需求以驗證權限
    const need = await getTeamNeed(application.teamNeedId);
    if (!need) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: '找不到相关需求',
        },
      });
    }

    // 处理不同的 HTTP 方法
    if (req.method === 'GET') {
      // 只有需求作者或申請者可以查看
      if (need.ownerUserId !== currentUser.uid && application.applicantUserId !== currentUser.uid) {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: '您沒有權限查看此申請',
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: application,
      });
    } else if (req.method === 'PATCH') {
      // 只有需求作者可以更新申請
      if (need.ownerUserId !== currentUser.uid) {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: '您沒有權限管理此申請',
          },
        });
      }

      const { status, markAsRead } = req.body;

      // 标记为已读
      if (markAsRead === true) {
        await markApplicationAsRead(id);
      }

      // 更新状态
      if (status) {
        const validStatuses: ApplicationStatus[] = ['pending', 'accepted', 'rejected', 'withdrawn'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: '無效的申請狀態',
            },
          });
        }

        await updateApplicationStatus(id, status);
      }

      // 重新獲取更新後的申請
      const updatedApplication = await getApplication(id);

      // 發送通知給申請者（如果狀態改變）
      if (status && (status === 'accepted' || status === 'rejected')) {
        try {
          // Email 通知
          const { notifyApplicantStatusUpdate } = await import('../../../../lib/teamUp/email');
          await notifyApplicantStatusUpdate(need, updatedApplication!, status);

          // 站内通知
          const { notifyApplicationStatusUpdate } = await import(
            '../../../../lib/teamUp/notifications'
          );
          await notifyApplicationStatusUpdate(
            application.applicantUserId,
            need.id,
            need.title,
            status,
          );
        } catch (error) {
          console.error('Failed to send notifications:', error);
          // 通知失败不影响状态更新
        }
      }

      return res.status(200).json({
        success: true,
        data: updatedApplication,
      });
    } else {
      return res.status(405).json({
        success: false,
        error: {
          code: ERROR_CODES.METHOD_NOT_ALLOWED,
          message: ERROR_MESSAGES[ERROR_CODES.METHOD_NOT_ALLOWED],
        },
      });
    }
  } catch (error: any) {
    console.error('Error managing application:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      },
    });
  }
}
