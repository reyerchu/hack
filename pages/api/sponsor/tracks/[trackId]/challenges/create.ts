/**
 * API endpoint to create a new challenge for a track
 * POST /api/sponsor/tracks/[trackId]/challenges/create
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../../../lib/admin/init';
import firebase from 'firebase-admin';
import { SPONSOR_COLLECTIONS } from '../../../../../../lib/sponsor/collections';

initializeApi();
const db = firebase.firestore();

interface CreateChallengeRequest {
  title: string;
  description?: string;
  prizes?: string;
  submissionRequirements?: string;
}

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
    const { trackId } = req.query;

    console.log('[CreateChallenge] User ID:', userId);
    console.log('[CreateChallenge] Track ID:', trackId);

    // 2. Get user data and check permissions
    const userDoc = await db.collection('registrations').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(403).json({ error: '用戶不存在' });
    }

    const userData = userDoc.data();
    const permissions = userData?.permissions || userData?.user?.permissions || [];
    const isAdmin = permissions[0] === 'super_admin' || permissions[0] === 'admin';

    console.log('[CreateChallenge] User permissions:', permissions);
    console.log('[CreateChallenge] Is admin:', isAdmin);

    if (!isAdmin) {
      return res.status(403).json({ error: '您沒有權限創建挑戰' });
    }

    // 3. Get track data
    const tracksSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.TRACKS)
      .where('trackId', '==', trackId)
      .get();

    if (tracksSnapshot.empty) {
      return res.status(404).json({ error: '賽道不存在' });
    }

    const trackData = tracksSnapshot.docs[0].data();

    // 4. Parse request body
    const { title, description, prizes, submissionRequirements } =
      req.body as CreateChallengeRequest;

    // 5. Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: '挑戰標題為必填項' });
    }

    // 6. Generate challenge ID
    const challengeId =
      title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '') +
      '-' +
      Date.now().toString().slice(-6);

    console.log('[CreateChallenge] Generated challengeId:', challengeId);

    // 7. Parse prizes into array
    const prizesArray = prizes
      ? prizes
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p)
      : [];

    // 8. Create the challenge in extended-challenges collection
    const challengeData = {
      trackId: trackId as string,
      challengeId: challengeId,
      track: trackData.name,
      title: title.trim(),
      description: description?.trim() || '',
      prizes: prizesArray,
      submissionRequirements: submissionRequirements?.trim() || '',
      sponsorId: trackData.sponsorId,
      sponsorName: trackData.sponsorName,
      status: 'published',
      organization: trackData.sponsorName,

      // Required fields
      timeline: '',
      rank: 0,

      // Metadata
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES).add(challengeData);

    console.log('[CreateChallenge] Challenge created with ID:', docRef.id);

    // 9. Log activity
    try {
      await db.collection('sponsor-activity-logs').add({
        userId: userId,
        action: 'create_challenge',
        targetType: 'challenge',
        targetId: docRef.id,
        details: {
          challengeId: challengeId,
          title: title.trim(),
          trackId: trackId,
        },
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[CreateChallenge] Failed to log activity:', logError);
      // Don't fail the creation if logging fails
    }

    // 10. Return success
    return res.status(200).json({
      success: true,
      challenge: {
        id: docRef.id,
        challengeId: challengeId,
        title: title.trim(),
        description: description?.trim() || '',
        trackId: trackId,
      },
      message: '挑戰創建成功',
    });
  } catch (error: any) {
    console.error('[CreateChallenge] Error:', error);
    return res.status(500).json({
      error: '服務器錯誤',
      details: error.message,
    });
  }
}
