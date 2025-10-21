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
    console.log('[ValidateEmail] Request body:', JSON.stringify(req.body));
    console.log('[ValidateEmail] Request body type:', typeof req.body);
    console.log('[ValidateEmail] Content-Type:', req.headers['content-type']);
    
    const { email } = req.body;
    console.log('[ValidateEmail] Extracted email:', email);

    if (!email || typeof email !== 'string' || !email.trim()) {
      console.log('[ValidateEmail] Email validation failed:', { email, type: typeof email });
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
      const doc = userSnapshot.docs[0];
      const userData = doc.data();
      const firstName = userData.user?.firstName || '';
      const lastName = userData.user?.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || userData.user?.nickname || '';

      console.log('[ValidateEmail] Found in registrations (user.preferredEmail):', normalizedEmail);
      return res.status(200).json({
        isValid: true,
        name: name || normalizedEmail,
        userId: doc.id,
      });
    }

    // Try user.email
    userSnapshot = await db
      .collection('registrations')
      .where('user.email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!userSnapshot.empty) {
      const doc = userSnapshot.docs[0];
      const userData = doc.data();
      const firstName = userData.user?.firstName || '';
      const lastName = userData.user?.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || userData.user?.nickname || '';

      console.log('[ValidateEmail] Found in registrations (user.email):', normalizedEmail);
      return res.status(200).json({
        isValid: true,
        name: name || normalizedEmail,
        userId: doc.id,
      });
    }

    // Try email field directly
    userSnapshot = await db
      .collection('registrations')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!userSnapshot.empty) {
      const doc = userSnapshot.docs[0];
      const userData = doc.data();
      const firstName = userData.user?.firstName || userData.firstName || '';
      const lastName = userData.user?.lastName || userData.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || userData.user?.nickname || userData.nickname || '';

      console.log('[ValidateEmail] Found in registrations (email):', normalizedEmail);
      return res.status(200).json({
        isValid: true,
        name: name || normalizedEmail,
        userId: doc.id,
      });
    }

    // Also check users collection as fallback
    let usersSnapshot = await db
      .collection('users')
      .where('preferredEmail', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const doc = usersSnapshot.docs[0];
      const userData = doc.data();
      const firstName = userData.firstName || '';
      const lastName = userData.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || userData.nickname || '';

      console.log('[ValidateEmail] Found in users (preferredEmail):', normalizedEmail);
      return res.status(200).json({
        isValid: true,
        name: name || normalizedEmail,
        userId: doc.id,
      });
    }

    // Try email field in users collection
    usersSnapshot = await db
      .collection('users')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const doc = usersSnapshot.docs[0];
      const userData = doc.data();
      const firstName = userData.firstName || '';
      const lastName = userData.lastName || '';
      const name = `${firstName} ${lastName}`.trim() || userData.nickname || '';

      console.log('[ValidateEmail] Found in users (email):', normalizedEmail);
      return res.status(200).json({
        isValid: true,
        name: name || normalizedEmail,
        userId: doc.id,
      });
    }

    // LAST RESORT: Scan all documents if indexed queries failed
    console.log('[ValidateEmail] ⚠️ All indexed queries failed. Starting full collection scan...');
    
    // Scan registrations collection
    const allRegistrations = await db.collection('registrations').get();
    console.log(`[ValidateEmail] Scanning ${allRegistrations.size} registration documents...`);
    
    for (const doc of allRegistrations.docs) {
      const data = doc.data();
      const emails = [
        data.email,
        data.user?.email,
        data.user?.preferredEmail,
      ].filter(e => e).map(e => e.toLowerCase().trim());
      
      if (emails.includes(normalizedEmail)) {
        const firstName = data.user?.firstName || data.firstName || '';
        const lastName = data.user?.lastName || data.lastName || '';
        const name = `${firstName} ${lastName}`.trim() || data.user?.nickname || data.nickname || '';
        
        console.log('[ValidateEmail] ✅ FOUND by full scan in registrations:', normalizedEmail);
        console.log('[ValidateEmail] Document ID:', doc.id);
        
        return res.status(200).json({
          isValid: true,
          name: name || normalizedEmail,
          userId: doc.id,
        });
      }
    }
    
    // Scan users collection
    const allUsers = await db.collection('users').get();
    console.log(`[ValidateEmail] Scanning ${allUsers.size} user documents...`);
    
    for (const doc of allUsers.docs) {
      const data = doc.data();
      const emails = [
        data.email,
        data.preferredEmail,
      ].filter(e => e).map(e => e.toLowerCase().trim());
      
      if (emails.includes(normalizedEmail)) {
        const firstName = data.firstName || '';
        const lastName = data.lastName || '';
        const name = `${firstName} ${lastName}`.trim() || data.nickname || '';
        
        console.log('[ValidateEmail] ✅ FOUND by full scan in users:', normalizedEmail);
        console.log('[ValidateEmail] Document ID:', doc.id);
        
        return res.status(200).json({
          isValid: true,
          name: name || normalizedEmail,
          userId: doc.id,
        });
      }
    }

    // User not found even after full scan
    console.log('[ValidateEmail] ❌ Email not found even after full collection scan:', normalizedEmail);
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

