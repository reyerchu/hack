import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';

/**
 * Get single NFT campaign details
 * GET /api/admin/nft/campaigns/[campaignId]
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();
    const db = firestore();
    const { campaignId } = req.query;

    if (!campaignId || typeof campaignId !== 'string') {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

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

    if (!userData || !userData.permissions?.includes('super_admin')) {
      return res.status(403).json({ 
        error: 'Forbidden: Admin access required'
      });
    }

    // Get campaign
    const campaignDoc = await db.collection('nft-campaigns').doc(campaignId).get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaignData = campaignDoc.data();
    const campaign = {
      id: campaignDoc.id,
      ...campaignData,
      startDate: campaignData?.startDate?.toDate(),
      endDate: campaignData?.endDate?.toDate(),
      createdAt: campaignData?.createdAt?.toDate(),
      updatedAt: campaignData?.updatedAt?.toDate(),
    };

    res.status(200).json({
      success: true,
      campaign,
    });
  } catch (error: any) {
    console.error('[NFT Campaign Detail] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

