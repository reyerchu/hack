import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '../../../../../lib/firebase/firebaseAdmin';

/**
 * Create a new NFT campaign
 * POST /api/admin/nft/campaigns/create
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { auth, db } = getFirebaseAdmin();

    // Verify admin authentication
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check if user is admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const {
      name,
      description,
      imageUrl,
      network,
      eligibleEmails,
      startDate,
      endDate,
      maxSupply,
    } = req.body;

    // Validation
    if (!name || !description || !imageUrl || !network || !eligibleEmails || !startDate || !endDate || !maxSupply) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create campaign
    const campaignRef = db.collection('nft-campaigns').doc();
    const campaignData = {
      id: campaignRef.id,
      name,
      description,
      imageUrl,
      network,
      eligibleEmails: eligibleEmails.map((email: string) => email.toLowerCase().trim()),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxSupply: parseInt(maxSupply),
      currentSupply: 0,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
    };

    await campaignRef.set(campaignData);

    res.status(200).json({
      success: true,
      campaign: campaignData,
    });
  } catch (error: any) {
    console.error('[NFT Campaign Create] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

