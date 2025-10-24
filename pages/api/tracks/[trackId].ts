/**
 * Public API endpoint to get track details
 * GET /api/tracks/[trackId]
 * 
 * This is a public endpoint - no authentication required
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';
import { SPONSOR_COLLECTIONS } from '../../../lib/sponsor/collections';

initializeApi();
const db = firestore();

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { trackId } = req.query;

  if (!trackId || typeof trackId !== 'string') {
    return res.status(400).json({ error: 'Invalid track ID' });
  }

  try {
    console.log('[/api/tracks/[id]] Fetching track:', trackId);

    // Try to find track by document ID first
    let trackDoc = await db.collection(SPONSOR_COLLECTIONS.TRACKS).doc(trackId).get();

    // If not found by doc ID, try to find by trackId field
    if (!trackDoc.exists) {
      console.log('[/api/tracks/[id]] Not found by doc ID, trying trackId field...');
      const trackQuery = await db
        .collection(SPONSOR_COLLECTIONS.TRACKS)
        .where('trackId', '==', trackId)
        .limit(1)
        .get();

      if (trackQuery.empty) {
        console.log('[/api/tracks/[id]] Track not found:', trackId);
        return res.status(404).json({ error: 'Track not found' });
      }

      trackDoc = trackQuery.docs[0];
    }

    const trackData = trackDoc.data()!;

    // Only return active tracks to public
    if (trackData.status !== 'active') {
      console.log('[/api/tracks/[id]] Track not active:', trackId);
      return res.status(404).json({ error: 'Track not found' });
    }

    // Get all published challenges for this track
    const challengesQuery = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .where('trackId', '==', trackData.trackId || trackId)
      .where('status', '==', 'published')
      .get();

    const challenges = challengesQuery.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || data.name,
        description: data.description || '',
        prizes: data.prizes || [],
        submissionRequirements: data.submissionRequirements || '',
        evaluationCriteria: data.evaluationCriteria || [],
        trackId: data.trackId,
      };
    });

    // Calculate total prize
    let totalPrize = 0;
    challenges.forEach((challenge) => {
      if (Array.isArray(challenge.prizes)) {
        challenge.prizes.forEach((prize: any) => {
          if (typeof prize === 'object' && prize.amount) {
            // Convert TWD to USD (rough estimate: 1 USD = 30 TWD)
            const amount = prize.currency === 'TWD' ? prize.amount / 30 : prize.amount;
            totalPrize += amount;
          }
        });
      }
    });

    // Format response
    const response = {
      id: trackDoc.id,
      name: trackData.name,
      description: trackData.description || '',
      sponsorName: trackData.sponsorName || '',
      sponsorId: trackData.sponsorId || '',
      totalPrize: Math.round(totalPrize),
      challenges: challenges,
      status: trackData.status,
    };

    console.log('[/api/tracks/[id]] Track found:', response.name, 'with', challenges.length, 'challenges');

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('[/api/tracks/[id]] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch track details',
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
