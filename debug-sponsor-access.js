/**
 * 调试 Sponsor 访问问题
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const testEmail = 'alphareyer@gmail.com';

async function debug() {
  try {
    console.log('🔍 调试 Sponsor 访问问题\n');

    // 1. 检查用户
    console.log('1️⃣  检查用户数据');
    const usersSnapshot = await db.collection('registrations').where('email', '==', testEmail).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ 用户不存在于 registrations');
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    console.log('✅ 用户存在');
    console.log('   ID:', userDoc.id);
    console.log('   Email:', userData.email);
    console.log('   Permissions:', userData.permissions);
    console.log('   Name:', userData.firstName, userData.lastName);

    // 2. 检查 Firebase Auth 用户
    console.log('\n2️⃣  检查 Firebase Auth 用户');
    try {
      const authUser = await admin.auth().getUserByEmail(testEmail);
      console.log('✅ Firebase Auth 用户存在');
      console.log('   UID:', authUser.uid);
      console.log('   Email:', authUser.email);
      console.log('   Email Verified:', authUser.emailVerified);
    } catch (authError) {
      console.log('❌ Firebase Auth 用户不存在');
      console.log('   错误:', authError.code);
      console.log('\n💡 解决方案：用户需要在前端注册/登录才能创建 Firebase Auth 用户');
      console.log('   访问: http://localhost:3009/auth');
    }

    // 3. 检查 sponsor-user-mappings
    console.log('\n3️⃣  检查 sponsor-user-mappings');
    const mappingsSnapshot = await db.collection('sponsor-user-mappings')
      .where('userId', '==', userDoc.id)
      .get();

    if (mappingsSnapshot.empty) {
      console.log('❌ 没有找到 sponsor-user-mappings');
    } else {
      console.log(`✅ 找到 ${mappingsSnapshot.size} 个 mapping(s)`);
      mappingsSnapshot.docs.forEach(doc => {
        const mapping = doc.data();
        console.log('   Sponsor:', mapping.sponsorName);
        console.log('   Track IDs:', mapping.trackIds);
      });
    }

    // 4. 检查 extended-sponsors
    console.log('\n4️⃣  检查 extended-sponsors');
    const sponsorsSnapshot = await db.collection('extended-sponsors').get();
    console.log(`✅ 找到 ${sponsorsSnapshot.size} 个赞助商`);
    sponsorsSnapshot.docs.forEach(doc => {
      const sponsor = doc.data();
      console.log('   -', sponsor.name, `(ID: ${doc.id})`);
    });

    // 5. 检查 extended-challenges
    console.log('\n5️⃣  检查 extended-challenges');
    const challengesSnapshot = await db.collection('extended-challenges').get();
    console.log(`✅ 找到 ${challengesSnapshot.size} 个挑战`);
    challengesSnapshot.docs.forEach(doc => {
      const challenge = doc.data();
      console.log('   -', challenge.title);
      console.log('     Track ID:', challenge.trackId);
      console.log('     Sponsor:', challenge.sponsorName);
      console.log('     Status:', challenge.status);
    });

    // 6. 检查 team-submissions
    console.log('\n6️⃣  检查 team-submissions');
    const submissionsSnapshot = await db.collection('team-submissions').get();
    console.log(`✅ 找到 ${submissionsSnapshot.size} 个提交`);
    submissionsSnapshot.docs.forEach(doc => {
      const submission = doc.data();
      console.log('   -', submission.projectName);
      console.log('     Team:', submission.teamName);
      console.log('     Track:', submission.projectTrack);
    });

    console.log('\n' + '='.repeat(60));
    console.log('📋 摘要');
    console.log('='.repeat(60));
    console.log('Firestore 数据: ✅ 完整');
    console.log('Firebase Auth: ❓ 需要检查');
    console.log('\n💡 如果仍然无法访问，请确保:');
    console.log('1. 在前端使用 alphareyer@gmail.com 登录');
    console.log('2. 检查浏览器控制台是否有错误');
    console.log('3. 确认 Firebase Auth token 有效');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error);
    process.exit(1);
  }
}

debug();

