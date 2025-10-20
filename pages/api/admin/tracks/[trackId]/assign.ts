/**
 * API endpoint to assign a track to a sponsor
 * PUT /api/admin/tracks/[trackId]/assign
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../../lib/admin/init';
import firebase from 'firebase-admin';
import { SPONSOR_COLLECTIONS } from '../../../../../lib/sponsor/collections';

initializeApi();
const db = firebase.firestore();

interface AssignRequest {
  sponsorId: string;
  sponsorName: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { trackId } = req.query;

  if (!trackId || typeof trackId !== 'string') {
    return res.status(400).json({ error: 'Invalid trackId' });
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

    console.log('[AssignTrack] User ID:', userId);
    console.log('[AssignTrack] Track ID:', trackId);

    // 2. Get user data and check permissions
    const userDoc = await db.collection('registrations').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(403).json({ error: '用戶不存在' });
    }

    const userData = userDoc.data();
    const permissions = userData?.permissions || userData?.user?.permissions || [];
    const isAdmin = permissions[0] === 'super_admin' || permissions[0] === 'admin';

    console.log('[AssignTrack] User permissions:', permissions);
    console.log('[AssignTrack] Is admin:', isAdmin);

    if (!isAdmin) {
      return res.status(403).json({ error: '您沒有權限分配 tracks' });
    }

    // 3. Parse request body
    const { sponsorId, sponsorName } = req.body as AssignRequest;

    if (!sponsorId || !sponsorName) {
      return res.status(400).json({ error: 'sponsorId 和 sponsorName 為必填項' });
    }

    console.log('[AssignTrack] New sponsor ID:', sponsorId);
    console.log('[AssignTrack] New sponsor name:', sponsorName);

    // 4. Check if track exists
    const tracksSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.TRACKS)
      .where('trackId', '==', trackId)
      .get();

    if (tracksSnapshot.empty) {
      return res.status(404).json({ error: 'Track 不存在' });
    }

    const trackDoc = tracksSnapshot.docs[0];

    // 5. Check if sponsor exists
    const sponsorDoc = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_SPONSORS)
      .doc(sponsorId)
      .get();

    if (!sponsorDoc.exists) {
      return res.status(404).json({ error: 'Sponsor 不存在' });
    }

    // 6. Update track
    await trackDoc.ref.update({
      sponsorId: sponsorId,
      sponsorName: sponsorName,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId,
      assignedAt: firebase.firestore.FieldValue.serverTimestamp(),
      assignedBy: userId,
    });

    console.log('[AssignTrack] Track updated successfully');

    // 7. Also update all challenges under this track
    const challengesSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .where('trackId', '==', trackId)
      .get();

    console.log('[AssignTrack] Updating', challengesSnapshot.size, 'challenges');

    const batch = db.batch();
    challengesSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        sponsorId: sponsorId,
        sponsorName: sponsorName,
        organization: sponsorName,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        assignedAt: firebase.firestore.FieldValue.serverTimestamp(),
        assignedBy: userId,
      });
    });
    await batch.commit();

    console.log('[AssignTrack] Challenges updated successfully');

    // 8. Log activity
    try {
      await db.collection('sponsor-activity-logs').add({
        userId: userId,
        action: 'assign_track',
        targetType: 'track',
        targetId: trackId,
        details: {
          trackId: trackId,
          sponsorId: sponsorId,
          sponsorName: sponsorName,
          challengesUpdated: challengesSnapshot.size,
        },
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[AssignTrack] Failed to log activity:', logError);
      // Don't fail the assignment if logging fails
    }

    // 9. Return success
    return res.status(200).json({
      success: true,
      message: `Track 已成功分配給 ${sponsorName}`,
      data: {
        trackId: trackId,
        sponsorId: sponsorId,
        sponsorName: sponsorName,
        challengesUpdated: challengesSnapshot.size,
      },
    });

  } catch (error: any) {
    console.error('[AssignTrack] Error:', error);
    return res.status(500).json({
      error: '服務器錯誤',
      details: error.message,
    });
  }
}

