import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../lib/admin/init';
import firebase from 'firebase-admin';

initializeApi();
const db = firebase.firestore();

/**
 * DELETE /api/team-register/[teamId]/delete
 * 删除团队报名
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证身份
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
    const { teamId } = req.query;

    if (!teamId || typeof teamId !== 'string') {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    console.log('[DELETE /api/team-register/[teamId]] Deleting team:', {
      teamId,
      userId,
    });

    // 获取团队
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data();

    // 检查权限：只有团队领导者或有编辑权限的成员可以删除
    const isLeader = teamData?.teamLeader?.userId === userId;
    const hasMemberEditRight = teamData?.teamMembers?.some(
      (member: any) => member.userId === userId && member.hasEditRight,
    );

    if (!isLeader && !hasMemberEditRight) {
      return res.status(403).json({ error: 'No permission to delete this team' });
    }

    // 删除团队
    await teamDoc.ref.delete();

    console.log('[DELETE /api/team-register/[teamId]] Team deleted successfully:', teamId);

    // 发送通知邮件给所有成员（可选）
    try {
      const allMembers = [
        teamData?.teamLeader?.email,
        ...(teamData?.teamMembers?.map((m: any) => m.email) || []),
      ].filter((email: string | undefined) => email);

      console.log('[DELETE /api/team-register/[teamId]] Notifying members:', allMembers);

      // 记录邮件通知（实际发送在后台处理）
      await db.collection('email-notifications').add({
        type: 'team-deleted',
        teamId: teamId,
        teamName: teamData?.teamName,
        recipients: allMembers,
        deletedBy: userId,
        deletedAt: firebase.firestore.Timestamp.now(),
        status: 'pending',
      });
    } catch (emailError) {
      console.error('[DELETE /api/team-register/[teamId]] Email notification error:', emailError);
      // 继续，不因邮件失败而中断
    }

    return res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error: any) {
    console.error('[DELETE /api/team-register/[teamId]] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
