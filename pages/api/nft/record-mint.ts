import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';

/**
 * Record a successful NFT mint
 * POST /api/nft/record-mint
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();
    const db = firestore();

    const { campaignId, userEmail, userId, walletAddress, tokenId, transactionHash } = req.body;

    // Validation
    if (!campaignId || !userEmail || !walletAddress || !tokenId || !transactionHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get campaign details
    const campaignDoc = await db.collection('nft-campaigns').doc(campaignId).get();
    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaignDoc.data();

    // Check if already minted
    const existingMint = await db
      .collection('nft-mints')
      .where('campaignId', '==', campaignId)
      .where('userEmail', '==', userEmail.toLowerCase().trim())
      .limit(1)
      .get();

    if (!existingMint.empty) {
      return res.status(400).json({ error: 'Already minted for this campaign' });
    }

    // Record the mint
    const mintRef = db.collection('nft-mints').doc();
    const mintData = {
      id: mintRef.id,
      campaignId,
      userEmail: userEmail.toLowerCase().trim(),
      userId: userId || '',
      walletAddress,
      tokenId,
      transactionHash,
      mintedAt: new Date(),
      imageUrl: campaign?.imageUrl || '',
      metadata: {
        name: campaign?.name || '',
        description: campaign?.description || '',
        image: campaign?.imageUrl || '',
      },
    };

    await mintRef.set(mintData);

    // Update campaign current supply
    await db
      .collection('nft-campaigns')
      .doc(campaignId)
      .update({
        currentSupply: (campaign?.currentSupply || 0) + 1,
        updatedAt: new Date(),
      });

    res.status(200).json({
      success: true,
      mint: mintData,
    });
  } catch (error: any) {
    console.error('[NFT Record Mint] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
