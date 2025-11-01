/**
 * API endpoint for submitting challenge submissions
 * POST /api/team-challenge-submissions/submit
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';
import admin from 'firebase-admin';

initializeApi();
const db = firestore();

interface SubmissionItem {
  type: 'file' | 'link' | 'checkbox' | 'text';
  description: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  value?: string;
  checked?: boolean;
}

interface SubmitRequest {
  teamId: string;
  challengeId: string;
  trackId?: string;
  submissions: SubmissionItem[];
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    const { teamId, challengeId, trackId, submissions } = req.body as SubmitRequest;

    // Validate input
    if (!teamId || !challengeId || !Array.isArray(submissions)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user has permission to submit for this team
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();
    if (!teamDoc.exists) {
      console.log(`[SubmitChallenge] Team not found: ${teamId}`);
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data()!;
    const normalizedEmail = userEmail?.toLowerCase();
    const userHasPermission = 
      teamData.teamLeader?.email?.toLowerCase() === normalizedEmail ||
      teamData.teamLeader?.userId === userId ||
      teamData.teamMembers?.some((member: any) => 
        member.email?.toLowerCase() === normalizedEmail && member.hasEditRight === true
      );

    if (!userHasPermission) {
      console.log(`[SubmitChallenge] User ${userId} has no permission for team ${teamId}`);
      return res.status(403).json({ error: 'No permission to submit for this team' });
    }

    console.log(`[SubmitChallenge] User ${userId} submitting to team ${teamId}, challenge ${challengeId}`);

    // Create submission document
    const submissionData = {
      teamId,
      teamName: teamData.teamName,
      challengeId,
      trackId: trackId || null,
      submissions,
      submittedBy: {
        userId,
        email: userEmail,
        name: decodedToken.name || userEmail,
      },
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'submitted',
    };

    // Check if submission already exists
    const existingSubmissions = await db
      .collection('team-challenge-submissions')
      .where('teamId', '==', teamId)
      .where('challengeId', '==', challengeId)
      .limit(1)
      .get();

    let submissionRef;
    if (!existingSubmissions.empty) {
      // Update existing submission
      submissionRef = existingSubmissions.docs[0].ref;
      await submissionRef.update(submissionData);
      console.log('[SubmitChallenge] Updated submission:', submissionRef.id);
    } else {
      // Create new submission
      submissionRef = await db.collection('team-challenge-submissions').add(submissionData);
      console.log('[SubmitChallenge] Created submission:', submissionRef.id);
    }

    return res.status(200).json({
      success: true,
      submissionId: submissionRef.id,
      message: 'Submission successful',
    });

  } catch (error: any) {
    console.error('[SubmitChallenge] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to submit',
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

