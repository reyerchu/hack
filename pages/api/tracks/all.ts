import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import firebase from 'firebase-admin';

initializeApi();
const db = firebase.firestore();

/**
 * API endpoint to get all available tracks for team registration
 * 
 * GET /api/tracks/all
 * 
 * Response:
 * {
 *   data: Track[]
 * }
 */

interface Track {
  id: string;
  name: string;
  description?: string;
  sponsorName?: string;
  trackId?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Fetch all active tracks from the tracks collection
    const tracksSnapshot = await db
      .collection('tracks')
      .where('status', '==', 'active')
      .get();

    // Build tracks list
    const tracks: Track[] = tracksSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.trackId || doc.id,
        name: data.name || data.trackId || 'Unnamed Track',
        description: data.description || '',
        sponsorName: data.sponsorName || '',
        trackId: data.trackId || doc.id,
      };
    }).filter(track => track.name && track.name !== 'Unnamed Track');

    // Sort by name
    tracks.sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({
      data: tracks,
    });

  } catch (error: any) {
    console.error('[GetAllTracks] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

