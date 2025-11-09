import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

    // First verify the campaign exists
    const campaignDoc = await db.collection('nft-campaigns').doc(campaignId).get();
    if (!campaignDoc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Fetch all mint records for this campaign
    const mintsSnapshot = await db
      .collection('nft-mints')
      .where('campaignId', '==', campaignId)
      .get();

    // Get unique user IDs and emails
    const userIds = [...new Set(mintsSnapshot.docs.map(doc => doc.data().userId).filter(Boolean))];
    const userEmails = [...new Set(mintsSnapshot.docs.map(doc => doc.data().userEmail).filter(Boolean))];
    
    // Fetch user information by userId
    const userInfoMap: { [key: string]: any } = {};
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = { ...userDoc.data(), userId: userDoc.id };
            userInfoMap[`id:${userId}`] = userData;
            // Also map by email for fallback
            if (userData.email || userData.preferredEmail) {
              const email = (userData.email || userData.preferredEmail).toLowerCase().trim();
              userInfoMap[`email:${email}`] = userData;
            }
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
        }
      })
    );
    
    // Fetch user information by email for records without userId
    await Promise.all(
      userEmails.map(async (email) => {
        const normalizedEmail = email.toLowerCase().trim();
        // Skip if already found by userId
        if (userInfoMap[`email:${normalizedEmail}`]) return;
        
        try {
          // Try email field
          let usersSnapshot = await db
            .collection('users')
            .where('email', '==', normalizedEmail)
            .limit(1)
            .get();
          
          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            userInfoMap[`email:${normalizedEmail}`] = { ...userDoc.data(), userId: userDoc.id };
            return;
          }
          
          // Try preferredEmail field
          usersSnapshot = await db
            .collection('users')
            .where('preferredEmail', '==', normalizedEmail)
            .limit(1)
            .get();
          
          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            userInfoMap[`email:${normalizedEmail}`] = { ...userDoc.data(), userId: userDoc.id };
          }
        } catch (error) {
          console.error(`Error fetching user by email ${email}:`, error);
        }
      })
    );

    const mints = mintsSnapshot.docs.map(doc => {
      const data = doc.data();
      const userId = data.userId || '';
      const userEmail = (data.userEmail || '').toLowerCase().trim();
      
      // Try to get user info by userId first, then by email
      let userInfo = userId ? userInfoMap[`id:${userId}`] : null;
      if (!userInfo && userEmail) {
        userInfo = userInfoMap[`email:${userEmail}`];
      }
      
      // Determine display name: preferredName > firstName lastName > email
      let displayName = data.userEmail || '';
      if (userInfo) {
        if (userInfo.preferredName) {
          displayName = userInfo.preferredName;
        } else if (userInfo.firstName || userInfo.lastName) {
          displayName = [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ');
        }
      }
      
      return {
        id: doc.id,
        userEmail: data.userEmail || '',
        userId: userInfo?.userId || data.userId || '',
        displayName: displayName,
        tokenId: data.tokenId || 0,
        transactionHash: data.transactionHash || '',
        mintedAt: data.mintedAt?.toDate?.()?.toISOString() || data.mintedAt || '',
      };
    });

    // Sort by mintedAt in descending order (newest first)
    mints.sort((a, b) => {
      const dateA = new Date(a.mintedAt).getTime();
      const dateB = new Date(b.mintedAt).getTime();
      return dateB - dateA;
    });

    return res.status(200).json({
      success: true,
      mints,
      total: mints.length,
    });
  } catch (error) {
    console.error('[NFT Mints API] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

