import { firestore } from 'firebase-admin';
import type { MintStatus } from '../../types/nft';

export interface NFTCampaignStatus {
  campaignId: string;
  name: string;
  description: string;
  imageUrl: string;
  network: string;
  contractAddress: string;
  maxSupply: number;
  currentSupply: number;
  startDate?: Date;
  endDate?: Date;
  eligible: boolean;
  alreadyMinted: boolean;
  mintRecord?: {
    mintedAt: Date;
    transactionHash: string;
    tokenId?: number;
  };
  reason?: string;
}

/**
 * Get all NFT campaigns that user is eligible for or has minted
 * Returns a list of all campaigns the user has access to
 */
export async function getAllUserNFTCampaigns(email: string): Promise<NFTCampaignStatus[]> {
  try {
    const db = firestore();
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    // Find all active campaigns where user is in the whitelist
    const campaignsSnapshot = await db
      .collection('nft-campaigns')
      .where('status', '==', 'active')
      .get();

    const campaigns: NFTCampaignStatus[] = [];

    for (const doc of campaignsSnapshot.docs) {
      const campaign = doc.data();
      
      // Check if user is in the whitelist (has a Merkle proof)
      if (!campaign.merkleProofs || !campaign.merkleProofs[normalizedEmail]) {
        continue; // User not eligible for this campaign
      }

      const startDate = campaign.startDate?.toDate();
      const endDate = campaign.endDate?.toDate();

      // Check if user already minted for this campaign
      const mintSnapshot = await db
        .collection('nft-mints')
        .where('campaignId', '==', doc.id)
        .where('userEmail', '==', normalizedEmail)
        .limit(1)
        .get();

      const alreadyMinted = !mintSnapshot.empty;
      let mintRecord = undefined;

      if (alreadyMinted) {
        const mintData = mintSnapshot.docs[0].data();
        mintRecord = {
          mintedAt: mintData.mintedAt?.toDate(),
          transactionHash: mintData.transactionHash,
          tokenId: mintData.tokenId,
        };
      }

      // Determine eligibility
      let eligible = false;
      let reason = '';

      if (alreadyMinted) {
        eligible = false;
        reason = 'Already minted';
      } else if (campaign.currentSupply >= campaign.maxSupply) {
        eligible = false;
        reason = 'Supply exhausted';
      } else if (startDate && now < startDate) {
        eligible = false;
        reason = 'Campaign not started';
      } else if (endDate && now > endDate) {
        eligible = false;
        reason = 'Campaign ended';
      } else {
        eligible = true;
      }

      campaigns.push({
        campaignId: doc.id,
        name: campaign.name,
        description: campaign.description,
        imageUrl: campaign.imageUrl,
        network: campaign.network,
        contractAddress: campaign.contractAddress,
        maxSupply: campaign.maxSupply,
        currentSupply: campaign.currentSupply,
        startDate,
        endDate,
        eligible,
        alreadyMinted,
        mintRecord,
        reason,
      });
    }

    return campaigns;
  } catch (error) {
    console.error('[getAllUserNFTCampaigns] Error:', error);
    return [];
  }
}

/**
 * Check if user is eligible to mint NFT
 * This is a shared function that can be called from API routes or SSR
 * Returns the first eligible campaign (for backward compatibility)
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

