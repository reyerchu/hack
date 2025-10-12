import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../lib/admin/init';

initializeApi();

const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Migration API to add timestamp to existing registrations
 *
 * This script will:
 * 1. Find all registrations without timestamp
 * 2. Add timestamp based on Firestore document creation time
 * 3. If creation time unavailable, use a default fallback
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.',
    });
  }

  try {
    console.log('Starting timestamp migration...');

    // 1. Get all registrations
    const registrationsSnapshot = await db.collection('/registrations').get();

    let total = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // 2. Iterate through all registrations
    for (const doc of registrationsSnapshot.docs) {
      total++;
      const data = doc.data();

      // Skip if timestamp already exists
      if (data.timestamp) {
        skipped++;
        continue;
      }

      try {
        // Get document metadata to find creation time
        const docMetadata = await doc.ref.get();
        const createTime = docMetadata.createTime;

        // Convert Firestore Timestamp to milliseconds
        let timestamp: number;
        if (createTime) {
          timestamp = createTime.toMillis();
        } else {
          // Fallback: use a default date (October 1, 2024)
          // You can adjust this based on your hackathon start date
          timestamp = new Date('2024-10-01').getTime();
          console.log(`User ${doc.id}: Using fallback timestamp`);
        }

        // Update the document with timestamp
        await doc.ref.update({ timestamp });
        updated++;

        if (updated % 10 === 0) {
          console.log(`Progress: ${updated}/${total} updated`);
        }
      } catch (error: any) {
        errors.push(`User ${doc.id}: Failed - ${error.message}`);
        console.error(`Failed to update user ${doc.id}:`, error);
      }
    }

    console.log('Migration completed!');

    // 3. Return statistics
    return res.status(200).json({
      success: true,
      message: 'Migration completed',
      stats: {
        total,
        updated,
        skipped,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Return first 10 errors
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
    });
  }
}
