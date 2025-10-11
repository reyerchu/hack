/**
 * 申請 API - 創建申請
 * POST /api/team-up/applications
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedUser, checkUserRegistration } from '../../../../lib/teamUp/auth';
import { createApplication, getTeamNeed } from '../../../../lib/teamUp/db';
import { validatePublicField } from '../../../../lib/teamUp/validation';
import { ERROR_CODES, ERROR_MESSAGES } from '../../../../lib/teamUp/constants';
import { APIError } from '../../../../lib/teamUp/types';

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
  // 只允许 POST
  if (req.method !== 'POST') {
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

    // 3. 验证请求参数
    const { needId, message, contactInfo } = req.body;

    if (!needId || typeof needId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'needId is required',
        },
      });
    }

    if (!message || typeof message !== 'string' || message.length < 10) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: '申請留言至少需要 10 個字符',
        },
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: '申請留言不能超過 500 個字符',
        },
      });
    }

    if (!contactInfo || typeof contactInfo !== 'string' || contactInfo.length < 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: '聯繫方式至少需要 5 個字符',
        },
      });
    }

    if (contactInfo.length > 200) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: '聯繫方式不能超過 200 個字符',
        },
      });
    }

    // 4. PII 验证
    const messageValidation = validatePublicField(message);
    if (!messageValidation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.PII_DETECTED,
          message: messageValidation.error || ERROR_MESSAGES[ERROR_CODES.PII_DETECTED],
        },
      });
    }

    // contactInfo 可以包含联系方式，不需要 PII 验证

    // 5. 检查需求是否存在且开放
    const need = await getTeamNeed(needId);
    if (!need) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: '找不到此需求',
        },
      });
    }

    if (need.isHidden) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: '此需求已被管理员隐藏',
        },
      });
    }

    if (!need.isOpen) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: '此需求已停止接收申请',
        },
      });
    }

    // 6. 不能申请自己的需求
    if (need.ownerUserId === currentUser.uid) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: '不能申請自己發布的需求',
        },
      });
    }

    // 7. 創建申請
    const applicationData = {
      teamNeedId: needId,
      applicantUserId: currentUser.uid,
      applicantEmail: currentUser.email || '',
      applicantName: currentUser.name || currentUser.email || 'Anonymous',
      roles: [], // 可以从 need.rolesNeeded 中选择，暂时留空
      message,
      contactForOwner: contactInfo,
      status: 'pending' as const,
      isReadByOwner: false,
    };

    // 8. 創建申請記錄
    const savedApplicationId = await createApplication(applicationData);

    // 9. 發送通知給需求發布者
    try {
      // Email 通知
      const { notifyAuthorNewApplication, notifyApplicantSubmitted } = await import(
        '../../../../lib/teamUp/email'
      );
      const fullApplication = {
        ...applicationData,
        id: savedApplicationId,
        createdAt: null as any,
        updatedAt: null as any,
        isFlagged: false,
      };
      await notifyAuthorNewApplication(need, fullApplication);
      await notifyApplicantSubmitted(need, fullApplication);

      // 站内通知
      const { notifyNewApplication } = await import('../../../../lib/teamUp/notifications');
      await notifyNewApplication(need.ownerUserId, needId, need.title, savedApplicationId);
    } catch (error) {
      console.error('Failed to send notifications:', error);
      // 通知失敗不影響申請創建
    }

    return res.status(201).json({
      success: true,
      data: { id: savedApplicationId, ...applicationData },
    });
  } catch (error: any) {
    console.error('Error creating application:', error);

    // 處理特定錯誤
    if (error.message === 'Application already exists') {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.DUPLICATE_APPLICATION,
          message: ERROR_MESSAGES[ERROR_CODES.DUPLICATE_APPLICATION],
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      },
    });
  }
}
