/**
 * 通知 API
 * GET /api/notifications - 获取当前用户的通知列表
 * PATCH /api/notifications - 标记所有通知为已读
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedUser } from '../../../lib/teamUp/auth';
import {
  getUserNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
} from '../../../lib/teamUp/notifications';
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

    if (req.method === 'GET') {
      // 获取通知列表
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await getUserNotifications(currentUser.uid, limit, offset);
      const unreadCount = await getUnreadCount(currentUser.uid);

      return res.status(200).json({
        success: true,
        data: {
          notifications,
          unreadCount,
          total: notifications.length,
        },
      });
    } else if (req.method === 'PATCH') {
      // 标记所有通知为已读
      await markAllNotificationsAsRead(currentUser.uid);

      return res.status(200).json({
        success: true,
        data: { message: '所有通知已标记为已读' },
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
    console.error('Error handling notifications:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      },
    });
  }
}
