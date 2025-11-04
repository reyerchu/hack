/**
 * API: /api/sponsor/tracks/[trackId]
 *
 * GET - 獲取單個賽道的詳細資訊
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';
import {
  requireSponsorAuth,
  ApiResponse,
  AuthenticatedRequest,
} from '../../../../lib/sponsor/middleware';
import { checkTrackAccess, getUserSponsorRole } from '../../../../lib/sponsor/permissions';
import { SPONSOR_COLLECTIONS } from '../../../../lib/sponsor/collections';
import type { ExtendedChallenge } from '../../../../lib/sponsor/types';

// 初始化 Firebase Admin
initializeApi();
const db = firestore();

/**
 * 獲取賽道統計數據
 */
async function getTrackStats(trackId: string) {
  try {
    const statsDoc = await db.collection(SPONSOR_COLLECTIONS.TRACK_STATS).doc(trackId).get();

    if (statsDoc.exists) {
      return statsDoc.data();
    }

    // 如果沒有統計數據，返回默認值
    return {
      submissionCount: 0,
      teamCount: 0,
      averageScore: 0,
    };
  } catch (error) {
    console.error('Error fetching track stats:', error);
    return {
      submissionCount: 0,
      teamCount: 0,
      averageScore: 0,
    };
  }
}

/**
 * GET - 獲取單個賽道詳情
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  console.log('[/api/sponsor/tracks/[trackId]] ========== GET 請求開始 ==========');

  if (!(await requireSponsorAuth(req, res))) {
    console.log('[/api/sponsor/tracks/[trackId]] ❌ 認證失敗');
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const { trackId } = req.query;

  console.log('[/api/sponsor/tracks/[trackId]] ✅ 認證成功, userId:', userId);
  console.log('[/api/sponsor/tracks/[trackId]] trackId:', trackId);

  if (!trackId || typeof trackId !== 'string') {
    return ApiResponse.error(res, 'Invalid track ID', 400);
  }

  try {
    // 1. 檢查用戶是否有權限訪問此賽道
    console.log('[/api/sponsor/tracks/[trackId]] 檢查權限中...');
    console.log('[/api/sponsor/tracks/[trackId]] userId:', userId);
    console.log('[/api/sponsor/tracks/[trackId]] trackId:', trackId);
    console.log('[/api/sponsor/tracks/[trackId]] userPermissions:', authReq.userPermissions);

    const hasAccess = await checkTrackAccess(userId, trackId);
    console.log('[/api/sponsor/tracks/[trackId]] hasAccess:', hasAccess);

    if (!hasAccess) {
      console.log('[/api/sponsor/tracks/[trackId]] ❌ 權限檢查失敗');
      return ApiResponse.forbidden(res, '您沒有權限訪問此賽道');
    }

    console.log('[/api/sponsor/tracks/[trackId]] ✅ 權限檢查通過');

    // 2. 獲取賽道資訊（從 tracks 集合）
    console.log('[/api/sponsor/tracks/[trackId]] 查詢 tracks...');
    const trackSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.TRACKS)
      .where('trackId', '==', trackId)
      .limit(1)
      .get();

    if (trackSnapshot.empty) {
      console.log('[/api/sponsor/tracks/[trackId]] ❌ 賽道不存在');
      return ApiResponse.notFound(res, '找不到該賽道');
    }

    const trackDoc = trackSnapshot.docs[0];
    const track = trackDoc.data();
    console.log('[/api/sponsor/tracks/[trackId]] 找到 track:', track.trackId);

    // 3. 獲取該賽道的所有挑戰
    console.log('[/api/sponsor/tracks/[trackId]] 查詢 challenges...');
    const challengesSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .where('trackId', '==', trackId)
      .where('status', '==', 'published')
      .get();

    const challenges = challengesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ExtendedChallenge[];
    console.log('[/api/sponsor/tracks/[trackId]] 找到 challenges 數量:', challenges.length);

    // 4. 獲取統計數據
    const stats = await getTrackStats(trackId);
    console.log('[/api/sponsor/tracks/[trackId]] stats:', stats);

    // 5. 獲取用戶對此賽道的權限
    const userRole = await getUserSponsorRole(userId, track.sponsorId);
    console.log('[/api/sponsor/tracks/[trackId]] userRole:', userRole);

    const permissions = {
      canEdit: userRole === 'admin',
      canViewSubmissions: ['admin', 'viewer', 'judge'].includes(userRole || ''),
      canJudge: ['admin', 'judge'].includes(userRole || ''),
      canManageFinance: userRole === 'admin',
    };
    console.log('[/api/sponsor/tracks/[trackId]] permissions:', permissions);

    // 6. 組裝回應數據
    const trackData = {
      id: trackId,
      name: track.name,
      description: track.description || '',
      sponsorId: track.sponsorId,
      sponsorName: track.sponsorName,
      submissionDeadline: track.submissionDeadline,
      challenges: challenges,
      stats: stats,
      permissions: permissions,
    };

    console.log('[/api/sponsor/tracks/[trackId]] ========== 返回成功 ==========');
    return ApiResponse.success(res, trackData);
  } catch (error: any) {
    console.error('[/api/sponsor/tracks/[trackId]] ❌ Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch track details', 500);
  }
}

/**
 * PUT - 更新賽道資訊
 */
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  console.log('[/api/sponsor/tracks/[trackId]] ========== PUT 請求開始 ==========');

  if (!(await requireSponsorAuth(req, res))) {
    console.log('[/api/sponsor/tracks/[trackId]] ❌ 認證失敗');
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const { trackId } = req.query;
  const { name, description, submissionDeadline } = req.body;

  console.log('[/api/sponsor/tracks/[trackId]] userId:', userId);
  console.log('[/api/sponsor/tracks/[trackId]] trackId:', trackId);
  console.log('[/api/sponsor/tracks/[trackId]] update data:', {
    name,
    description,
    submissionDeadline,
  });

  if (!trackId || typeof trackId !== 'string') {
    return ApiResponse.error(res, 'Invalid track ID', 400);
  }

  if (!name || !name.trim()) {
    return ApiResponse.error(res, '賽道名稱為必填項', 400);
  }

  try {
    // 1. 檢查用戶是否有權限編輯此賽道
    const hasAccess = await checkTrackAccess(userId, trackId);
    console.log('[/api/sponsor/tracks/[trackId]] hasAccess:', hasAccess);

    if (!hasAccess) {
      return ApiResponse.forbidden(res, '您沒有權限編輯此賽道');
    }

    // 2. 更新賽道資訊
    const trackSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.TRACKS)
      .where('trackId', '==', trackId)
      .limit(1)
      .get();

    if (trackSnapshot.empty) {
      return ApiResponse.notFound(res, '找不到該賽道');
    }

    const trackDoc = trackSnapshot.docs[0];
    const updateData: any = {
      name: name.trim(),
      description: description?.trim() || '',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    // Handle submission deadline
    if (submissionDeadline) {
      updateData.submissionDeadline = firestore.Timestamp.fromDate(new Date(submissionDeadline));
    }

    await trackDoc.ref.update(updateData);

    // 3. 記錄活動日誌
    try {
      await db.collection('sponsor-activity-logs').add({
        userId: userId,
        action: 'update_track',
        resourceType: 'track',
        resourceId: trackDoc.id,
        trackId: trackId,
        changes: updateData,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[/api/sponsor/tracks/[trackId]] Failed to log activity:', logError);
    }

    console.log('[/api/sponsor/tracks/[trackId]] ✅ 賽道更新成功');
    return ApiResponse.success(res, {
      message: '賽道更新成功',
      track: {
        trackId,
        ...updateData,
      },
    });
  } catch (error: any) {
    console.error('[/api/sponsor/tracks/[trackId]] ❌ Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to update track', 500);
  }
}

/**
 * Main handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'PUT') {
    return handlePut(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
