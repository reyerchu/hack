/**
 * API: /api/team-up/needs
 *
 * GET  - 獲取需求列表
 * POST - 創建需求
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../lib/admin/init';
import { getAuthenticatedUser, checkUserRegistration } from '../../../../lib/teamUp/auth';
import { createTeamNeed, getTeamNeeds } from '../../../../lib/teamUp/db';
import { validateCreateNeedRequest } from '../../../../lib/teamUp/validation';
import { checkSensitiveContent } from '../../../../lib/teamUp/validation';
import { ERROR_CODES, ERROR_MESSAGES, PAGINATION_DEFAULTS } from '../../../../lib/teamUp/constants';
import { CreateTeamNeedRequest, GetNeedsQueryParams } from '../../../../lib/teamUp/types';

initializeApi();

/**
 * GET /api/team-up/needs
 * 獲取需求列表（公開）
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      track,
      stage,
      roles,
      search,
      isOpen,
      sort = 'latest',
      limit = PAGINATION_DEFAULTS.LIMIT,
      offset = PAGINATION_DEFAULTS.OFFSET,
    } = req.query;

    // 構建查詢參數
    const params: GetNeedsQueryParams = {
      track: track as any,
      stage: stage as any,
      roles: roles
        ? typeof roles === 'string'
          ? roles.split(',')
          : (roles as string[])
        : undefined,
      search: search as string,
      isOpen: isOpen === 'true' ? true : isOpen === 'false' ? false : undefined,
      sort: (sort as 'latest' | 'popular' | 'applications') || 'latest',
      limit: Math.min(Number(limit) || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT),
      offset: Number(offset) || PAGINATION_DEFAULTS.OFFSET,
    };

    // 獲取需求列表
    const { needs, total, hasMore } = await getTeamNeeds(params);

    return res.status(200).json({
      success: true,
      data: needs,
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/team-up/needs:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      },
    });
  }
}

/**
 * POST /api/team-up/needs
 * 創建需求（需要認證）
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. 認證檢查
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED],
        },
      });
    }

    // 2. 報名檢查並獲取用戶資料
    const hasRegistered = await checkUserRegistration(user.uid);
    if (!hasRegistered) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_REGISTERED,
          message: ERROR_MESSAGES[ERROR_CODES.NOT_REGISTERED],
        },
      });
    }

    // 2.5 獲取用戶的 nickname
    const admin = await import('firebase-admin');
    const db = admin.firestore();
    const registrationDoc = await db.collection('registrations').doc(user.uid).get();
    const registrationData = registrationDoc.data();
    // 優先使用 nickname，若無則使用 firstName（名字），最後才用完整名字
    const userNickname =
      registrationData?.nickname || registrationData?.user?.firstName || user.name || '匿名用戶';

    // 3. 驗證請求數據
    const validationResult = validateCreateNeedRequest(req.body);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validationResult.errors?.[0] || ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
        },
      });
    }

    const data = validationResult.data as CreateTeamNeedRequest;

    // 4. 敏感內容檢測
    const allText = [data.title, data.brief, data.otherNeeds].filter(Boolean).join(' ');
    const moderationResult = checkSensitiveContent(allText);

    // 創建需求數據
    const needData = {
      ownerUserId: user.uid,
      ownerEmail: user.email,
      ownerName: user.name,
      ownerNickname: userNickname,
      title: data.title,
      projectTrack: data.projectTrack,
      projectStage: data.projectStage,
      brief: data.brief,
      rolesNeeded: data.rolesNeeded,
      haveRoles: data.haveRoles || [],
      otherNeeds: data.otherNeeds,
      contactHint: data.contactHint,
      isOpen: true,
      // 如果檢測到敏感詞，自動標記
      isFlagged: moderationResult.isFlagged,
      flagReason: moderationResult.isFlagged
        ? `自動標記: ${moderationResult.matchedKeywords.join(', ')}`
        : undefined,
    };

    // 5. 創建需求
    const needId = await createTeamNeed(needData);

    // 6. 發送確認郵件（非阻塞）
    const createdNeed = { ...needData, id: needId };
    const { notifyNeedCreated } = await import('../../../../lib/teamUp/email');
    notifyNeedCreated(createdNeed as any).catch((err) => {
      console.error('Failed to send need created notification:', err);
    });

    return res.status(201).json({
      success: true,
      data: {
        id: needId,
        message: '需求發布成功！',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/team-up/needs:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      },
    });
  }
}

/**
 * API Handler
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: '不支援的請求方法',
        },
      });
  }
}
