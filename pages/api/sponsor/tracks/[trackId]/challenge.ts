/**
 * API: /api/sponsor/tracks/[trackId]/challenge
 * 
 * GET - 获取赛道的挑战题目
 * PUT - 更新赛道挑战题目（需要权限）
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';
import {
  requireTrackAccess,
  ApiResponse,
  AuthenticatedRequest,
} from '../../../../../lib/sponsor/middleware';
import {
  getUserSponsorRole,
  checkTrackAccess,
} from '../../../../../lib/sponsor/permissions';
import { logSponsorActivity } from '../../../../../lib/sponsor/activity-log';
import { SPONSOR_COLLECTIONS } from '../../../../../lib/sponsor/collections';
import type { ExtendedChallenge } from '../../../../../lib/sponsor/types';

// 初始化 Firebase Admin
initializeApi();
const db = firestore();

/**
 * GET /api/sponsor/tracks/[trackId]/challenge
 * 获取赛道的挑战题目
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { trackId } = req.query;

  if (!trackId || typeof trackId !== 'string') {
    return ApiResponse.error(res, 'Invalid track ID', 400);
  }

  if (!(await requireTrackAccess(req, res, trackId))) return;

  try {
    // 查询该赛道的挑战
    const challengesSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .where('trackId', '==', trackId)
      .limit(1)
      .get();

    if (challengesSnapshot.empty) {
      return ApiResponse.notFound(res, 'Challenge not found for this track');
    }

    const challengeDoc = challengesSnapshot.docs[0];
    const challenge: ExtendedChallenge = {
      id: challengeDoc.id,
      ...challengeDoc.data(),
    } as ExtendedChallenge;

    return ApiResponse.success(res, challenge);
  } catch (error: any) {
    console.error('Error fetching challenge:', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch challenge', 500);
  }
}

/**
 * PUT /api/sponsor/tracks/[trackId]/challenge
 * 更新赛道挑战题目
 */
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { trackId } = req.query;

  if (!trackId || typeof trackId !== 'string') {
    return ApiResponse.error(res, 'Invalid track ID', 400);
  }

  if (!(await requireTrackAccess(req, res, trackId))) return;

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;

  try {
    // 1. 查询该赛道的挑战
    const challengesSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .where('trackId', '==', trackId)
      .limit(1)
      .get();

    if (challengesSnapshot.empty) {
      return ApiResponse.notFound(res, 'Challenge not found for this track');
    }

    const challengeDoc = challengesSnapshot.docs[0];
    const existingChallenge = challengeDoc.data();

    // 2. 检查权限：是否可以编辑挑战
    const sponsorDoc = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_SPONSORS)
      .doc(existingChallenge.sponsorId)
      .get();

    if (!sponsorDoc.exists) {
      return ApiResponse.error(res, 'Sponsor not found', 404);
    }

    const sponsor = sponsorDoc.data();

    // 检查用户的赞助商角色
    const userRole = await getUserSponsorRole(userId, existingChallenge.sponsorId);

    // 只有 admin 或有 canEditTrackChallenge 权限的赞助商可以编辑
    const canEdit =
      authReq.userPermissions?.includes('admin') ||
      authReq.userPermissions?.includes('super_admin') ||
      (userRole === 'admin' && sponsor?.permissions?.canEditTrackChallenge);

    if (!canEdit) {
      return ApiResponse.forbidden(
        res,
        'You do not have permission to edit this challenge',
      );
    }

    // 3. 验证并准备更新数据
    const {
      title,
      description,
      detailedDescription,
      requirements,
      submissionRequirements,
      timeline,
      attachments,
      prizes,
    } = req.body;

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
    if (prizes !== undefined) updateData.prizes = prizes;
    if (attachments !== undefined) updateData.attachments = attachments;

    // 处理时间线（转换为 Timestamp）
    if (timeline !== undefined) {
      updateData.timeline = {
        announcementDate: firestore.Timestamp.fromDate(new Date(timeline.announcementDate)),
        submissionStart: firestore.Timestamp.fromDate(new Date(timeline.submissionStart)),
        submissionDeadline: firestore.Timestamp.fromDate(new Date(timeline.submissionDeadline)),
        judgingDate: firestore.Timestamp.fromDate(new Date(timeline.judgingDate)),
        resultsDate: firestore.Timestamp.fromDate(new Date(timeline.resultsDate)),
      };
    }

    // 4. 更新挑战
    await challengeDoc.ref.update(updateData);

    // 5. 记录活动日志
    await logSponsorActivity({
      sponsorId: existingChallenge.sponsorId,
      userId: userId,
      userName: authReq.userEmail || 'Unknown',
      action: 'edit_challenge',
      targetType: 'challenge',
      targetId: challengeDoc.id,
      details: {
        trackId: trackId,
        updatedFields: Object.keys(updateData),
      },
    });

    // 6. 返回更新后的挑战
    const updatedChallenge: ExtendedChallenge = {
      id: challengeDoc.id,
      ...existingChallenge,
      ...updateData,
    } as ExtendedChallenge;

    return ApiResponse.success(res, updatedChallenge, 'Challenge updated successfully');
  } catch (error: any) {
    console.error('Error updating challenge:', error);
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

