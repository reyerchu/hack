/**
 * Public API endpoint to get challenge details
 * GET /api/challenges/[challengeId]
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
  const { challengeId } = req.query;

  if (!challengeId || typeof challengeId !== 'string') {
    return res.status(400).json({ error: 'Invalid challenge ID' });
  }

  try {
    console.log('[/api/challenges/[id]] Fetching challenge:', challengeId);

    // Get challenge from extended-challenges collection
    const challengeDoc = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES)
      .doc(challengeId)
      .get();

    if (!challengeDoc.exists) {
      console.log('[/api/challenges/[id]] Challenge not found:', challengeId);
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challengeData = challengeDoc.data()!;

    // Only return published challenges to public
    if (challengeData.status !== 'published') {
      console.log('[/api/challenges/[id]] Challenge not published:', challengeId);
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Get track info if trackId exists
    let trackInfo = null;
    if (challengeData.trackId) {
      const trackDoc = await db
        .collection(SPONSOR_COLLECTIONS.TRACKS)
        .where('trackId', '==', challengeData.trackId)
        .limit(1)
        .get();

      if (!trackDoc.empty) {
        const trackData = trackDoc.docs[0].data();
        trackInfo = {
          id: trackDoc.docs[0].id,
          trackId: trackData.trackId,
          name: trackData.name,
          sponsorName: trackData.sponsorName,
        };
      }
    }

    // Format response
    const response = {
      id: challengeDoc.id,
      title: challengeData.title || challengeData.name,
      description: challengeData.description || '',
      prizes: challengeData.prizes || [],
      submissionRequirements: challengeData.submissionRequirements || '',
      evaluationCriteria: challengeData.evaluationCriteria || [],
      trackId: challengeData.trackId || '',
      track: trackInfo,
      sponsorName: challengeData.sponsorName || trackInfo?.sponsorName || '',
      status: challengeData.status,
    };

    console.log('[/api/challenges/[id]] Challenge found:', response.title);

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('[/api/challenges/[id]] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch challenge details',
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

