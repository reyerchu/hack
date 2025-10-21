import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import firebase from 'firebase-admin';

initializeApi();
const db = firebase.firestore();

/**
 * API endpoint to get all available challenges for team registration
 * 
 * GET /api/challenges/all
 * 
 * Response:
 * {
 *   data: Challenge[]
 * }
 */

interface Challenge {
  id: string;
  title: string;
  track?: string;
  sponsorName?: string;
  organization?: string;
  status?: string;
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

    // Fetch all published challenges from extended-challenges collection
    const challengesSnapshot = await db
      .collection('extended-challenges')
      .where('status', '==', 'published')
      .get();

    const challenges: Challenge[] = challengesSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        // Filter out track-only records (must have title or challengeId)
        const hasTitle = data.title && data.title.trim() !== '';
        const hasChallengeId = data.challengeId && data.challengeId.trim() !== '';
        return hasTitle || hasChallengeId;
      })
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || data.challengeId || '未命名挑戰',
          track: data.track || data.trackId || '',
          sponsorName: data.sponsorName || '',
          organization: data.organization || '',
          status: data.status || 'published',
        };
      })
      .sort((a, b) => {
        // Sort by track first, then by title
        const trackCompare = (a.track || '').localeCompare(b.track || '');
        if (trackCompare !== 0) return trackCompare;
        return a.title.localeCompare(b.title);
      });

    return res.status(200).json({
      data: challenges,
    });

  } catch (error: any) {
    console.error('[GetAllChallenges] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

