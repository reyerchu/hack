import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';
import { ethers } from 'ethers';

/**
 * Debug API to check contract Merkle root
 * GET /api/debug/check-contract-merkle-root?campaignId=xxx
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();
    const db = firestore();

    const { campaignId } = req.query;

    if (!campaignId || typeof campaignId !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: campaignId',
      });
    }

    // Fetch campaign
    const campaignDoc = await db.collection('nft-campaigns').doc(campaignId).get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaignDoc.data();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign data not found' });
    }

    if (!campaign.contractAddress) {
      return res.status(400).json({ error: 'No contract address for this campaign' });
    }

    // Get RPC URL for the network
    const rpcUrls: Record<string, string> = {
      sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
      arbitrum: 'https://arb1.arbitrum.io/rpc',
      'arbitrum-sepolia': 'https://sepolia-rollup.arbitrum.io/rpc',
    };

    const rpcUrl = rpcUrls[campaign.network];

    if (!rpcUrl) {
      return res.status(400).json({ error: `Unsupported network: ${campaign.network}` });
    }

    // Connect to contract
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    const contractABI = [
      'function merkleRoot() public view returns (bytes32)',
      'function name() public view returns (string)',
      'function symbol() public view returns (string)',
      'function totalSupply() public view returns (uint256)',
      'function maxSupply() public view returns (uint256)',
      'function mintingEnabled() public view returns (bool)',
    ];

    const contract = new ethers.Contract(campaign.contractAddress, contractABI, provider);

    // Get contract data
    const [
      contractMerkleRoot,
      contractName,
      contractSymbol,
      contractTotalSupply,
      contractMaxSupply,
      contractMintingEnabled,
    ] = await Promise.all([
      contract.merkleRoot(),
      contract.name(),
      contract.symbol(),
      contract.totalSupply(),
      contract.maxSupply(),
      contract.mintingEnabled(),
    ]);

    const result: any = {
      campaignId,
      campaignName: campaign.name,
      network: campaign.network,
      contractAddress: campaign.contractAddress,
      database: {
        merkleRoot: campaign.merkleRoot,
        maxSupply: campaign.maxSupply,
        currentSupply: campaign.currentSupply,
        eligibleEmailsCount: campaign.eligibleEmails?.length || 0,
        merkleProofsCount: Object.keys(campaign.merkleProofs || {}).length,
      },
      contract: {
        name: contractName,
        symbol: contractSymbol,
        merkleRoot: contractMerkleRoot,
        totalSupply: contractTotalSupply.toString(),
        maxSupply: contractMaxSupply.toString(),
        mintingEnabled: contractMintingEnabled,
      },
      merkleRootMatch: campaign.merkleRoot === contractMerkleRoot,
    };

    if (!result.merkleRootMatch) {
      result.error = '❌ CRITICAL: Merkle roots do NOT match!';
      result.recommendation =
        'The Merkle root in the smart contract is different from the database. You need to update the contract Merkle root using setMerkleRoot().';
    } else {
      result.success = '✅ Merkle roots match! Contract is correctly configured.';
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[CheckContractMerkleRoot] Error:', error);
    return res.status(500).json({
      error: 'Failed to check contract Merkle root',
      details: error.message,
    });
  }
}
