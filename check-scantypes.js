const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = admin.firestore();

async function checkScanTypes() {
  try {
    const snapshot = await db.collection('scan-types').get();

    console.log(`\n📊 找到 ${snapshot.size} 个扫描类型:\n`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`ID: ${doc.id}`);
      console.log(`名称: ${data.name || '(未命名)'}`);
      console.log(`是否为 Check-in: ${data.isCheckIn ? '✅ 是' : '❌ 否'}`);
      console.log(`优先级: ${data.precedence || 0}`);
      console.log(
        `创建时间: ${
          data.createdAt ? new Date(data.createdAt._seconds * 1000).toLocaleString('zh-TW') : '未知'
        }`,
      );
      console.log('');
    });

    // 检查 checkins 集合
    const checkinsSnapshot = await db.collection('checkins').limit(5).get();
    console.log(`\n📝 Checkins 集合记录数: ${checkinsSnapshot.size} (显示前5条)\n`);
  } catch (error) {
    console.error('错误:', error);
  }

  process.exit(0);
}

checkScanTypes();
