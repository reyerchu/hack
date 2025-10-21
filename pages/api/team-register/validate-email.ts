import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import firebase from 'firebase-admin';

initializeApi();
const db = firebase.firestore();

/**
 * API endpoint to validate if an email is registered
 * 
 * POST /api/team-register/validate-email
 * 
 * Request body:
 * {
 *   email: string
 * }
 * 
 * Response:
 * {
 *   isValid: boolean,
 *   name?: string
 * }
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await firebase.auth().verifyIdToken(token);
    
    if (!decodedToken || !decodedToken.uid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get email from request
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check multiple possible email fields in registrations collection
    // Try user.preferredEmail
    let userSnapshot = await db
      .collection('registrations')
      .where('user.preferredEmail', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      const firstName = userData.user?.firstName || '';
      const lastName = userData.user?.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || userData.user?.nickname || '';

      console.log('[ValidateEmail] Found in registrations (user.preferredEmail):', normalizedEmail);
      return res.status(200).json({
        isValid: true,
        name: name || normalizedEmail,
      });
    }

    // Try user.email
    userSnapshot = await db
      .collection('registrations')
      .where('user.email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      const firstName = userData.user?.firstName || '';
      const lastName = userData.user?.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || userData.user?.nickname || '';

      console.log('[ValidateEmail] Found in registrations (user.email):', normalizedEmail);
      return res.status(200).json({
        isValid: true,
        name: name || normalizedEmail,
      });
    }

    // Try email field directly
    userSnapshot = await db
      .collection('registrations')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      const firstName = userData.user?.firstName || userData.firstName || '';
      const lastName = userData.user?.lastName || userData.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || userData.user?.nickname || userData.nickname || '';

      console.log('[ValidateEmail] Found in registrations (email):', normalizedEmail);
      return res.status(200).json({
        isValid: true,
        name: name || normalizedEmail,
      });
    }

    // Also check users collection as fallback
    let usersSnapshot = await db
      .collection('users')
      .where('preferredEmail', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userData = usersSnapshot.docs[0].data();
      const firstName = userData.firstName || '';
      const lastName = userData.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || userData.nickname || '';

      console.log('[ValidateEmail] Found in users (preferredEmail):', normalizedEmail);
      return res.status(200).json({
        isValid: true,
        name: name || normalizedEmail,
      });
    }

    // Try email field in users collection
    usersSnapshot = await db
      .collection('users')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userData = usersSnapshot.docs[0].data();
      const firstName = userData.firstName || '';
      const lastName = userData.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || userData.nickname || '';

      console.log('[ValidateEmail] Found in users (email):', normalizedEmail);
      return res.status(200).json({
        isValid: true,
        name: name || normalizedEmail,
      });
    }

    // User not found
    console.log('[ValidateEmail] Email not found:', normalizedEmail);
    return res.status(200).json({
      isValid: false,
    });

  } catch (error: any) {
    console.error('[ValidateEmail] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

