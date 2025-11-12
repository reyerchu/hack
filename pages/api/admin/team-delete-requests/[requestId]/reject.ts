/**
 * API: POST /api/admin/team-delete-requests/[requestId]/reject
 * Reject a team delete request (team will not be deleted)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../../lib/admin/init';
import firebase from 'firebase-admin';

initializeApi();
const db = firebase.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await firebase.auth().verifyIdToken(token);

    if (!decodedToken || !decodedToken.uid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userEmail = decodedToken.email;

    // Check if user is admin
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'reyerchu@defintek.io';
    if (userEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { requestId } = req.query;

    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    // Get the delete request
    const requestDoc = await db.collection('team-delete-requests').doc(requestId).get();

    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Delete request not found' });
    }

    const requestData = requestDoc.data()!;

    if (requestData.status !== 'pending') {
      return res.status(400).json({ error: 'Delete request already processed' });
    }

    // Update request status
    await requestDoc.ref.update({
      status: 'rejected',
      rejectedBy: decodedToken.uid,
      rejectedAt: firebase.firestore.Timestamp.now(),
    });

    // Log activity
    try {
      await db.collection('activity-logs').add({
        userId: decodedToken.uid,
        action: 'team_delete_request_rejected',
        resourceType: 'team_registration',
        resourceId: requestData.teamId,
        teamName: requestData.teamName,
        requestId: requestId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[Admin] Failed to log activity:', logError);
    }

    console.log('[Admin] Team delete request rejected:', {
      requestId,
      teamId: requestData.teamId,
      teamName: requestData.teamName,
    });

    return res.status(200).json({
      success: true,
      message: '刪除請求已拒絕',
    });
  } catch (error: any) {
    console.error('[Admin] Error rejecting delete request:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
