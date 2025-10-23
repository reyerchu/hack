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

interface Challenge {
  id: string;
  title: string;
  description?: string;
  prizes?: any;
  submissionRequirements?: string;
}

interface Track {
  id: string;
  name: string;
  description?: string;
  sponsorName?: string;
  trackId?: string;
  totalPrize?: number;
  challenges?: Challenge[];
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
    const tracksSnapshot = await db.collection('tracks').where('status', '==', 'active').get();

    console.log('[GetAllTracks] Found tracks:', tracksSnapshot.size);

    // Fetch all challenges from extended-challenges collection
    // Note: Firestore doesn't support OR queries, so we fetch published or active
    const challengesSnapshot = await db.collection('extended-challenges').get();

    console.log('[GetAllTracks] Total challenges in DB:', challengesSnapshot.size);

    // Group challenges by trackId
    const challengesByTrack: { [key: string]: Challenge[] } = {};
    let challengeCount = 0;

    challengesSnapshot.docs.forEach((doc) => {
      const data = doc.data();

      // Only include challenges with:
      // 1. Valid title
      // 2. Valid trackId
      // 3. Status is 'published' or 'active'
      const hasValidStatus = data.status === 'published' || data.status === 'active';

      if (data.title && data.trackId && hasValidStatus) {
        const challenge: Challenge = {
          id: doc.id,
          title: data.title,
          description: data.description || '',
          prizes: data.prizes,
          submissionRequirements: data.submissionRequirements || '',
        };

        if (!challengesByTrack[data.trackId]) {
          challengesByTrack[data.trackId] = [];
        }
        challengesByTrack[data.trackId].push(challenge);
        challengeCount++;

        console.log(`[GetAllTracks] Added challenge "${data.title}" to track "${data.trackId}"`);
      } else {
        // Log why challenge was skipped
        if (!data.title) {
          console.log(`[GetAllTracks] Skipped challenge ${doc.id}: no title`);
        } else if (!data.trackId) {
          console.log(`[GetAllTracks] Skipped challenge "${data.title}": no trackId`);
        } else if (!hasValidStatus) {
          console.log(
            `[GetAllTracks] Skipped challenge "${data.title}": status is "${data.status}" (not published/active)`,
          );
        }
      }
    });

    console.log('[GetAllTracks] Total challenges added:', challengeCount);
    console.log(
      '[GetAllTracks] Challenges by track:',
      Object.keys(challengesByTrack)
        .map((trackId) => `${trackId}: ${challengesByTrack[trackId].length} challenges`)
        .join(', '),
    );

    // Build tracks list with challenges and totalPrize
    const tracks: Track[] = tracksSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        const trackId = data.trackId || doc.id;
        const challenges = challengesByTrack[trackId] || [];

        console.log(
          `[GetAllTracks] Processing track: docId=${doc.id}, trackId=${trackId}, name=${data.name}`,
        );

        // Calculate total prize
        let totalPrize = 0;
        challenges.forEach((challenge) => {
          if (challenge.prizes) {
            // New structured format: Array of objects with { currency, amount, description }
            if (
              Array.isArray(challenge.prizes) &&
              challenge.prizes.length > 0 &&
              typeof challenge.prizes[0] === 'object' &&
              challenge.prizes[0].amount !== undefined
            ) {
              challenge.prizes.forEach((prize: any) => {
                if (prize.amount && typeof prize.amount === 'number') {
                  // Convert TWD to USD equivalent (1 USD ≈ 30 TWD)
                  if (prize.currency === 'TWD') {
                    totalPrize += prize.amount / 30;
                  } else {
                    totalPrize += prize.amount;
                  }
                }
              });
            }
            // Old format: Parse prize string
            else if (typeof challenge.prizes === 'string') {
              const prizeMatches = challenge.prizes.match(/(\d+)u?/gi);
              if (prizeMatches) {
                prizeMatches.forEach((match: string) => {
                  const amount = parseInt(match.replace(/u/gi, ''));
                  if (!isNaN(amount)) {
                    totalPrize += amount;
                  }
                });
              }
            }
            // Old format: Array of strings or numbers
            else if (Array.isArray(challenge.prizes)) {
              challenge.prizes.forEach((prize: any) => {
                if (typeof prize === 'number') {
                  totalPrize += prize;
                } else if (typeof prize === 'string') {
                  const prizeMatches = prize.match(/(\d+)u?/gi);
                  if (prizeMatches) {
                    prizeMatches.forEach((match: string) => {
                      const amount = parseInt(match.replace(/u/gi, ''));
                      if (!isNaN(amount)) {
                        totalPrize += amount;
                      }
                    });
                  }
                }
              });
            }
            // Old format: Direct number
            else if (typeof challenge.prizes === 'number') {
              totalPrize += challenge.prizes;
            }
          }
        });

        return {
          id: doc.id, // 使用文档 ID 作为主 ID（用于 URL）
          name: data.name || data.trackId || 'Unnamed Track',
          description: data.description || '',
          sponsorName: data.sponsorName || '',
          trackId: trackId, // 保留 trackId 字段（用于查询挑战）
          totalPrize: Math.round(totalPrize),
          challenges: challenges,
        };
      })
      .filter((track) => track.name && track.name !== 'Unnamed Track');

    // 自定義排序：imToken 第一，AWS 最後，其他按總獎金排序
    tracks.sort((a, b) => {
      const aIsImToken =
        a.sponsorName?.toLowerCase().includes('imtoken') ||
        a.name?.toLowerCase().includes('imtoken');
      const bIsImToken =
        b.sponsorName?.toLowerCase().includes('imtoken') ||
        b.name?.toLowerCase().includes('imtoken');
      const aIsAWS =
        a.sponsorName?.toLowerCase().includes('aws') || a.name?.toLowerCase().includes('aws');
      const bIsAWS =
        b.sponsorName?.toLowerCase().includes('aws') || b.name?.toLowerCase().includes('aws');

      // imToken 永遠第一
      if (aIsImToken && !bIsImToken) return -1;
      if (!aIsImToken && bIsImToken) return 1;

      // AWS 永遠最後
      if (aIsAWS && !bIsAWS) return 1;
      if (!aIsAWS && bIsAWS) return -1;

      // 其他按總獎金排序（高到低），相同則按名稱
      if ((b.totalPrize || 0) !== (a.totalPrize || 0)) {
        return (b.totalPrize || 0) - (a.totalPrize || 0);
      }
      return a.name.localeCompare(b.name);
    });

    console.log('[GetAllTracks] Returning tracks:', tracks.length, '(imToken 第一, AWS 最後)');
    tracks.forEach((track) => {
      console.log(
        `  - ${track.name}: ${track.challenges?.length || 0} challenges, ${
          track.totalPrize
        } USD (id: ${track.id}, trackId: ${track.trackId})`,
      );
    });

    // Set cache control headers to ensure fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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
