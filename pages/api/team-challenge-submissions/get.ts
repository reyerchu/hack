/**
 * API endpoint for getting team challenge submission
 * GET /api/team-challenge-submissions/get?teamId=xxx&challengeId=xxx
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';
import admin from 'firebase-admin';

initializeApi();
const db = firestore();

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { teamId, challengeId } = req.query;

    // Validate input
    if (!teamId || !challengeId || typeof teamId !== 'string' || typeof challengeId !== 'string') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user has permission to view this team's submission
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data()!;
    const userEmail = decodedToken.email?.toLowerCase();
    const userHasPermission = 
      teamData.teamLeader?.userId === userId ||
      teamData.teamLeader?.email?.toLowerCase() === userEmail ||
      teamData.teamMembers?.some((member: any) => 
        member.email?.toLowerCase() === userEmail
      );

    if (!userHasPermission) {
      return res.status(403).json({ error: 'No permission to view this team submission' });
    }

    // Get submission
    const submissionsSnapshot = await db
      .collection('team-challenge-submissions')
      .where('teamId', '==', teamId)
      .where('challengeId', '==', challengeId)
      .limit(1)
      .get();

    if (submissionsSnapshot.empty) {
      return res.status(404).json({ error: 'No submission found' });
    }

    const submissionDoc = submissionsSnapshot.docs[0];
    const submissionData = submissionDoc.data();

    // Convert Firestore timestamps to ISO strings
    const formatTimestamp = (ts: any) => {
      if (!ts) return null;
      if (ts.toDate) return ts.toDate().toISOString();
      if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
      return ts;
    };

    const response = {
      id: submissionDoc.id,
      ...submissionData,
      submittedAt: formatTimestamp(submissionData.submittedAt),
      updatedAt: formatTimestamp(submissionData.updatedAt),
    };

    console.log(`[GetSubmission] Found submission for team ${teamId}, challenge ${challengeId}`);

    return res.status(200).json({
      success: true,
      data: response,
    });

  } catch (error: any) {
    console.error('[GetSubmission] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get submission',
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

