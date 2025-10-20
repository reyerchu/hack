const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

(async () => {
  try {
    console.log('查詢 extended-challenges 集合中的 test-challenge-imtoken...\n');
    
    const doc = await db.collection('extended-challenges').doc('test-challenge-imtoken').get();
    
    if (doc.exists) {
      const data = doc.data();
      console.log('✅ 文檔存在！');
      console.log('Document ID:', doc.id);
      console.log('trackId:', data.trackId);
      console.log('track:', data.track);
      console.log('sponsorId:', data.sponsorId);
      console.log('sponsorName:', data.sponsorName);
      console.log('status:', data.status);
    } else {
      console.log('❌ 文檔不存在！');
      console.log('\n列出所有 extended-challenges 文檔：');
      const snapshot = await db.collection('extended-challenges').get();
      console.log(`找到 ${snapshot.size} 個文檔：`);
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id} (trackId: ${data.trackId}, status: ${data.status})`);
      });
    }
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
  process.exit(0);
})();

