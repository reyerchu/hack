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
    const userId = authReq.userId!;

    console.log('[Delete Challenge] Request from user:', userId, 'for challenge ID:', trackId);

    // Get the challenge document directly by ID
    const challengeDoc = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .doc(trackId)
      .get();

    if (!challengeDoc.exists) {
      console.log('[Delete Challenge] Challenge not found:', trackId);
      return res.status(404).json({ error: 'Challenge 不存在' });
    }

    const challengeData = challengeDoc.data()!;
    console.log('[Delete Challenge] Challenge data:', {
      id: challengeDoc.id,
      title: challengeData.title,
      trackId: challengeData.trackId,
    });

    // Get user permissions
    const userDoc = await db.collection('registrations').doc(userId).get();
    let userPermissions: string[] = [];

    if (userDoc.exists) {
      const userData = userDoc.data();
      userPermissions = userData?.permissions || userData?.user?.permissions || [];
    }

    console.log('[Delete Challenge] User permissions:', userPermissions);

    // Check if user is super_admin or admin (can delete any challenge)
    const isAdmin = userPermissions[0] === 'super_admin' || userPermissions[0] === 'admin';

    // If not admin, check if user has permission for this challenge's sponsor
    let hasPermission = isAdmin;

    if (!hasPermission) {
      const sponsorId = challengeData.sponsorId;
      
      if (sponsorId) {
        // Check sponsor-user-mappings
        const mappingSnapshot = await db
          .collection('sponsor-user-mappings')
          .where('userId', '==', userId)
          .where('sponsorId', '==', sponsorId)
          .get();

        if (!mappingSnapshot.empty) {
          const mapping = mappingSnapshot.docs[0].data();
          hasPermission = mapping.role === 'admin' || mapping.role === 'manager';
          console.log('[Delete Challenge] User mapping found, role:', mapping.role);
        }
      }
    }

    if (!hasPermission) {
      console.log('[Delete Challenge] Permission denied for user:', userId);
      return res.status(403).json({ error: '您沒有權限刪除此 Challenge' });
    }

    // Delete the challenge
    await challengeDoc.ref.delete();

    console.log('[Delete Challenge] Successfully deleted challenge:', trackId);

    // Log the deletion activity
    try {
      await db.collection('sponsor-activity-logs').add({
        userId,
        action: 'delete_challenge',
        challengeId: trackId,
        trackId: challengeData.trackId,
        challengeName: challengeData.title || challengeData.name || trackId,
        deletedBy: userId,
        isAdmin,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[Delete Challenge] Failed to log activity:', logError);
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
