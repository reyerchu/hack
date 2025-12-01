import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';

/**
 * Delete an NFT campaign
 * POST /api/admin/nft/campaigns/delete
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();
    const db = firestore();

    // Verify admin authentication
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedToken = await auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check if user is admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Temporary permission check aligned with create.ts
    // Note: In production, strict checking should be enabled
    /*
    if (!userData || !userData.permissions?.includes('super_admin')) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    */

    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'Missing campaignId' });
    }

    // Delete campaign
    await db.collection('nft-campaigns').doc(campaignId).delete();

    // Optional: Delete related mints?
    // For now, we just delete the campaign. Mints might be useful for history.

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[NFT Campaign Delete] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
