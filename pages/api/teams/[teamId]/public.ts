/**
 * API: 获取团队公开信息
 * 
 * GET: 获取指定团队的公开信息（队名、队友、赛道、得奖）
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
    const { teamId } = req.query;

    if (!teamId || typeof teamId !== 'string') {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const db = admin.firestore();
    
    // 获取团队信息
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data()!;

    // 构建团队公开信息
    const teamInfo: any = {
      teamId: teamDoc.id,
      teamName: teamData.teamName,
      description: teamData.description || '',
      createdAt: teamData.createdAt,
    };

    // 获取队长信息（只显示暱称）
    const leader = teamData.teamLeader;
    if (leader) {
      teamInfo.leader = {
        userId: leader.userId || leader.email,
        displayName: leader.name || leader.email,
      };
    }

    // 获取队员信息（只显示暱称）
    const members: any[] = [];
    if (teamData.teamMembers && Array.isArray(teamData.teamMembers)) {
      for (const member of teamData.teamMembers) {
        members.push({
          userId: member.userId || member.email,
          displayName: member.name || member.email,
          role: member.role || '',
        });
      }
    }
    teamInfo.members = members;

    // 获取参加的赛道
    const tracks: any[] = [];
    if (teamData.tracks && Array.isArray(teamData.tracks)) {
      for (const track of teamData.tracks) {
        const trackDoc = await db.collection('tracks').doc(track.id || track.trackId).get();
        if (trackDoc.exists) {
          const trackData = trackDoc.data();
          tracks.push({
            trackId: trackDoc.id,
            trackName: trackData?.name || track.name,
            sponsor: trackData?.sponsor || '',
          });
        }
      }
    }
    teamInfo.tracks = tracks;

    // 获取参加的挑战
    const challenges: any[] = [];
    if (teamData.challenges && Array.isArray(teamData.challenges)) {
      for (const challenge of teamData.challenges) {
        const challengeDoc = await db.collection('extended-challenges').doc(challenge.id).get();
        if (challengeDoc.exists) {
          const challengeData = challengeDoc.data();
          challenges.push({
            challengeId: challengeDoc.id,
            challengeTitle: challengeData?.title || challenge.title,
            trackId: challengeData?.trackId || '',
          });
        }
      }
    }
    teamInfo.challenges = challenges;

    // 获取得奖信息（从 winners 页面数据推断，实际应该从专门的 awards 集合获取）
    // 这里暂时不实现，等有明确的获奖数据结构后再添加
    teamInfo.awards = [];

    return res.status(200).json({
      success: true,
      team: teamInfo,
    });
  } catch (error: any) {
    console.error('[TeamPublic] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get team public info' });
  }
}

