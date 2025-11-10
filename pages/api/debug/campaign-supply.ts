import type { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import { getFirestore } from 'firebase-admin/firestore';
import { ethers } from 'ethers';

initializeApi();
const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { campaignId } = req.query;

  if (!campaignId) {
    return res.status(400).json({ error: 'Missing campaignId' });
  }

  try {
    // Get from database
    const campaignDoc = await db
      .collection('nft-campaigns')
      .doc(campaignId as string)
      .get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaignData = campaignDoc.data();

    // Get from contract
    const provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    const contractABI = [
      'function totalSupply() external view returns (uint256)',
      'function maxSupply() external view returns (uint256)',
      'function mintingEnabled() external view returns (bool)',
    ];

    const contract = new ethers.Contract(campaignData!.contractAddress, contractABI, provider);

    const totalSupply = await contract.totalSupply();
    const maxSupply = await contract.maxSupply();
    const mintingEnabled = await contract.mintingEnabled();

    return res.status(200).json({
      campaignId,
      database: {
        currentSupply: campaignData!.currentSupply,
        maxSupply: campaignData!.maxSupply,
        contractAddress: campaignData!.contractAddress,
      },
      contract: {
        totalSupply: totalSupply.toNumber(),
        maxSupply: maxSupply.toNumber(),
        mintingEnabled,
      },
      match: {
        supplyMatch: campaignData!.currentSupply === totalSupply.toNumber(),
        maxSupplyMatch: campaignData!.maxSupply === maxSupply.toNumber(),
      },
      correctDisplay: `${totalSupply.toNumber()} / ${maxSupply.toNumber()}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[CampaignSupply] Error:', error);
    return res.status(500).json({
      error: 'Failed to check supply',
      details: error.message,
    });
  }
}
