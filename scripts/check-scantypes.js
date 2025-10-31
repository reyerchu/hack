// Load environment from .env.local manually
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function checkScanTypes() {
  try {
    const snapshot = await db.collection('scan-types').get();
    
    console.log(`\n📊 扫描类型总数: ${snapshot.size}\n`);
    
    if (snapshot.empty) {
      console.log('❌ 没有找到任何扫描类型');
    } else {
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`ID: ${doc.id}`);
        console.log(`名称: ${data.name || '(未命名)'}`);
        console.log(`是否为 Check-in: ${data.isCheckIn ? '✅ 是' : '❌ 否'}`);
        console.log(`优先级: ${data.precedence || 0}`);
        if (data.createdAt) {
          const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt._seconds * 1000);
          console.log(`创建时间: ${date.toLocaleString('zh-TW')}`);
        }
        console.log('');
      });
    }
    
    // 检查 checkins 集合
    const checkinsSnapshot = await db.collection('checkins').limit(5).get();
    console.log(`\n📝 Checkins 集合记录数: ${checkinsSnapshot.size}\n`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
  
  process.exit(0);
}

checkScanTypes();

