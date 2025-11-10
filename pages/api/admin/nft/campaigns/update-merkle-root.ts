import type { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../../lib/admin/init';
import { getFirestore } from 'firebase-admin/firestore';

initializeApi();
const db = getFirestore();

/**
 * Get contract info for updating Merkle Root
 *
 * POST /api/admin/nft/campaigns/update-merkle-root
 *
 * Body:
 * {
 *   campaignId: string;
 * }
 *
 * Returns contract info for client-side MetaMask interaction
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'Missing campaignId' });
    }

    // Get campaign
    const campaignRef = db.collection('nft-campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaignData = campaignDoc.data();

    if (!campaignData?.contractAddress) {
      return res.status(400).json({
        error: 'Contract not deployed yet',
      });
    }

    // Return contract info for client-side interaction
    return res.status(200).json({
      success: true,
      contractAddress: campaignData.contractAddress,
      network: campaignData.network || 'sepolia',
      merkleRoot: campaignData.merkleRoot,
    });
  } catch (error: any) {
    console.error('[update-merkle-root] Error:', error);
    return res.status(500).json({
      error: 'Failed to get contract info',
      details: error.message,
    });
  }
}
