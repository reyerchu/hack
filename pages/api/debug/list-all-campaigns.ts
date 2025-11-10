import type { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import { getFirestore } from 'firebase-admin/firestore';

initializeApi();
const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const snapshot = await db.collection('nft-campaigns').get();

    const campaigns = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        contractAddress: data.contractAddress,
        currentSupply: data.currentSupply,
        maxSupply: data.maxSupply,
        status: data.status,
        network: data.network,
      };
    });

    return res.status(200).json({
      total: campaigns.length,
      campaigns,
    });
  } catch (error: any) {
    console.error('[ListCampaigns] Error:', error);
    return res.status(500).json({
      error: 'Failed to list campaigns',
      details: error.message,
    });
  }
}
