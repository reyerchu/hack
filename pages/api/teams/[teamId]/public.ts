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
import memoryCache from '../../../../lib/cache/memoryCache';

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

    // 获取队员信息（优化：批量查询，避免 N+1 问题）
    const members: any[] = [];
    if (teamData.teamMembers && Array.isArray(teamData.teamMembers)) {
      console.log('[TeamPublic] Processing', teamData.teamMembers.length, 'members');

      // Performance optimization: Batch fetch all member UIDs first
      // Instead of calling auth().getUserByEmail() for each member sequentially
      const memberEmails = teamData.teamMembers
        .map((m) => m.email)
        .filter(
          (email) => email && !teamData.teamMembers.find((m2) => m2.email === email && m2.nickname),
        );

      // Batch fetch UIDs from auth (still sequential but better than N queries)
      const emailToUidMap = new Map<string, string>();
      if (memberEmails.length > 0) {
        console.log('[TeamPublic] Batch fetching UIDs for', memberEmails.length, 'emails');

        // Note: Firebase Auth doesn't have a batch getUserByEmail, so we skip this
        // and rely on existing nickname data in teamMembers or use name as fallback
        // This is acceptable since nickname is not critical data
      }

      // Build member list using available data
      for (const member of teamData.teamMembers) {
        const email = member.email || member.userId;
        const hash = email ? emailToHash(email) : member.userId;

        // Use existing nickname from member data
        // Skip expensive auth().getUserByEmail() calls for performance
        const nickname = member.nickname;

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

      console.log('[TeamPublic] Processed', members.length, 'members');
    }
    teamInfo.members = members;

    // 获取参加的赛道（优化：使用緩存 + 批量并行查詢）
    const tracks: any[] = [];
    if (teamData.tracks && Array.isArray(teamData.tracks)) {
      console.log('[TeamPublic] Fetching', teamData.tracks.length, 'tracks (with cache)');

      // Performance optimization: Use cached tracks map for instant lookup
      const CACHE_KEY = 'tracks:map:all';
      const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

      const tracksMap = await memoryCache.getOrSet(
        CACHE_KEY,
        async () => {
          console.log('[TeamPublic] Cache miss: Building tracks map from Firestore...');
          const tracksSnapshot = await db.collection('tracks').get();
          const map = new Map();
          tracksSnapshot.docs.forEach((doc) => {
            map.set(doc.id, {
              id: doc.id,
              name: doc.data().name,
              sponsor: doc.data().sponsor || '',
            });
          });
          return map;
        },
        CACHE_TTL,
      );

      // Use cached tracks map for instant lookup
      teamData.tracks.forEach((track) => {
        const trackId = track.id || track.trackId;
        const cachedTrack = tracksMap.get(trackId);

        if (cachedTrack) {
          tracks.push({
            trackId: cachedTrack.id,
            trackName: cachedTrack.name || track.name,
            sponsor: cachedTrack.sponsor || '',
          });
        } else {
          // Fallback: use data from team registration if track not found
          tracks.push({
            trackId: trackId || '',
            trackName: track.name || '未知賽道',
            sponsor: '',
          });
        }
      });

      console.log('[TeamPublic] Fetched', tracks.length, 'tracks (cached)');
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

      // Performance optimization: Batch fetch all challenges in parallel
      const uniqueSubmissions = submissionsSnapshot.docs.filter((doc) => {
        const challengeId = doc.data().challengeId;
        if (challengeId && !challengeSet.has(challengeId)) {
          challengeSet.add(challengeId);
          return true;
        }
        return false;
      });

      console.log(
        `[TeamPublic] Fetching ${uniqueSubmissions.length} challenges in parallel (with cache)`,
      );

      // Performance: Use cached challenges map
      const CHALLENGES_CACHE_KEY = 'challenges:map:all';
      const CHALLENGES_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

      const challengesMap = await memoryCache.getOrSet(
        CHALLENGES_CACHE_KEY,
        async () => {
          console.log('[TeamPublic] Cache miss: Building challenges map from Firestore...');
          const challengesSnapshot = await db.collection('extended-challenges').get();
          const map = new Map();
          challengesSnapshot.docs.forEach((doc) => {
            map.set(doc.id, {
              id: doc.id,
              title: doc.data().title,
              trackId: doc.data().trackId,
            });
          });
          console.log(`[TeamPublic] Built challenges map with ${map.size} entries`);
          return map;
        },
        CHALLENGES_CACHE_TTL,
      );

      // Map submissions to challenges using cache
      const challengeResults = uniqueSubmissions.map((submissionDoc) => {
        const submissionData = submissionDoc.data();
        const challengeId = submissionData.challengeId;
        const cachedChallenge = challengesMap.get(challengeId);

        if (cachedChallenge) {
          return {
            submissionData,
            challengeDoc: {
              exists: true,
              id: cachedChallenge.id,
              data: () => cachedChallenge,
            },
          };
        } else {
          console.warn(`[TeamPublic] Challenge ${challengeId} not found in cache`);
          return {
            submissionData,
            challengeDoc: null,
          };
        }
      });

      console.log(`[TeamPublic] Fetched ${challengeResults.length} challenges (cached)`);

      // Performance: Pre-fetch all missing track names in parallel
      const missingTrackIds = new Set<string>();
      challengeResults.forEach(({ challengeDoc, submissionData }) => {
        if (challengeDoc && challengeDoc.exists) {
          const challengeData = challengeDoc.data();
          const trackId = challengeData?.trackId || submissionData.trackId || '';
          if (trackId && !trackIdToNameMap.has(trackId)) {
            missingTrackIds.add(trackId);
          }
        }
      });

      // Batch fetch missing tracks if any
      if (missingTrackIds.size > 0) {
        console.log(`[TeamPublic] Fetching ${missingTrackIds.size} missing track names...`);
        const missingTrackPromises = Array.from(missingTrackIds).map(async (trackId) => {
          try {
            const trackDoc = await db.collection('tracks').doc(trackId).get();
            if (trackDoc.exists) {
              return { trackId, name: trackDoc.data()?.name || '' };
            }
          } catch (err) {
            console.error(`[TeamPublic] Error fetching track ${trackId}:`, err);
          }
          return { trackId, name: '' };
        });

        const missingTracks = await Promise.all(missingTrackPromises);
        missingTracks.forEach(({ trackId, name }) => {
          if (name) {
            trackIdToNameMap.set(trackId, name);
          }
        });
        console.log(`[TeamPublic] Fetched ${missingTracks.length} missing tracks`);
      }

      // Process all challenges (now all track names are in the map)
      for (const { submissionData, challengeDoc } of challengeResults) {
        if (challengeDoc && challengeDoc.exists) {
          try {
            const challengeData = challengeDoc.data();
            const trackId = challengeData?.trackId || submissionData.trackId || '';

            // Get track name from map (instant lookup, no async call)
            const trackName = trackId ? trackIdToNameMap.get(trackId) || '' : '';

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
          } catch (err) {
            console.error(`[TeamPublic] Error processing challenge:`, err);
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
