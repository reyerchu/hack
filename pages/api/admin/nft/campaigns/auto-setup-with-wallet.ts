import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';

/**
 * Automatic setup for NFT campaign using frontend wallet
 * POST /api/admin/nft/campaigns/auto-setup-with-wallet
 *
 * This endpoint will:
 * 1. Fetch wallet addresses for eligible emails from Firestore
 * 2. Return the list to frontend
 * 3. Frontend will use MetaMask to sign transactions
 *
 * Body: {
 *   campaignId: string,
 *   contractAddress: string,
 *   signerAddress: string,
 *   network: string
 * }
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();
    const db = firestore();

    const { campaignId, contractAddress, signerAddress, network } = req.body;

    if (!campaignId || !contractAddress || !signerAddress) {
      return res.status(400).json({
        error: 'Missing required fields: campaignId, contractAddress, signerAddress',
      });
    }

    console.log(`[AutoSetupWallet] Starting setup for campaign: ${campaignId}`);
    console.log(`[AutoSetupWallet] Contract: ${contractAddress}`);
    console.log(`[AutoSetupWallet] Signer: ${signerAddress}`);

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

    // Get wallet addresses for eligible emails
    const eligibleEmails = campaign.eligibleEmails || [];
    const walletAddresses: string[] = [];
    const notFoundEmails: string[] = [];

    console.log(`[AutoSetupWallet] Looking up ${eligibleEmails.length} emails...`);

    for (const email of eligibleEmails) {
      const normalizedEmail = email.toLowerCase().trim();

      // Query users collection for wallet address
      const usersSnapshot = await db
        .collection('users')
        .where('preferredEmail', '==', normalizedEmail)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        if (userData.walletAddress) {
          walletAddresses.push(userData.walletAddress);
          console.log(`[AutoSetupWallet] ✓ ${email} -> ${userData.walletAddress}`);
        } else {
          notFoundEmails.push(email);
          console.log(`[AutoSetupWallet] ✗ ${email} (no wallet)`);
        }
      } else {
        notFoundEmails.push(email);
        console.log(`[AutoSetupWallet] ✗ ${email} (user not found)`);
      }
    }

    console.log(`[AutoSetupWallet] Found ${walletAddresses.length} wallet addresses`);

    // Return data for frontend to execute transactions
    return res.status(200).json({
      success: true,
      contractAddress,
      walletAddresses,
      campaignId,
      summary: {
        totalEligibleEmails: eligibleEmails.length,
        walletsFound: walletAddresses.length,
        emailsWithoutWallet: notFoundEmails.length,
        notFoundEmails,
      },
    });
  } catch (error: any) {
    console.error('[AutoSetupWallet] Error:', error);
    return res.status(500).json({
      error: 'Setup failed',
      details: error.message,
    });
  }
}
