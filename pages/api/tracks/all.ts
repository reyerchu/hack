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
    const tracksSnapshot = await db
      .collection('tracks')
      .where('status', '==', 'active')
      .get();

    // Fetch all challenges from extended-challenges collection
    const challengesSnapshot = await db
      .collection('extended-challenges')
      .get();

    // Group challenges by trackId
    const challengesByTrack: { [key: string]: Challenge[] } = {};
    challengesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Only include challenges with a valid title
      if (data.title && data.trackId) {
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
      }
    });

    // Build tracks list with challenges and totalPrize
    const tracks: Track[] = tracksSnapshot.docs.map((doc) => {
      const data = doc.data();
      const trackId = data.trackId || doc.id;
      const challenges = challengesByTrack[trackId] || [];
      
      // Calculate total prize
      let totalPrize = 0;
      challenges.forEach((challenge) => {
        if (challenge.prizes) {
          // New structured format: Array of objects with { currency, amount, description }
          if (Array.isArray(challenge.prizes) && challenge.prizes.length > 0 && typeof challenge.prizes[0] === 'object' && challenge.prizes[0].amount !== undefined) {
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
        id: trackId,
        name: data.name || data.trackId || 'Unnamed Track',
        description: data.description || '',
        sponsorName: data.sponsorName || '',
        trackId: trackId,
        totalPrize: Math.round(totalPrize),
        challenges: challenges,
      };
    }).filter(track => track.name && track.name !== 'Unnamed Track');

    // Sort by total prize (highest first), then by name
    tracks.sort((a, b) => {
      if ((b.totalPrize || 0) !== (a.totalPrize || 0)) {
        return (b.totalPrize || 0) - (a.totalPrize || 0);
      }
      return a.name.localeCompare(b.name);
    });

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

