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

async function checkTeams() {
  console.log('\n检查数据库连接...');
  console.log('Project ID:', process.env.SERVICE_ACCOUNT_PROJECT_ID);
  
  // 检查 teams 集合
  const teamsSnapshot = await db.collection('teams').get();
  console.log('\nteams 集合文档数:', teamsSnapshot.size);
  
  if (teamsSnapshot.size > 0) {
    console.log('\n前3个团队样例:');
    let count = 0;
    teamsSnapshot.forEach((doc) => {
      if (count < 3) {
        const data = doc.data();
        console.log(`- ${doc.id}: ${data.teamName || '无名称'}`);
        count++;
      }
    });
  }
  
  // 检查其他可能的集合
  const collections = await db.listCollections();
  console.log('\n数据库中的所有集合:');
  collections.forEach(col => {
    console.log(`- ${col.id}`);
  });
}

checkTeams()
  .then(() => {
    console.log('\n完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('错误:', error);
    process.exit(1);
  });
