/**
 * API: /api/admin/diagnose-tracks
 *
 * 诊断 tracks 数据状态
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import firebase from 'firebase-admin';
import { SPONSOR_COLLECTIONS } from '../../../lib/sponsor/collections';

initializeApi();
const db = firebase.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未認證' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await firebase.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    console.log('[DiagnoseTracks] User ID:', userId);

    // 2. Check /tracks collection
    const tracksSnapshot = await db.collection(SPONSOR_COLLECTIONS.TRACKS).get();
    const tracksData = tracksSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        trackId: data.trackId,
        name: data.name,
        sponsorName: data.sponsorName,
        status: data.status,
      };
    });

    console.log('[DiagnoseTracks] /tracks count:', tracksSnapshot.size);

    // 3. Check /extended-challenges collection
    const challengesSnapshot = await db.collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES).get();

    const trackOnlyRecords = [];
    const realChallenges = [];

    challengesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const hasTitle = data.title && data.title.trim() !== '';
      const hasChallengeId = data.challengeId && data.challengeId.trim() !== '';

      if (!hasTitle && !hasChallengeId) {
        trackOnlyRecords.push({
          id: doc.id,
          trackId: data.trackId,
          track: data.track,
          sponsorName: data.sponsorName,
          status: data.status,
        });
      } else {
        realChallenges.push({
          id: doc.id,
          trackId: data.trackId,
          title: data.title,
          challengeId: data.challengeId,
        });
      }
    });

    console.log('[DiagnoseTracks] Track-only records:', trackOnlyRecords.length);
    console.log('[DiagnoseTracks] Real challenges:', realChallenges.length);

    // 4. Return diagnosis
    return res.status(200).json({
      success: true,
      diagnosis: {
        tracksCollection: {
          count: tracksSnapshot.size,
          tracks: tracksData,
        },
        extendedChallengesCollection: {
          total: challengesSnapshot.size,
          trackOnlyRecords: {
            count: trackOnlyRecords.length,
            tracks: trackOnlyRecords,
          },
          realChallenges: {
            count: realChallenges.length,
            sample: realChallenges.slice(0, 3),
          },
        },
      },
      recommendations:
        tracksSnapshot.size === 0 && trackOnlyRecords.length > 0
          ? ['需要執行數據遷移', '使用 POST /api/admin/migrate-tracks 進行遷移']
          : tracksSnapshot.size === 0 && trackOnlyRecords.length === 0
          ? ['沒有找到任何 tracks 數據', '請使用「新增賽道」功能創建 tracks']
          : ['數據狀態正常'],
    });
  } catch (error: any) {
    console.error('[DiagnoseTracks] Error:', error);
    return res.status(500).json({
      error: '診斷失敗',
      details: error.message,
    });
  }
}
