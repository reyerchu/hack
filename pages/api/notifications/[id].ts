/**
 * 单个通知 API
 * PATCH /api/notifications/[id] - 标记通知为已读
 * DELETE /api/notifications/[id] - 删除通知
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedUser } from '../../../lib/teamUp/auth';
import { markNotificationAsRead, deleteNotification } from '../../../lib/teamUp/notifications';
import { ERROR_CODES, ERROR_MESSAGES } from '../../../lib/teamUp/constants';
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
        message: 'Invalid notification ID',
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

    if (req.method === 'PATCH') {
      // 标记为已读
      await markNotificationAsRead(id);

      return res.status(200).json({
        success: true,
        data: { message: '通知已标记为已读' },
      });
    } else if (req.method === 'DELETE') {
      // 删除通知
      await deleteNotification(id);

      return res.status(200).json({
        success: true,
        data: { message: '通知已删除' },
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
    console.error('Error handling notification:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      },
    });
  }
}
