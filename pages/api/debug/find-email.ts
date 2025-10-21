import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import firebase from 'firebase-admin';

initializeApi();
const db = firebase.firestore();

/**
 * Debug API to find email in database
 * GET /api/debug/find-email?email=xxx
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const results: any = {
      searchEmail: normalizedEmail,
      registrations: [],
      users: [],
    };

    // Search registrations
    const registrationsSnapshot = await db.collection('registrations').get();
    
    registrationsSnapshot.forEach(doc => {
      const data = doc.data();
      const emails = {
        email: data.email,
        'user.email': data.user?.email,
        'user.preferredEmail': data.user?.preferredEmail,
      };
      
      const matchingFields: string[] = [];
      if (emails.email?.toLowerCase() === normalizedEmail) matchingFields.push('email');
      if (emails['user.email']?.toLowerCase() === normalizedEmail) matchingFields.push('user.email');
      if (emails['user.preferredEmail']?.toLowerCase() === normalizedEmail) matchingFields.push('user.preferredEmail');
      
      if (matchingFields.length > 0) {
        results.registrations.push({
          docId: doc.id,
          matchingFields,
          data: {
            email: data.email,
            'user.email': data.user?.email,
            'user.preferredEmail': data.user?.preferredEmail,
            'user.firstName': data.user?.firstName,
            'user.lastName': data.user?.lastName,
            'user.nickname': data.user?.nickname,
          },
        });
      }
    });

    // Search users
    const usersSnapshot = await db.collection('users').get();
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const emails = {
        email: data.email,
        preferredEmail: data.preferredEmail,
      };
      
      const matchingFields: string[] = [];
      if (emails.email?.toLowerCase() === normalizedEmail) matchingFields.push('email');
      if (emails.preferredEmail?.toLowerCase() === normalizedEmail) matchingFields.push('preferredEmail');
      
      if (matchingFields.length > 0) {
        results.users.push({
          docId: doc.id,
          matchingFields,
          data: {
            email: data.email,
            preferredEmail: data.preferredEmail,
            firstName: data.firstName,
            lastName: data.lastName,
            nickname: data.nickname,
          },
        });
      }
    });

    return res.status(200).json(results);

  } catch (error: any) {
    console.error('[Debug Find Email] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

