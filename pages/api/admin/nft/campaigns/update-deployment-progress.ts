import type { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../../lib/admin/init';
import { getFirestore } from 'firebase-admin/firestore';

initializeApi();
const db = getFirestore();

/**
 * Update NFT campaign deployment progress
 *
 * POST /api/admin/nft/campaigns/update-deployment-progress
 *
 * Body:
 * {
 *   campaignId: string;
 *   progress: {
 *     currentStep: 'ipfs' | 'deploying' | 'complete';
 *     lastUpdated?: Date;
 *     ipfs?: {
 *       imageCID: string;
 *       metadataCID: string;
 *       baseURI: string;
 *       completedAt: Date;
 *     };
 *     deployment?: {
 *       contractAddress: string;
 *       transactionHash: string;
 *       network: string;
 *       completedAt: Date;
 *     };
 *     setup?: {
 *       merkleRoot: string;
 *       whitelistCount: number;
 *       mintingEnabled: boolean;
 *       completedAt: Date;
 *     };
 *   };
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { campaignId, progress } = req.body;

    if (!campaignId || !progress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update campaign deployment progress
    const campaignRef = db.collection('nft-campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Merge with existing progress
    const existingData = campaignDoc.data();
    const existingProgress = existingData?.deploymentProgress || {};

    const updatedProgress = {
      ...existingProgress,
      ...progress,
      lastUpdated: new Date(),
    };

    await campaignRef.update({
      deploymentProgress: updatedProgress,
      updatedAt: new Date(),
    });

    console.log('[update-deployment-progress] Updated:', campaignId, progress.currentStep);

    return res.status(200).json({
      success: true,
      progress: updatedProgress,
    });
  } catch (error: any) {
    console.error('[update-deployment-progress] Error:', error);
    return res.status(500).json({
      error: 'Failed to update deployment progress',
      details: error.message,
    });
  }
}
