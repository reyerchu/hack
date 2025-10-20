/**
 * API: /api/sponsor/tracks
 * 
 * GET - 獲取贊助商的賽道列表
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';
import {
  requireSponsorAuth,
  ApiResponse,
  AuthenticatedRequest,
} from '../../../../lib/sponsor/middleware';
import {
  getUserAccessibleTracks,
  getUserSponsors,
  getUserSponsorRole,
} from '../../../../lib/sponsor/permissions';
import { SPONSOR_COLLECTIONS } from '../../../../lib/sponsor/collections';
import type {
  TrackListResponse,
  ExtendedChallenge,
  ExtendedSponsor,
} from '../../../../lib/sponsor/types';

// 初始化 Firebase Admin
initializeApi();
const db = firestore();

/**
 * GET /api/sponsor/tracks
 * 獲取當前用戶可访问的賽道列表
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  console.log('[/api/sponsor/tracks] ========== GET 請求開始 ==========');
  
  if (!(await requireSponsorAuth(req, res))) {
    console.log('[/api/sponsor/tracks] ❌ 認證失敗');
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  
  console.log('[/api/sponsor/tracks] ✅ 認證成功, userId:', userId);

  try {
    // 1. 獲取用戶可访问的賽道
    console.log('[/api/sponsor/tracks] 獲取用戶可訪問的賽道...');
    const trackIds = await getUserAccessibleTracks(userId);
    console.log('[/api/sponsor/tracks] trackIds:', trackIds);

    if (trackIds.length === 0) {
      console.log('[/api/sponsor/tracks] ⚠️  沒有賽道，返回空數組');
      return ApiResponse.success(res, { tracks: [] });
    }

    // 2. 獲取用戶的贊助商列表
    console.log('[/api/sponsor/tracks] 獲取贊助商列表...');
    const sponsorIds = await getUserSponsors(userId);
    console.log('[/api/sponsor/tracks] sponsorIds:', sponsorIds);

    // 3. 獲取所有相關的挑戰
    console.log('[/api/sponsor/tracks] 查詢 extended-challenges...');
    console.log('[/api/sponsor/tracks] 查詢條件: trackId in', trackIds, ', status == published');
    const challengesSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .where('trackId', 'in', trackIds)
      .where('status', '==', 'published')
      .get();
    
    console.log('[/api/sponsor/tracks] 查詢結果: challenges.size =', challengesSnapshot.size);

    // 4. 獲取所有相關的贊助商資訊
    const sponsorsMap = new Map<string, ExtendedSponsor>();
    if (sponsorIds.length > 0) {
      const sponsorsSnapshot = await db
        .collection(SPONSOR_COLLECTIONS.EXTENDED_SPONSORS)
        .where(firestore.FieldPath.documentId(), 'in', sponsorIds)
        .get();

      sponsorsSnapshot.docs.forEach((doc) => {
        sponsorsMap.set(doc.id, { id: doc.id, ...doc.data() } as ExtendedSponsor);
      });
    }

    // 5. 按賽道组织數據 - 一個賽道可以有多個挑戰
    const tracksMap = new Map<
      string,
      {
        id: string;
        name: string;
        sponsorId: string;
        sponsorName: string;
        challenges: ExtendedChallenge[];
        stats: {
          submissionCount: number;
          teamCount: number;
          averageScore?: number;
        };
        permissions: {
          canEdit: boolean;
          canViewSubmissions: boolean;
          canJudge: boolean;
          canManageFinance: boolean;
        };
      }
    >();

    for (const doc of challengesSnapshot.docs) {
      const challenge = { id: doc.id, ...doc.data() } as ExtendedChallenge;

      // 如果該賽道還沒有記錄，創建新記錄
      if (!tracksMap.has(challenge.trackId)) {
        // 獲取該賽道的統計數據
        const stats = await getTrackStats(challenge.trackId);

        // 獲取用戶對此賽道的權限
        const userRole = await getUserSponsorRole(userId, challenge.sponsorId);
        console.log(`[/api/sponsor/tracks] Track ${challenge.trackId}: userRole =`, userRole);
        const permissions = {
          canEdit: userRole === 'admin',
          canViewSubmissions: ['admin', 'viewer', 'judge'].includes(userRole || ''),
          canJudge: ['admin', 'judge'].includes(userRole || ''),
          canManageFinance: userRole === 'admin',
        };
        console.log(`[/api/sponsor/tracks] Track ${challenge.trackId}: permissions =`, permissions);

        tracksMap.set(challenge.trackId, {
          id: challenge.trackId,
          name: challenge.track,
          sponsorId: challenge.sponsorId,
          sponsorName: challenge.sponsorName,
          challenges: [],
          stats: stats,
          permissions: permissions,
        });
      }
      
      // 添加 challenge 到該賽道
      const track = tracksMap.get(challenge.trackId)!;
      track.challenges.push(challenge);
    }

    // 6. 转换為数组並返回
    const tracks = Array.from(tracksMap.values());
    
    console.log('[/api/sponsor/tracks] 最終 tracks 數量:', tracks.length);
    console.log('[/api/sponsor/tracks] tracks:', JSON.stringify(tracks, null, 2));

    const response: TrackListResponse = {
      tracks: tracks,
    };
    
    console.log('[/api/sponsor/tracks] ========== 返回成功 ==========');
    return ApiResponse.success(res, response);
  } catch (error: any) {
    console.error('Error fetching sponsor tracks:', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch tracks', 500);
  }
}

/**
 * 獲取賽道統計數據
 */
async function getTrackStats(trackId: string): Promise<{
  submissionCount: number;
  teamCount: number;
  averageScore?: number;
}> {
  try {
    // 查詢該賽道的所有提交
    const submissionsSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.TEAM_SUBMISSIONS)
      .where('projectTrack', '==', trackId)
      .get();

    const submissionCount = submissionsSnapshot.size;

    // 計算隊伍数（去重）
    const teamNames = new Set<string>();
    let totalScore = 0;
    let scoredSubmissions = 0;

    submissionsSnapshot.docs.forEach((doc) => {
      const submission = doc.data();
      teamNames.add(submission.teamName);

      if (submission.averageScore !== undefined && submission.averageScore !== null) {
        totalScore += submission.averageScore;
        scoredSubmissions++;
      }
    });

    const averageScore = scoredSubmissions > 0 ? totalScore / scoredSubmissions : undefined;

    return {
      submissionCount,
      teamCount: teamNames.size,
      averageScore,
    };
  } catch (error) {
    console.error('Error fetching track stats:', error);
    return {
      submissionCount: 0,
      teamCount: 0,
    };
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

