import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';
import { ethers } from 'ethers';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

/**
 * Automatically deploy NFT contract
 * POST /api/admin/nft/campaigns/deploy-contract
 * 
 * This endpoint will:
 * 1. Read campaign details from Firestore
 * 2. Deploy contract using hardhat
 * 3. Return contract address
 * 
 * Body: {
 *   campaignId: string,
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

    const { campaignId, network = 'sepolia' } = req.body;

    if (!campaignId) {
      return res.status(400).json({ 
        error: 'Missing required field: campaignId' 
      });
    }

    console.log(`[DeployContract] Deploying contract for campaign: ${campaignId}`);
    console.log(`[DeployContract] Network: ${network}`);

    // Get campaign from Firestore
    const campaignDoc = await db.collection('nft-campaigns').doc(campaignId).get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaignDoc.data();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign data not found' });
    }

    // Check if contract already deployed
    if (campaign.contractAddress) {
      return res.status(400).json({ 
        error: 'Contract already deployed for this campaign',
        contractAddress: campaign.contractAddress
      });
    }

    // Check if deployer private key is configured
    if (!process.env.DEPLOYER_PRIVATE_KEY) {
      return res.status(500).json({ 
        error: 'Deployer private key not configured in environment variables',
        hint: 'Please set DEPLOYER_PRIVATE_KEY in .env.local'
      });
    }

    // Deploy contract using hardhat
    const contractsDir = path.join(process.cwd(), 'contracts');
    
    // Check if contracts directory exists
    if (!fs.existsSync(contractsDir)) {
      return res.status(500).json({ 
        error: 'Contracts directory not found',
        path: contractsDir
      });
    }

    console.log(`[DeployContract] Deploying to ${network}...`);

    // Set environment variables for deployment
    const env = {
      ...process.env,
      NFT_NAME: campaign.name,
      NFT_SYMBOL: campaign.symbol || 'RWAHACK',
      NFT_MAX_SUPPLY: campaign.maxSupply?.toString() || '100',
      NFT_BASE_URI: campaign.imageUrl || '',
    };

    try {
      // Execute deployment command
      const { stdout, stderr } = await execAsync(
        `cd ${contractsDir} && npm run deploy:${network}`,
        { 
          env,
          timeout: 120000 // 2 minutes timeout
        }
      );

      console.log(`[DeployContract] stdout:`, stdout);
      if (stderr) {
        console.log(`[DeployContract] stderr:`, stderr);
      }

      // Parse contract address from output
      // Look for pattern: "deployed to: 0x..."
      const addressMatch = stdout.match(/deployed to:?\s*(0x[a-fA-F0-9]{40})/i);
      
      if (!addressMatch) {
        throw new Error('Could not find contract address in deployment output');
      }

      const contractAddress = addressMatch[1];
      console.log(`[DeployContract] Contract deployed to: ${contractAddress}`);

      // Verify it's a valid address
      if (!ethers.utils.isAddress(contractAddress)) {
        throw new Error(`Invalid contract address: ${contractAddress}`);
      }

      // Update Firestore with contract address
      await db.collection('nft-campaigns').doc(campaignId).update({
        contractAddress,
        deployedAt: firestore.Timestamp.now(),
        network,
        updatedAt: firestore.Timestamp.now(),
      });

      console.log(`[DeployContract] Firestore updated`);

      return res.status(200).json({
        success: true,
        contractAddress,
        network,
        message: 'Contract deployed successfully',
        transactionHash: stdout.match(/transaction hash:?\s*(0x[a-fA-F0-9]{64})/i)?.[1],
      });

    } catch (execError: any) {
      console.error('[DeployContract] Deployment failed:', execError);
      return res.status(500).json({
        error: 'Contract deployment failed',
        details: execError.message,
        stdout: execError.stdout,
        stderr: execError.stderr,
      });
    }

  } catch (error: any) {
    console.error('[DeployContract] Error:', error);
    return res.status(500).json({ 
      error: 'Deployment failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

