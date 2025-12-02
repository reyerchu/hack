import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();

    const { campaignId } = req.query;

    if (!campaignId || typeof campaignId !== 'string') {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    const db = firestore();
    const campaignDoc = await db.collection('nft-campaigns').doc(campaignId).get();

    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaignData = campaignDoc.data();

    // Check if user is admin
    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth().verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        isAdmin =
          userData?.permissions?.includes('super_admin') ||
          userData?.permissions?.includes('admin') ||
          false;
      } catch (err) {
        console.log('[NFT Campaign API] Auth check failed:', err);
      }
    }

    // Build campaign response
    const publicCampaign: any = {
      id: campaignDoc.id,
      name: campaignData?.name || '',
      description: campaignData?.description || '',
      imageUrl: campaignData?.imageUrl || '',
      network: campaignData?.network || '',
      contractAddress: campaignData?.contractAddress || '',
      maxSupply: campaignData?.maxSupply || 0,
      currentSupply: campaignData?.currentSupply || 0,
      status: campaignData?.status || 'draft',
      startDate: campaignData?.startDate?.toDate?.()?.toISOString() || campaignData?.startDate,
      endDate: campaignData?.endDate?.toDate?.()?.toISOString() || campaignData?.endDate,
      createdAt: campaignData?.createdAt?.toDate?.()?.toISOString() || campaignData?.createdAt,
    };

    // Include whitelist for admin users
    if (isAdmin) {
      publicCampaign.whitelistedEmails =
        campaignData?.whitelistedEmails || campaignData?.eligibleEmails || [];
    }

    return res.status(200).json({
      success: true,
      campaign: publicCampaign,
    });
  } catch (error) {
    console.error('[NFT Campaign API] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
