/**
 * 获取前几个团队的 ID 用于测试
 */

const admin = require('firebase-admin');

// 初始化 Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();

async function getTeamIds() {
  try {
    console.log('获取团队列表...\n');

    const teamsSnapshot = await db.collection('team-registrations').limit(5).get();

    if (teamsSnapshot.empty) {
      console.log('没有找到团队');
      return;
    }

    console.log(`找到 ${teamsSnapshot.size} 个团队：\n`);

    teamsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`团队 ID: ${doc.id}`);
      console.log(`团队名称: ${data.teamName}`);
      console.log(`测试链接: https://hackathon.com.tw/teams/${doc.id}/public`);

      if (data.teamLeader) {
        console.log(`队长: ${data.teamLeader.name || data.teamLeader.email}`);
        const leaderId = data.teamLeader.userId || data.teamLeader.email;
        console.log(`队长链接: https://hackathon.com.tw/user/${leaderId}`);
      }

      console.log('---\n');
    });
  } catch (error) {
    console.error('错误:', error);
  } finally {
    process.exit(0);
  }
}

getTeamIds();
