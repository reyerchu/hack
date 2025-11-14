/**
 * API: /api/cache/winners
 * Cached winners data with 5-minute TTL
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { winnersData } from '../../../lib/winnersData';
import memoryCache from '../../../lib/cache/memoryCache';

const CACHE_KEY = 'winners:data';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cachedData = await memoryCache.getOrSet(
      CACHE_KEY,
      async () => {
        console.log('[API] Cache miss: Fetching winners data...');
        return winnersData;
      },
      CACHE_TTL,
    );

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      success: true,
      data: cachedData,
      cached: true,
    });
  } catch (error) {
    console.error('[API] Error fetching winners:', error);
    return res.status(500).json({ error: 'Failed to fetch winners data' });
  }
}
