const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
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

async function checkAndTruncateTeamNames() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  检查并截断团队名称（限制：30字符）                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Get all teams
    const teamsSnapshot = await db.collection('team-registrations').get();
    
    console.log(`📊 总共找到 ${teamsSnapshot.size} 个团队\n`);
    
    if (teamsSnapshot.empty) {
      console.log('❌ 没有找到任何团队');
      return;
    }

    const teamsToUpdate = [];
    const validTeams = [];

    // Check each team
    teamsSnapshot.forEach((doc) => {
      const teamData = doc.data();
      const teamName = teamData.teamName || '';
      const teamId = doc.id;
      const length = teamName.length;

      if (length > 30) {
        const truncatedName = teamName.substring(0, 30);
        teamsToUpdate.push({
          id: teamId,
          originalName: teamName,
          truncatedName: truncatedName,
          originalLength: length,
        });
      } else {
        validTeams.push({
          id: teamId,
          name: teamName,
          length: length,
        });
      }
    });

    // Display results
    console.log('✅ 符合30字符限制的团队：\n');
    validTeams.forEach((team, index) => {
      console.log(`${index + 1}. [${team.length}字] ${team.name}`);
      console.log(`   ID: ${team.id}\n`);
    });

    if (teamsToUpdate.length === 0) {
      console.log('\n🎉 所有团队名称都符合30字符限制！');
      return;
    }

    console.log(`\n⚠️  需要截断的团队（${teamsToUpdate.length}个）：\n`);
    teamsToUpdate.forEach((team, index) => {
      console.log(`${index + 1}. [${team.originalLength}字 → 30字]`);
      console.log(`   原名称: ${team.originalName}`);
      console.log(`   新名称: ${team.truncatedName}`);
      console.log(`   ID: ${team.id}\n`);
    });

    // Ask for confirmation
    console.log('═'.repeat(60));
    console.log('❓ 是否要执行截断操作？');
    console.log('   如果要执行，请运行：');
    console.log('   node scripts/check-and-truncate-team-names.js --confirm\n');

    // Check if --confirm flag is present
    const confirmFlag = process.argv.includes('--confirm');
    
    if (!confirmFlag) {
      console.log('ℹ️  仅显示预览，未执行任何修改\n');
      return;
    }

    // Execute truncation
    console.log('\n🔄 开始执行截断操作...\n');
    
    let successCount = 0;
    let errorCount = 0;

    for (const team of teamsToUpdate) {
      try {
        await db.collection('team-registrations').doc(team.id).update({
          teamName: team.truncatedName,
        });
        console.log(`✅ 已更新: ${team.id}`);
        successCount++;
      } catch (error) {
        console.error(`❌ 更新失败: ${team.id}`, error.message);
        errorCount++;
      }
    }

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║  截断操作完成                                             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${errorCount}`);
    console.log(`📊 总计: ${teamsToUpdate.length}\n`);

  } catch (error) {
    console.error('\n❌ 执行过程中发生错误:', error);
  }
}

// Run the script
checkAndTruncateTeamNames()
  .then(() => {
    console.log('✅ 脚本执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });

