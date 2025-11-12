/**
 * API: GET /api/admin/team-delete-requests
 * Get all team delete requests for admin review
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
    const ADMIN_EMAIL = 'reyerchu@defintek.io';
    if (userEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get all pending delete requests
    const requestsSnapshot = await db
      .collection('team-delete-requests')
      .where('status', '==', 'pending')
      .orderBy('requestedAt', 'desc')
      .get();

    const requests = requestsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toDate?.()?.toISOString() || null,
    }));

    console.log('[Admin] Fetched team delete requests:', requests.length);

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error: any) {
    console.error('[Admin] Error fetching delete requests:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
