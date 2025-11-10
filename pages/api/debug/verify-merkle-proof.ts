import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { hashEmail } from '../../../lib/merkleTree';

/**
 * Debug API to verify Merkle proof
 * GET /api/debug/verify-merkle-proof?campaignId=xxx&email=xxx
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();
    const db = firestore();

    const { campaignId, email } = req.query;

    if (!campaignId || !email || typeof campaignId !== 'string' || typeof email !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameters: campaignId, email',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Fetch campaign
    const campaignDoc = await db.collection('nft-campaigns').doc(campaignId).get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaignDoc.data();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign data not found' });
    }

    const result: any = {
      campaignId,
      campaignName: campaign.name,
      email: normalizedEmail,
      merkleRootExists: !!campaign.merkleRoot,
      merkleProofsExists: !!campaign.merkleProofs,
      eligibleEmailsCount: campaign.eligibleEmails?.length || 0,
      merkleProofsCount: Object.keys(campaign.merkleProofs || {}).length,
    };

    if (!campaign.merkleRoot) {
      result.error = 'Merkle root not set for this campaign';
      return res.status(200).json(result);
    }

    if (!campaign.merkleProofs) {
      result.error = 'Merkle proofs not generated for this campaign';
      return res.status(200).json(result);
    }

    // Get proof for email
    const proof = campaign.merkleProofs[normalizedEmail];

    if (!proof) {
      result.error = `No proof found for email: ${normalizedEmail}`;
      result.availableEmails = Object.keys(campaign.merkleProofs).slice(0, 10);

      // Check if email is in eligibleEmails
      result.emailInEligibleList = campaign.eligibleEmails?.some(
        (e: string) => e.toLowerCase().trim() === normalizedEmail,
      );

      return res.status(200).json(result);
    }

    // Calculate email hash
    const emailHash = hashEmail(normalizedEmail);

    result.proofFound = true;
    result.emailHash = emailHash;
    result.proofLength = proof.length;
    result.merkleRoot = campaign.merkleRoot;
    result.proof = proof;

    // Verify proof locally
    const isValid = MerkleTree.verify(proof, emailHash, campaign.merkleRoot, keccak256, {
      sortPairs: true,
    });

    result.localVerification = isValid;

    if (!isValid) {
      result.critical = 'PROOF IS INVALID! It will be rejected by the smart contract.';

      // Try to regenerate the tree
      const eligibleEmails = campaign.eligibleEmails || [];
      const leaves = eligibleEmails.map((e: string) => hashEmail(e));
      const tree = new MerkleTree(leaves, keccak256, {
        sortPairs: true,
        hashLeaves: false,
      });

      const regeneratedRoot = tree.getHexRoot();
      result.storedRoot = campaign.merkleRoot;
      result.regeneratedRoot = regeneratedRoot;
      result.rootsMatch = campaign.merkleRoot === regeneratedRoot;

      if (campaign.merkleRoot !== regeneratedRoot) {
        result.recommendation =
          'The stored Merkle root does NOT match the regenerated root. Regenerate the Merkle tree for this campaign.';
      } else {
        const regeneratedProof = tree.getHexProof(emailHash);
        result.regeneratedProofLength = regeneratedProof.length;

        const isValidRegenerated = MerkleTree.verify(
          regeneratedProof,
          emailHash,
          regeneratedRoot,
          keccak256,
          { sortPairs: true },
        );
        result.regeneratedProofValid = isValidRegenerated;
        result.regeneratedProof = regeneratedProof;
      }
    } else {
      result.success = 'Proof is VALID and will work with the smart contract!';
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[VerifyMerkleProof] Error:', error);
    return res.status(500).json({
      error: 'Failed to verify Merkle proof',
      details: error.message,
    });
  }
}
