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
  evmWalletAddress?: string;
  otherWallets?: Array<{ chain: string; address: string }>;
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

    // Convert Firestore Timestamp to ISO string for submittedPdf
    let submittedPdf = null;
    if (teamData.submittedPdf) {
      submittedPdf = {
        ...teamData.submittedPdf,
        uploadedAt: teamData.submittedPdf.uploadedAt?.toDate
          ? teamData.submittedPdf.uploadedAt.toDate().toISOString()
          : teamData.submittedPdf.uploadedAt,
      };
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
        submittedPdf: submittedPdf,
        evmWalletAddress: teamData.evmWalletAddress || '',
        otherWallets: teamData.otherWallets || [],
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

    // Update wallet addresses if provided
    if (updateData.evmWalletAddress !== undefined) {
      updates.evmWalletAddress = updateData.evmWalletAddress?.trim() || '';
    }

    if (updateData.otherWallets !== undefined) {
      if (!Array.isArray(updateData.otherWallets)) {
        return res.status(400).json({ error: 'otherWallets 必須是陣列' });
      }
      updates.otherWallets = updateData.otherWallets.filter(
        (w: any) => w.chain?.trim() && w.address?.trim(),
      );
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
      if (updates.evmWalletAddress !== undefined) changedFields.push(`EVM 錢包地址已更新`);
      if (updates.otherWallets !== undefined) changedFields.push(`其他錢包地址已更新`);

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

      // Get the latest team data after update to include wallet addresses
      const updatedTeamDoc = await db.collection('team-registrations').doc(teamId).get();
      const updatedTeamData = updatedTeamDoc.data();

      await notifyAdminTeamEdit(
        teamId,
        updates.teamName || teamData.teamName,
        userEmail,
        editorName,
        changedFields,
        updatedTeamData?.evmWalletAddress,
        updatedTeamData?.otherWallets,
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
 * Admin (reyerchu@defintek.io): 直接刪除
 * 團隊成員: 發送刪除請求 email 給 admin，不執行刪除
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
    const userEmail = decodedToken.email;

    // Get team document
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: '團隊不存在' });
    }

    const teamData = teamDoc.data()!;

    // Check if user is admin (reyerchu@defintek.io)
    const ADMIN_EMAIL = 'reyerchu@defintek.io';
    const isAdmin = userEmail === ADMIN_EMAIL;

    // Check if user has permission (team leader or member with edit rights)
    const isLeader = teamData.teamLeader?.userId === userId;
    const hasMemberEditRight = teamData.teamMembers?.some(
      (member: any) => member.userId === userId && member.hasEditRight,
    );

    const hasPermission = isLeader || hasMemberEditRight;

    if (!isAdmin && !hasPermission) {
      return res.status(403).json({ error: '您沒有權限刪除此團隊' });
    }

    // If admin: directly delete the team
    if (isAdmin) {
      console.log('[DeleteTeam] Admin deleting team:', teamId);

      // Delete team
      await db.collection('team-registrations').doc(teamId).delete();

      // Log activity
      try {
        await db.collection('activity-logs').add({
          userId: userId,
          action: 'team_registration_delete_admin',
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
    }

    // If team member: send delete request email to admin (不執行刪除)
    console.log('[DeleteTeam] Team member requesting delete:', {
      teamId,
      userId,
      userEmail,
    });

    // Create delete request record
    try {
      await db.collection('team-delete-requests').add({
        teamId,
        teamName: teamData.teamName,
        requestedBy: {
          userId,
          email: userEmail,
          name: isLeader
            ? teamData.teamLeader.name
            : teamData.teamMembers.find((m: any) => m.userId === userId)?.name,
          role: isLeader ? '團隊領導者' : '團隊成員',
        },
        teamData: teamData,
        status: 'pending',
        requestedAt: firebase.firestore.Timestamp.now(),
      });

      // Send email notification to admin
      await sendDeleteRequestEmail(teamId, teamData.teamName, userEmail, isLeader);

      // Log activity
      await db.collection('activity-logs').add({
        userId: userId,
        action: 'team_delete_request',
        resourceType: 'team_registration',
        resourceId: teamId,
        teamName: teamData.teamName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        success: true,
        message: '刪除請求已發送給管理員，請等待審核',
        isRequest: true, // 標記這是請求而非直接刪除
      });
    } catch (emailError) {
      console.error('[DeleteTeam] Failed to send delete request:', emailError);
      return res.status(500).json({
        error: '發送刪除請求失敗',
        details: emailError.message,
      });
    }
  } catch (error: any) {
    console.error('[DeleteTeam] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

/**
 * Send delete request email to admin
 */
async function sendDeleteRequestEmail(
  teamId: string,
  teamName: string,
  requesterEmail: string,
  isLeader: boolean,
): Promise<void> {
  const ADMIN_EMAIL = 'reyerchu@defintek.io';
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackathon.com.tw';

  const subject = `【團隊刪除請求】${teamName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a3a6e;">團隊刪除請求</h2>
      <p>有團隊成員請求刪除團隊，詳細資訊如下：</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>團隊名稱：</strong>${teamName}</p>
        <p><strong>團隊 ID：</strong>${teamId}</p>
        <p><strong>請求者：</strong>${requesterEmail} (${isLeader ? '團隊領導者' : '團隊成員'})</p>
        <p><strong>請求時間：</strong>${new Date().toLocaleString('zh-TW', {
          timeZone: 'Asia/Taipei',
        })}</p>
      </div>
      
      <p>您可以登入管理後台查看團隊詳情並決定是否刪除：</p>
      <p><a href="${BASE_URL}/admin/team-management" style="display: inline-block; background-color: #1a3a6e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0;">前往管理後台</a></p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">此郵件由 RWA 黑客松台灣系統自動發送，請勿直接回覆。</p>
    </div>
  `;

  const text = `
團隊刪除請求

團隊名稱：${teamName}
團隊 ID：${teamId}
請求者：${requesterEmail} (${isLeader ? '團隊領導者' : '團隊成員'})
請求時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}

請登入管理後台查看詳情：${BASE_URL}/admin/team-management
  `;

  try {
    await sendEmail(ADMIN_EMAIL, subject, html, text);
    console.log('[DeleteTeam] Delete request email sent to admin');
  } catch (error) {
    console.error('[DeleteTeam] Failed to send email to admin:', error);
    throw error;
  }
}

/**
 * Send email using SMTP or SendGrid
 */
async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@hackathon.com.tw';
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;

  // Try SMTP first
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });

      await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        text,
        html,
      });

      console.log('[DeleteTeam] SMTP email sent to:', to);
      return;
    } catch (error) {
      console.error('[DeleteTeam] SMTP send failed:', error);
    }
  }

  // Try SendGrid
  if (SENDGRID_API_KEY) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: EMAIL_FROM },
          subject,
          content: [
            { type: 'text/plain', value: text || subject },
            { type: 'text/html', value: html },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid API error: ${error}`);
      }

      console.log('[DeleteTeam] SendGrid email sent to:', to);
      return;
    } catch (error) {
      console.error('[DeleteTeam] SendGrid send failed:', error);
      throw error;
    }
  }

  // No email service configured
  console.log('[DeleteTeam] No email service configured. Email would be sent:');
  console.log(`  To: ${to}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Text: ${text}`);
}
