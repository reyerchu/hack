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

async function checkSameTeamNames() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  检查相同团队名称                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const teamsRef = db.collection('teams');
  const snapshot = await teamsRef.get();

  console.log(`📊 数据库连接成功！`);
  console.log(`📦 集合: teams`);
  console.log(`📝 文档总数: ${snapshot.size}\n`);

  if (snapshot.empty) {
    console.log('⚠️  数据库中没有团队数据。\n');
    console.log('可能的原因：');
    console.log('  1. 还没有团队注册');
    console.log('  2. 连接到了错误的 Firestore 项目');
    console.log('  3. 集合名称不正确\n');

    console.log('检查 Firebase 项目配置：');
    console.log(`  Project ID: ${process.env.SERVICE_ACCOUNT_PROJECT_ID}`);
    console.log(`  Client Email: ${process.env.SERVICE_ACCOUNT_CLIENT_EMAIL}\n`);
    return;
  }

  const teams = [];
  const teamNameMap = new Map();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const teamName = (data.teamName || '').trim();

    const teamInfo = {
      id: doc.id,
      teamName: data.teamName || '',
      normalizedName: teamName.toLowerCase(),
      leaderEmail: data.leaderEmail || '',
      leaderName: data.leaderName || '',
      memberCount: (data.teamMembers || []).length,
      createdAt: data.createdAt,
      track: data.track || '',
      trackName: data.trackName || '',
    };

    teams.push(teamInfo);

    // Group by normalized name
    const normalizedName = teamInfo.normalizedName;
    if (!teamNameMap.has(normalizedName)) {
      teamNameMap.set(normalizedName, []);
    }
    teamNameMap.get(normalizedName).push(teamInfo);
  });

  console.log(`✅ 成功读取 ${teams.length} 个团队\n`);

  // Find duplicates
  const duplicates = Array.from(teamNameMap.entries())
    .filter(([_, teams]) => teams.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  if (duplicates.length === 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 没有发现重复的团队名称！\n');

    console.log('所有团队名称：');
    teams.forEach((team, index) => {
      console.log(`  ${index + 1}. "${team.teamName}" (ID: ${team.id})`);
    });
    console.log('');
    return;
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`⚠️  发现 ${duplicates.length} 个重复的团队名称：\n`);

  duplicates.forEach(([normalizedName, dupeTeams], index) => {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n${index + 1}. 团队名称: "${dupeTeams[0].teamName}"`);
    console.log(`   重复次数: ${dupeTeams.length}\n`);

    dupeTeams
      .sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return a.createdAt.seconds - b.createdAt.seconds;
      })
      .forEach((team, i) => {
        const isFirst = i === 0;
        const label = isFirst ? '🟢 最早注册' : '🔴 重复注册';

        console.log(`   ${label} ${String.fromCharCode(65 + i)}.`);
        console.log(`   ├─ ID: ${team.id}`);
        console.log(`   ├─ 队长: ${team.leaderName} <${team.leaderEmail}>`);
        console.log(`   ├─ 赛道: ${team.trackName || team.track || 'N/A'}`);
        console.log(`   ├─ 成员数: ${team.memberCount}`);
        console.log(
          `   └─ 创建时间: ${
            team.createdAt
              ? new Date(team.createdAt.seconds * 1000).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : 'N/A'
          }`,
        );
        console.log('');
      });
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 统计摘要\n');
  console.log(`   总团队数: ${teams.length}`);
  console.log(`   唯一团队名称: ${teamNameMap.size}`);
  console.log(`   重复的团队名称: ${duplicates.length}`);
  console.log(`   受影响的团队: ${duplicates.reduce((sum, [_, teams]) => sum + teams.length, 0)}`);
  console.log('');

  // Recommendations
  console.log('═══════════════════════════════════════════════════════════');
  console.log('💡 建议操作\n');
  console.log('   1. 联系队长确认是否为误操作');
  console.log('   2. 保留最早注册的团队（标记为 🟢）');
  console.log('   3. 考虑删除重复注册的团队（标记为 🔴）');
  console.log('   4. 或者要求队长修改团队名称\n');
}

checkSameTeamNames().catch((error) => {
  console.error('\n❌ 错误:', error.message);
  console.error('\n详细信息:', error);
});
