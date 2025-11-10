import type { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../../lib/admin/init';
import { getFirestore } from 'firebase-admin/firestore';

initializeApi();
const db = getFirestore();

/**
 * Update NFT campaign maximum supply
 *
 * POST /api/admin/nft/campaigns/update-max-supply
 *
 * Body:
 * {
 *   campaignId: string;
 *   maxSupply: number;
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { campaignId, maxSupply } = req.body;

    if (!campaignId || typeof maxSupply !== 'number' || maxSupply <= 0) {
      return res.status(400).json({ error: 'Invalid fields' });
    }

    // Get campaign
    const campaignRef = db.collection('nft-campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaignData = campaignDoc.data();
    const currentSupply = campaignData?.currentSupply || 0;

    // Validate that new maxSupply is not less than current supply
    if (maxSupply < currentSupply) {
      return res.status(400).json({
        error: 'New max supply cannot be less than current supply',
        currentSupply,
        requestedMaxSupply: maxSupply,
      });
    }

    // Update campaign
    await campaignRef.update({
      maxSupply,
      updatedAt: new Date(),
    });

    console.log('[update-max-supply] Updated:', campaignId);
    console.log('[update-max-supply] Old maxSupply:', campaignData.maxSupply);
    console.log('[update-max-supply] New maxSupply:', maxSupply);

    return res.status(200).json({
      success: true,
      oldMaxSupply: campaignData.maxSupply,
      newMaxSupply: maxSupply,
      currentSupply,
    });
  } catch (error: any) {
    console.error('[update-max-supply] Error:', error);
    return res.status(500).json({
      error: 'Failed to update max supply',
      details: error.message,
    });
  }
}
