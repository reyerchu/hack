/**
 * API endpoint for sponsors to view all team submissions for a challenge
 * GET /api/sponsor/challenges/[challengeId]/submissions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';
import { requireAuth, ApiResponse, AuthenticatedRequest } from '../../../../../lib/sponsor/middleware';

initializeApi();
const db = firestore();

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Use unified authentication middleware
    if (!(await requireAuth(req, res))) return;

    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const userEmail = authReq.userEmail!;
    const permissions = authReq.userPermissions || [];

    // Get challengeId from query
    const { challengeId } = req.query;
    if (!challengeId || typeof challengeId !== 'string') {
      return res.status(400).json({ error: 'Missing challengeId' });
    }

    // Verify user is a sponsor
    if (!permissions.includes('sponsor') && !permissions.includes('admin') && !permissions.includes('super_admin')) {
      return res.status(403).json({ error: 'Not authorized as sponsor' });
    }

    // Get challenge details to verify it belongs to this sponsor
    const challengeDoc = await db.collection('extended-challenges').doc(challengeId).get();
    if (!challengeDoc.exists) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challengeData = challengeDoc.data()!;

    // Verify sponsor owns this challenge (through track)
    if (challengeData.trackId) {
      const trackDoc = await db.collection('tracks').doc(challengeData.trackId).get();
      if (trackDoc.exists) {
        const trackData = trackDoc.data()!;
        if (trackData.sponsorEmail !== userEmail && trackData.sponsorId !== userId) {
          return res.status(403).json({ error: 'Not authorized to view this challenge submissions' });
        }
      }
    }

    // Get all submissions for this challenge
    const submissionsSnapshot = await db
      .collection('team-challenge-submissions')
      .where('challengeId', '==', challengeId)
      .get();

    // Convert Firestore timestamps to ISO strings
    const formatTimestamp = (ts: any) => {
      if (!ts) return null;
      if (ts.toDate) return ts.toDate().toISOString();
      if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
      return ts;
    };

    const submissions = submissionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: formatTimestamp(data.submittedAt),
        updatedAt: formatTimestamp(data.updatedAt),
      };
    });

    // Sort by submittedAt in descending order (newest first) in JavaScript
    submissions.sort((a, b) => {
      const dateA = new Date(a.submittedAt || 0).getTime();
      const dateB = new Date(b.submittedAt || 0).getTime();
      return dateB - dateA; // Descending order
    });

    console.log(`[SponsorSubmissions] Found ${submissions.length} submissions for challenge ${challengeId}`);

    return res.status(200).json({
      success: true,
      data: {
        challenge: {
          id: challengeDoc.id,
          title: challengeData.title,
          description: challengeData.description,
        },
        submissions,
        total: submissions.length,
      },
    });

  } catch (error: any) {
    console.error('[SponsorSubmissions] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch submissions',
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

