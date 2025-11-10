import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';
import { exportMerkleTreeData } from '../../../../../lib/merkleTree';

/**
 * Generate Merkle Tree for NFT campaign whitelist
 * POST /api/admin/nft/campaigns/generate-merkle-tree
 *
 * Body: {
 *   campaignId: string
 * }
 *
 * Returns: {
 *   root: string,
 *   totalEmails: number
 * }
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();
    const db = firestore();

    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        error: 'Missing required field: campaignId',
      });
    }

    console.log(`[GenerateMerkleTree] Campaign: ${campaignId}`);

    // Get campaign from Firestore
    const campaignRef = db.collection('nft-campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaignDoc.data();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign data not found' });
    }

    // Get eligible emails
    const eligibleEmails = campaign.eligibleEmails || [];

    if (eligibleEmails.length === 0) {
      return res.status(400).json({
        error: 'No eligible emails in campaign',
      });
    }

    console.log(`[GenerateMerkleTree] 📧 Generating tree for ${eligibleEmails.length} emails...`);
    console.log(`[GenerateMerkleTree] 📧 First 3 emails:`, eligibleEmails.slice(0, 3));

    // Generate Merkle Tree
    const { root, proofs } = exportMerkleTreeData(eligibleEmails);

    console.log(`[GenerateMerkleTree] 🌳 Root: ${root}`);
    console.log(
      `[GenerateMerkleTree] 📋 Generated proofs for ${Object.keys(proofs).length} emails`,
    );
    console.log(`[GenerateMerkleTree] 📋 First 3 proof keys:`, Object.keys(proofs).slice(0, 3));

    // Store Merkle Tree data in Firestore
    await campaignRef.update({
      merkleRoot: root,
      merkleProofs: proofs,
      merkleTreeGeneratedAt: firestore.Timestamp.now(),
      updatedAt: firestore.Timestamp.now(),
    });

    console.log(`[GenerateMerkleTree] ✅ Merkle Tree data stored in Firestore`);

    return res.status(200).json({
      success: true,
      root,
      totalEmails: eligibleEmails.length,
    });
  } catch (error: any) {
    console.error('[GenerateMerkleTree] Error:', error);
    return res.status(500).json({
      error: 'Failed to generate Merkle Tree',
      details: error.message,
    });
  }
}
