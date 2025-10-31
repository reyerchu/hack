import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';
import { userIsAuthorized } from '../../../lib/authorization/check-authorization';

initializeApi();
const db = firestore();

/**
 * POST /api/checkins/create
 * 
 * Creates a new check-in record
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const userToken = req.headers['authorization'] as string;
  
  // Check authorization
  const isAuthorized = await userIsAuthorized(userToken, ['admin', 'super_admin', 'organizer']);
  if (!isAuthorized) {
    return res.status(403).json({
      message: 'Unauthorized',
    });
  }

  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required',
      });
    }

    // Get user data from registrations collection
    const userDoc = await db.collection('registrations').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const userData = userDoc.data();
    if (!userData) {
      return res.status(404).json({
        message: 'User data not found',
      });
    }
    
    // Extract name from nested structure
    const userName = userData?.user?.firstName && userData?.user?.lastName
      ? `${userData.user.firstName} ${userData.user.lastName}`
      : userData?.firstName && userData?.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : userData?.user?.preferredEmail || userData?.email || '未知';
    
    const userEmail = userData?.user?.preferredEmail || userData?.email || '';

    // Check if already checked in
    const checkinDoc = await db.collection('checkins').doc(userId).get();
    
    if (checkinDoc.exists) {
      const existingCheckin = checkinDoc.data();
      return res.status(409).json({
        message: '此用戶已報到',
        checkedInAt: existingCheckin?.checkedInAt,
      });
    }

    // Get team name if available
    let teamName = '';
    if (userData.teamId) {
      const teamDoc = await db.collection('team-registrations').doc(userData.teamId).get();
      if (teamDoc.exists) {
        teamName = teamDoc.data()?.teamName || '';
      }
    }

    // Create check-in record
    const checkinRecord = {
      userId,
      userName,
      userEmail,
      teamName,
      checkedInAt: firestore.FieldValue.serverTimestamp(),
      checkedInBy: req.body.checkedInBy || 'admin',
    };

    await db.collection('checkins').doc(userId).set(checkinRecord);

    return res.status(200).json({
      message: 'Check-in successful',
      checkin: {
        ...checkinRecord,
        checkedInAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating check-in:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  
  switch (method) {
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(405).json({
        message: 'Method not allowed',
      });
  }
}

