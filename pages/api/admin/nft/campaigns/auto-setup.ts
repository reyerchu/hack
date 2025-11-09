import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';
import { ethers } from 'ethers';

/**
 * Automatic setup for NFT campaign after contract deployment
 * POST /api/admin/nft/campaigns/auto-setup
 * 
 * This endpoint will:
 * 1. Verify contract ownership
 * 2. Fetch wallet addresses for eligible emails
 * 3. Add all addresses to contract whitelist
 * 4. Enable minting
 * 5. Update campaign status
 * 
 * Body: {
 *   campaignId: string,
 *   contractAddress: string,
 *   deployerPrivateKey: string
 * }
 */

const CONTRACT_ABI = [
  "function addToWhitelist(address[] calldata addresses) external",
  "function setMintingEnabled(bool enabled) external",
  "function owner() external view returns (address)",
  "function mintingEnabled() external view returns (bool)"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();
    const db = firestore();

    const { campaignId, contractAddress, deployerPrivateKey, network = 'sepolia' } = req.body;

    if (!campaignId || !contractAddress || !deployerPrivateKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: campaignId, contractAddress, deployerPrivateKey' 
      });
    }

    console.log(`[AutoSetup] Starting setup for campaign: ${campaignId}`);

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

    // Step 1: Connect to blockchain
    const rpcUrls: Record<string, string> = {
      sepolia: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      ethereum: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
      arbitrum: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    };

    const rpcUrl = rpcUrls[campaign.network || network];
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const deployer = new ethers.Wallet(deployerPrivateKey, provider);

    console.log(`[AutoSetup] Deployer address: ${deployer.address}`);

    // Step 2: Connect to contract
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, deployer);

    // Verify ownership
    const owner = await contract.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      return res.status(403).json({ 
        error: 'Deployer is not the contract owner',
        owner: owner,
        deployer: deployer.address
      });
    }

    console.log(`[AutoSetup] Contract ownership verified`);

    // Step 3: Get wallet addresses for eligible emails
    const eligibleEmails = campaign.eligibleEmails || [];
    const walletAddresses: string[] = [];
    const notFoundEmails: string[] = [];

    console.log(`[AutoSetup] Looking up ${eligibleEmails.length} emails...`);

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
        if (userData.walletAddress && ethers.isAddress(userData.walletAddress)) {
          walletAddresses.push(userData.walletAddress);
          console.log(`[AutoSetup] ✓ ${email} -> ${userData.walletAddress}`);
        } else {
          notFoundEmails.push(email);
          console.log(`[AutoSetup] ✗ ${email} (no wallet)`);
        }
      } else {
        notFoundEmails.push(email);
        console.log(`[AutoSetup] ✗ ${email} (user not found)`);
      }
    }

    console.log(`[AutoSetup] Found ${walletAddresses.length} wallet addresses`);

    // Step 4: Add addresses to whitelist in batches
    const BATCH_SIZE = 50;
    const addedAddresses: string[] = [];
    const failedAddresses: string[] = [];

    if (walletAddresses.length > 0) {
      for (let i = 0; i < walletAddresses.length; i += BATCH_SIZE) {
        const batch = walletAddresses.slice(i, Math.min(i + BATCH_SIZE, walletAddresses.length));
        
        console.log(`[AutoSetup] Adding batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} addresses)...`);

        try {
          const tx = await contract.addToWhitelist(batch);
          console.log(`[AutoSetup] Transaction sent: ${tx.hash}`);
          
          const receipt = await tx.wait();
          console.log(`[AutoSetup] Transaction confirmed (Gas: ${receipt.gasUsed.toString()})`);
          
          addedAddresses.push(...batch);
        } catch (error: any) {
          console.error(`[AutoSetup] Failed to add batch:`, error.message);
          failedAddresses.push(...batch);
        }
      }
    }

    // Step 5: Enable minting
    console.log(`[AutoSetup] Enabling minting...`);
    const enableTx = await contract.setMintingEnabled(true);
    await enableTx.wait();
    console.log(`[AutoSetup] Minting enabled`);

    // Step 6: Update campaign in Firestore
    await campaignRef.update({
      contractAddress: contractAddress,
      status: 'active',
      setupCompletedAt: firestore.Timestamp.now(),
      whitelistSummary: {
        totalEmails: eligibleEmails.length,
        walletsFound: walletAddresses.length,
        walletsAdded: addedAddresses.length,
        walletsFailed: failedAddresses.length,
        emailsWithoutWallet: notFoundEmails.length,
      },
      updatedAt: firestore.Timestamp.now(),
    });

    console.log(`[AutoSetup] Setup complete!`);

    // Return summary
    return res.status(200).json({
      success: true,
      message: 'Campaign setup completed successfully',
      contractAddress: contractAddress,
      network: campaign.network,
      summary: {
        totalEligibleEmails: eligibleEmails.length,
        walletsFound: walletAddresses.length,
        walletsAddedToContract: addedAddresses.length,
        walletsFailed: failedAddresses.length,
        emailsWithoutWallet: notFoundEmails.length,
        notFoundEmails: notFoundEmails,
      },
      mintingEnabled: true,
      campaignStatus: 'active',
      nextSteps: notFoundEmails.length > 0 
        ? `${notFoundEmails.length} users need to add their wallet addresses to the system`
        : 'All set! Users can now mint NFTs.',
    });

  } catch (error: any) {
    console.error('[AutoSetup] Error:', error);
    return res.status(500).json({ 
      error: 'Setup failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

