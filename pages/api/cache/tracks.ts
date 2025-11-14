/**
 * API: /api/cache/tracks
 * Cached tracks data with 10-minute TTL
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';
import memoryCache from '../../../lib/cache/memoryCache';

initializeApi();
const db = firestore();

const CACHE_KEY = 'tracks:all:active';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tracksData = await memoryCache.getOrSet(
      CACHE_KEY,
      async () => {
        console.log('[API] Cache miss: Fetching tracks from Firestore...');
        const tracksSnapshot = await db.collection('tracks').where('status', '==', 'active').get();

        const tracks = tracksSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return tracks;
      },
      CACHE_TTL,
    );

    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    return res.status(200).json({
      success: true,
      data: tracksData,
      count: tracksData.length,
      cached: true,
    });
  } catch (error) {
    console.error('[API] Error fetching tracks:', error);
    return res.status(500).json({ error: 'Failed to fetch tracks data' });
  }
}
