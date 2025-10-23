import { firestore } from 'firebase-admin';
import { auth } from 'firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import { userIsAuthorized } from '../../../lib/authorization/check-authorization';

initializeApi();
const db = firestore();

const USERS_COLLECTION = '/registrations';
const MISC_COLLECTION = '/miscellaneous';

/**
 *
 * Represent how data of a User is stored in the backend
 *
 */
export interface UserData {
  id: string;
  scans?: string[];
  timestamp?: number;
  user: {
    firstName: string;
    lastName: string;
    permissions: string[];
    preferredEmail?: string;
    nickname?: string;
    gender?: string;
    teamStatus?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    resume?: string;
  };
}

/**
 *
 * API endpoint to fetch all users from the database
 *
 * @param req HTTP request object
 * @param res HTTP response object
 *
 *
 */
async function getAllUsers(req: NextApiRequest, res: NextApiResponse) {
  const { headers } = req;

  const userToken = headers['authorization'];
  const isAuthorized = await userIsAuthorized(userToken);

  if (!isAuthorized) {
    return res.status(403).json({
      msg: 'Request is not authorized to perform admin functionality.',
    });
  }

  // Fetch all users from the registrations collection
  const usersSnapshot = await db.collection(USERS_COLLECTION).get();

  const users: UserData[] = [];

  usersSnapshot.forEach((doc) => {
    const data = doc.data();

    // Convert Firestore Timestamp to number (milliseconds)
    // Support both old (timestamp) and new (createdAt) formats
    let timestamp = null;
    const rawTimestamp =
      data.timestamp || data.user?.timestamp || data.createdAt || data.user?.createdAt;
    if (rawTimestamp) {
      if (typeof rawTimestamp === 'object' && rawTimestamp._seconds) {
        // Firestore Timestamp object
        timestamp = rawTimestamp._seconds * 1000 + Math.floor(rawTimestamp._nanoseconds / 1000000);
      } else if (typeof rawTimestamp === 'number') {
        // Already a number
        timestamp = rawTimestamp;
      }
    }

    // Map the document data to our UserData structure
    users.push({
      id: doc.id,
      scans: data.scans || [],
      timestamp: timestamp,
      user: {
        firstName: data.user?.firstName || data.firstName || '',
        lastName: data.user?.lastName || data.lastName || '',
        permissions: data.user?.permissions || [],
        preferredEmail: data.preferredEmail || data.user?.preferredEmail || '',
        nickname: data.nickname || data.user?.nickname || '',
        gender: data.gender || data.user?.gender || '',
        teamStatus: data.teamStatus || data.user?.teamStatus || '',
        github: data.github || data.user?.github || '',
        linkedin: data.linkedin || data.user?.linkedin || '',
        website: data.website || data.user?.website || '',
        resume: data.resume || data.user?.resume || '',
      },
    });
  });

  return res.json(users);
}

function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  return getAllUsers(req, res);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  switch (method) {
    case 'GET': {
      return handleGetRequest(req, res);
    }
    default: {
      return res.status(404).json({
        msg: 'Route not found',
      });
    }
  }
}
