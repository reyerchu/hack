/**
 * API endpoint to create a new track
 * POST /api/sponsor/tracks/create
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../lib/admin/init';
import firebase from 'firebase-admin';
import { SPONSOR_COLLECTIONS } from '../../../../lib/sponsor/collections';

initializeApi();
const db = firebase.firestore();

interface CreateTrackRequest {
  name: string;
  description?: string;
  sponsorId: string;
  sponsorName: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授權' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await firebase.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    console.log('[CreateTrack] User ID:', userId);

    // 2. Get user data and check permissions
    const userDoc = await db.collection('registrations').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(403).json({ error: '用戶不存在' });
    }

    const userData = userDoc.data();
    const permissions = userData?.permissions || userData?.user?.permissions || [];
    
    console.log('[CreateTrack] User permissions:', permissions);

    // Check if user is super_admin or admin
    const isSuperAdmin = permissions[0] === 'super_admin' || permissions.includes('super_admin');
    const isAdmin = permissions[0] === 'admin' || permissions.includes('admin');

    if (!isSuperAdmin && !isAdmin) {
      return res.status(403).json({ error: '權限不足：僅管理員可創建賽道' });
    }

    // 3. Validate request body
    const { name, description, sponsorId, sponsorName } = req.body as CreateTrackRequest;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '賽道名稱為必填項' });
    }

    if (!sponsorId || !sponsorId.trim()) {
      return res.status(400).json({ error: '贊助商 ID 為必填項' });
    }

    if (!sponsorName || !sponsorName.trim()) {
      return res.status(400).json({ error: '贊助商名稱為必填項' });
    }

    // 4. Generate trackId
    const trackId = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
      + '-' + Date.now().toString().slice(-6);

    console.log('[CreateTrack] Generated trackId:', trackId);

    // 5. Create the track (without challenges) in tracks collection
    const trackData = {
      trackId: trackId,
      name: name.trim(),
      description: description?.trim() || '',
      sponsorId: sponsorId.trim(),
      sponsorName: sponsorName.trim(),
      status: 'active',
      
      // Metadata
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(SPONSOR_COLLECTIONS.TRACKS).add(trackData);

    console.log('[CreateTrack] Track created with ID:', docRef.id);

    // 6. Log activity
    try {
      await db.collection('sponsor-activity-logs').add({
        userId: userId,
        action: 'create_track',
        resourceType: 'track',
        resourceId: docRef.id,
        trackId: trackId,
        trackName: name.trim(),
        sponsorName: sponsorName.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[CreateTrack] Failed to log activity:', logError);
      // Don't fail the creation if logging fails
    }

    // 7. Return success
    return res.status(200).json({
      success: true,
      track: {
        id: docRef.id,
        trackId: trackId,
        name: name.trim(),
        description: description?.trim() || '',
        sponsorId: sponsorId.trim(),
        sponsorName: sponsorName.trim(),
      },
      message: '賽道創建成功。您可以在賽道頁面中添加挑戰。',
    });

  } catch (error: any) {
    console.error('[CreateTrack] Error:', error);
    return res.status(500).json({
      error: '服務器錯誤',
      details: error.message,
    });
  }
}

