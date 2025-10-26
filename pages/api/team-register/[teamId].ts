import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import firebase from 'firebase-admin';

initializeApi();
const db = firebase.firestore();

/**
 * API endpoint for team registration operations
 *
 * GET /api/team-register/[teamId]
 * - Get team details
 * - Returns full team information
 * - Only accessible to team members
 *
 * PUT /api/team-register/[teamId]
 * - Update team information
 * - Only accessible to members with edit rights
 * - Validates all changes
 *
 * DELETE /api/team-register/[teamId]
 * - Delete team registration
 * - Only accessible to team leader before deadline
 */

interface TeamMember {
  email: string;
  name?: string;
  role: string;
  hasEditRight: boolean;
}

interface UpdateRequest {
  teamName?: string;
  teamMembers?: TeamMember[];
  tracks?: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query;

  if (typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Invalid team ID' });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, teamId);
    case 'PUT':
      return handlePut(req, res, teamId);
    case 'DELETE':
      return handleDelete(req, res, teamId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET team details
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse, teamId: string) {
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

    // Get team document
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: '團隊不存在' });
    }

    const teamData = teamDoc.data()!;

    // Get user email for permission check
    const userDoc = await db.collection('registrations').doc(userId).get();
    let userEmail = '';

    if (userDoc.exists) {
      const userData = userDoc.data();
      userEmail = userData?.user?.preferredEmail || '';
    }

    if (!userEmail) {
      userEmail = decodedToken.email || '';
    }

    const normalizedEmail = userEmail.toLowerCase();

    // Check if user is part of this team
    const isLeader = teamData.teamLeader?.userId === userId;
    const isMember = teamData.teamMembers?.some(
      (m: any) => m.email && m.email.toLowerCase() === normalizedEmail,
    );

    if (!isLeader && !isMember) {
      return res.status(403).json({ error: '您不是此團隊的成員' });
    }

    // Determine user's role and permissions
    let myRole = '';
    let canEdit = false;

    if (isLeader) {
      myRole = teamData.teamLeader?.role || '';
      canEdit = teamData.teamLeader?.hasEditRight !== false;
    } else {
      const memberInfo = teamData.teamMembers?.find(
        (m: any) => m.email && m.email.toLowerCase() === normalizedEmail,
      );
      if (memberInfo) {
        myRole = memberInfo.role || '';
        canEdit = memberInfo.hasEditRight === true;
      }
    }

    return res.status(200).json({
      data: {
        id: teamDoc.id,
        teamName: teamData.teamName,
        teamLeader: teamData.teamLeader,
        teamMembers: teamData.teamMembers || [],
        tracks: teamData.tracks || [],
        challenges: teamData.challenges || [],
        status: teamData.status || 'active',
        myRole: myRole,
        canEdit: canEdit,
        isLeader: isLeader,
        createdAt: teamData.createdAt,
        updatedAt: teamData.updatedAt,
        agreedToCommitment: teamData.agreedToCommitment,
      },
    });
  } catch (error: any) {
    console.error('[GetTeamDetails] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

/**
 * PUT - Update team information
 */
async function handlePut(req: NextApiRequest, res: NextApiResponse, teamId: string) {
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

    // Get team document
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: '團隊不存在' });
    }

    const teamData = teamDoc.data()!;

    // Get user email for permission check
    const userDoc = await db.collection('registrations').doc(userId).get();
    let userEmail = '';

    if (userDoc.exists) {
      const userData = userDoc.data();
      userEmail = userData?.user?.preferredEmail || '';
    }

    if (!userEmail) {
      userEmail = decodedToken.email || '';
    }

    const normalizedEmail = userEmail.toLowerCase();

    // Check if user has edit permission
    const isLeader = teamData.teamLeader?.userId === userId;
    let canEdit = false;

    if (isLeader) {
      canEdit = teamData.teamLeader?.hasEditRight !== false;
    } else {
      const memberInfo = teamData.teamMembers?.find(
        (m: any) => m.email && m.email.toLowerCase() === normalizedEmail,
      );
      if (memberInfo) {
        canEdit = memberInfo.hasEditRight === true;
      }
    }

    if (!canEdit) {
      return res.status(403).json({ error: '您沒有編輯此團隊的權限' });
    }

    // Get update data
    const updateData: UpdateRequest = req.body;

    // Validate and build update object
    const updates: any = {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (updateData.teamName !== undefined) {
      if (!updateData.teamName.trim()) {
        return res.status(400).json({ error: '團隊名稱不能為空' });
      }
      updates.teamName = updateData.teamName.trim();
    }

    if (updateData.teamMembers !== undefined) {
      if (!Array.isArray(updateData.teamMembers)) {
        return res.status(400).json({ error: 'teamMembers 必須是陣列' });
      }

      // Validate all team members
      const validatedMembers: TeamMember[] = [];

      for (let i = 0; i < updateData.teamMembers.length; i++) {
        const member = updateData.teamMembers[i];

        if (!member.email || !member.role) {
          return res.status(400).json({
            error: `第 ${i + 1} 位成員的資訊不完整`,
          });
        }

        const email = member.email.trim().toLowerCase();

        // Validate email is registered
        let userSnapshot = await db
          .collection('registrations')
          .where('user.preferredEmail', '==', email)
          .limit(1)
          .get();

        if (userSnapshot.empty) {
          userSnapshot = await db
            .collection('users')
            .where('preferredEmail', '==', email)
            .limit(1)
            .get();

          if (userSnapshot.empty) {
            return res.status(400).json({
              error: `Email ${email} 尚未註冊`,
            });
          }
        }

        validatedMembers.push({
          email: email,
          name: member.name || '',
          role: member.role.trim(),
          hasEditRight: member.hasEditRight || false,
        });
      }

      // Check for duplicate emails
      const emails = validatedMembers.map((m) => m.email);
      const uniqueEmails = new Set(emails);
      if (emails.length !== uniqueEmails.size) {
        return res.status(400).json({ error: '團隊成員 Email 不可重複' });
      }

      // Check if leader email is in members
      const leaderEmail = teamData.teamLeader?.email?.toLowerCase();
      if (leaderEmail && emails.includes(leaderEmail)) {
        return res.status(400).json({
          error: '團隊成員中不應包含領導者的 Email',
        });
      }

      updates.teamMembers = validatedMembers;
    }

    if (updateData.tracks !== undefined) {
      if (!Array.isArray(updateData.tracks) || updateData.tracks.length === 0) {
        return res.status(400).json({ error: '請至少選擇一個賽道' });
      }

      // Validate tracks exist
      const trackDetails: any[] = [];
      for (const trackId of updateData.tracks) {
        const trackSnapshot = await db
          .collection('tracks')
          .where('trackId', '==', trackId)
          .limit(1)
          .get();

        let trackData: any = null;

        if (!trackSnapshot.empty) {
          trackData = trackSnapshot.docs[0].data();
        } else {
          const trackDoc = await db.collection('tracks').doc(trackId).get();
          if (trackDoc.exists) {
            trackData = trackDoc.data();
          } else {
            return res.status(400).json({
              error: `賽道 ${trackId} 不存在`,
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

      updates.tracks = trackDetails;
    }

    // Update team
    await db.collection('team-registrations').doc(teamId).update(updates);

    // Log activity
    try {
      await db.collection('activity-logs').add({
        userId: userId,
        action: 'team_registration_update',
        resourceType: 'team_registration',
        resourceId: teamId,
        teamName: updates.teamName || teamData.teamName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[UpdateTeam] Failed to log activity:', logError);
    }

    // Send notification email to admin (reyer.chu@rwa.nexus)
    try {
      const { notifyAdminTeamEdit } = await import('../../../lib/teamRegister/email');

      // Prepare changed fields summary
      const changedFields: string[] = [];
      if (updates.teamName) changedFields.push(`團隊名稱: ${updates.teamName}`);
      if (updates.teamMembers) changedFields.push(`團隊成員: ${updates.teamMembers.length} 人`);
      if (updates.tracks) changedFields.push(`賽道: ${updates.tracks.length} 個`);

      // Get editor name
      let editorName = userEmail;
      const userDoc = await db.collection('registrations').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        editorName =
          `${userData?.user?.firstName || ''} ${userData?.user?.lastName || ''}`.trim() ||
          userData?.user?.nickname ||
          userEmail;
      }

      await notifyAdminTeamEdit(
        teamId,
        updates.teamName || teamData.teamName,
        userEmail,
        editorName,
        changedFields,
      );
      console.log(`[UpdateTeam] Sent admin notification email to reyer.chu@rwa.nexus`);
    } catch (emailError) {
      console.error('[UpdateTeam] Failed to send admin notification email:', emailError);
      // Don't fail the update if email notification fails
    }

    return res.status(200).json({
      success: true,
      message: '團隊資料已更新',
    });
  } catch (error: any) {
    console.error('[UpdateTeam] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

/**
 * DELETE - Delete team registration
 */
async function handleDelete(req: NextApiRequest, res: NextApiResponse, teamId: string) {
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

    // Get team document
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: '團隊不存在' });
    }

    const teamData = teamDoc.data()!;

    // Only team leader can delete
    if (teamData.teamLeader?.userId !== userId) {
      return res.status(403).json({ error: '只有團隊領導者可以刪除團隊' });
    }

    // Check if before deadline (2025-10-27 23:59)
    const deadline = new Date('2025-10-27T23:59:59+08:00');
    const now = new Date();

    if (now > deadline) {
      return res.status(403).json({
        error: '報名截止日期已過，無法刪除團隊',
      });
    }

    // Delete team
    await db.collection('team-registrations').doc(teamId).delete();

    // Log activity
    try {
      await db.collection('activity-logs').add({
        userId: userId,
        action: 'team_registration_delete',
        resourceType: 'team_registration',
        resourceId: teamId,
        teamName: teamData.teamName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[DeleteTeam] Failed to log activity:', logError);
    }

    return res.status(200).json({
      success: true,
      message: '團隊已刪除',
    });
  } catch (error: any) {
    console.error('[DeleteTeam] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
