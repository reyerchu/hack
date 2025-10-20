/**
 * API: /api/admin/challenges
 * 
 * GET - 獲取所有 challenges 列表（僅供 admin 使用）
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';
import {
  requireAuth,
  ApiResponse,
  AuthenticatedRequest,
} from '../../../../lib/sponsor/middleware';
import { SPONSOR_COLLECTIONS } from '../../../../lib/sponsor/collections';
import type { ExtendedChallenge } from '../../../../lib/sponsor/types';

initializeApi();
const db = firestore();

/**
 * GET - 獲取所有 challenges
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  console.log('[/api/admin/challenges] ========== GET 請求開始 ==========');
  
  if (!(await requireAuth(req, res))) {
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const userPermissions = authReq.userPermissions || [];

  // 檢查權限：只有 super_admin 和 admin 可以查看所有 challenges
  if (!userPermissions.includes('super_admin') && 
      !userPermissions.includes('admin') &&
      userPermissions[0] !== 'super_admin' && 
      userPermissions[0] !== 'admin') {
    return ApiResponse.forbidden(res, '只有 admin 可以查看所有 challenges');
  }

  try {
    console.log('[/api/admin/challenges] 查詢所有 challenges...');
    const challengesSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .orderBy('track', 'asc')
      .get();

    const challenges = challengesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        trackId: data.trackId,
        track: data.track,
        sponsorId: data.sponsorId,
        sponsorName: data.sponsorName,
        status: data.status,
        description: data.description,
        requirements: data.requirements,
        prizeDetails: data.prizeDetails,
        assignedBy: data.assignedBy,
        assignedAt: data.assignedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as ExtendedChallenge;
    });

    console.log('[/api/admin/challenges] 找到', challenges.length, '個 challenges');
    return ApiResponse.success(res, { challenges });
  } catch (error: any) {
    console.error('[/api/admin/challenges] ❌ Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch challenges', 500);
  }
}

/**
 * Main handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

