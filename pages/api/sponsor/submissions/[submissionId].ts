/**
 * API: /api/sponsor/submissions/[submissionId]
 *
 * GET - 獲取單個提交的详细資訊
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';
import {
  requireSponsorAuth,
  ApiResponse,
  AuthenticatedRequest,
} from '../../../../lib/sponsor/middleware';
import { canViewSubmission } from '../../../../lib/sponsor/permissions';
import { logSponsorActivity } from '../../../../lib/sponsor/activity-log';
import { SPONSOR_COLLECTIONS } from '../../../../lib/sponsor/collections';
import type { TeamSubmission } from '../../../../lib/sponsor/types';

// 初始化 Firebase Admin
initializeApi();
const db = firestore();

/**
 * GET /api/sponsor/submissions/[submissionId]
 * 獲取單個提交的详细資訊
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { submissionId } = req.query;

  if (!submissionId || typeof submissionId !== 'string') {
    return ApiResponse.error(res, 'Invalid submission ID', 400);
  }

  if (!(await requireSponsorAuth(req, res))) return;

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;

  try {
    // 1. 獲取提交
    const submissionDoc = await db
      .collection(SPONSOR_COLLECTIONS.TEAM_SUBMISSIONS)
      .doc(submissionId)
      .get();

    if (!submissionDoc.exists) {
      return ApiResponse.notFound(res, 'Submission not found');
    }

    // 2. 檢查權限
    const canView = await canViewSubmission(userId, submissionId);

    if (!canView) {
      return ApiResponse.forbidden(res, 'You do not have permission to view this submission');
    }

    const submission: TeamSubmission = {
      id: submissionDoc.id,
      ...submissionDoc.data(),
    } as TeamSubmission;

    // 3. 記錄活动日志（如果是贊助商查看）
    if (!submission.teamMembers.some((m) => m.userId === userId)) {
      // 獲取贊助商 ID
      const challengeSnapshot = await db
        .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
        .where('trackId', '==', submission.projectTrack)
        .limit(1)
        .get();

      if (!challengeSnapshot.empty) {
        const challenge = challengeSnapshot.docs[0].data();

        await logSponsorActivity({
          sponsorId: challenge.sponsorId,
          userId: userId,
          userName: authReq.userEmail || 'Unknown',
          action: 'view_submission',
          targetType: 'submission',
          targetId: submissionId,
          details: {
            trackId: submission.projectTrack,
            teamName: submission.teamName,
          },
        });
      }
    }

    return ApiResponse.success(res, submission);
  } catch (error: any) {
    console.error('Error fetching submission:', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch submission', 500);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);

    default:
      return ApiResponse.error(res, 'Method not allowed', 405);
  }
}
