/**
 * API: 获取用户公开信息
 *
 * GET: 获取指定用户的公开信息（根据隐私设置）
 */

import { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';
import { emailToHash, isValidHash } from '../../../../lib/utils/email-hash';
import { getTeamAwards } from '../../../../lib/winnersData';

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

    let userDoc: any = null;
    let userData: any = null;

    // 檢查是否為 hash 格式
    const isHash = isValidHash(userId);

    if (isHash) {
      // 方法 0: 如果是 hash，需要遍歷查找匹配的 email
      console.log(`[UserPublic] Looking for user by hash: ${userId}`);

      // 先從 registrations 查找
      const registrationsSnapshot = await db.collection('registrations').get();
      console.log(`[UserPublic] Checking ${registrationsSnapshot.size} registrations`);

      for (const doc of registrationsSnapshot.docs) {
        const data = doc.data();
        let emailToCheck = data.email;

        // 如果 registrations 中沒有 email，嘗試從 Firebase Auth 獲取
        if (!emailToCheck) {
          try {
            const authUser = await admin.auth().getUser(doc.id);
            emailToCheck = authUser.email;
          } catch (err) {
            // 無法獲取 Auth 信息，跳過
            continue;
          }
        }

        if (emailToCheck) {
          const hash = emailToHash(emailToCheck);
          if (hash === userId) {
            userDoc = doc;
            userData = data;
            console.log(
              `[UserPublic] ✅ Found user by hash in registrations: ${emailToCheck} (hash: ${hash})`,
            );
            break;
          }
        }
      }

      // 如果還沒找到，從 users 集合查找
      if (!userDoc) {
        console.log(`[UserPublic] Not found in registrations, checking users collection`);
        const usersSnapshot = await db.collection('users').get();
        console.log(`[UserPublic] Checking ${usersSnapshot.size} users`);

        for (const doc of usersSnapshot.docs) {
          const data = doc.data();
          let emailToCheck = data.email;

          // 如果 users 中沒有 email，嘗試從 Firebase Auth 獲取
          if (!emailToCheck) {
            try {
              const authUser = await admin.auth().getUser(doc.id);
              emailToCheck = authUser.email;
            } catch (err) {
              // 無法獲取 Auth 信息，跳過
              continue;
            }
          }

          if (emailToCheck) {
            const hash = emailToHash(emailToCheck);
            if (hash === userId) {
              userDoc = doc;
              userData = data;
              console.log(
                `[UserPublic] ✅ Found user by hash in users: ${emailToCheck} (hash: ${hash})`,
              );
              break;
            }
          }
        }
      }

      if (!userDoc) {
        console.log(`[UserPublic] ❌ User not found by hash: ${userId}`);
      }
    } else {
      // 原有的查找邏輯（用於非 hash 的情況）

      // 方法 1: 尝试从 registrations 用文档 ID 查找
      let doc = await db.collection('registrations').doc(userId).get();
      if (doc.exists) {
        userDoc = doc;
        userData = doc.data();
      }

      // 方法 2: 尝试从 registrations 用 email 查找
      if (!userDoc) {
        const snapshot = await db
          .collection('registrations')
          .where('email', '==', userId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          userDoc = snapshot.docs[0];
          userData = snapshot.docs[0].data();
        }
      }

      // 方法 3: 尝试从 users 集合用文档 ID (email) 查找
      if (!userDoc) {
        doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
          userDoc = doc;
          userData = doc.data();
        }
      }

      // 方法 4: 尝试从 users 集合用 email 字段查找
      if (!userDoc) {
        const snapshot = await db.collection('users').where('email', '==', userId).limit(1).get();

        if (!snapshot.empty) {
          userDoc = snapshot.docs[0];
          userData = snapshot.docs[0].data();
        }
      }
    }

    if (!userDoc || !userData) {
      console.log(`[UserPublic] User not found in registrations/users: ${userId}`);

      // 查找 team-registrations 中的基本信息
      const teamsSnapshot = await db.collection('team-registrations').get();
      let foundInTeam = false;
      let basicInfo: any = null;
      let foundEmail: string | null = null;

      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data();

        // 检查队长
        const leader = teamData.teamLeader;
        if (leader) {
          const leaderEmail = leader.email || leader.userId;
          if (leaderEmail && emailToHash(leaderEmail) === userId) {
            console.log(
              `[UserPublic] Found in team as leader: email=${leaderEmail}, nickname=${leader.nickname}, name=${leader.name}`,
            );

            foundEmail = leaderEmail;

            // 如果 team 中的 nickname 为空，从 registrations 集合获取
            let displayName = leader.nickname || leader.name || '匿名用戶';
            if (!leader.nickname) {
              try {
                // 遍历所有 registrations 查找匹配的 email（不区分大小写）
                const allRegs = await db.collection('registrations').get();
                let found = false;
                const targetEmail = leaderEmail.toLowerCase().trim();

                // 先尝试精确匹配 email
                for (const regDoc of allRegs.docs) {
                  const regData = regDoc.data();
                  const regEmail = (regData?.preferredEmail || regData?.email || '')
                    .toLowerCase()
                    .trim();

                  if (regEmail === targetEmail) {
                    displayName = regData?.nickname || displayName;
                    found = true;
                    break;
                  }
                }

                // 如果没找到，尝试通过 firstName/lastName 匹配
                if (!found && leader.name) {
                  const nameParts = leader.name.trim().split(/\s+/);
                  for (const regDoc of allRegs.docs) {
                    const regData = regDoc.data();
                    const regFirstName = regData?.user?.firstName || regData?.firstName || '';
                    const regLastName = regData?.user?.lastName || regData?.lastName || '';

                    const nameMatch =
                      nameParts.includes(regFirstName) && nameParts.includes(regLastName);

                    if (nameMatch) {
                      displayName = regData?.nickname || displayName;
                      found = true;
                      break;
                    }
                  }
                }
              } catch (err: any) {
                console.log(`[UserPublic] Error getting nickname: ${err.message}`);
              }
            }

            basicInfo = {
              displayName,
              teams: [{ teamId: teamDoc.id, teamName: teamData.teamName, role: leader.role || '' }],
            };
            foundInTeam = true;
            break;
          }
        }

        // 检查队员
        if (!foundInTeam && teamData.teamMembers && Array.isArray(teamData.teamMembers)) {
          for (const member of teamData.teamMembers) {
            const memberEmail = member.email || member.userId;
            if (memberEmail && emailToHash(memberEmail) === userId) {
              console.log(
                `[UserPublic] Found in team as member: email=${memberEmail}, nickname=${member.nickname}, name=${member.name}`,
              );

              foundEmail = memberEmail;

              // 如果 team 中的 nickname 为空，从 registrations 集合获取
              let displayName = member.nickname || member.name || '匿名用戶';
              if (!member.nickname) {
                try {
                  // 遍历所有 registrations 查找匹配的 email（不区分大小写）
                  const allRegs = await db.collection('registrations').get();
                  let found = false;
                  const targetEmail = memberEmail.toLowerCase().trim();

                  // 先尝试精确匹配 email
                  for (const regDoc of allRegs.docs) {
                    const regData = regDoc.data();
                    const regEmail = (regData?.preferredEmail || regData?.email || '')
                      .toLowerCase()
                      .trim();

                    if (regEmail === targetEmail) {
                      displayName = regData?.nickname || displayName;
                      found = true;
                      break;
                    }
                  }

                  // 如果没找到，尝试通过 firstName/lastName 匹配
                  if (!found && member.name) {
                    const nameParts = member.name.trim().split(/\s+/);
                    for (const regDoc of allRegs.docs) {
                      const regData = regDoc.data();
                      const regFirstName = regData?.user?.firstName || regData?.firstName || '';
                      const regLastName = regData?.user?.lastName || regData?.lastName || '';

                      const nameMatch =
                        nameParts.includes(regFirstName) && nameParts.includes(regLastName);

                      if (nameMatch) {
                        displayName = regData?.nickname || displayName;
                        found = true;
                        break;
                      }
                    }
                  }
                } catch (err: any) {
                  console.log(`[UserPublic] Error getting nickname: ${err.message}`);
                }
              }

              basicInfo = {
                displayName,
                teams: [
                  { teamId: teamDoc.id, teamName: teamData.teamName, role: member.role || '隊員' },
                ],
              };
              foundInTeam = true;
              break;
            }
          }
        }

        if (foundInTeam) break;
      }

      if (foundInTeam && basicInfo && foundEmail) {
        console.log(
          `[UserPublic] Found user in team-registrations with email ${foundEmail}, now looking for full registration data`,
        );

        // 使用找到的 email 去 registrations 查找完整数据
        const regSnapshot = await db
          .collection('registrations')
          .where('preferredEmail', '==', foundEmail)
          .limit(1)
          .get();

        if (!regSnapshot.empty) {
          userDoc = regSnapshot.docs[0];
          userData = regSnapshot.docs[0].data();
          console.log(`[UserPublic] ✅ Found full registration data for ${foundEmail}`);
          // 继续执行后面的完整数据返回逻辑
        } else {
          // 尝试用 email 字段查找
          const regSnapshot2 = await db
            .collection('registrations')
            .where('email', '==', foundEmail)
            .limit(1)
            .get();

          if (!regSnapshot2.empty) {
            userDoc = regSnapshot2.docs[0];
            userData = regSnapshot2.docs[0].data();
            console.log(`[UserPublic] ✅ Found full registration data by email for ${foundEmail}`);
            // 继续执行后面的完整数据返回逻辑
          } else {
            console.log(`[UserPublic] No full registration data found, returning basic info only`);
            return res.status(200).json({
              success: true,
              user: {
                userId,
                ...basicInfo,
              },
            });
          }
        }
      } else if (foundInTeam && basicInfo) {
        console.log(`[UserPublic] Found user in team but no email, returning basic info only`);
        return res.status(200).json({
          success: true,
          user: {
            userId,
            ...basicInfo,
          },
        });
      }

      if (!userDoc || !userData) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    console.log(`[UserPublic] Found user: ${userDoc.id}, email: ${userData?.email || 'N/A'}`);

    // 如果 userData 沒有 email，從 Auth 獲取
    let authDisplayName = null;
    if (!userData?.email) {
      try {
        const authUser = await admin.auth().getUser(userDoc.id);
        // 將 email 添加到 userData
        userData = userData || {};
        userData.email = authUser.email;
        authDisplayName = authUser.displayName;
      } catch (err) {
        console.log('[UserPublic] Could not get email from Auth');
      }
    }

    // 获取隐私设置（可能在 user-privacy-settings 集合中）
    let privacySettings = userData?.privacySettings || {};

    try {
      const privacyDoc = await db.collection('user-privacy-settings').doc(userDoc.id).get();
      if (privacyDoc.exists) {
        privacySettings = privacyDoc.data() || {};
      }
    } catch (err) {
      console.log('[UserPublic] Error getting privacy settings:', err);
    }

    // 构建公开信息对象（暱称始終公開）
    const publicInfo: any = {
      userId: userDoc.id,
      // 暱稱始終公開（優先使用 nickname，其次 displayName，再其次 Auth displayName，絕不顯示 email）
      displayName: userData?.nickname || userData?.displayName || authDisplayName || '匿名用戶',
    };

    // 根据隐私设置添加其他信息
    if (privacySettings.showName) {
      // 如果勾選顯示姓名，則顯示 firstName 和 lastName（优先从 user 对象中读取，其次从根级别读取）
      publicInfo.firstName = userData?.user?.firstName || userData?.firstName;
      publicInfo.lastName = userData?.user?.lastName || userData?.lastName;
    }
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
    if (privacySettings.showWebsite) {
      publicInfo.website = userData?.website;
    }
    if (privacySettings.showResume) {
      publicInfo.resume = userData?.resume;
    }
    if (privacySettings.showEvmAddress) {
      publicInfo.evmAddress = userData?.evmAddress;
    }
    if (privacySettings.showWalletAddresses) {
      publicInfo.walletAddresses = userData?.walletAddresses;
    }

    // 获取用户参与的团队
    const userEmail = userData?.email || userDoc.id;

    // 查找作为队长的团队
    const teamsAsLeaderByUserId = await db
      .collection('team-registrations')
      .where('teamLeader.userId', '==', userDoc.id)
      .get();

    const teamsAsLeaderByEmail = await db
      .collection('team-registrations')
      .where('teamLeader.email', '==', userEmail)
      .get();

    // 查找作为队员的团队（使用 email）
    const teamsAsMemberSnapshot = await db.collection('team-registrations').get();

    const teamsAsMember: any[] = [];
    teamsAsMemberSnapshot.forEach((doc) => {
      const teamData = doc.data();
      if (teamData.teamMembers && Array.isArray(teamData.teamMembers)) {
        const isMember = teamData.teamMembers.some(
          (m: any) => m.email === userEmail || m.userId === userDoc.id,
        );
        if (isMember) {
          teamsAsMember.push(doc);
        }
      }
    });

    // 合并并去重团队列表
    const teamSet = new Set<string>();
    const teams: any[] = [];

    // 添加作为队长的团队
    teamsAsLeaderByUserId.forEach((doc) => {
      if (!teamSet.has(doc.id)) {
        teamSet.add(doc.id);
        const teamData = doc.data();
        const awards = getTeamAwards(teamData.teamName);
        teams.push({
          teamId: doc.id,
          teamName: teamData.teamName,
          role: teamData.teamLeader?.role || '',
          awards: awards,
        });
      }
    });

    teamsAsLeaderByEmail.forEach((doc) => {
      if (!teamSet.has(doc.id)) {
        teamSet.add(doc.id);
        const teamData = doc.data();
        const awards = getTeamAwards(teamData.teamName);
        teams.push({
          teamId: doc.id,
          teamName: teamData.teamName,
          role: teamData.teamLeader?.role || '',
          awards: awards,
        });
      }
    });

    // 添加作为队员的团队
    teamsAsMember.forEach((doc) => {
      if (!teamSet.has(doc.id)) {
        teamSet.add(doc.id);
        const teamData = doc.data();
        const member = teamData.teamMembers?.find(
          (m: any) => m.email === userEmail || m.userId === userDoc.id,
        );
        const awards = getTeamAwards(teamData.teamName);
        teams.push({
          teamId: doc.id,
          teamName: teamData.teamName,
          role: member?.role || '隊員',
          awards: awards,
        });
      }
    });

    publicInfo.teams = teams;

    // Check NFT mint eligibility
    let nftMintStatus = null;
    if (userEmail) {
      try {
        const nftCheckResponse = await fetch(`http://localhost:${process.env.PORT || 3009}/api/nft/check-eligibility?email=${encodeURIComponent(userEmail)}`);
        if (nftCheckResponse.ok) {
          nftMintStatus = await nftCheckResponse.json();
        }
      } catch (error) {
        console.log('[UserPublic] Could not check NFT eligibility:', error);
        // Don't fail the request if NFT check fails
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        ...publicInfo,
        nftMintStatus,
      },
    });
  } catch (error: any) {
    console.error('[UserPublic] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get user public info' });
  }
}
