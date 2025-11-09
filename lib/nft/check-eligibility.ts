import { firestore } from 'firebase-admin';
import type { MintStatus } from '../../types/nft';

/**
 * Check if user is eligible to mint NFT
 * This is a shared function that can be called from API routes or SSR
 */
export async function checkNFTEligibility(email: string): Promise<MintStatus> {
  try {
    const db = firestore();
    const normalizedEmail = email.toLowerCase().trim();

    // Find active campaigns
    const campaignsSnapshot = await db
      .collection('nft-campaigns')
      .where('status', '==', 'active')
      .get();

    if (campaignsSnapshot.empty) {
      return {
        eligible: false,
        alreadyMinted: false,
        reason: 'No active campaigns',
      };
    }

    const now = new Date();
    let eligibleCampaign: any = null;

    // Find a campaign that's currently active (within date range) and user is eligible
    for (const doc of campaignsSnapshot.docs) {
      const campaign = doc.data();
      const startDate = campaign.startDate?.toDate();
      const endDate = campaign.endDate?.toDate();

      // Check if campaign has Merkle Tree and user has a proof
      if (!campaign.merkleProofs || !campaign.merkleProofs[normalizedEmail]) {
        continue; // User not eligible for this campaign
      }

      if (startDate && endDate && now >= startDate && now <= endDate) {
        if (campaign.currentSupply < campaign.maxSupply) {
          eligibleCampaign = { id: doc.id, ...campaign };
          break;
        }
      }
    }

    if (!eligibleCampaign) {
      return {
        eligible: false,
        alreadyMinted: false,
        reason: 'No active campaigns within date range or supply exhausted',
      };
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
      return {
        eligible: false,
        alreadyMinted: true,
        reason: 'NFT already minted for this campaign',
        campaign: {
          id: eligibleCampaign.id,
          name: eligibleCampaign.name,
          description: eligibleCampaign.description,
          imageUrl: eligibleCampaign.imageUrl,
        },
        mintRecord: {
          mintedAt: mintRecord.mintedAt?.toDate(),
          transactionHash: mintRecord.transactionHash,
        },
      };
    }

    // User is eligible to mint
    return {
      eligible: true,
      alreadyMinted: false,
      campaign: {
        id: eligibleCampaign.id,
        name: eligibleCampaign.name,
        description: eligibleCampaign.description,
        imageUrl: eligibleCampaign.imageUrl,
        network: eligibleCampaign.network,
        contractAddress: eligibleCampaign.contractAddress,
        maxSupply: eligibleCampaign.maxSupply,
        currentSupply: eligibleCampaign.currentSupply,
        endDate: eligibleCampaign.endDate?.toDate(),
      },
    };
  } catch (error) {
    console.error('[checkNFTEligibility] Error:', error);
    return {
      eligible: false,
      alreadyMinted: false,
      reason: 'Error checking eligibility',
    };
  }
}

