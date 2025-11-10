import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from 'firebase-admin';
import initializeApi from '../../../../../../lib/admin/init';

/**
 * Get mint records for a campaign
 * GET /api/admin/nft/campaigns/[campaignId]/mints
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
        error: 'Forbidden: Admin access required',
      });
    }

    // Get mint records
    const mintsSnapshot = await db
      .collection('nft-mints')
      .where('campaignId', '==', campaignId)
      .orderBy('mintedAt', 'desc')
      .get();

    const mints = mintsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        mintedAt: data.mintedAt?.toDate(),
      };
    });

    res.status(200).json({
      success: true,
      mints,
    });
  } catch (error: any) {
    console.error('[NFT Mints] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
