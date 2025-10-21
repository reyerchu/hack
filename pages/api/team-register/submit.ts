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
 *   teamLeader: { email: string, name: string, role: string, hasEditRight: boolean },
 *   teamMembers: [{ email: string, name: string, role: string, hasEditRight: boolean }],
 *   tracks: string[],  // array of track IDs
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

interface TeamMember {
  email: string;
  name?: string;
  role: string;
  hasEditRight: boolean;
}

interface SubmitRequest {
  teamName: string;
  teamLeader: TeamMember & { userId?: string };
  teamMembers: TeamMember[];
  tracks: string[];
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
    const { teamName, teamLeader, teamMembers, tracks, agreedToCommitment } = req.body as SubmitRequest;

    // Validation
    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ error: '團隊名稱為必填項' });
    }

    if (!teamLeader || !teamLeader.email || !teamLeader.role) {
      return res.status(400).json({ error: '團隊領導者資訊不完整' });
    }

    if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
      return res.status(400).json({ error: '請至少添加一位團隊成員' });
    }

    if (teamMembers.length > 10) {
      return res.status(400).json({ error: '團隊成員最多 10 人（不含領導者）' });
    }

    // Validate all team members have required fields
    for (let i = 0; i < teamMembers.length; i++) {
      const member = teamMembers[i];
      if (!member.email || !member.role) {
        return res.status(400).json({ 
          error: `第 ${i + 1} 位成員的資訊不完整（需要 Email 和角色）` 
        });
      }
    }

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({ error: '請至少選擇一個賽道' });
    }

    if (!agreedToCommitment) {
      return res.status(400).json({ error: '請閱讀並同意參賽者承諾書' });
    }

    // Validate all team member emails are registered
    const memberEmails = teamMembers.map(m => m.email.trim().toLowerCase());
    const uniqueEmails = Array.from(new Set(memberEmails));

    if (uniqueEmails.length !== memberEmails.length) {
      return res.status(400).json({ error: '團隊成員 Email 不可重複' });
    }

    // Check if leader email is in team members
    const leaderEmail = teamLeader.email.trim().toLowerCase();
    if (uniqueEmails.includes(leaderEmail)) {
      return res.status(400).json({ error: '團隊成員中不應包含領導者的 Email' });
    }

    // Validate each team member email is registered
    const validatedMembers: TeamMember[] = [];
    
    for (const member of teamMembers) {
      const email = member.email.trim().toLowerCase();
      
      // Check registrations collection first
      let userSnapshot = await db
        .collection('registrations')
        .where('user.preferredEmail', '==', email)
        .limit(1)
        .get();

      let userData: any = null;
      let userName = member.name;

      if (!userSnapshot.empty) {
        userData = userSnapshot.docs[0].data();
        userName = userName || `${userData?.user?.firstName || ''} ${userData?.user?.lastName || ''}`.trim() || 
                   userData?.user?.nickname || email;
      } else {
        // Check users collection
        userSnapshot = await db
          .collection('users')
          .where('preferredEmail', '==', email)
          .limit(1)
          .get();

        if (userSnapshot.empty) {
          return res.status(400).json({ 
            error: `團隊成員 Email ${email} 尚未註冊` 
          });
        }

        userData = userSnapshot.docs[0].data();
        userName = userName || userData?.nickname || userData?.displayName || email;
      }

      validatedMembers.push({
        email: email,
        name: userName,
        role: member.role.trim(),
        hasEditRight: member.hasEditRight || false,
      });
    }

    // Get leader user info
    let leaderName = teamLeader.name || '';
    const leaderUserDoc = await db.collection('registrations').doc(userId).get();
    
    if (leaderUserDoc.exists) {
      const leaderData = leaderUserDoc.data();
      if (!leaderName) {
        leaderName = `${leaderData?.user?.firstName || ''} ${leaderData?.user?.lastName || ''}`.trim() || 
                     leaderData?.user?.nickname || leaderEmail;
      }
    }

    // Validate tracks exist
    const trackDetails: any[] = [];
    for (const trackId of tracks) {
      // Try to find track by trackId field
      const trackSnapshot = await db
        .collection('tracks')
        .where('trackId', '==', trackId)
        .limit(1)
        .get();
      
      let trackData: any = null;
      
      if (!trackSnapshot.empty) {
        trackData = trackSnapshot.docs[0].data();
      } else {
        // Try to find by document ID
        const trackDoc = await db.collection('tracks').doc(trackId).get();
        
        if (trackDoc.exists) {
          trackData = trackDoc.data();
        } else {
          return res.status(400).json({ 
            error: `賽道 ${trackId} 不存在` 
          });
        }
      }

      trackDetails.push({
        id: trackId,
        name: trackData?.name || trackData?.trackId || '',
        description: trackData?.description || '',
        sponsorName: trackData?.sponsorName || '',
      });
    }

    // Create team registration document
    const registrationData = {
      teamName: teamName.trim(),
      teamLeader: {
        userId: userId,
        email: leaderEmail,
        name: leaderName,
        role: teamLeader.role.trim(),
        hasEditRight: teamLeader.hasEditRight !== false, // Default to true for leader
      },
      teamMembers: validatedMembers,
      tracks: trackDetails,
      challenges: [], // To be filled when submitting deliverables
      agreedToCommitment: true,
      status: 'active', // active, completed, disqualified
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
        memberCount: validatedMembers.length + 1, // +1 for leader
        trackCount: tracks.length,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[SubmitTeamRegistration] Failed to log activity:', logError);
    }

    // Prepare all members list for notifications
    const allMembers = [
      { email: leaderEmail, name: leaderName, role: teamLeader.role },
      ...validatedMembers.map(m => ({ email: m.email, name: m.name || '', role: m.role }))
    ];

    // Send notification emails to all team members
    try {
      // Create notification records for team members
      const emailPromises = allMembers.map(member => 
        db.collection('email-notifications').add({
          to: member.email,
          type: 'team_registration_confirmation',
          teamId: docRef.id,
          teamName: teamName.trim(),
          memberName: member.name,
          memberRole: member.role,
          trackCount: tracks.length,
          status: 'pending',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
      );

      await Promise.all(emailPromises);
      console.log(`[SubmitTeamRegistration] Created ${allMembers.length} email notification records for team members`);
    } catch (emailError) {
      console.error('[SubmitTeamRegistration] Failed to create email notifications for team members:', emailError);
      // Don't fail the registration if email notifications fail
    }

    // Send notification email to admin (reyer.chu@rwa.nexus)
    try {
      await db.collection('email-notifications').add({
        to: 'reyer.chu@rwa.nexus',
        type: 'team_registration_admin_notification',
        teamId: docRef.id,
        teamName: teamName.trim(),
        teamLeader: {
          email: leaderEmail,
          name: leaderName,
          role: teamLeader.role,
        },
        memberCount: validatedMembers.length + 1, // +1 for leader
        teamMembers: allMembers.map(m => `${m.name} (${m.email}) - ${m.role}`),
        tracks: trackDetails.map(t => `${t.name} (${t.sponsorName || '無贊助商'})`),
        trackCount: tracks.length,
        registrationTime: new Date().toISOString(),
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[SubmitTeamRegistration] Created admin notification email for reyer.chu@rwa.nexus`);
    } catch (emailError) {
      console.error('[SubmitTeamRegistration] Failed to create admin notification email:', emailError);
      // Don't fail the registration if email notifications fail
    }

    return res.status(200).json({
      success: true,
      registrationId: docRef.id,
      message: '團隊報名成功！通知郵件將發送給所有團隊成員。',
    });

  } catch (error: any) {
    console.error('[SubmitTeamRegistration] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
