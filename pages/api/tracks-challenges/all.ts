/**
 * API: /api/tracks-challenges/all
 * 
 * GET - 獲取所有賽道和挑戰（公開，無需認證）
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import firebase from 'firebase-admin';

initializeApi();
const db = firebase.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[GET /api/tracks-challenges/all] 開始獲取所有賽道和挑戰...');

    // 1. 獲取所有活躍的賽道
    const tracksSnapshot = await db
      .collection('tracks')
      .where('status', '==', 'active')
      .get();

    console.log('[GET /api/tracks-challenges/all] Tracks 數量:', tracksSnapshot.size);

    // 2. 獲取所有已發布的挑戰
    const challengesSnapshot = await db
      .collection('extended-challenges')
      .where('status', '==', 'published')
      .get();

    console.log('[GET /api/tracks-challenges/all] Challenges 數量:', challengesSnapshot.size);

    // 3. 獲取所有贊助商資訊
    const sponsorsSnapshot = await db
      .collection('extended-sponsors')
      .get();

    const sponsorsMap = new Map();
    sponsorsSnapshot.docs.forEach(doc => {
      const sponsorData = { id: doc.id, ...doc.data() };
      sponsorsMap.set(doc.id, sponsorData);
      console.log('[Sponsor]', doc.id, '- name:', sponsorData.name, '- logoUrl:', sponsorData.logoUrl, '- brandLogo:', sponsorData.brandLogo);
    });

    // 4. 組織數據
    const tracksData = [];
    const trackIds = new Set<string>();

    // 將 challenges 按 trackId 分組
    const challengesByTrack = new Map<string, any[]>();
    challengesSnapshot.docs.forEach(doc => {
      const challenge = { id: doc.id, ...doc.data() };
      const trackId = challenge.trackId;
      
      if (!challengesByTrack.has(trackId)) {
        challengesByTrack.set(trackId, []);
      }
      challengesByTrack.get(trackId)!.push(challenge);
      trackIds.add(trackId);
    });

    // 處理每個 track
    for (const doc of tracksSnapshot.docs) {
      const trackData = doc.data();
      const trackId = trackData.trackId || doc.id;
      
      // 獲取該 track 的 challenges
      const trackChallenges = challengesByTrack.get(trackId) || [];
      
      // 獲取 sponsor 資訊
      const sponsor = trackData.sponsorId ? sponsorsMap.get(trackData.sponsorId) : null;
      console.log('[Track]', trackId, '- sponsorId:', trackData.sponsorId, '- sponsor found:', !!sponsor, '- sponsor logo:', sponsor?.logoUrl || sponsor?.brandLogo || 'N/A');

      // 計算總獎金
      let totalPrize = 0;
      trackChallenges.forEach(challenge => {
        if (challenge.prizes && Array.isArray(challenge.prizes)) {
          challenge.prizes.forEach((prize: any) => {
            if (typeof prize === 'object' && prize.amount) {
              // 將 TWD 轉換為 USD 等值（1 USD = 30 TWD）
              const amount = prize.currency === 'TWD' ? prize.amount / 30 : prize.amount;
              totalPrize += amount;
            }
          });
        }
      });

      tracksData.push({
        id: trackId,
        name: trackData.name || '',
        description: trackData.description || '',
        sponsorName: sponsor?.name || '',
        sponsorLogo: sponsor?.logoUrl || sponsor?.brandLogo || sponsor?.logo || '',
        sponsorId: trackData.sponsorId || '',
        totalPrize: Math.round(totalPrize),
        challengeCount: trackChallenges.length,
        challenges: trackChallenges.map(c => ({
          id: c.id,
          trackId: c.trackId,
          title: c.title || c.track || '',
          description: c.description || '',
          submissionRequirements: c.submissionRequirements || c.requirements || '',
          evaluationCriteria: c.evaluationCriteria || [],
          prizes: c.prizes || [],
          resources: c.resources || [],
          attachments: c.attachments || [],
        })),
      });
    }

    // 按總獎金排序（高到低）
    tracksData.sort((a, b) => b.totalPrize - a.totalPrize);

    console.log('[GET /api/tracks-challenges/all] ✅ 返回', tracksData.length, '個賽道');

    return res.status(200).json({
      success: true,
      data: tracksData,
    });

  } catch (error: any) {
    console.error('[GET /api/tracks-challenges/all] ❌ Error:', error);
    return res.status(500).json({
      error: '獲取賽道挑戰失敗',
      details: error.message,
    });
  }
}

