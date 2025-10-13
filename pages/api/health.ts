import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../lib/admin/init';

initializeApi();

/**
 * Health check endpoint to monitor Firebase Admin SDK status
 *
 * This endpoint ensures Firebase Admin SDK is properly initialized
 * and can connect to Firestore.
 *
 * Route: /api/health
 *
 * Returns:
 * - 200 OK: Firebase is working properly
 * - 500 Error: Firebase initialization failed
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test Firestore connection
    const db = firestore();
    const testDoc = await db.collection('registrations').limit(1).get();

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      firebase: {
        adminSDK: 'connected',
        firestore: 'connected',
        documentsAccessible: testDoc.size > 0,
      },
    });
  } catch (error) {
    console.error('❌ CRITICAL: Firebase Admin SDK Health Check Failed!', error);

    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      firebase: {
        adminSDK: 'failed',
        error: error.message,
      },
      message: 'Firebase Admin SDK is not working. Users will be redirected to /register on login!',
    });
  }
}
