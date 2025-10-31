import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';
import { userIsAuthorized } from '../../../lib/authorization/check-authorization';

initializeApi();
const db = firestore();

/**
 * GET /api/checkins/list
 *
 * Returns all check-in records and total user count
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const userToken = req.headers['authorization'] as string;

  // Check authorization
  const isAuthorized = await userIsAuthorized(userToken, ['admin', 'super_admin', 'organizer']);
  if (!isAuthorized) {
    return res.status(403).json({
      message: 'Unauthorized',
    });
  }

  try {
    // Load check-ins
    const checkinsSnapshot = await db.collection('checkins').orderBy('checkedInAt', 'desc').get();

    const checkins = checkinsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        teamName: data.teamName || '',
        checkedInAt: data.checkedInAt,
        checkedInBy: data.checkedInBy,
      };
    });

    // Load total registered users (from team-registrations)
    const teamsSnapshot = await db.collection('team-registrations').get();
    let userCount = 0;

    teamsSnapshot.docs.forEach((doc) => {
      const team = doc.data();
      // Count team leader
      if (team.teamLeader && (team.teamLeader.name || team.teamLeader.email)) {
        userCount++;
      }
      // Count team members
      if (team.teamMembers && Array.isArray(team.teamMembers)) {
        userCount += team.teamMembers.filter((m: any) => m.name || m.email).length;
      }
    });

    return res.status(200).json({
      checkins,
      totalUsers: userCount,
    });
  } catch (error) {
    console.error('Error loading check-ins:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    default:
      return res.status(405).json({
        message: 'Method not allowed',
      });
  }
}
