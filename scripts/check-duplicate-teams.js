const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && match[1].startsWith('SERVICE_ACCOUNT_')) {
    process.env[match[1]] = match[2];
  }
});

// Initialize Firebase
if (!admin.apps.length) {
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;
  if (privateKey && (privateKey.startsWith('"') || privateKey.startsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();

async function checkDuplicateTeams() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  检查重复注册的团队                                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const teamsRef = db.collection('teams');
  const snapshot = await teamsRef.get();

  const teams = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    teams.push({
      id: doc.id,
      teamName: data.teamName || '',
      leaderEmail: data.leaderEmail || '',
      leaderName: data.leaderName || '',
      members: data.teamMembers || [],
      createdAt: data.createdAt,
      track: data.track || '',
    });
  });

  console.log(`📊 总共找到 ${teams.length} 个团队\n`);

  // Check 1: Duplicate team names
  console.log('═══════════════════════════════════════════════════════════');
  console.log('1️⃣  检查重复的团队名称\n');
  const teamNameMap = {};
  teams.forEach((team) => {
    const name = team.teamName.trim().toLowerCase();
    if (!teamNameMap[name]) {
      teamNameMap[name] = [];
    }
    teamNameMap[name].push(team);
  });

  const duplicateNames = Object.entries(teamNameMap).filter(([_, teams]) => teams.length > 1);

  if (duplicateNames.length > 0) {
    console.log(`⚠️  发现 ${duplicateNames.length} 个重复的团队名称：\n`);
    duplicateNames.forEach(([name, dupeTeams], index) => {
      console.log(
        `${index + 1}. 团队名称: "${dupeTeams[0].teamName}" (${dupeTeams.length} 个重复)`,
      );
      dupeTeams.forEach((team, i) => {
        console.log(`   ${String.fromCharCode(97 + i)}. ID: ${team.id}`);
        console.log(`      队长: ${team.leaderName} (${team.leaderEmail})`);
        console.log(`      赛道: ${team.track}`);
        console.log(`      成员数: ${team.members.length}`);
        console.log(
          `      创建时间: ${
            team.createdAt ? new Date(team.createdAt.seconds * 1000).toLocaleString('zh-CN') : 'N/A'
          }`,
        );
      });
      console.log('');
    });
  } else {
    console.log('✅ 没有发现重复的团队名称\n');
  }

  // Check 2: Duplicate leader emails
  console.log('═══════════════════════════════════════════════════════════');
  console.log('2️⃣  检查重复的队长邮箱\n');
  const leaderEmailMap = {};
  teams.forEach((team) => {
    const email = team.leaderEmail.trim().toLowerCase();
    if (email) {
      if (!leaderEmailMap[email]) {
        leaderEmailMap[email] = [];
      }
      leaderEmailMap[email].push(team);
    }
  });

  const duplicateLeaderEmails = Object.entries(leaderEmailMap).filter(
    ([_, teams]) => teams.length > 1,
  );

  if (duplicateLeaderEmails.length > 0) {
    console.log(`⚠️  发现 ${duplicateLeaderEmails.length} 个重复的队长邮箱：\n`);
    duplicateLeaderEmails.forEach(([email, dupeTeams], index) => {
      console.log(`${index + 1}. 队长邮箱: ${email} (${dupeTeams.length} 个团队)`);
      dupeTeams.forEach((team, i) => {
        console.log(`   ${String.fromCharCode(97 + i)}. 团队: "${team.teamName}" (ID: ${team.id})`);
        console.log(`      队长: ${team.leaderName}`);
        console.log(`      赛道: ${team.track}`);
        console.log(
          `      创建时间: ${
            team.createdAt ? new Date(team.createdAt.seconds * 1000).toLocaleString('zh-CN') : 'N/A'
          }`,
        );
      });
      console.log('');
    });
  } else {
    console.log('✅ 没有发现重复的队长邮箱\n');
  }

  // Check 3: Teams with overlapping members (same email in different teams)
  console.log('═══════════════════════════════════════════════════════════');
  console.log('3️⃣  检查在多个团队中的成员\n');
  const memberEmailMap = {};
  teams.forEach((team) => {
    const allEmails = [team.leaderEmail, ...team.members.map((m) => m.email)].filter((e) => e);
    allEmails.forEach((email) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail) {
        if (!memberEmailMap[normalizedEmail]) {
          memberEmailMap[normalizedEmail] = [];
        }
        memberEmailMap[normalizedEmail].push({
          teamId: team.id,
          teamName: team.teamName,
          track: team.track,
        });
      }
    });
  });

  const duplicateMembers = Object.entries(memberEmailMap)
    .filter(([_, teams]) => teams.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  if (duplicateMembers.length > 0) {
    console.log(`⚠️  发现 ${duplicateMembers.length} 个在多个团队中的成员：\n`);
    duplicateMembers.slice(0, 20).forEach(([email, memberTeams], index) => {
      console.log(`${index + 1}. 成员邮箱: ${email} (在 ${memberTeams.length} 个团队中)`);
      memberTeams.forEach((team, i) => {
        console.log(
          `   ${String.fromCharCode(97 + i)}. 团队: "${team.teamName}" (ID: ${team.teamId})`,
        );
        console.log(`      赛道: ${team.track}`);
      });
      console.log('');
    });
    if (duplicateMembers.length > 20) {
      console.log(`   ... 还有 ${duplicateMembers.length - 20} 个重复成员\n`);
    }
  } else {
    console.log('✅ 没有发现在多个团队中的成员\n');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 汇总统计\n');
  console.log(`   总团队数: ${teams.length}`);
  console.log(`   重复团队名称: ${duplicateNames.length}`);
  console.log(`   重复队长邮箱: ${duplicateLeaderEmails.length}`);
  console.log(`   在多个团队中的成员: ${duplicateMembers.length}`);
  console.log('\n✅ 检查完成！\n');
}

checkDuplicateTeams().catch(console.error);
