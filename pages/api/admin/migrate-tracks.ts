/**
 * API: /api/admin/migrate-tracks
 *
 * 迁移 track-only 记录从 /extended-challenges 到 /tracks
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import firebase from 'firebase-admin';
import { SPONSOR_COLLECTIONS } from '../../../lib/sponsor/collections';

initializeApi();
const db = firebase.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    console.log('[MigrateTracks] User ID:', userId);

    // 2. Get user data and check permissions
    const userDoc = await db.collection('registrations').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(403).json({ error: '用戶不存在' });
    }

    const userData = userDoc.data();
    const permissions = userData?.permissions || userData?.user?.permissions || [];
    const isAdmin = permissions[0] === 'super_admin' || permissions[0] === 'admin';

    console.log('[MigrateTracks] User permissions:', permissions);
    console.log('[MigrateTracks] Is admin:', isAdmin);

    if (!isAdmin) {
      return res.status(403).json({ error: '您沒有權限執行數據遷移' });
    }

    // 3. 检查 /tracks 集合
    console.log('[MigrateTracks] 检查 /tracks 集合...');
    const tracksSnapshot = await db.collection(SPONSOR_COLLECTIONS.TRACKS).get();
    console.log('[MigrateTracks] 现有 tracks:', tracksSnapshot.size);

    // 4. 检查 /extended-challenges 中的 track-only 记录
    console.log('[MigrateTracks] 检查 /extended-challenges...');
    const challengesSnapshot = await db.collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES).get();
    console.log('[MigrateTracks] 总记录数:', challengesSnapshot.size);

    const trackOnlyRecords = [];
    const realChallenges = [];

    challengesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const hasTitle = data.title && data.title.trim() !== '';
      const hasChallengeId = data.challengeId && data.challengeId.trim() !== '';

      if (!hasTitle && !hasChallengeId) {
        // Track-only record
        trackOnlyRecords.push({ id: doc.id, ...data });
      } else {
        // Real challenge
        realChallenges.push({ id: doc.id, ...data });
      }
    });

    console.log('[MigrateTracks] Track-only 记录:', trackOnlyRecords.length);
    console.log('[MigrateTracks] 真正的 Challenges:', realChallenges.length);

    // 5. 迁移 track-only 记录
    let migratedCount = 0;
    let skippedCount = 0;
    const migratedTracks = [];

    for (const record of trackOnlyRecords) {
      // 检查是否已存在
      const existingTrack = await db
        .collection(SPONSOR_COLLECTIONS.TRACKS)
        .where('trackId', '==', record.trackId)
        .limit(1)
        .get();

      if (!existingTrack.empty) {
        console.log('[MigrateTracks] 跳过', record.trackId, '(已存在)');
        skippedCount++;
        continue;
      }

      // 创建新的 track 记录
      const trackData = {
        trackId: record.trackId,
        name: record.track || record.name || record.trackId,
        description: record.description || '',
        sponsorId: record.sponsorId || '',
        sponsorName: record.sponsorName || '',
        status: record.status === 'published' ? 'active' : record.status || 'active',

        // 保留原始元数据
        createdAt: record.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: record.createdBy || 'migration-api',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),

        // 迁移元数据
        migratedFrom: 'extended-challenges',
        migratedAt: firebase.firestore.FieldValue.serverTimestamp(),
        migratedBy: userId,
        originalDocId: record.id,
      };

      const docRef = await db.collection(SPONSOR_COLLECTIONS.TRACKS).add(trackData);
      console.log('[MigrateTracks] 迁移成功:', record.trackId, '新 docId:', docRef.id);
      migratedCount++;

      migratedTracks.push({
        trackId: record.trackId,
        name: trackData.name,
        sponsorName: trackData.sponsorName,
      });
    }

    // 6. 返回结果
    return res.status(200).json({
      success: true,
      summary: {
        existingTracks: tracksSnapshot.size,
        totalExtendedChallenges: challengesSnapshot.size,
        trackOnlyRecords: trackOnlyRecords.length,
        realChallenges: realChallenges.length,
        migratedCount: migratedCount,
        skippedCount: skippedCount,
      },
      migratedTracks: migratedTracks,
      message: `成功迁移 ${migratedCount} 条 tracks，跳过 ${skippedCount} 条已存在的记录`,
    });
  } catch (error: any) {
    console.error('[MigrateTracks] Error:', error);
    return res.status(500).json({
      error: '迁移失敗',
      details: error.message,
    });
  }
}
