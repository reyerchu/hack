import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';

initializeApi();

const admin = require('firebase-admin');
const db = admin.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Email parameter is required' });
  }

  try {
    console.log(`Searching for users with email: ${email}`);

    const registrationsRef = db.collection('registrations');
    const snapshot = await registrationsRef.get();

    const matchingUsers: any[] = [];

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      const userEmail = data.preferredEmail || data.user?.preferredEmail || '';

      if (userEmail.toLowerCase() === email.toLowerCase()) {
        const firstName = data.user?.firstName || data.firstName || '';
        const lastName = data.user?.lastName || data.lastName || '';
        const nickname = data.nickname || data.user?.nickname || '';
        const timestamp = data.timestamp;
        const permissions = data.user?.permissions || [];
        const teamStatus = data.teamStatus || data.user?.teamStatus || '';

        matchingUsers.push({
          id: doc.id,
          firstName,
          lastName,
          nickname,
          email: userEmail,
          timestamp,
          permissions,
          teamStatus,
          registeredDate: timestamp
            ? new Date(timestamp).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
            : 'N/A',
        });
      }
    });

    console.log(`Found ${matchingUsers.length} user(s) with email: ${email}`);

    return res.status(200).json({
      success: true,
      email,
      count: matchingUsers.length,
      users: matchingUsers,
    });
  } catch (error: any) {
    console.error('Error finding duplicate users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to find users',
      error: error.message,
    });
  }
}
