import type { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../../lib/admin/init';
import { getFirestore } from 'firebase-admin/firestore';
import { exportMerkleTreeData } from '../../../../../lib/merkleTree';

initializeApi();
const db = getFirestore();

/**
 * Remove emails from NFT campaign whitelist
 *
 * POST /api/admin/nft/campaigns/remove-whitelist
 *
 * Body:
 * {
 *   campaignId: string;
 *   emailsToRemove: string[];
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { campaignId, emailsToRemove } = req.body;

    if (!campaignId || !Array.isArray(emailsToRemove) || emailsToRemove.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    // Get campaign
    const campaignRef = db.collection('nft-campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaignData = campaignDoc.data();
    const existingWhitelist = campaignData?.whitelistedEmails || [];

    // Normalize emails to remove
    const normalizedToRemove = emailsToRemove.map((e) => e.trim().toLowerCase());

    // Check if any emails have already minted
    const mintRecordsSnapshot = await db
      .collection('nft-mints')
      .where('campaignId', '==', campaignId)
      .get();

    const mintedEmails = new Set(
      mintRecordsSnapshot.docs.map((doc) => doc.data().email?.toLowerCase()),
    );

    const alreadyMinted = normalizedToRemove.filter((email) => mintedEmails.has(email));

    if (alreadyMinted.length > 0) {
      return res.status(400).json({
        error: 'Cannot remove emails that have already minted',
        alreadyMinted,
      });
    }

    // Filter out emails to remove
    const updatedWhitelist = existingWhitelist.filter(
      (email: string) => !normalizedToRemove.includes(email.toLowerCase()),
    );

    const removedCount = existingWhitelist.length - updatedWhitelist.length;

    if (removedCount === 0) {
      return res.status(400).json({
        error: 'No matching emails found in whitelist',
      });
    }

    // Generate new Merkle tree
    const merkleData = exportMerkleTreeData(updatedWhitelist);

    // Update campaign
    await campaignRef.update({
      whitelistedEmails: updatedWhitelist,
      merkleRoot: merkleData.root,
      updatedAt: new Date(),
    });

    console.log('[remove-whitelist] Removed emails:', removedCount);
    console.log('[remove-whitelist] New total:', updatedWhitelist.length);
    console.log('[remove-whitelist] New Merkle Root:', merkleData.root);

    return res.status(200).json({
      success: true,
      removedCount,
      totalCount: updatedWhitelist.length,
      newMerkleRoot: merkleData.root,
    });
  } catch (error: any) {
    console.error('[remove-whitelist] Error:', error);
    return res.status(500).json({
      error: 'Failed to remove from whitelist',
      details: error.message,
    });
  }
}
