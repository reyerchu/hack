/**
 * API endpoint to fetch all tracks
 * GET /api/admin/tracks
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../lib/admin/init';
import firebase from 'firebase-admin';
import { SPONSOR_COLLECTIONS } from '../../../../lib/sponsor/collections';

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

    console.log('[GetTracks] User ID:', userId);

    // 2. Get user data and check permissions
    const userDoc = await db.collection('registrations').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(403).json({ error: '用戶不存在' });
    }

    const userData = userDoc.data();
    const permissions = userData?.permissions || userData?.user?.permissions || [];
    const isAdmin = permissions[0] === 'super_admin' || permissions[0] === 'admin';

    console.log('[GetTracks] User permissions:', permissions);
    console.log('[GetTracks] Is admin:', isAdmin);

    if (!isAdmin) {
      return res.status(403).json({ error: '您沒有權限查看所有 tracks' });
    }

    // 3. Fetch all tracks
    console.log('[GetTracks] Fetching from collection:', SPONSOR_COLLECTIONS.TRACKS);
    const tracksSnapshot = await db.collection(SPONSOR_COLLECTIONS.TRACKS).get();

    console.log('[GetTracks] Snapshot size:', tracksSnapshot.size);
    console.log('[GetTracks] Snapshot empty:', tracksSnapshot.empty);

    const tracks = tracksSnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log(
        '[GetTracks] Processing doc:',
        doc.id,
        'trackId:',
        data.trackId,
        'name:',
        data.name,
      );
      return {
        id: doc.id,
        ...data,
      };
    });

    console.log('[GetTracks] Final tracks count:', tracks.length);
    console.log('[GetTracks] Sample track:', tracks[0]);

    return res.status(200).json({
      success: true,
      data: {
        tracks: tracks,
        count: tracks.length,
      },
    });
  } catch (error: any) {
    console.error('[GetTracks] Error:', error);
    return res.status(500).json({
      error: '服務器錯誤',
      details: error.message,
    });
  }
}
