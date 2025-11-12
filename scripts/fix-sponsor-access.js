#!/usr/bin/env node
/**
 * 修复所有缺失的 sponsor manager 访问权限
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

async function findUserByEmail(email) {
  const normalizedEmail = email.toLowerCase();

  // Try registrations.email
  let userQuery = await db
    .collection('registrations')
    .where('email', '==', normalizedEmail)
    .limit(1)
    .get();

  if (!userQuery.empty) {
    return userQuery.docs[0];
  }

  // Try registrations.preferredEmail
  userQuery = await db
    .collection('registrations')
    .where('preferredEmail', '==', normalizedEmail)
    .limit(1)
    .get();

  if (!userQuery.empty) {
    return userQuery.docs[0];
  }

  // Search through all registrations for nested fields
  const allUsers = await db.collection('registrations').get();

  for (const doc of allUsers.docs) {
    const data = doc.data();
    const userEmail =
      data.email || data.preferredEmail || data.user?.email || data.user?.preferredEmail;

    if (userEmail && userEmail.toLowerCase() === normalizedEmail) {
      return doc;
    }
  }

  return null;
}

async function fixSponsorAccess() {
  console.log('\n========== 修复 Sponsor Manager 访问权限 ==========\n');

  try {
    const sponsorsSnapshot = await db.collection('extended-sponsors').get();
    console.log(`找到 ${sponsorsSnapshot.size} 个 sponsors\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const sponsorDoc of sponsorsSnapshot.docs) {
      const sponsorData = sponsorDoc.data();
      const sponsorId = sponsorDoc.id;
      const sponsorName = sponsorData.name || sponsorId;
      const managers = sponsorData.managers || [];

      if (managers.length === 0) {
        continue;
      }

      console.log(`\n📦 处理 Sponsor: ${sponsorName}`);

      for (const manager of managers) {
        const email = typeof manager === 'string' ? manager : manager?.email;

        if (!email) {
          console.log(`  ⚠️  跳过无效 manager entry`);
          continue;
        }

        console.log(`  👤 处理: ${email}`);

        // 查找用户
        const userDoc = await findUserByEmail(email);

        if (!userDoc) {
          console.log(`     ❌ 用户不存在，跳过`);
          errorCount++;
          continue;
        }

        const userId = userDoc.id;
        const userData = userDoc.data();

        // 检查并添加 sponsor permission
        let userPermissions = userData?.permissions || userData?.user?.permissions || [];

        if (!Array.isArray(userPermissions)) {
          userPermissions = [];
        }

        if (
          !userPermissions.includes('sponsor') &&
          !userPermissions.includes('admin') &&
          !userPermissions.includes('super_admin')
        ) {
          userPermissions.push('sponsor');

          if (userData?.user) {
            await userDoc.ref.update({
              'user.permissions': userPermissions,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            await userDoc.ref.update({
              permissions: userPermissions,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          console.log(`     ✅ 添加了 sponsor permission`);
        } else {
          console.log(`     ℹ️  已有 sponsor permission`);
        }

        // 检查并创建 sponsor-user-mapping
        const existingMapping = await db
          .collection('sponsor-user-mappings')
          .where('userId', '==', userId)
          .where('sponsorId', '==', sponsorId)
          .get();

        if (existingMapping.empty) {
          await db.collection('sponsor-user-mappings').add({
            userId: userId,
            sponsorId: sponsorId,
            role: 'admin',
            email: email.toLowerCase(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: 'auto-fix-script',
          });

          console.log(`     ✅ 创建了 sponsor-user-mapping (role: admin)`);
          fixedCount++;
        } else {
          // 检查 role 是否正确
          const mapping = existingMapping.docs[0];
          const mappingData = mapping.data();

          if (mappingData.role !== 'admin') {
            await mapping.ref.update({
              role: 'admin',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`     ✅ 更新了 role 为 admin (原来是: ${mappingData.role})`);
            fixedCount++;
          } else {
            console.log(`     ℹ️  Mapping 已存在且正确`);
          }
        }
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 修复完成');
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ 修复/创建的 mappings: ${fixedCount}`);
    console.log(`❌ 错误/跳过: ${errorCount}`);
    console.log(`${'='.repeat(80)}\n`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  }
}

fixSponsorAccess()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
