import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';

/**
 * List all NFT campaigns
 * GET /api/admin/nft/campaigns/list
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Get all campaigns
    const campaignsSnapshot = await db
      .collection('nft-campaigns')
      .orderBy('createdAt', 'desc')
      .get();

    const campaigns = campaignsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });

    res.status(200).json({
      success: true,
      campaigns,
    });
  } catch (error: any) {
    console.error('[NFT Campaigns List] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

