import type { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../../lib/admin/init';
import { getFirestore } from 'firebase-admin/firestore';
import { createMerkleTree, exportMerkleTreeData } from '../../../../../lib/merkleTree';

initializeApi();
const db = getFirestore();

/**
 * Add emails to NFT campaign whitelist
 *
 * POST /api/admin/nft/campaigns/add-whitelist
 *
 * Body:
 * {
 *   campaignId: string;
 *   newEmails: string[];
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '不允許的請求方法' });
  }

  try {
    const { campaignId, newEmails } = req.body;

    if (!campaignId || !Array.isArray(newEmails) || newEmails.length === 0) {
      return res.status(400).json({ error: '缺少必要欄位或欄位格式錯誤' });
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = newEmails.filter((email) => !emailRegex.test(email.trim()));

    if (invalidEmails.length > 0) {
      return res.status(400).json({
        error: '電子郵件格式無效',
        invalidEmails,
      });
    }

    // Get campaign
    const campaignRef = db.collection('nft-campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: '找不到此活動' });
    }

    const campaignData = campaignDoc.data();
    // Support both new field (whitelistedEmails) and legacy field (eligibleEmails)
    const existingWhitelist = campaignData?.whitelistedEmails || campaignData?.eligibleEmails || [];

    // Merge and deduplicate emails
    const normalizedNewEmails = newEmails.map((e) => e.trim().toLowerCase());
    const normalizedExisting = existingWhitelist.map((e: string) => e.toLowerCase());

    const duplicates = normalizedNewEmails.filter((email) => normalizedExisting.includes(email));

    const uniqueNewEmails = normalizedNewEmails.filter(
      (email) => !normalizedExisting.includes(email),
    );

    if (uniqueNewEmails.length === 0) {
      return res.status(400).json({
        error: '所有電子郵件都已在白名單中',
        duplicates,
      });
    }

    const updatedWhitelist = [...existingWhitelist, ...uniqueNewEmails];

    // Generate new Merkle tree
    const merkleData = exportMerkleTreeData(updatedWhitelist);

    // Update campaign
    await campaignRef.update({
      whitelistedEmails: updatedWhitelist,
      merkleRoot: merkleData.root,
      updatedAt: new Date(),
    });

    console.log('[add-whitelist] Added emails:', uniqueNewEmails.length);
    console.log('[add-whitelist] New total:', updatedWhitelist.length);
    console.log('[add-whitelist] New Merkle Root:', merkleData.root);

    return res.status(200).json({
      success: true,
      addedCount: uniqueNewEmails.length,
      duplicateCount: duplicates.length,
      totalCount: updatedWhitelist.length,
      newMerkleRoot: merkleData.root,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      contractAddress: campaignData?.contractAddress,
    });
  } catch (error: any) {
    console.error('[add-whitelist] Error:', error);
    return res.status(500).json({
      error: '添加白名單失敗',
      details: error.message,
    });
  }
}
