import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import firebase from 'firebase-admin';

initializeApi();
const db = firebase.firestore();

/**
 * API endpoint to submit team registration
 * 
 * POST /api/team-register/submit
 * 
 * Request body:
 * {
 *   teamName: string,
 *   teamMembers: string[],  // array of emails
 *   challenges: string[],    // array of challenge IDs
 *   agreedToCommitment: boolean
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   registrationId?: string,
 *   message?: string
 * }
 */

interface SubmitRequest {
  teamName: string;
  teamMembers: string[];
  challenges: string[];
  agreedToCommitment: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const userId = decodedToken.uid;

    // Get request body
    const { teamName, teamMembers, challenges, agreedToCommitment } = req.body as SubmitRequest;

    // Validation
    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ error: '團隊名稱為必填項' });
    }

    if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
      return res.status(400).json({ error: '請至少添加一位隊友' });
    }

    if (teamMembers.length > 5) {
      return res.status(400).json({ error: '團隊成員最多 5 人' });
    }

    if (!Array.isArray(challenges) || challenges.length === 0) {
      return res.status(400).json({ error: '請至少選擇一個挑戰' });
    }

    if (!agreedToCommitment) {
      return res.status(400).json({ error: '請閱讀並同意參賽者承諾書' });
    }

    // Validate all team member emails are registered
    const normalizedEmails = teamMembers.map(email => email.trim().toLowerCase());
    const uniqueEmails = [...new Set(normalizedEmails)];

    if (uniqueEmails.length !== normalizedEmails.length) {
      return res.status(400).json({ error: '隊友 Email 不可重複' });
    }

    // Check each email
    for (const email of uniqueEmails) {
      const userSnapshot = await db
        .collection('registrations')
        .where('user.preferredEmail', '==', email)
        .limit(1)
        .get();

      if (userSnapshot.empty) {
        // Also check users collection
        const usersSnapshot = await db
          .collection('users')
          .where('preferredEmail', '==', email)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          return res.status(400).json({ 
            error: `隊友 Email ${email} 尚未註冊` 
          });
        }
      }
    }

    // Get user info
    const userDoc = await db.collection('registrations').doc(userId).get();
    let userName = '';
    let userEmail = '';

    if (userDoc.exists) {
      const userData = userDoc.data();
      userName = `${userData?.user?.firstName || ''} ${userData?.user?.lastName || ''}`.trim() || 
                 userData?.user?.nickname || '';
      userEmail = userData?.user?.preferredEmail || '';
    }

    // Validate challenges exist
    const challengeDetails: any[] = [];
    for (const challengeId of challenges) {
      const challengeDoc = await db.collection('extended-challenges').doc(challengeId).get();
      
      if (!challengeDoc.exists) {
        return res.status(400).json({ 
          error: `挑戰 ${challengeId} 不存在` 
        });
      }

      const challengeData = challengeDoc.data();
      challengeDetails.push({
        id: challengeId,
        title: challengeData?.title || '',
        track: challengeData?.track || '',
        sponsorName: challengeData?.sponsorName || '',
      });
    }

    // Create team registration document
    const registrationData = {
      teamName: teamName.trim(),
      teamLeader: {
        userId: userId,
        name: userName,
        email: userEmail,
      },
      teamMembers: uniqueEmails,
      challenges: challengeDetails,
      agreedToCommitment: true,
      status: 'pending', // pending, approved, rejected
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      submittedBy: userId,
    };

    const docRef = await db.collection('team-registrations').add(registrationData);

    // Log activity
    try {
      await db.collection('activity-logs').add({
        userId: userId,
        action: 'team_registration_submit',
        resourceType: 'team_registration',
        resourceId: docRef.id,
        teamName: teamName.trim(),
        memberCount: uniqueEmails.length,
        challengeCount: challenges.length,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[SubmitTeamRegistration] Failed to log activity:', logError);
    }

    return res.status(200).json({
      success: true,
      registrationId: docRef.id,
      message: '團隊報名成功！我們會盡快審核您的申請。',
    });

  } catch (error: any) {
    console.error('[SubmitTeamRegistration] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

