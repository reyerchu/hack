/**
 * API: /api/sponsor/tracks/[trackId]/challenge
 *
 * GET - 獲取賽道的挑戰題目
 * PUT - 更新賽道挑戰題目（需要權限）
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';
import {
  requireTrackAccess,
  ApiResponse,
  AuthenticatedRequest,
} from '../../../../../lib/sponsor/middleware';
import { getUserSponsorRole, checkTrackAccess } from '../../../../../lib/sponsor/permissions';
import { logSponsorActivity } from '../../../../../lib/sponsor/activity-log';
import { SPONSOR_COLLECTIONS } from '../../../../../lib/sponsor/collections';
import type { ExtendedChallenge } from '../../../../../lib/sponsor/types';

// 初始化 Firebase Admin
initializeApi();
const db = firestore();

/**
 * GET /api/sponsor/tracks/[trackId]/challenge?challengeId=xxx
 * 獲取指定的挑戰題目
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { trackId, challengeId } = req.query;

  console.log('[GET /api/sponsor/tracks/[trackId]/challenge] Query params:', {
    trackId,
    challengeId,
  });

  if (!trackId || typeof trackId !== 'string') {
    return ApiResponse.error(res, 'Invalid track ID', 400);
  }

  if (!challengeId || typeof challengeId !== 'string') {
    return ApiResponse.error(res, 'Invalid challenge ID', 400);
  }

  if (!(await requireTrackAccess(req, res, trackId))) return;

  try {
    // 通過 document ID 直接獲取挑戰
    const challengeDoc = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .doc(challengeId)
      .get();

    console.log(
      '[GET /api/sponsor/tracks/[trackId]/challenge] Challenge exists:',
      challengeDoc.exists,
    );

    if (!challengeDoc.exists) {
      return ApiResponse.notFound(res, 'Challenge not found');
    }

    const challengeData = challengeDoc.data();
    console.log(
      '[GET /api/sponsor/tracks/[trackId]/challenge] Challenge trackId:',
      challengeData?.trackId,
    );

    // 驗證挑戰是否屬於該賽道
    // Support both document ID and trackId field for validation
    const trackDoc = await db
      .collection(SPONSOR_COLLECTIONS.TRACKS)
      .where('trackId', '==', challengeData?.trackId)
      .limit(1)
      .get();

    const trackDocId = trackDoc.empty ? null : trackDoc.docs[0].id;
    const isValidTrack = challengeData?.trackId === trackId || trackDocId === trackId;

    console.log('[GET challenge] Track validation:', {
      urlTrackId: trackId,
      challengeTrackIdField: challengeData?.trackId,
      trackDocumentId: trackDocId,
      isValid: isValidTrack,
    });

    if (!isValidTrack) {
      return ApiResponse.error(res, 'Challenge does not belong to this track', 403);
    }

    const challenge: ExtendedChallenge = {
      id: challengeDoc.id,
      ...challengeData,
    } as ExtendedChallenge;

    console.log(
      '[GET /api/sponsor/tracks/[trackId]/challenge] Returning challenge:',
      challenge.title,
    );

    return ApiResponse.success(res, challenge);
  } catch (error: any) {
    console.error('[GET /api/sponsor/tracks/[trackId]/challenge] Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch challenge', 500);
  }
}

/**
 * PUT /api/sponsor/tracks/[trackId]/challenge?challengeId=xxx
 * 更新指定的挑戰題目
 */
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { trackId, challengeId } = req.query;

  console.log('[PUT /api/sponsor/tracks/[trackId]/challenge] Query params:', {
    trackId,
    challengeId,
  });

  if (!trackId || typeof trackId !== 'string') {
    return ApiResponse.error(res, 'Invalid track ID', 400);
  }

  if (!challengeId || typeof challengeId !== 'string') {
    return ApiResponse.error(res, 'Invalid challenge ID', 400);
  }

  if (!(await requireTrackAccess(req, res, trackId))) return;

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;

  try {
    // 1. 通過 document ID 直接獲取挑戰
    const challengeDoc = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .doc(challengeId)
      .get();

    console.log(
      '[PUT /api/sponsor/tracks/[trackId]/challenge] Challenge exists:',
      challengeDoc.exists,
    );

    if (!challengeDoc.exists) {
      return ApiResponse.notFound(res, 'Challenge not found');
    }

    const existingChallenge = challengeDoc.data();

    console.log(
      '[PUT /api/sponsor/tracks/[trackId]/challenge] Challenge trackId:',
      existingChallenge?.trackId,
    );

    // 驗證挑戰是否屬於該賽道
    // Support both document ID and trackId field for validation
    const trackDoc = await db
      .collection(SPONSOR_COLLECTIONS.TRACKS)
      .where('trackId', '==', existingChallenge?.trackId)
      .limit(1)
      .get();

    const trackDocId = trackDoc.empty ? null : trackDoc.docs[0].id;
    const isValidTrack = existingChallenge?.trackId === trackId || trackDocId === trackId;

    console.log('[PUT challenge] Track validation:', {
      urlTrackId: trackId,
      challengeTrackIdField: existingChallenge?.trackId,
      trackDocumentId: trackDocId,
      isValid: isValidTrack,
    });

    if (!isValidTrack) {
      return ApiResponse.error(res, 'Challenge does not belong to this track', 403);
    }

    // 2. 檢查權限：是否可以編輯挑戰
    const sponsorDoc = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_SPONSORS)
      .doc(existingChallenge.sponsorId)
      .get();

    if (!sponsorDoc.exists) {
      return ApiResponse.error(res, 'Sponsor not found', 404);
    }

    const sponsor = sponsorDoc.data();

    // 檢查用戶的贊助商角色
    const userRole = await getUserSponsorRole(userId, existingChallenge.sponsorId);

    console.log('[PUT challenge] Permission check:', {
      userId,
      sponsorId: existingChallenge.sponsorId,
      userRole,
      userPermissions: authReq.userPermissions,
      sponsorPermissions: sponsor?.permissions,
    });

    // 權限檢查：
    // 1. 系統管理員 (admin/super_admin) 可以編輯任何挑戰
    // 2. Sponsor 的 admin 角色可以編輯自己贊助商的挑戰
    const canEdit =
      authReq.userPermissions?.includes('admin') ||
      authReq.userPermissions?.includes('super_admin') ||
      userRole === 'admin';

    console.log('[PUT challenge] canEdit:', canEdit);

    if (!canEdit) {
      return ApiResponse.forbidden(res, 'You do not have permission to edit this challenge');
    }

    // 3. 驗證並准备更新數據
    const {
      title,
      description,
      detailedDescription,
      requirements,
      submissionRequirements,
      timeline,
      attachments,
      prizes,
      prizeDetails,
      evaluationCriteria,
      resources,
    } = req.body;

    console.log('[PUT /api/sponsor/tracks/[trackId]/challenge] Request body fields:', {
      hasTitle: title !== undefined,
      hasEvaluationCriteria: evaluationCriteria !== undefined,
      evaluationCriteriaValue: evaluationCriteria,
      hasResources: resources !== undefined,
      resourcesValue: resources,
      hasPrizes: prizes !== undefined,
    });

    const updateData: Partial<ExtendedChallenge> = {
      updatedAt: firestore.Timestamp.now(),
    };

    // 只更新提供的字段
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (detailedDescription !== undefined) updateData.detailedDescription = detailedDescription;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (submissionRequirements !== undefined)
      updateData.submissionRequirements = submissionRequirements;

    // Support both 'prizes' and 'prizeDetails' for backward compatibility
    if (prizes !== undefined) updateData.prizes = prizes;
    if (prizeDetails !== undefined) updateData.prizes = prizeDetails;

    if (attachments !== undefined) updateData.attachments = attachments;

    // 評分標准
    if (evaluationCriteria !== undefined) updateData.evaluationCriteria = evaluationCriteria;

    // 参考资源
    if (resources !== undefined) updateData.resources = resources;

    // 處理時間线（转换為 Timestamp）
    if (timeline !== undefined) {
      updateData.timeline = {
        announcementDate: firestore.Timestamp.fromDate(new Date(timeline.announcementDate)),
        submissionStart: firestore.Timestamp.fromDate(new Date(timeline.submissionStart)),
        submissionDeadline: firestore.Timestamp.fromDate(new Date(timeline.submissionDeadline)),
        judgingDate: firestore.Timestamp.fromDate(new Date(timeline.judgingDate)),
        resultsDate: firestore.Timestamp.fromDate(new Date(timeline.resultsDate)),
      };
    }

    // 4. 更新挑戰
    await challengeDoc.ref.update(updateData);

    console.log('[PUT /api/sponsor/tracks/[trackId]/challenge] Challenge updated successfully');

    // 5. 記錄活动日志
    await logSponsorActivity({
      sponsorId: existingChallenge.sponsorId,
      userId: userId,
      userName: authReq.userEmail || 'Unknown',
      action: 'edit_challenge',
      targetType: 'challenge',
      targetId: challengeDoc.id,
      details: {
        trackId: trackId,
        challengeId: challengeId,
        updatedFields: Object.keys(updateData),
      },
    });

    // 6. 返回更新后的挑戰
    const updatedChallenge: ExtendedChallenge = {
      id: challengeDoc.id,
      ...existingChallenge,
      ...updateData,
    } as ExtendedChallenge;

    console.log(
      '[PUT /api/sponsor/tracks/[trackId]/challenge] Returning updated challenge:',
      updatedChallenge.title,
    );

    return ApiResponse.success(res, updatedChallenge, 'Challenge updated successfully');
  } catch (error: any) {
    console.error('[PUT /api/sponsor/tracks/[trackId]/challenge] Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to update challenge', 500);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);

    case 'PUT':
      return handlePut(req, res);

    default:
      return ApiResponse.error(res, 'Method not allowed', 405);
  }
}
