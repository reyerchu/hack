/**
 * 設置 Sponsor 測試數據
 * 為 alphareyer@gmail.com 創建完整的測試環境
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
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

async function setup() {
  try {
    console.log('🚀 開始設置 Sponsor 測試數據...\n');

    // 1. 獲取用戶 ID
    console.log(`1️⃣  查找用戶: ${testEmail}`);

    // 先試 registrations collection
    let usersSnapshot = await db.collection('registrations').where('email', '==', testEmail).get();

    // 如果找不到，試 users collection
    if (usersSnapshot.empty) {
      console.log('   在 registrations 中未找到，嘗試 users collection...');
      usersSnapshot = await db.collection('users').where('email', '==', testEmail).get();
    }

    if (usersSnapshot.empty) {
      console.log('   用戶不存在，創建測試用戶...');

      // 創建測試用戶
      const newUserRef = db.collection('registrations').doc();
      const newUserData = {
        email: testEmail,
        firstName: 'Reyer',
        lastName: 'Chu',
        permissions: ['user', 'sponsor'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await newUserRef.set(newUserData);

      console.log(`✅ 創建新用戶 ID: ${newUserRef.id}`);
      console.log(`   Email: ${testEmail}`);
      console.log(`   權限: ${newUserData.permissions}`);

      // 重新獲取
      usersSnapshot = await db.collection('registrations').where('email', '==', testEmail).get();
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    console.log(`✅ 找到用戶 ID: ${userId}`);
    console.log(`   Collection: ${userDoc.ref.parent.path}`);
    console.log(`   當前權限: ${userData.permissions || ['user']}`);

    // 2. 設置 sponsor 權限
    console.log('\n2️⃣  設置 Sponsor 權限');
    const currentPermissions = userData.permissions || ['user'];
    if (!currentPermissions.includes('sponsor')) {
      await userDoc.ref.update({
        permissions: [...currentPermissions, 'sponsor'],
      });
      console.log('✅ 已添加 sponsor 權限');
    } else {
      console.log('✅ 用戶已有 sponsor 權限');
    }

    // 3. 創建測試賛助商
    console.log('\n3️⃣  創建測試賛助商');
    const sponsorId = 'test-sponsor-imtoken';
    const sponsorData = {
      id: sponsorId,
      name: 'imToken（測試）',
      tier: 'track',
      logo: '/logos/imtoken.png',
      website: 'https://token.im',
      contactEmail: testEmail,
      contactName: userData.firstName + ' ' + userData.lastName,
      permissions: {
        canViewSubmissions: true,
        canEditChallenge: true,
        canScoreTeams: true,
        canContactTeams: true,
        canExportReports: true,
      },
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('extended-sponsors').doc(sponsorId).set(sponsorData, { merge: true });
    console.log(`✅ 創建賛助商: ${sponsorData.name}`);

    // 4. 創建測試挑戰
    console.log('\n4️⃣  創建測試挑戰');
    const trackId = 'imtoken-track';
    const challengeId = 'test-challenge-imtoken';
    const challengeData = {
      id: challengeId,
      title: 'imToken Track - Web3 錢包整合（測試）',
      description: '使用 imToken SDK 開發創新的 Web3 應用',
      track: 'imToken Track',
      trackId: trackId,
      sponsorId: sponsorId,
      sponsorName: 'imToken（測試）',
      prizes: [
        { place: 1, amount: 1000, currency: 'USD', description: '第一名' },
        { place: 2, amount: 500, currency: 'USD', description: '第二名' },
      ],
      requirements: {
        teamSize: { min: 1, max: 5 },
        skills: ['Solidity', 'React', 'Web3.js'],
        deliverables: ['GitHub Repo', 'Demo Video', 'Presentation'],
      },
      submissionRequirements: {
        requiredFields: ['githubRepo', 'demoUrl', 'presentationUrl'],
        customFields: [
          {
            name: 'imTokenIntegration',
            label: 'imToken 整合說明',
            type: 'textarea',
            required: true,
          },
        ],
      },
      timeline: {
        registrationStart: admin.firestore.Timestamp.fromDate(new Date('2025-10-15')),
        registrationEnd: admin.firestore.Timestamp.fromDate(new Date('2025-10-25')),
        submissionDeadline: admin.firestore.Timestamp.fromDate(new Date('2025-11-05')),
        judgingEnd: admin.firestore.Timestamp.fromDate(new Date('2025-11-10')),
        announcementDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-15')),
      },
      status: 'published',
      rank: 1,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('extended-challenges').doc(challengeId).set(challengeData, { merge: true });
    console.log(`✅ 創建挑戰: ${challengeData.title}`);

    // 5. 創建 sponsor-user-mapping
    console.log('\n5️⃣  創建用戶-賛助商關聯');
    const mappingId = `${userId}_${sponsorId}`;
    const mappingData = {
      id: mappingId,
      userId: userId,
      userEmail: testEmail,
      userName: userData.firstName + ' ' + userData.lastName,
      sponsorId: sponsorId,
      sponsorName: 'imToken（測試）',
      trackIds: [trackId],
      role: 'admin',
      permissions: [
        'view_submissions',
        'edit_challenge',
        'score_teams',
        'contact_teams',
        'export_reports',
      ],
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('sponsor-user-mappings').doc(mappingId).set(mappingData, { merge: true });
    console.log(`✅ 創建關聯: ${mappingData.userName} -> ${mappingData.sponsorName}`);

    // 6. 創建測試提交（可選）
    console.log('\n6️⃣  創建測試提交');
    const submissionId = 'test-submission-001';
    const submissionData = {
      id: submissionId,
      teamName: '測試團隊 Alpha',
      teamMembers: [
        { name: 'Alice Chen', email: 'alice@test.com', role: 'leader' },
        { name: 'Bob Wang', email: 'bob@test.com', role: 'developer' },
      ],
      projectName: 'Web3 Social Platform',
      projectTrack: 'imToken Track',
      trackId: trackId,
      challengeId: challengeId,
      oneLiner: '基於 imToken 的去中心化社交平台',
      description: '整合 imToken 錢包，提供無縫的 Web3 社交體驗',
      githubRepo: 'https://github.com/test/web3-social',
      demoUrl: 'https://demo.web3social.com',
      videoUrl: 'https://youtube.com/watch?v=test123',
      presentationUrl: 'https://docs.google.com/presentation/d/test',
      techStack: ['React', 'Solidity', 'imToken SDK', 'IPFS'],
      tags: ['DeFi', 'Social', 'Web3'],
      status: 'submitted',
      customFields: {
        imTokenIntegration: '使用 imToken SDK 實現錢包連接和交易簽名功能',
      },
      criteriaScores: {},
      finalScore: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('team-submissions').doc(submissionId).set(submissionData, { merge: true });
    console.log(`✅ 創建提交: ${submissionData.projectName}`);

    console.log('\n✨ 設置完成！\n');
    console.log('📋 摘要:');
    console.log(`   用戶: ${testEmail} (ID: ${userId})`);
    console.log(`   賛助商: imToken（測試）`);
    console.log(`   挑戰: imToken Track`);
    console.log(`   測試提交: 1 個`);
    console.log('\n🔗 現在可以訪問:');
    console.log(`   http://localhost:3009/sponsor/dashboard`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setup();
