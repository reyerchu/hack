/**
 * API: /api/team-up/needs/:id
 *
 * GET    - 獲取單個需求詳情
 * PATCH  - 更新需求
 * DELETE - 刪除需求
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../../lib/admin/init';
import { getAuthenticatedUser, isAdmin } from '../../../../../lib/teamUp/auth';
import {
  getTeamNeed,
  updateTeamNeed,
  deleteTeamNeed,
  getNeedApplications,
} from '../../../../../lib/teamUp/db';
import { validateTeamNeedForm, checkSensitiveContent } from '../../../../../lib/teamUp/validation';
import { ERROR_CODES, ERROR_MESSAGES } from '../../../../../lib/teamUp/constants';
import { UpdateTeamNeedRequest } from '../../../../../lib/teamUp/types';

initializeApi();

/**
 * GET /api/team-up/needs/:id
 * 獲取單個需求詳情（公開）
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    // 獲取需求
    const need = await getTeamNeed(id as string);

    if (!need) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NEED_NOT_FOUND,
          message: ERROR_MESSAGES[ERROR_CODES.NEED_NOT_FOUND],
        },
      });
    }

    // 檢查是否為 owner
    const user = await getAuthenticatedUser(req);
    const isOwner = user && user.uid === need.ownerUserId;

    // 準備響應數據
    const responseData: any = { ...need };

    // 如果是 owner，返回額外資訊
    if (isOwner) {
      responseData.isOwner = true;
      // 獲取應徵列表
      const applications = await getNeedApplications(need.id);
      responseData.applications = applications;
    }

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error in GET /api/team-up/needs/:id:', error);
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
 * PATCH /api/team-up/needs/:id
 * 更新需求（僅 owner）
 */
async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

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

    // 2. 獲取需求
    const need = await getTeamNeed(id as string);
    if (!need) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NEED_NOT_FOUND,
          message: ERROR_MESSAGES[ERROR_CODES.NEED_NOT_FOUND],
        },
      });
    }

    // 3. 權限檢查
    if (need.ownerUserId !== user.uid) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: ERROR_MESSAGES[ERROR_CODES.FORBIDDEN],
        },
      });
    }

    const updateData: UpdateTeamNeedRequest = req.body;

    // 4. 驗證更新數據
    const formData = {
      title: updateData.title || need.title,
      projectTrack: ((updateData as any).projectTrack || need.projectTrack) as any,
      projectStage: (updateData as any).projectStage || need.projectStage,
      brief: updateData.brief || need.brief,
      rolesNeeded: updateData.rolesNeeded || need.rolesNeeded,
      haveRoles: updateData.haveRoles !== undefined ? updateData.haveRoles : need.haveRoles,
      otherNeeds:
        updateData.otherNeeds !== undefined ? updateData.otherNeeds : need.otherNeeds || '',
      contactHint: updateData.contactHint || need.contactHint,
    };

    const errors = validateTeamNeedForm(formData, true);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: Object.values(errors)[0],
        },
      });
    }

    // 5. 敏感內容檢測
    const allText = [updateData.title, updateData.brief, updateData.otherNeeds]
      .filter(Boolean)
      .join(' ');
    const moderationResult = checkSensitiveContent(allText);

    // 構建更新數據
    const dataToUpdate: any = {};
    if (updateData.title) dataToUpdate.title = updateData.title;
    if (updateData.projectStage) dataToUpdate.projectStage = updateData.projectStage;
    if (updateData.brief) dataToUpdate.brief = updateData.brief;
    if (updateData.rolesNeeded) dataToUpdate.rolesNeeded = updateData.rolesNeeded;
    if (updateData.haveRoles !== undefined) dataToUpdate.haveRoles = updateData.haveRoles;
    if (updateData.otherNeeds !== undefined) dataToUpdate.otherNeeds = updateData.otherNeeds;
    if (updateData.contactHint) dataToUpdate.contactHint = updateData.contactHint;
    if (updateData.isOpen !== undefined) dataToUpdate.isOpen = updateData.isOpen;

    // 如果檢測到敏感詞，更新標記
    if (moderationResult.isFlagged) {
      dataToUpdate.isFlagged = true;
      dataToUpdate.flagReason = `自動標記: ${moderationResult.matchedKeywords.join(', ')}`;
    }

    // 6. 更新需求
    const success = await updateTeamNeed(id as string, dataToUpdate);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: ERROR_MESSAGES[ERROR_CODES.DATABASE_ERROR],
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: '更新成功！',
    });
  } catch (error) {
    console.error('Error in PATCH /api/team-up/needs/:id:', error);
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
 * DELETE /api/team-up/needs/:id
 * 刪除需求（owner 或 admin）
 */
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

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

    // 2. 獲取需求
    const need = await getTeamNeed(id as string);
    if (!need) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NEED_NOT_FOUND,
          message: ERROR_MESSAGES[ERROR_CODES.NEED_NOT_FOUND],
        },
      });
    }

    // 3. 權限檢查（owner 或 admin）
    const isOwner = need.ownerUserId === user.uid;
    const isUserAdmin = isAdmin(user.permissions);

    if (!isOwner && !isUserAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: ERROR_MESSAGES[ERROR_CODES.FORBIDDEN],
        },
      });
    }

    // 4. 刪除需求
    const success = await deleteTeamNeed(id as string);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: ERROR_MESSAGES[ERROR_CODES.DATABASE_ERROR],
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: '需求已刪除',
    });
  } catch (error) {
    console.error('Error in DELETE /api/team-up/needs/:id:', error);
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
    case 'PATCH':
      return handlePatch(req, res);
    case 'DELETE':
      return handleDelete(req, res);
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
