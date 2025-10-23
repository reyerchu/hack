#!/usr/bin/env node
/**
 * 检查所有 sponsor managers 的访问权限
 *
 * 验证每个 sponsor manager 是否有：
 * 1. sponsor permission
 * 2. sponsor-user-mappings 记录
 * 3. 能够访问对应的 tracks
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

async function checkAllSponsorAccess() {
  console.log('\n========== 检查所有 Sponsor Manager 的访问权限 ==========\n');

  try {
    // 1. 获取所有 sponsors
    console.log('📋 Step 1: 获取所有 sponsors...\n');
    const sponsorsSnapshot = await db.collection('extended-sponsors').get();
    console.log(`找到 ${sponsorsSnapshot.size} 个 sponsors\n`);

    const issues = [];
    const summary = {
      totalSponsors: sponsorsSnapshot.size,
      totalManagers: 0,
      managersWithIssues: 0,
      managersOK: 0,
    };

    // 2. 检查每个 sponsor
    for (const sponsorDoc of sponsorsSnapshot.docs) {
      const sponsorData = sponsorDoc.data();
      const sponsorId = sponsorDoc.id;
      const sponsorName = sponsorData.name || sponsorId;
      const managers = sponsorData.managers || [];

      console.log(`\n${'='.repeat(80)}`);
      console.log(`📦 Sponsor: ${sponsorName} (ID: ${sponsorId})`);
      console.log(`${'='.repeat(80)}`);

      if (managers.length === 0) {
        console.log('  ⚠️  没有 managers');
        continue;
      }

      console.log(`  👥 Managers (${managers.length}):`);

      // 3. 获取该 sponsor 的所有 tracks
      const tracksSnapshot = await db
        .collection('tracks')
        .where('sponsorId', '==', sponsorId)
        .get();

      const trackIds = tracksSnapshot.docs.map((doc) => doc.data().trackId);
      console.log(`  🎯 Tracks (${trackIds.length}): ${trackIds.join(', ') || 'none'}\n`);

      // 4. 检查每个 manager
      for (const manager of managers) {
        summary.totalManagers++;

        const email = typeof manager === 'string' ? manager : manager?.email;
        const name = typeof manager === 'object' ? manager?.name : '';

        if (!email) {
          console.log(`  ❌ Invalid manager entry:`, manager);
          issues.push({
            sponsor: sponsorName,
            sponsorId,
            issue: 'Invalid manager entry',
            manager,
          });
          summary.managersWithIssues++;
          continue;
        }

        console.log(`  👤 Checking: ${email}${name ? ` (${name})` : ''}`);

        const managerIssues = [];

        // 4.1 查找用户
        const userDoc = await findUserByEmail(email);

        if (!userDoc) {
          console.log(`     ❌ User not found in database`);
          managerIssues.push('User not found');
          issues.push({
            sponsor: sponsorName,
            sponsorId,
            email,
            issue: 'User not found in database',
          });
          summary.managersWithIssues++;
          continue;
        }

        const userId = userDoc.id;
        const userData = userDoc.data();
        console.log(`     ✅ User found: ${userId}`);

        // 4.2 检查 permissions
        const permissions = userData?.permissions || userData?.user?.permissions || [];
        const hasSponsorPermission =
          permissions.includes('sponsor') ||
          permissions.includes('admin') ||
          permissions.includes('super_admin');

        if (hasSponsorPermission) {
          console.log(`     ✅ Has sponsor permission: ${permissions.join(', ')}`);
        } else {
          console.log(
            `     ❌ Missing sponsor permission (current: ${permissions.join(', ') || 'none'})`,
          );
          managerIssues.push('Missing sponsor permission');
        }

        // 4.3 检查 sponsor-user-mappings
        const mappingSnapshot = await db
          .collection('sponsor-user-mappings')
          .where('userId', '==', userId)
          .where('sponsorId', '==', sponsorId)
          .get();

        if (mappingSnapshot.empty) {
          console.log(`     ❌ Missing sponsor-user-mapping`);
          managerIssues.push('Missing sponsor-user-mapping');
        } else {
          const mapping = mappingSnapshot.docs[0].data();
          console.log(`     ✅ Has sponsor-user-mapping (role: ${mapping.role})`);

          if (mapping.role !== 'admin') {
            console.log(`     ⚠️  Role is not 'admin' (current: ${mapping.role})`);
            managerIssues.push(`Role is '${mapping.role}' instead of 'admin'`);
          }
        }

        // 4.4 测试访问 tracks
        if (trackIds.length > 0) {
          const userSponsorIds = [];

          if (permissions.includes('super_admin') || permissions.includes('admin')) {
            // Admin 可以访问所有 tracks
            console.log(`     ✅ Admin user - can access all tracks`);
          } else {
            // 获取用户的所有 sponsor mappings
            const allMappingsSnapshot = await db
              .collection('sponsor-user-mappings')
              .where('userId', '==', userId)
              .get();

            allMappingsSnapshot.docs.forEach((doc) => {
              userSponsorIds.push(doc.data().sponsorId);
            });

            if (userSponsorIds.includes(sponsorId)) {
              console.log(`     ✅ Can access tracks for this sponsor`);
            } else {
              console.log(`     ❌ Cannot access tracks (no mapping found)`);
              managerIssues.push('Cannot access tracks');
            }
          }
        }

        // 汇总
        if (managerIssues.length > 0) {
          console.log(`     📋 Issues: ${managerIssues.join(', ')}`);
          issues.push({
            sponsor: sponsorName,
            sponsorId,
            email,
            userId,
            issues: managerIssues,
          });
          summary.managersWithIssues++;
        } else {
          console.log(`     ✅ All checks passed`);
          summary.managersOK++;
        }
      }
    }

    // 5. 打印总结
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('📊 SUMMARY');
    console.log(`${'='.repeat(80)}`);
    console.log(`Total Sponsors: ${summary.totalSponsors}`);
    console.log(`Total Managers: ${summary.totalManagers}`);
    console.log(`✅ Managers OK: ${summary.managersOK}`);
    console.log(`❌ Managers with Issues: ${summary.managersWithIssues}`);

    if (issues.length > 0) {
      console.log(`\n\n${'='.repeat(80)}`);
      console.log('🔍 ISSUES FOUND');
      console.log(`${'='.repeat(80)}`);

      issues.forEach((issue, idx) => {
        console.log(`\n${idx + 1}. ${issue.sponsor} (${issue.sponsorId})`);
        console.log(`   Email: ${issue.email || 'N/A'}`);
        if (issue.userId) {
          console.log(`   User ID: ${issue.userId}`);
        }
        if (issue.issue) {
          console.log(`   Issue: ${issue.issue}`);
        }
        if (issue.issues) {
          console.log(`   Issues: ${issue.issues.join(', ')}`);
        }
      });

      console.log(`\n\n${'='.repeat(80)}`);
      console.log('💡 RECOMMENDED ACTIONS');
      console.log(`${'='.repeat(80)}`);
      console.log('1. For "User not found" issues:');
      console.log('   - Ask users to complete registration first');
      console.log('   - Or remove invalid email from sponsor managers list');
      console.log('');
      console.log('2. For "Missing sponsor permission" or "Missing sponsor-user-mapping" issues:');
      console.log('   - Run: node scripts/fix-sponsor-access.js');
      console.log('   - Or re-save the sponsor in admin panel to trigger auto-fix');
      console.log('');
      console.log('3. For "Role is not admin" issues:');
      console.log('   - Update the sponsor-user-mapping role to "admin"');
    } else {
      console.log(`\n✅ All sponsor managers have correct access rights!`);
    }

    console.log(`\n${'='.repeat(80)}\n`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  }
}

checkAllSponsorAccess()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
