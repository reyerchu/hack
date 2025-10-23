#!/usr/bin/env node
/**
 * 检查并修复 sponsor 用户的赛道访问权限
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 读取 .env.local 文件
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      // 去除引号
      value = value.replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  }
});

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: envVars.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: envVars.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: envVars.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function checkAndFixSponsorAccess() {
  const userEmail = 'alphareyer@gmail.com';
  const trackNamePattern = 'RWA'; // 使用模糊匹配

  console.log(`\n========== 检查 ${userEmail} 的赛道访问权限 ==========\n`);

  try {
    // 1. 查找用户
    console.log('1️⃣ 查找用户...');

    // 先尝试 registrations
    let userSnapshot = await db
      .collection('registrations')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    // 如果没找到，尝试 preferredEmail
    if (userSnapshot.empty) {
      console.log('   在 registrations.email 中未找到，尝试 preferredEmail...');
      userSnapshot = await db
        .collection('registrations')
        .where('preferredEmail', '==', userEmail)
        .limit(1)
        .get();
    }

    // 如果还是没找到，尝试 users collection
    if (userSnapshot.empty) {
      console.log('   在 registrations 中未找到，尝试 users collection...');
      userSnapshot = await db.collection('users').where('email', '==', userEmail).limit(1).get();
    }

    // 如果还是没找到，尝试 users.preferredEmail
    if (userSnapshot.empty) {
      console.log('   在 users.email 中未找到，尝试 users.preferredEmail...');
      userSnapshot = await db
        .collection('users')
        .where('preferredEmail', '==', userEmail)
        .limit(1)
        .get();
    }

    // 如果还是没找到，尝试嵌套的 user.email
    if (userSnapshot.empty) {
      console.log('   尝试在所有 registrations 中搜索（包括嵌套字段）...');
      const allUsers = await db.collection('registrations').get();
      let foundUser = null;

      for (const doc of allUsers.docs) {
        const data = doc.data();
        const email =
          data.email || data.preferredEmail || data.user?.email || data.user?.preferredEmail;

        if (email && email.toLowerCase() === userEmail.toLowerCase()) {
          foundUser = doc;
          break;
        }
      }

      if (foundUser) {
        userSnapshot = { docs: [foundUser], empty: false };
        console.log('   ✅ 在嵌套字段中找到用户');
      }
    }

    // 如果还是没找到，列出所有可能的用户
    if (userSnapshot.empty) {
      console.log(`\n❌ 在任何 collection 中都未找到 email 为 ${userEmail} 的用户`);
      console.log('\n列出 registrations 中前 5 个用户（用于调试）:');
      const allUsers = await db.collection('registrations').limit(5).get();
      allUsers.docs.forEach((doc) => {
        const data = doc.data();
        const email =
          data.email || data.preferredEmail || data.user?.email || data.user?.preferredEmail;
        console.log(`  - ID: ${doc.id}, Email: ${email || 'N/A'}`);
      });
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    console.log(`✅ 找到用户: ${userId}`);
    console.log(`   Collection: ${userDoc.ref.parent.id}`);
    console.log(`   Email: ${userData.email || userData.preferredEmail || 'N/A'}`);
    console.log(`   权限: ${JSON.stringify(userData.permissions || [])}`);

    // 2. 查找 RWA 赛道
    console.log('\n2️⃣ 查找 RWA 赛道...');
    const allTracks = await db.collection('tracks').get();

    const rwaTracksArray = allTracks.docs.filter((doc) => {
      const name = doc.data().name || '';
      return name.includes(trackNamePattern);
    });

    if (rwaTracksArray.length === 0) {
      console.log(`❌ 未找到包含 "${trackNamePattern}" 的赛道`);
      console.log('\n所有赛道列表:');
      allTracks.docs.forEach((doc) => {
        console.log(`  - ${doc.data().name}`);
      });
      return;
    }

    console.log(`✅ 找到 ${rwaTracksArray.length} 个包含 "${trackNamePattern}" 的赛道:`);
    rwaTracksArray.forEach((doc) => {
      console.log(`  - ${doc.data().name} (trackId: ${doc.data().trackId})`);
    });

    // 使用第一个匹配的赛道
    const trackDoc = rwaTracksArray[0];
    const trackData = trackDoc.data();
    const trackId = trackData.trackId;
    const sponsorId = trackData.sponsorId;

    console.log(`\n将处理赛道: ${trackData.name}`);
    console.log(`   trackId: ${trackId}`);
    console.log(`   赛道文档ID: ${trackDoc.id}`);
    console.log(`   Sponsor ID: ${sponsorId}`);

    // 3. 检查 sponsor 是否存在
    console.log('\n3️⃣ 检查 sponsor...');
    const sponsorDoc = await db.collection('extended-sponsors').doc(sponsorId).get();

    if (!sponsorDoc.exists) {
      console.log(`❌ Sponsor ${sponsorId} 不存在`);
      return;
    }

    const sponsorData = sponsorDoc.data();
    console.log(`✅ 找到 sponsor: ${sponsorData.name}`);
    console.log(`   Managers: ${JSON.stringify(sponsorData.managers || [])}`);

    // 4. 检查 sponsor-user-mappings
    console.log('\n4️⃣ 检查 sponsor-user-mappings...');
    const mappingSnapshot = await db
      .collection('sponsor-user-mappings')
      .where('userId', '==', userId)
      .where('sponsorId', '==', sponsorId)
      .get();

    if (mappingSnapshot.empty) {
      console.log(`⚠️  未找到 mapping，将创建新的 mapping`);

      // 创建新的 mapping
      const newMapping = {
        userId: userId,
        sponsorId: sponsorId,
        role: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('sponsor-user-mappings').add(newMapping);
      console.log(`✅ 已创建新的 sponsor-user-mapping`);
      console.log(`   userId: ${userId}`);
      console.log(`   sponsorId: ${sponsorId}`);
      console.log(`   role: admin`);
    } else {
      console.log(`✅ 已存在 mapping`);
      mappingSnapshot.docs.forEach((doc) => {
        const mapping = doc.data();
        console.log(`   文档ID: ${doc.id}`);
        console.log(`   userId: ${mapping.userId}`);
        console.log(`   sponsorId: ${mapping.sponsorId}`);
        console.log(`   role: ${mapping.role}`);
      });
    }

    // 5. 检查 sponsor managers 字段
    console.log('\n5️⃣ 检查 sponsor managers 字段...');
    const managers = sponsorData.managers || [];
    const hasManagerEmail = managers.some((m) => {
      if (typeof m === 'string') {
        return m.toLowerCase() === userEmail.toLowerCase();
      }
      return m.email && m.email.toLowerCase() === userEmail.toLowerCase();
    });

    if (!hasManagerEmail) {
      console.log(`⚠️  managers 字段中未包含 ${userEmail}，将添加`);

      const updatedManagers = [...managers, userEmail];
      await db.collection('extended-sponsors').doc(sponsorId).update({
        managers: updatedManagers,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ 已将 ${userEmail} 添加到 managers 字段`);
    } else {
      console.log(`✅ managers 字段中已包含 ${userEmail}`);
    }

    // 6. 测试访问权限
    console.log('\n6️⃣ 测试访问权限...');
    const testMappingSnapshot = await db
      .collection('sponsor-user-mappings')
      .where('userId', '==', userId)
      .get();

    console.log(`   用户的所有 sponsor mappings: ${testMappingSnapshot.size} 个`);

    const userSponsorIds = testMappingSnapshot.docs.map((doc) => doc.data().sponsorId);
    console.log(`   用户的 sponsorIds: ${JSON.stringify(userSponsorIds)}`);

    const testTrackSnapshot = await db
      .collection('tracks')
      .where('trackId', '==', trackId)
      .where('sponsorId', 'in', userSponsorIds.length > 0 ? userSponsorIds : ['__dummy__'])
      .get();

    if (testTrackSnapshot.empty) {
      console.log(`❌ 权限测试失败: 用户仍然无法访问该赛道`);
      console.log(`   可能的问题:`);
      console.log(`   1. trackId 不匹配: ${trackId}`);
      console.log(`   2. sponsorId 不匹配: ${sponsorId}`);
    } else {
      console.log(`✅ 权限测试通过: 用户现在可以访问该赛道`);
    }

    console.log('\n========== 完成 ==========\n');
  } catch (error) {
    console.error('\n❌ 错误:', error);
    console.error(error.stack);
  }
}

checkAndFixSponsorAccess()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
