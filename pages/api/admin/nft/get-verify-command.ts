import type { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../lib/admin/init';
import { getFirestore } from 'firebase-admin/firestore';

initializeApi();
const db = getFirestore();

/**
 * Get Hardhat verify command for a deployed contract
 * GET /api/admin/nft/get-verify-command?contractAddress=0x...
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress } = req.query;

    if (!contractAddress || typeof contractAddress !== 'string') {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    console.log(`[Get Verify Command] Looking for contract: ${contractAddress}`);

    // Find campaign with this contract address
    const campaignsSnapshot = await db
      .collection('nft-campaigns')
      .where('contractAddress', '==', contractAddress)
      .limit(1)
      .get();

    if (campaignsSnapshot.empty) {
      return res.status(404).json({
        error: 'Campaign not found for this contract address',
        contractAddress,
      });
    }

    const campaignDoc = campaignsSnapshot.docs[0];
    const campaign: any = campaignDoc.data();

    console.log(`[Get Verify Command] Found campaign: ${campaignDoc.id}`);

    // Extract deployment parameters
    const name = campaign.name;
    const symbol = campaign.symbol || 'RWAHACK';
    const maxSupply = campaign.maxSupply;
    const baseURI = campaign.deploymentProgress?.ipfs?.baseURI || '';
    const merkleRoot =
      campaign.merkleRoot || '0x0000000000000000000000000000000000000000000000000000000000000000';
    const network = campaign.network || 'sepolia';

    // Validate all required parameters
    const missingParams = [];
    if (!name) missingParams.push('name');
    if (!maxSupply) missingParams.push('maxSupply');
    if (!baseURI) missingParams.push('baseURI (IPFS metadata)');
    if (
      !merkleRoot ||
      merkleRoot === '0x0000000000000000000000000000000000000000000000000000000000000000'
    ) {
      missingParams.push('merkleRoot');
    }

    if (missingParams.length > 0) {
      return res.status(400).json({
        error: 'Missing required deployment parameters',
        missingParams,
        hint: 'Please ensure the contract was deployed with all parameters set',
      });
    }

    // Generate verify command
    const verifyCommand = `cd contracts && npx hardhat verify --network ${network} ${contractAddress} "${name}" "${symbol}" ${maxSupply} "${baseURI}" "${merkleRoot}"`;

    // Return all information
    return res.status(200).json({
      success: true,
      campaignId: campaignDoc.id,
      contractAddress,
      network,
      parameters: {
        name,
        symbol,
        maxSupply,
        baseURI,
        merkleRoot,
      },
      verifyCommand,
      etherscanUrl:
        network === 'sepolia'
          ? `https://sepolia.etherscan.io/address/${contractAddress}#code`
          : network === 'arbitrum'
          ? `https://arbiscan.io/address/${contractAddress}#code`
          : `https://etherscan.io/address/${contractAddress}#code`,
    });
  } catch (error: any) {
    console.error('[Get Verify Command] Error:', error);
    return res.status(500).json({
      error: 'Failed to generate verify command',
      details: error.message,
    });
  }
}
