/**
 * API: /api/admin/challenges/[challengeId]/assign
 * 
 * PUT - Super_admin 將 challenge 分配給 sponsor
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';
import {
  requireAuth,
  ApiResponse,
  AuthenticatedRequest,
} from '../../../../../lib/sponsor/middleware';
import { SPONSOR_COLLECTIONS } from '../../../../../lib/sponsor/collections';

initializeApi();
const db = firestore();

/**
 * PUT - 分配 challenge 給 sponsor
 */
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  console.log('[/api/admin/challenges/assign] ========== PUT 請求開始 ==========');
  
  if (!(await requireAuth(req, res))) {
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const userPermissions = authReq.userPermissions || [];
  const { challengeId } = req.query;
  const { sponsorId, sponsorName } = req.body;

  console.log('[assign] userId:', userId);
  console.log('[assign] userPermissions:', userPermissions);
  console.log('[assign] challengeId:', challengeId);
  console.log('[assign] sponsorId:', sponsorId);

  // 1. 檢查權限：只有 super_admin 和 admin 可以分配
  if (!userPermissions.includes('super_admin') && 
      !userPermissions.includes('admin') &&
      userPermissions[0] !== 'super_admin' && 
      userPermissions[0] !== 'admin') {
    console.log('[assign] ❌ 權限不足');
    return ApiResponse.forbidden(res, '只有 super_admin 可以分配 challenges');
  }

  if (!challengeId || typeof challengeId !== 'string') {
    return ApiResponse.error(res, 'Invalid challenge ID', 400);
  }

  if (!sponsorId || !sponsorName) {
    return ApiResponse.error(res, 'sponsorId 和 sponsorName 為必填項', 400);
  }

  try {
    // 2. 檢查 challenge 是否存在
    console.log('[assign] 查詢 challenge...');
    const challengeSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .where('trackId', '==', challengeId)
      .limit(1)
      .get();

    if (challengeSnapshot.empty) {
      console.log('[assign] ❌ Challenge 不存在');
      return ApiResponse.notFound(res, '找不到該 challenge');
    }

    const challengeDoc = challengeSnapshot.docs[0];
    const oldData = challengeDoc.data();
    console.log('[assign] 找到 challenge:', challengeDoc.id);
    console.log('[assign] 舊 sponsor:', oldData.sponsorId, oldData.sponsorName);

    // 3. 檢查 sponsor 是否存在
    console.log('[assign] 檢查 sponsor 是否存在...');
    const sponsorDoc = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_SPONSORS)
      .doc(sponsorId)
      .get();

    if (!sponsorDoc.exists) {
      console.log('[assign] ❌ Sponsor 不存在');
      return ApiResponse.error(res, '找不到該 sponsor', 404);
    }

    // 4. 更新 challenge
    console.log('[assign] 更新 challenge...');
    await challengeDoc.ref.update({
      sponsorId: sponsorId,
      sponsorName: sponsorName,
      assignedBy: userId,
      assignedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // 5. 記錄活動日誌
    console.log('[assign] 記錄活動日誌...');
    try {
      await db.collection('sponsor-activity-logs').add({
        userId: userId,
        action: 'update_challenge',
        resourceType: 'challenge',
        resourceId: challengeDoc.id,
        trackId: challengeId,
        trackName: oldData.track,
        oldSponsorId: oldData.sponsorId,
        oldSponsorName: oldData.sponsorName,
        newSponsorId: sponsorId,
        newSponsorName: sponsorName,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[assign] Failed to log activity:', logError);
      // Don't fail the assignment if logging fails
    }

    console.log('[assign] ✅ 分配成功');
    return ApiResponse.success(res, {
      message: '成功將 challenge 分配給 sponsor',
      challenge: {
        id: challengeDoc.id,
        trackId: challengeId,
        trackName: oldData.track,
        sponsorId: sponsorId,
        sponsorName: sponsorName,
      },
    });
  } catch (error: any) {
    console.error('[assign] ❌ Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to assign challenge', 500);
  }
}

/**
 * Main handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    return handlePut(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

