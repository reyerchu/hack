import type { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import type { MintStatus } from '../../../types/nft';
import { checkNFTEligibility } from '../../../lib/nft/check-eligibility';

/**
 * Check if user is eligible to mint NFT
 * GET /api/nft/check-eligibility?email=user@example.com
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<MintStatus>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      eligible: false,
      alreadyMinted: false,
      reason: 'Method not allowed',
    } as MintStatus);
  }

  try {
    initializeApi();
    const { email, campaignId } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        eligible: false,
        alreadyMinted: false,
        reason: 'Email parameter required',
      } as MintStatus);
    }

    // If campaignId is provided, check eligibility for that specific campaign
    const result = await checkNFTEligibility(
      email, 
      typeof campaignId === 'string' ? campaignId : undefined
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[NFT Check Eligibility] Error:', error);
    return res.status(500).json({
      eligible: false,
      alreadyMinted: false,
      reason: error.message || 'Internal server error',
    } as MintStatus);
  }
}
