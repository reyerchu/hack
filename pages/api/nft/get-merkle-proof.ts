import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';

/**
 * Get Merkle Proof for an email
 * GET /api/nft/get-merkle-proof?email=xxx&campaignId=xxx
 * 
 * Returns: {
 *   proof: string[],
 *   emailHash: string,
 *   eligible: boolean
 * }
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();
    const db = firestore();

    const { email, campaignId } = req.query;

    if (!email || !campaignId || typeof email !== 'string' || typeof campaignId !== 'string') {
      return res.status(400).json({ 
        error: 'Missing required parameters: email, campaignId' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    console.log(`[GetMerkleProof] Email: ${normalizedEmail}, Campaign: ${campaignId}`);

    // Get campaign from Firestore
    const campaignDoc = await db.collection('nft-campaigns').doc(campaignId).get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaignDoc.data();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign data not found' });
    }

    // Check if Merkle Tree has been generated
    if (!campaign.merkleProofs || !campaign.merkleRoot) {
      return res.status(400).json({ 
        error: 'Merkle Tree not generated for this campaign' 
      });
    }

    // Get proof for this email
    const proof = campaign.merkleProofs[normalizedEmail];

    if (!proof) {
      return res.status(200).json({
        eligible: false,
        reason: 'Email not in whitelist',
      });
    }

    // Calculate email hash (to match contract)
    const { hashEmail } = await import('../../../lib/merkleTree');
    const emailHash = hashEmail(normalizedEmail);

    console.log(`[GetMerkleProof] Found proof for ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      eligible: true,
      proof,
      emailHash,
      campaignId,
      contractAddress: campaign.contractAddress,
      network: campaign.network,
    });

  } catch (error: any) {
    console.error('[GetMerkleProof] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to get Merkle proof', 
      details: error.message,
    });
  }
}

