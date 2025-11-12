/**
 * 修复 registrations 集合中缺少 email 的记录
 *
 * 问题：某些用户在 registrations 中没有 email 或 preferredEmail 字段
 * 解决方案：从 Firebase Auth 获取 email 并更新到 registrations
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 手动加载环境变量（读取 .env.local）
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // 移除引号
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

// 初始化 Firebase Admin（使用环境变量）
if (!admin.apps.length) {
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ 缺少 SERVICE_ACCOUNT_PRIVATE_KEY 环境变量');
    process.exit(1);
  }

  // 处理私钥格式
  privateKey = privateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'hackathon-rwa-nexus.firebasestorage.app',
  });

  console.log('✅ Firebase Admin SDK 初始化成功\n');
}

const db = admin.firestore();

async function fixRegistrationsEmail() {
  console.log('========================================');
  console.log('开始修复 registrations 数据完整性问题');
  console.log('========================================\n');

  try {
    // 获取所有 registrations
    const regsSnapshot = await db.collection('registrations').get();
    console.log(`✅ 找到 ${regsSnapshot.size} 个注册记录\n`);

    let fixedCount = 0;
    let alreadyOkCount = 0;
    let failedCount = 0;
    const failedUsers = [];

    for (const regDoc of regsSnapshot.docs) {
      const regData = regDoc.data();
      const userId = regDoc.id;

      // 检查是否缺少 email 字段
      const hasPreferredEmail = regData?.preferredEmail;
      const hasEmail = regData?.email;

      if (hasPreferredEmail && hasEmail) {
        alreadyOkCount++;
        continue;
      }

      console.log(`\n🔍 检查用户: ${userId}`);
      console.log(`   当前 preferredEmail: ${hasPreferredEmail || '(空)'}`);
      console.log(`   当前 email: ${hasEmail || '(空)'}`);

      try {
        // 从 Firebase Auth 获取 email
        const authUser = await admin.auth().getUser(userId);
        const authEmail = authUser.email;

        if (!authEmail) {
          console.log(`   ⚠️  Auth 中也没有 email`);
          failedCount++;
          failedUsers.push({
            userId,
            nickname: regData?.nickname,
            reason: 'No email in Auth',
          });
          continue;
        }

        // 更新 registrations
        const updates = {};
        if (!hasPreferredEmail) {
          updates.preferredEmail = authEmail;
        }
        if (!hasEmail) {
          updates.email = authEmail;
        }

        if (Object.keys(updates).length > 0) {
          await regDoc.ref.update(updates);
          console.log(`   ✅ 已更新: ${JSON.stringify(updates)}`);
          fixedCount++;
        }
      } catch (authError) {
        console.log(`   ❌ 获取 Auth 失败: ${authError.message}`);
        failedCount++;
        failedUsers.push({
          userId,
          nickname: regData?.nickname,
          reason: authError.message,
        });
      }
    }

    console.log('\n========================================');
    console.log('修复完成！');
    console.log('========================================');
    console.log(`✅ 已修复: ${fixedCount} 个记录`);
    console.log(`✓  正常: ${alreadyOkCount} 个记录`);
    console.log(`❌ 失败: ${failedCount} 个记录`);

    if (failedUsers.length > 0) {
      console.log('\n失败的用户列表：');
      failedUsers.forEach((user, index) => {
        console.log(
          `  ${index + 1}. userId: ${user.userId}, nickname: ${user.nickname || 'N/A'}, 原因: ${
            user.reason
          }`,
        );
      });
    }

    console.log('\n');
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }

  process.exit(0);
}

// 运行脚本
fixRegistrationsEmail();
