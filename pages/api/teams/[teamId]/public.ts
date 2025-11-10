/**
 * API: 获取团队公开信息
 *
 * GET: 获取指定团队的公开信息（队名、队友、赛道、得奖）
 */

import { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';
import { emailToHash } from '../../../../lib/utils/email-hash';
import { getTeamAwards } from '../../../../lib/winnersData';

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
      evmWalletAddress: teamData.evmWalletAddress || '',
      otherWallets: teamData.otherWallets || [],
      demoDaySubmission: null, // 將填入 Demo Day 賽道的提交資料
    };

    // 获取队长信息（只显示暱称）
    const leader = teamData.teamLeader;
    if (leader) {
      const email = leader.email || leader.userId;
      const hash = email ? emailToHash(email) : leader.userId;

      // 嘗試從 registrations 獲取 nickname
      let nickname = leader.nickname;
      if (!nickname) {
        try {
          // 先嘗試通過 email 查找
          if (email) {
            const authUser = await admin.auth().getUserByEmail(email);
            const regDoc = await db.collection('registrations').doc(authUser.uid).get();
            if (regDoc.exists) {
              const regData = regDoc.data();
              nickname = regData?.nickname;
            }
          }
        } catch (err) {
          console.log(`[TeamPublic] Could not get nickname for leader: ${email}`);
        }
      }

      console.log(
        `[TeamPublic] Leader: email=${email}, hash=${hash}, nickname=${nickname}, name=${leader.name}`,
      );

      teamInfo.leader = {
        // 使用 email hash 作為 userId，保護隱私
        userId: hash,
        // 優先顯示 nickname，其次 name，絕不顯示 email
        displayName: nickname || leader.name || '匿名用戶',
        role: leader.role || '',
      };
    }

    // 获取队员信息（只显示暱称）
    const members: any[] = [];
    if (teamData.teamMembers && Array.isArray(teamData.teamMembers)) {
      for (const member of teamData.teamMembers) {
        const email = member.email || member.userId;
        const hash = email ? emailToHash(email) : member.userId;

        // 嘗試從 registrations 獲取 nickname
        let nickname = member.nickname;
        if (!nickname) {
          try {
            // 先嘗試通過 email 查找
            if (email) {
              const authUser = await admin.auth().getUserByEmail(email);
              const regDoc = await db.collection('registrations').doc(authUser.uid).get();
              if (regDoc.exists) {
                const regData = regDoc.data();
                nickname = regData?.nickname;
              }
            }
          } catch (err) {
            console.log(`[TeamPublic] Could not get nickname for member: ${email}`);
          }
        }

        console.log(
          `[TeamPublic] Member: email=${email}, hash=${hash}, nickname=${nickname}, name=${member.name}`,
        );

        members.push({
          // 使用 email hash 作為 userId，保護隱私
          userId: hash,
          // 優先顯示 nickname，其次 name，絕不顯示 email
          displayName: nickname || member.name || '匿名用戶',
          role: member.role || '',
        });
      }
    }
    teamInfo.members = members;

    // 获取参加的赛道
    const tracks: any[] = [];
    if (teamData.tracks && Array.isArray(teamData.tracks)) {
      for (const track of teamData.tracks) {
        const trackDoc = await db
          .collection('tracks')
          .doc(track.id || track.trackId)
          .get();
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
    // 策略：从提交记录中获取实际提交过的挑战，而不仅仅依赖 team-registrations.challenges
    const challenges: any[] = [];
    const challengeSet = new Set<string>();

    // 创建 trackId -> trackName 映射（用于后续查找）
    const trackIdToNameMap = new Map<string, string>();
    const trackNameToNameMap = new Map<string, string>(); // 用于模糊匹配
    tracks.forEach((track) => {
      trackIdToNameMap.set(track.trackId, track.trackName);
      // 同时存储规范化的名称用于模糊匹配（去除空格、标点等）
      const normalizedName = track.trackName.replace(/\s+/g, '').toLowerCase();
      trackNameToNameMap.set(normalizedName, track.trackName);
    });

    // 辅助函数：根据 trackId 查找 trackName（支持异步查询）
    const getTrackName = async (trackId: string): Promise<string> => {
      // 首先尝试直接匹配
      if (trackIdToNameMap.has(trackId)) {
        return trackIdToNameMap.get(trackId) || '';
      }

      // 如果直接匹配失败，尝试从 trackId 中提取名称进行模糊匹配
      // 例如 "sui-賽道-835919" -> 查找包含 "sui" 和 "賽道" 的 track
      let result = '';
      trackNameToNameMap.forEach((trackName, normalizedName) => {
        if (result) return; // 已找到，跳过
        const trackIdLower = trackId.toLowerCase().replace(/\s+/g, '');
        const firstPart = trackIdLower.split('-')[0];
        // 简单的包含检查
        if (trackIdLower.includes(normalizedName) || normalizedName.includes(firstPart)) {
          result = trackName;
        }
      });

      // 如果模糊匹配也失败，尝试直接查询 tracks 集合
      if (!result && trackId) {
        try {
          const trackDoc = await db.collection('tracks').doc(trackId).get();
          if (trackDoc.exists) {
            result = trackDoc.data()?.name || '';
          } else {
            // 尝试通过 trackId 中的关键词搜索
            // 例如 "rwa-黑客松台灣賽道-622165" 可能对应 "Demo Day 賽道"
            if (trackId.includes('rwa') || trackId.includes('黑客松') || trackId.includes('台灣')) {
              // 这通常是 Demo Day 赛道的旧 ID
              const tracksSnapshot = await db
                .collection('tracks')
                .where('name', '==', 'Demo Day 賽道')
                .limit(1)
                .get();
              if (!tracksSnapshot.empty) {
                result = tracksSnapshot.docs[0].data()?.name || '';
              }
            }
          }
        } catch (err) {
          console.error(`[TeamPublic] Error querying track ${trackId}:`, err);
        }
      }

      return result;
    };

    // 1. 首先获取所有该团队的提交记录
    try {
      const submissionsSnapshot = await db
        .collection('team-challenge-submissions')
        .where('teamId', '==', teamId)
        .get();

      console.log(`[TeamPublic] Found ${submissionsSnapshot.size} submissions for team ${teamId}`);

      // 对每个提交，获取挑战详情
      for (const submissionDoc of submissionsSnapshot.docs) {
        const submissionData = submissionDoc.data();
        const challengeId = submissionData.challengeId;

        if (challengeId && !challengeSet.has(challengeId)) {
          challengeSet.add(challengeId);

          try {
            const challengeDoc = await db.collection('extended-challenges').doc(challengeId).get();
            if (challengeDoc.exists) {
              const challengeData = challengeDoc.data();
              const trackId = challengeData?.trackId || submissionData.trackId || '';

              // 使用辅助函数获取赛道名称
              const trackName = trackId ? await getTrackName(trackId) : '';

              challenges.push({
                challengeId: challengeDoc.id,
                challengeTitle: challengeData?.title || submissionData.challengeTitle || '未知挑战',
                trackId: trackId,
                trackName: trackName,
                submissionStatus: '提交完成',
              });

              // 檢查是否為 Demo Day 賽道的提交
              console.log(
                `[TeamPublic] Challenge trackName: "${trackName}", challengeTitle: "${challengeData?.title}"`,
              );

              if (trackName && trackName.includes('Demo Day')) {
                console.log(`[TeamPublic] Found Demo Day track submission for team ${teamId}`);
                const demoDayData: any = {};

                // 使用本地 public 目錄的 PDF 文件
                // 所有 Demo Day 團隊的 PDF 都同步到 /team-media/2025/DemoDay/{teamName}.pdf
                const teamName = teamData.teamName;
                const pdfPath = `/team-media/2025/DemoDay/${teamName}.pdf`;

                console.log(`[TeamPublic] Using local PDF path: ${pdfPath}`);

                demoDayData.onePager = {
                  title: '一頁簡介',
                  value: pdfPath,
                  type: '檔案',
                  teamName: teamName,
                };

                // 從提交中提取所有 Github 原始碼連結
                const items = [
                  ...(submissionData.submissions || []),
                  ...(submissionData.extraItems || []),
                ];
                console.log(`[TeamPublic] Checking ${items.length} items for GitHub repos`);
                console.log(
                  `[TeamPublic] Items details:`,
                  JSON.stringify(
                    items.map((i) => ({ title: i.title, type: i.type, hasValue: !!i.value })),
                  ),
                );

                const githubRepos: any[] = [];
                for (const item of items) {
                  console.log(
                    `[TeamPublic] Checking item: title="${item.title}", type="${
                      item.type
                    }", value="${item.value?.substring(0, 50)}..."`,
                  );
                  if (item.value) {
                    const valueLower = item.value.toLowerCase();
                    const titleLower = item.title?.toLowerCase() || '';

                    // 檢查 value 或 title 是否包含 GitHub 相關關鍵字
                    if (
                      valueLower.includes('github') ||
                      titleLower.includes('github') ||
                      titleLower.includes('原始碼') ||
                      titleLower.includes('source') ||
                      titleLower.includes('code') ||
                      titleLower.includes('repo')
                    ) {
                      githubRepos.push({
                        title: item.title || 'Github 連結',
                        value: item.value,
                        type: item.type,
                      });
                      console.log(`[TeamPublic] Found githubRepo: ${item.value}`);
                    }
                  }
                }

                // 如果找到 GitHub 連結，儲存所有連結
                if (githubRepos.length > 0) {
                  demoDayData.githubRepos = githubRepos;
                  console.log(`[TeamPublic] Found ${githubRepos.length} GitHub repos`);
                }

                // 儲存 Demo Day 資料
                if (Object.keys(demoDayData).length > 0) {
                  teamInfo.demoDaySubmission = demoDayData;
                  console.log(
                    `[TeamPublic] Saved Demo Day submission for team ${teamId}:`,
                    JSON.stringify(demoDayData),
                  );
                }
              }
            }
          } catch (err) {
            console.error(`[TeamPublic] Error fetching challenge ${challengeId}:`, err);
          }
        }
      }
    } catch (error) {
      console.error(`[TeamPublic] Error fetching submissions:`, error);
    }

    // 2. 补充 team-registrations.challenges 中的其他挑战（如果有未提交的）
    if (teamData.challenges && Array.isArray(teamData.challenges)) {
      for (const challenge of teamData.challenges) {
        if (!challengeSet.has(challenge.id)) {
          challengeSet.add(challenge.id);

          try {
            const challengeDoc = await db.collection('extended-challenges').doc(challenge.id).get();
            if (challengeDoc.exists) {
              const challengeData = challengeDoc.data();
              const trackId = challengeData?.trackId || '';

              // 使用辅助函数获取赛道名称
              const trackName = trackId ? await getTrackName(trackId) : '';

              challenges.push({
                challengeId: challengeDoc.id,
                challengeTitle: challengeData?.title || challenge.title,
                trackId: trackId,
                trackName: trackName,
                submissionStatus: '未提交',
              });
            }
          } catch (err) {
            console.error(`[TeamPublic] Error fetching challenge ${challenge.id}:`, err);
          }
        }
      }
    }

    teamInfo.challenges = challenges;

    // 獲取得獎紀錄（使用團隊名稱匹配）
    const awards = getTeamAwards(teamData.teamName);
    teamInfo.awards = awards;
    console.log(`[TeamPublic] Found ${awards.length} awards for team ${teamData.teamName}`);

    return res.status(200).json({
      success: true,
      team: teamInfo,
    });
  } catch (error: any) {
    console.error('[TeamPublic] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get team public info' });
  }
}
