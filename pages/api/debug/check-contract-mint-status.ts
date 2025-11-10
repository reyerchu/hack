import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';
import { ethers } from 'ethers';
import { hashEmail } from '../../../lib/merkleTree';

/**
 * Debug API to check if email has minted in contract
 * GET /api/debug/check-contract-mint-status?campaignId=xxx&email=xxx
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

    // Calculate email hash
    const emailHash = hashEmail(normalizedEmail);

    // Connect to contract
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    const contractABI = [
      'function hasEmailMinted(bytes32 emailHash) public view returns (bool)',
      'function verifyWhitelist(bytes32 emailHash, bytes32[] calldata merkleProof) public view returns (bool)',
    ];

    const contract = new ethers.Contract(campaign.contractAddress, contractABI, provider);

    // Check if email has minted
    const hasMinted = await contract.hasEmailMinted(emailHash);

    // Get proof from database
    const proof = campaign.merkleProofs?.[normalizedEmail] || [];

    // Verify whitelist on contract
    let whitelistVerified = false;
    try {
      whitelistVerified = await contract.verifyWhitelist(emailHash, proof);
    } catch (err: any) {
      console.error('[CheckContractMintStatus] Error verifying whitelist:', err.message);
    }

    const result: any = {
      campaignId,
      campaignName: campaign.name,
      network: campaign.network,
      contractAddress: campaign.contractAddress,
      email: normalizedEmail,
      emailHash,
      contractStatus: {
        hasMinted,
        whitelistVerified,
      },
      database: {
        hasProof: !!proof.length,
        proofLength: proof.length,
      },
    };

    if (hasMinted) {
      result.warning = '⚠️ Email has already minted on the contract!';
    } else if (!whitelistVerified) {
      result.error = '❌ Email is NOT in the contract whitelist or proof is invalid!';
    } else {
      result.success = '✅ Email can mint!';
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[CheckContractMintStatus] Error:', error);
    return res.status(500).json({
      error: 'Failed to check contract mint status',
      details: error.message,
    });
  }
}
