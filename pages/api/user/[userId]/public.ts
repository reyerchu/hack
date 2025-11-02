/**
 * API: 获取用户公开信息
 * 
 * GET: 获取指定用户的公开信息（根据隐私设置）
 */

import { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  initializeApi();
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const db = admin.firestore();
    
    // 尝试从 registrations 获取用户信息
    let userDoc = await db.collection('registrations').doc(userId).get();
    
    if (!userDoc.exists) {
      // 尝试用 userId 作为 email 查找
      const usersByEmail = await db
        .collection('registrations')
        .where('email', '==', userId)
        .limit(1)
        .get();
      
      if (!usersByEmail.empty) {
        userDoc = usersByEmail.docs[0];
      }
    }

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const privacySettings = userData?.privacySettings || {};

    // 构建公开信息对象（暱称必须公开）
    const publicInfo: any = {
      userId: userDoc.id,
      displayName: userData?.displayName || userData?.firstName || 'Anonymous User',
    };

    // 根据隐私设置添加其他信息
    if (privacySettings.showEmail) {
      publicInfo.email = userData?.email;
    }
    if (privacySettings.showRole) {
      publicInfo.role = userData?.role;
    }
    if (privacySettings.showSchool) {
      publicInfo.school = userData?.school || userData?.organization;
    }
    if (privacySettings.showGithub) {
      publicInfo.github = userData?.github;
    }
    if (privacySettings.showLinkedin) {
      publicInfo.linkedin = userData?.linkedin;
    }
    if (privacySettings.showPhone) {
      publicInfo.phone = userData?.phone;
    }

    // 获取用户参与的团队
    const teamsAsLeader = await db
      .collection('team-registrations')
      .where('teamLeader.userId', '==', userDoc.id)
      .get();

    const teamsAsMember = await db
      .collection('team-registrations')
      .where('teamMembers', 'array-contains', { email: userData?.email })
      .get();

    // 合并并去重团队列表
    const teamSet = new Set<string>();
    const teams: any[] = [];

    teamsAsLeader.forEach((doc) => {
      if (!teamSet.has(doc.id)) {
        teamSet.add(doc.id);
        const teamData = doc.data();
        teams.push({
          teamId: doc.id,
          teamName: teamData.teamName,
          role: 'leader',
        });
      }
    });

    teamsAsMember.forEach((doc) => {
      if (!teamSet.has(doc.id)) {
        teamSet.add(doc.id);
        const teamData = doc.data();
        const member = teamData.teamMembers?.find((m: any) => m.email === userData?.email);
        teams.push({
          teamId: doc.id,
          teamName: teamData.teamName,
          role: member?.role || 'member',
        });
      }
    });

    publicInfo.teams = teams;

    return res.status(200).json({
      success: true,
      user: publicInfo,
    });
  } catch (error: any) {
    console.error('[UserPublic] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get user public info' });
  }
}

