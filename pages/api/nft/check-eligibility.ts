import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '../../../lib/firebase/firebaseAdmin';
import type { MintStatus } from '../../../types/nft';

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
    const { auth, db } = getFirebaseAdmin();
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        eligible: false,
        alreadyMinted: false,
        reason: 'Email parameter required',
      } as MintStatus);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find active campaigns where user is eligible
    const campaignsSnapshot = await db
      .collection('nft-campaigns')
      .where('status', '==', 'active')
      .where('eligibleEmails', 'array-contains', normalizedEmail)
      .get();

    if (campaignsSnapshot.empty) {
      return res.status(200).json({
        eligible: false,
        alreadyMinted: false,
        reason: 'No active campaigns found for this email',
      });
    }

    const now = new Date();
    let eligibleCampaign: any = null;

    // Find a campaign that's currently active (within date range)
    for (const doc of campaignsSnapshot.docs) {
      const campaign = doc.data();
      const startDate = campaign.startDate?.toDate();
      const endDate = campaign.endDate?.toDate();

      if (startDate && endDate && now >= startDate && now <= endDate) {
        if (campaign.currentSupply < campaign.maxSupply) {
          eligibleCampaign = { id: doc.id, ...campaign };
          break;
        }
      }
    }

    if (!eligibleCampaign) {
      return res.status(200).json({
        eligible: false,
        alreadyMinted: false,
        reason: 'No active campaigns within date range or supply exhausted',
      });
    }

    // Check if user already minted for this campaign
    const mintSnapshot = await db
      .collection('nft-mints')
      .where('campaignId', '==', eligibleCampaign.id)
      .where('userEmail', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!mintSnapshot.empty) {
      const mintRecord = mintSnapshot.docs[0].data();
      return res.status(200).json({
        eligible: false,
        alreadyMinted: true,
        campaignId: eligibleCampaign.id,
        campaignName: eligibleCampaign.name,
        campaignImage: eligibleCampaign.imageUrl,
        mintRecord: {
          ...mintRecord,
          mintedAt: mintRecord.mintedAt?.toDate(),
        } as any,
        reason: 'Already minted for this campaign',
      });
    }

    // User is eligible to mint
    return res.status(200).json({
      eligible: true,
      alreadyMinted: false,
      campaignId: eligibleCampaign.id,
      campaignName: eligibleCampaign.name,
      campaignImage: eligibleCampaign.imageUrl,
      endDate: eligibleCampaign.endDate?.toDate(),
    });
  } catch (error: any) {
    console.error('[NFT Check Eligibility] Error:', error);
    res.status(500).json({
      eligible: false,
      alreadyMinted: false,
      reason: error.message || 'Internal server error',
    } as MintStatus);
  }
}

