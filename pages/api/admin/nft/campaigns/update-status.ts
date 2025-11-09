import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';

/**
 * Update NFT campaign status after setup
 * POST /api/admin/nft/campaigns/update-status
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();
    const db = firestore();

    const { campaignId, contractAddress, status, whitelistSummary } = req.body;

    if (!campaignId || !contractAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: campaignId, contractAddress' 
      });
    }

    const campaignRef = db.collection('nft-campaigns').doc(campaignId);
    
    await campaignRef.update({
      contractAddress,
      status: status || 'active',
      setupCompletedAt: firestore.Timestamp.now(),
      whitelistSummary: whitelistSummary || {},
      updatedAt: firestore.Timestamp.now(),
    });

    console.log(`[UpdateStatus] Campaign ${campaignId} updated successfully`);

    return res.status(200).json({
      success: true,
      message: 'Campaign status updated',
    });

  } catch (error: any) {
    console.error('[UpdateStatus] Error:', error);
    return res.status(500).json({ 
      error: 'Update failed', 
      details: error.message,
    });
  }
}

