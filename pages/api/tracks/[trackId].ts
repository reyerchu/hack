/**
 * 公開賽道詳情 API（不需要認證）
 *
 * 提供賽道的詳細資訊給所有用戶
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import firebase from 'firebase-admin';

initializeApi();
const db = firebase.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 GET 請求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { trackId } = req.query;

  if (!trackId || typeof trackId !== 'string') {
    return res.status(400).json({ error: 'Track ID is required' });
  }

  try {
    console.log('[API /tracks/[trackId]] Fetching track:', trackId);

    // 嘗試方法 1: 從 tracks 集合查詢（主要集合）
    let trackDoc = await db.collection('tracks').doc(trackId).get();

    console.log('[API /tracks/[trackId]] Method 1 (tracks collection) - exists:', trackDoc.exists);

    let actualDocId = trackId;

    // 嘗試方法 2: 從 extended-sponsors 集合查詢（舊數據）
    if (!trackDoc.exists) {
      console.log('[API /tracks/[trackId]] Not found in tracks, trying extended-sponsors...');
      trackDoc = await db.collection('extended-sponsors').doc(trackId).get();

      console.log(
        '[API /tracks/[trackId]] Method 2 (extended-sponsors) - exists:',
        trackDoc.exists,
      );
    }

    // 嘗試方法 3: 通過 trackId 字段查詢 extended-sponsors
    if (!trackDoc.exists) {
      console.log('[API /tracks/[trackId]] Trying trackId field in extended-sponsors...');
      const querySnapshot = await db
        .collection('extended-sponsors')
        .where('trackId', '==', trackId)
        .where('type', '==', 'track')
        .limit(1)
        .get();

      console.log('[API /tracks/[trackId]] Method 3 result - found:', !querySnapshot.empty);

      if (!querySnapshot.empty) {
        trackDoc = querySnapshot.docs[0];
        actualDocId = trackDoc.id;
        console.log('[API /tracks/[trackId]] Found by trackId field, actual doc ID:', actualDocId);
      }
    }

    if (!trackDoc.exists) {
      console.log('[API /tracks/[trackId]] Track not found after all attempts:', trackId);
      return res.status(404).json({ error: 'Track not found' });
    }

    const trackData = trackDoc.data();

    if (!trackData) {
      console.log('[API /tracks/[trackId]] Track data is empty:', trackId);
      return res.status(404).json({ error: 'Track data not found' });
    }

    // 檢查是否為賽道（僅對 extended-sponsors 集合的文檔檢查）
    if (trackData.type && trackData.type !== 'track') {
      console.log(
        '[API /tracks/[trackId]] Not a track:',
        trackId,
        'type:',
        trackData.type,
        'name:',
        trackData.name || trackData.title,
      );
      return res.status(404).json({ error: 'Not a track', actualType: trackData.type });
    }

    console.log(
      '[API /tracks/[trackId]] Found track - name:',
      trackData.name,
      'trackId field:',
      trackData.trackId,
    );

    // 獲取關聯的挑戰（使用實際的文檔 ID 或 trackId 字段）
    const usedTrackId = trackData.trackId || actualDocId;
    console.log('[API /tracks/[trackId]] Querying challenges with trackId:', usedTrackId);

    // 從 extended-challenges 集合獲取挑戰
    const challengesSnapshot = await db
      .collection('extended-challenges')
      .where('trackId', '==', usedTrackId)
      .get();

    const challenges = challengesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log('[API /tracks/[trackId]] Found challenges:', challenges.length);

    // 計算總獎金
    let totalPrize = 0;
    challenges.forEach((challenge: any) => {
      if (challenge.prizes) {
        if (Array.isArray(challenge.prizes)) {
          challenge.prizes.forEach((prize: any) => {
            if (typeof prize === 'object' && prize.amount) {
              // 將 TWD 轉換為 USD（假設匯率 1 USD = 30 TWD）
              const amountInUSD = prize.currency === 'TWD' ? prize.amount / 30 : prize.amount;
              totalPrize += amountInUSD;
            }
          });
        }
      }
    });

    // 構建回應資料
    const trackInfo = {
      id: actualDocId, // 使用實際的文檔 ID
      trackId: usedTrackId, // 也返回 trackId 字段以便前端使用
      name: trackData.name,
      description: trackData.description,
      sponsorName: trackData.sponsorName,
      sponsorId: trackData.sponsorId,
      totalPrize: Math.round(totalPrize),
      challenges: challenges.map((challenge: any) => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        prizes: challenge.prizes,
        submissionRequirements: challenge.submissionRequirements,
        evaluationCriteria: challenge.evaluationCriteria,
      })),
      createdAt: trackData.createdAt,
    };

    console.log('[API /tracks/[trackId]] Returning track info:', {
      docId: trackInfo.id,
      trackId: trackInfo.trackId,
      name: trackInfo.name,
      challengeCount: trackInfo.challenges.length,
      totalPrize: trackInfo.totalPrize,
    });

    return res.status(200).json({ data: trackInfo });
  } catch (error: any) {
    console.error('[API /tracks/[trackId]] Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
