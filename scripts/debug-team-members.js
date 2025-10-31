const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

async function debugTeamMembers() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  調試團隊成員資料                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    const teamsSnapshot = await db.collection('team-registrations').get();
    
    console.log(`📊 找到 ${teamsSnapshot.size} 個團隊\n`);

    let totalMembersWithName = 0;
    let totalMembersWithoutName = 0;
    let totalMembersAll = 0;

    teamsSnapshot.forEach((doc) => {
      const team = doc.data();
      const teamName = team.teamName || '未命名團隊';
      
      console.log(`\n團隊: ${teamName}`);
      console.log(`Team ID: ${doc.id}`);
      
      // 檢查隊長
      if (team.teamLeader) {
        console.log(`  隊長:`);
        console.log(`    姓名: "${team.teamLeader.name}" (有值: ${!!team.teamLeader.name}, 非空: ${!!(team.teamLeader.name && team.teamLeader.name.trim())})`);
        console.log(`    郵箱: ${team.teamLeader.email || '無'}`);
        totalMembersAll++;
        if (team.teamLeader.name && team.teamLeader.name.trim()) {
          totalMembersWithName++;
        } else {
          totalMembersWithoutName++;
        }
      } else {
        console.log(`  隊長: 無資料`);
      }
      
      // 檢查成員
      if (team.teamMembers && Array.isArray(team.teamMembers)) {
        console.log(`  成員數量: ${team.teamMembers.length}`);
        team.teamMembers.forEach((member, index) => {
          console.log(`    成員 ${index + 1}:`);
          console.log(`      姓名: "${member.name}" (有值: ${!!member.name}, 非空: ${!!(member.name && member.name.trim())})`);
          console.log(`      郵箱: ${member.email || '無'}`);
          totalMembersAll++;
          if (member.name && member.name.trim()) {
            totalMembersWithName++;
          } else {
            totalMembersWithoutName++;
          }
        });
      } else {
        console.log(`  成員: 無`);
      }
    });

    console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║  統計結果                                                ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`\n總團隊數: ${teamsSnapshot.size}`);
    console.log(`總成員數（全部）: ${totalMembersAll}`);
    console.log(`有姓名的成員: ${totalMembersWithName}`);
    console.log(`無姓名的成員: ${totalMembersWithoutName}\n`);

  } catch (error) {
    console.error('❌ 錯誤:', error);
    throw error;
  }
}

// 執行腳本
debugTeamMembers()
  .then(() => {
    console.log('✅ 完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 失敗:', error);
    process.exit(1);
  });

