/**
 * API endpoint to delete a challenge/track
 * DELETE /api/sponsor/tracks/[trackId]/delete
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';
import {
  requireAuth,
  ApiResponse,
  AuthenticatedRequest,
} from '../../../../../lib/sponsor/middleware';
import { SPONSOR_COLLECTIONS } from '../../../../../lib/sponsor/collections';

initializeApi();
const db = firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { trackId } = req.query;

    if (!trackId || typeof trackId !== 'string') {
      return res.status(400).json({ error: 'Invalid track ID' });
    }

    // Verify authentication
    if (!(await requireAuth(req, res))) {
      return;
    }

    const authReq = req as AuthenticatedRequest;
    const userId = authReq.uid;

    console.log('[Delete Track] Request from user:', userId, 'for track:', trackId);

    // Get user permissions
    const userDoc = await db.collection('registrations').doc(userId).get();
    let userPermissions: string[] = [];

    if (userDoc.exists) {
      const userData = userDoc.data();
      userPermissions = userData?.permissions || userData?.user?.permissions || [];
    }

    console.log('[Delete Track] User permissions:', userPermissions);

    // Check if user is super_admin or admin (can delete any track)
    const isAdmin = userPermissions[0] === 'super_admin' || userPermissions[0] === 'admin';

    // If not admin, check if user has permission for this specific track
    let hasPermission = isAdmin;

    if (!hasPermission) {
      // Check if this track is assigned to the user as a sponsor
      const trackQuery = await db
        .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
        .where('trackId', '==', trackId)
        .get();

      if (!trackQuery.empty) {
        const trackData = trackQuery.docs[0].data();
        const assignedSponsors = trackData.assignedSponsors || [];
        
        // Check if user is in assignedSponsors
        hasPermission = assignedSponsors.some((sponsor: any) => 
          sponsor.userId === userId || sponsor.id === userId
        );

        console.log('[Delete Track] Assigned sponsors:', assignedSponsors);
        console.log('[Delete Track] User has permission:', hasPermission);
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ error: '您沒有權限刪除此 Challenge' });
    }

    // Delete the challenge from extended-challenges
    const challengeQuery = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .where('trackId', '==', trackId)
      .get();

    if (challengeQuery.empty) {
      return res.status(404).json({ error: 'Challenge 不存在' });
    }

    const challengeDoc = challengeQuery.docs[0];
    const challengeData = challengeDoc.data();
    await challengeDoc.ref.delete();

    console.log('[Delete Track] Successfully deleted challenge:', trackId);

    // Log the deletion activity
    try {
      await db.collection('sponsor-activity-logs').add({
        userId,
        action: 'delete_challenge',
        trackId,
        challengeName: challengeData.name || trackId,
        deletedBy: userId,
        isAdmin,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[Delete Track] Failed to log activity:', logError);
      // Don't fail the delete operation if logging fails
    }

    res.status(200).json({
      success: true,
      message: 'Challenge 已成功刪除',
    });
  } catch (error: any) {
    console.error('[Delete Track] Error:', error);
    console.error('[Delete Track] Error stack:', error.stack);
    res.status(500).json({
      error: '刪除 Challenge 時發生錯誤',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

