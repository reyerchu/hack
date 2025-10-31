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

async function checkTeamRegistrations() {
  const snapshot = await db.collection('team-registrations').get();
  console.log('\nteam-registrations 集合文档数:', snapshot.size);
  
  if (snapshot.size > 0) {
    console.log('\n前3个团队样例:');
    let count = 0;
    snapshot.forEach((doc) => {
      if (count < 3) {
        const data = doc.data();
        console.log(`\n团队 ${count + 1}:`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  名称: ${data.teamName || '无'}`);
        console.log(`  队长: ${data.captainName || data.captain?.name || '无'}`);
        console.log(`  成员数: ${data.members?.length || data.teamMembers?.length || 0}`);
        console.log(`  字段: ${Object.keys(data).join(', ')}`);
        count++;
      }
    });
  }
}

checkTeamRegistrations()
  .then(() => {
    console.log('\n完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('错误:', error);
    process.exit(1);
  });
