/**
 * 更新 Sponsors 的 Logo URL
 * 使用 Home 页面中的 logo 路径
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 讀取 .env.local 文件
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ 找不到 .env.local 文件');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

// 解析環境變數
const envVars = {};
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      // 移除引號
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      envVars[key.trim()] = value;
    }
  }
});

console.log('📋 找到的環境變數:', Object.keys(envVars).join(', '));

// 初始化 Firebase Admin
if (!admin.apps.length) {
  try {
    const privateKey = envVars.SERVICE_ACCOUNT_PRIVATE_KEY;
    const projectId = envVars.SERVICE_ACCOUNT_PROJECT_ID;
    const clientEmail = envVars.SERVICE_ACCOUNT_CLIENT_EMAIL;

    if (!privateKey || !projectId || !clientEmail) {
      throw new Error(
        `Missing Firebase credentials: privateKey=${!!privateKey}, projectId=${!!projectId}, clientEmail=${!!clientEmail}`,
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin 初始化成功');
  } catch (error) {
    console.error('❌ Firebase Admin 初始化失敗:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

// Logo 映射表（从 Home 页面的 TSMCPrizePool.tsx 获取）
const logoMapping = {
  imToken: '/sponsor-media/imToken-logo.svg',
  國泰金控: '/sponsor-media/Cathay-logo.png',
  'Oasis Protocol': '/sponsor-media/Oasis-logo.svg',
  'Self Protocol': '/sponsor-media/Self-logo.svg',
  Zircuit: '/sponsor-media/Zircuit-logo.svg',
  Sui: '/sponsor-media/Sui-logo.svg',
  AWS: '/sponsor-media/AWS-logo.svg',
  'RWA 黑客松台灣': '/sponsor-media/RWA-logo.svg',
};

async function updateSponsorLogos() {
  try {
    console.log('\n🔍 開始檢查並更新 Sponsor Logos...\n');

    const sponsorsSnapshot = await db.collection('extended-sponsors').get();

    console.log(`📊 找到 ${sponsorsSnapshot.size} 個贊助商\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const doc of sponsorsSnapshot.docs) {
      const sponsorData = doc.data();
      const sponsorName = sponsorData.name;
      const currentLogoUrl = sponsorData.logoUrl;

      console.log(`\n📌 處理: ${sponsorName} (${doc.id})`);
      console.log(`   當前 logoUrl: ${currentLogoUrl || 'undefined'}`);

      // 查找匹配的 logo
      const newLogoUrl = logoMapping[sponsorName];

      if (newLogoUrl) {
        if (currentLogoUrl !== newLogoUrl) {
          // 更新 logo
          await doc.ref.update({
            logoUrl: newLogoUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`   ✅ 更新 logoUrl: ${newLogoUrl}`);
          updatedCount++;
        } else {
          console.log(`   ⏭️  Logo 已經是最新的`);
          skippedCount++;
        }
      } else {
        console.log(`   ⚠️  找不到匹配的 logo，請手動添加`);
        skippedCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ 更新完成！');
    console.log(`   更新: ${updatedCount} 個`);
    console.log(`   跳過: ${skippedCount} 個`);
    console.log(`${'='.repeat(60)}\n`);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

updateSponsorLogos()
  .then(() => {
    console.log('🎉 腳本執行完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 腳本執行失敗:', error);
    process.exit(1);
  });
