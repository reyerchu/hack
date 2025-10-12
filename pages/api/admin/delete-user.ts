import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';

initializeApi();

const admin = require('firebase-admin');
const db = admin.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed. Use DELETE.' });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, message: 'userId parameter is required' });
  }

  try {
    console.log(`Attempting to delete user: ${userId}`);

    // Get user data before deletion for logging
    const userDoc = await db.collection('registrations').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `User ${userId} not found`,
      });
    }

    const userData = userDoc.data();
    const firstName = userData.user?.firstName || userData.firstName || '';
    const lastName = userData.user?.lastName || userData.lastName || '';
    const email = userData.preferredEmail || userData.user?.preferredEmail || '';

    // Delete from registrations collection
    await db.collection('registrations').doc(userId).delete();
    console.log(`✅ Deleted user ${userId} from /registrations`);

    // Also try to delete from Firebase Auth (if exists)
    try {
      await admin.auth().deleteUser(userId);
      console.log(`✅ Deleted user ${userId} from Firebase Auth`);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.log(
          `ℹ️  User ${userId} not found in Firebase Auth (already deleted or never existed)`,
        );
      } else {
        console.warn(`⚠️  Could not delete user from Firebase Auth: ${authError.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `User deleted successfully`,
      deletedUser: {
        id: userId,
        name: `${firstName} ${lastName}`,
        email,
      },
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
}
