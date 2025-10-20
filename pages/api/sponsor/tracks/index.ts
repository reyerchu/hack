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
    // 1. 獲取用戶的贊助商列表
    console.log('[/api/sponsor/tracks] 獲取贊助商列表...');
    const sponsorIds = await getUserSponsors(userId);
    console.log('[/api/sponsor/tracks] sponsorIds:', sponsorIds);

    // 2. 獲取賽道列表（從 tracks 集合）
    console.log('[/api/sponsor/tracks] 查詢 tracks...');
    let tracksQuery = db.collection(SPONSOR_COLLECTIONS.TRACKS)
      .where('status', '==', 'active');
    
    // 如果不是 super_admin，只顯示用戶關聯的贊助商的賽道
    if (sponsorIds.length > 0 && !sponsorIds.includes('*')) {
      tracksQuery = tracksQuery.where('sponsorId', 'in', sponsorIds) as any;
    }
    
    const tracksSnapshot = await tracksQuery.get();
    console.log('[/api/sponsor/tracks] 查詢結果: tracks.size =', tracksSnapshot.size);

    if (tracksSnapshot.empty) {
      console.log('[/api/sponsor/tracks] ⚠️  沒有賽道，返回空數組');
      return ApiResponse.success(res, { tracks: [] });
    }

    // 3. 為每個賽道獲取關聯的挑戰
    console.log('[/api/sponsor/tracks] 獲取關聯的挑戰...');
    const trackIds = tracksSnapshot.docs.map(doc => doc.data().trackId);
    
    let challengesSnapshot;
    if (trackIds.length > 0) {
      challengesSnapshot = await db
        .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
        .where('trackId', 'in', trackIds)
        .where('status', '==', 'published')
        .get();
      console.log('[/api/sponsor/tracks] 查詢結果: challenges.size =', challengesSnapshot.size);
    } else {
      challengesSnapshot = { docs: [], empty: true, size: 0 };
    }

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
    const tracksData = [];
    
    // 將 challenges 按 trackId 分組
    const challengesByTrack = new Map<string, ExtendedChallenge[]>();
    if (challengesSnapshot && !challengesSnapshot.empty) {
      for (const doc of challengesSnapshot.docs) {
        const challenge = { id: doc.id, ...doc.data() } as ExtendedChallenge;
        if (!challengesByTrack.has(challenge.trackId)) {
          challengesByTrack.set(challenge.trackId, []);
        }
        challengesByTrack.get(challenge.trackId)!.push(challenge);
      }
    }

    // 為每個賽道構建數據
    for (const doc of tracksSnapshot.docs) {
      const trackData = doc.data();
      const trackId = trackData.trackId;
      
      // 獲取該賽道的統計數據
      const stats = await getTrackStats(trackId);

      // 獲取用戶對此賽道的權限
      const userRole = await getUserSponsorRole(userId, trackData.sponsorId);
      console.log(`[/api/sponsor/tracks] Track ${trackId}: userRole =`, userRole);
      const permissions = {
        canEdit: userRole === 'admin',
        canViewSubmissions: ['admin', 'viewer', 'judge'].includes(userRole || ''),
        canJudge: ['admin', 'judge'].includes(userRole || ''),
        canManageFinance: userRole === 'admin',
      };
      console.log(`[/api/sponsor/tracks] Track ${trackId}: permissions =`, permissions);

      tracksData.push({
        id: trackId,
        name: trackData.name,
        description: trackData.description || '',
        sponsorId: trackData.sponsorId,
        sponsorName: trackData.sponsorName,
        challenges: challengesByTrack.get(trackId) || [],
        stats: stats,
        permissions: permissions,
      });
    }

    // 6. 計算每個賽道的總獎金並排序
    // Calculate total prize for each track
    const tracksWithPrizes = tracksData.map(track => {
      let totalPrize = 0;
      
      // Sum up prizes from all challenges in this track
      if (track.challenges && track.challenges.length > 0) {
        track.challenges.forEach((challenge: any) => {
          if (challenge.prizes) {
            // Parse prize if it's a string (e.g., "第一名：500u，第二名：300u")
            if (typeof challenge.prizes === 'string') {
              const prizeMatches = challenge.prizes.match(/(\d+)u/g);
              if (prizeMatches) {
                prizeMatches.forEach((match: string) => {
                  const amount = parseInt(match.replace('u', ''));
                  if (!isNaN(amount)) {
                    totalPrize += amount;
                  }
                });
              }
            } else if (Array.isArray(challenge.prizes)) {
              // If prizes is an array, try to sum numeric values
              challenge.prizes.forEach((prize: any) => {
                if (typeof prize === 'number') {
                  totalPrize += prize;
                } else if (typeof prize === 'string') {
                  const prizeMatches = prize.match(/(\d+)u?/g);
                  if (prizeMatches) {
                    prizeMatches.forEach((match: string) => {
                      const amount = parseInt(match.replace('u', ''));
                      if (!isNaN(amount)) {
                        totalPrize += amount;
                      }
                    });
                  }
                }
              });
            } else if (typeof challenge.prizes === 'number') {
              totalPrize += challenge.prizes;
            }
          }
        });
      }
      
      return {
        ...track,
        totalPrize: totalPrize,
      };
    });
    
    // Sort by totalPrize descending (higher prize first)
    tracksWithPrizes.sort((a, b) => b.totalPrize - a.totalPrize);
    
    const tracks = tracksWithPrizes;
    
    console.log('[/api/sponsor/tracks] 最終 tracks 數量:', tracks.length);
    console.log('[/api/sponsor/tracks] Tracks sorted by prize (high to low)');
    tracks.forEach(track => {
      console.log(`  - ${track.name}: ${track.totalPrize}u`);
    });

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

