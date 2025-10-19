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
  if (!(await requireSponsorAuth(req, res))) return;

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;

  try {
    // 1. 獲取用戶可访问的賽道
    const trackIds = await getUserAccessibleTracks(userId);

    if (trackIds.length === 0) {
      return ApiResponse.success(res, { tracks: [] });
    }

    // 2. 獲取用戶的贊助商列表
    const sponsorIds = await getUserSponsors(userId);

    // 3. 獲取所有相關的挑戰
    const challengesSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .where('trackId', 'in', trackIds)
      .where('status', '==', 'published')
      .get();

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

    // 5. 按賽道组织數據
    const tracksMap = new Map<
      string,
      {
        id: string;
        name: string;
        sponsorId: string;
        sponsorName: string;
        challenge?: ExtendedChallenge;
        stats: {
          submissionCount: number;
          teamCount: number;
          averageScore?: number;
        };
      }
    >();

    for (const doc of challengesSnapshot.docs) {
      const challenge = { id: doc.id, ...doc.data() } as ExtendedChallenge;

      // 獲取該賽道的統計數據
      const stats = await getTrackStats(challenge.trackId);

      tracksMap.set(challenge.trackId, {
        id: challenge.trackId,
        name: challenge.track,
        sponsorId: challenge.sponsorId,
        sponsorName: challenge.sponsorName,
        challenge: challenge,
        stats: stats,
      });
    }

    // 6. 转换為数组並返回
    const tracks = Array.from(tracksMap.values());

    const response: TrackListResponse = {
      tracks: tracks,
    };

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

