import type { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';
import { firestore } from 'firebase-admin';
import { ethers } from 'ethers';
import initializeApi from '../../../lib/admin/init';
import { hashEmail } from '../../../lib/merkleTree';

/**
 * Sync NFT mint status from blockchain
 * POST /api/nft/sync-mint
 * Body: { campaignId, walletAddress, userEmail }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();
    const db = firestore();

    const { campaignId, walletAddress, userEmail } = req.body;

    if (!campaignId || !walletAddress || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    const normalizedWallet = walletAddress.toLowerCase();

    // 1. Get Campaign
    const campaignDoc = await db.collection('nft-campaigns').doc(campaignId).get();
    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    const campaign = campaignDoc.data();

    if (!campaign?.contractAddress) {
      return res.status(400).json({ error: 'Contract address not set' });
    }

    // 2. Check if already minted in DB
    const existingMint = await db
      .collection('nft-mints')
      .where('campaignId', '==', campaignId)
      .where('userEmail', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!existingMint.empty) {
      return res
        .status(200)
        .json({ success: true, message: 'Already synced', mint: existingMint.docs[0].data() });
    }

    // 3. Verify on Blockchain
    // Use a provider (we need a public RPC or one from env)
    const rpcUrl = getRpcUrl(campaign.network);
    if (!rpcUrl) {
      return res.status(500).json({ error: 'Unsupported network RPC' });
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // We need ABI - minimal for what we need
    const abi = [
      'function balanceOf(address owner) view returns (uint256)',
      'function hasEmailMinted(bytes32 emailHash) view returns (bool)',
      'event NFTMinted(address indexed to, uint256 indexed tokenId, bytes32 emailHash)',
    ];

    const contract = new ethers.Contract(campaign.contractAddress, abi, provider);

    // Check 1: hasEmailMinted?
    const emailHash = hashEmail(normalizedEmail);
    const hasMinted = await contract.hasEmailMinted(emailHash);

    if (!hasMinted) {
      return res.status(404).json({ error: 'Not minted on-chain' });
    }

    // Check 2: Find the Token ID & Tx Hash
    // We need to scan logs. This might be slow on basic RPCs but usually fine for limited range or recent.
    // Ideally we'd scan from deployment block.
    // For simplicity/performance in a serverless function without indexer:
    // We will trust the user claims they minted if `hasEmailMinted` is true.
    // But we need Token ID and Tx Hash for the record.

    // Filter logs: NFTMinted(to=walletAddress)
    // Note: If user transferred it out, 'to' won't match current owner, but 'NFTMinted' event records the original minter.
    // The contract emits `NFTMinted(msg.sender, tokenId, emailHash)`.
    // So we can filter by `to` (topic 1).

    const filter = contract.filters.NFTMinted(walletAddress);
    // To save RPC calls, we might want to limit block range. But we don't know when it happened.
    // Try query from latest 100,000 blocks? Or from block 0 (might timeout).
    // Most RPCs limit range.

    // Better strategy: Filter by `emailHash` if possible?
    // No, `emailHash` is not indexed in `NFTMinted(address indexed to, uint256 indexed tokenId, bytes32 emailHash)`.
    // But `to` is indexed.

    // Let's try to fetch logs for this user address.
    const logs = await contract.queryFilter(filter); // Default might be 'latest' range, depends on provider.
    // Some providers error if fromBlock is not set or range too large.
    // Let's try fetching. If fail, maybe fallback or just fail.

    // Find log matching our emailHash
    const log = logs.find((l) => {
      // Decode data to get emailHash
      const parsed = contract.interface.parseLog(l);
      return parsed.args.emailHash === emailHash;
    });

    if (!log) {
      // Could happen if RPC limit reached or event missed.
      // Fallback: if `hasEmailMinted` is true, but we can't find log, maybe we can't auto-sync fully.
      // Or we can try to guess/scan balance if they still own it.
      console.log('Has minted but log not found. Checking current balance...');
      const balance = await contract.balanceOf(walletAddress);
      if (balance.gt(0)) {
        // They own one. But which one?
        // If simple ERC721 (not enumerable), we can't easily list.
        // But `hasEmailMinted` ensures they minted ONE specific token (since it checks map).
        // We just don't know WHICH one without the log.
        return res.status(500).json({
          error: 'Mint verified on-chain but transaction log not found. Please contact support.',
        });
      }
      return res.status(404).json({ error: 'Log not found and no current balance.' });
    }

    const parsedLog = contract.interface.parseLog(log);
    const tokenId = parsedLog.args.tokenId.toNumber();
    const transactionHash = log.transactionHash;
    const block = await log.getBlock();
    const mintedAt = new Date(block.timestamp * 1000);

    // 4. Create Record
    const userId = await getUserId(db, normalizedEmail);

    const mintRef = db.collection('nft-mints').doc();
    const mintData = {
      id: mintRef.id,
      campaignId,
      userEmail: normalizedEmail,
      userId,
      walletAddress,
      tokenId,
      transactionHash,
      mintedAt,
      imageUrl: campaign.imageUrl || '',
      metadata: {
        name: campaign.name || '',
        description: campaign.description || '',
        image: campaign.imageUrl || '',
      },
    };

    await mintRef.set(mintData);

    // 5. Update Supply
    await db
      .collection('nft-campaigns')
      .doc(campaignId)
      .update({
        currentSupply: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date(),
      });

    return res.status(200).json({ success: true, mint: mintData });
  } catch (error: any) {
    console.error('[SyncMint] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

function getRpcUrl(network: string): string | null {
  const NETWORKS: Record<string, string> = {
    sepolia: 'https://rpc.sepolia.org', // Public RPC
    ethereum: 'https://eth.llamarpc.com', // Public RPC
    mainnet: 'https://eth.llamarpc.com',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
  };
  return NETWORKS[network.toLowerCase()] || null;
}

async function getUserId(db: FirebaseFirestore.Firestore, email: string): Promise<string> {
  const usersSnapshot = await db
    .collection('users')
    .where('preferredEmail', '==', email)
    .limit(1)
    .get();

  if (!usersSnapshot.empty) return usersSnapshot.docs[0].id;

  const usersEmailSnapshot = await db
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (!usersEmailSnapshot.empty) return usersEmailSnapshot.docs[0].id;

  return '';
}
