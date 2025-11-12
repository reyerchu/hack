/**
 * 为所有用户初始化隐私设置
 *
 * 策略：对于已有数据的字段，默认设置为公开（true）
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 手动加载环境变量
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
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

// 初始化 Firebase Admin
if (!admin.apps.length) {
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ 缺少 SERVICE_ACCOUNT_PRIVATE_KEY 环境变量');
    process.exit(1);
  }

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

async function initPrivacySettings() {
  console.log('========================================');
  console.log('开始初始化用户隐私设置');
  console.log('========================================\n');

  try {
    // 获取所有 registrations
    const regsSnapshot = await db.collection('registrations').get();
    console.log(`✅ 找到 ${regsSnapshot.size} 个注册记录\n`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const regDoc of regsSnapshot.docs) {
      const regData = regDoc.data();
      const userId = regDoc.id;

      console.log(`\n🔍 检查用户: ${userId} (${regData?.nickname || 'N/A'})`);

      // 检查是否已有隐私设置
      const privacyDoc = await db.collection('user-privacy-settings').doc(userId).get();

      if (privacyDoc.exists) {
        console.log(`   ⏭️  已有隐私设置，跳过`);
        skippedCount++;
        continue;
      }

      // 根据已有数据构建隐私设置
      const privacySettings = {
        // 姓名：如果有 firstName 或 lastName 就默认公开（优先检查 user 对象）
        showName: !!(
          regData?.user?.firstName ||
          regData?.user?.lastName ||
          regData?.firstName ||
          regData?.lastName
        ),
        // Email：默认不公开
        showEmail: false,
        // Role：如果有就公开
        showRole: !!regData?.role,
        // School：如果有就公开
        showSchool: !!(regData?.school || regData?.organization),
        // GitHub：如果有就公开
        showGithub: !!regData?.github,
        // LinkedIn：如果有就公开
        showLinkedin: !!regData?.linkedin,
        // Phone：默认不公开
        showPhone: false,
        // Website：如果有就公开
        showWebsite: !!regData?.website,
        // Resume：如果有就公开
        showResume: !!regData?.resume,
        // EVM Address：如果有就公开
        showEvmAddress: !!regData?.evmAddress,
        // Wallet Addresses：如果有就公开
        showWalletAddresses: !!(regData?.walletAddresses && regData.walletAddresses.length > 0),
      };

      const hasAnyData = Object.values(privacySettings).some((v) => v === true);

      if (hasAnyData) {
        try {
          await db.collection('user-privacy-settings').doc(userId).set(privacySettings);
          console.log(
            `   ✅ 已创建隐私设置:`,
            JSON.stringify(privacySettings, null, 2)
              .split('\n')
              .map((l) => `      ${l}`)
              .join('\n'),
          );
          createdCount++;
        } catch (err) {
          console.log(`   ❌ 创建失败: ${err.message}`);
          errorCount++;
        }
      } else {
        console.log(`   ⏭️  用户没有任何额外数据，跳过`);
        skippedCount++;
      }
    }

    console.log('\n========================================');
    console.log('初始化完成！');
    console.log('========================================');
    console.log(`✅ 已创建: ${createdCount} 个隐私设置`);
    console.log(`⏭️  跳过: ${skippedCount} 个用户`);
    console.log(`❌ 失败: ${errorCount} 个用户`);
    console.log('\n');
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }

  process.exit(0);
}

// 运行脚本
initPrivacySettings();
