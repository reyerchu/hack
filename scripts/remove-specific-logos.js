/**
 * 移除特定 Sponsors 的 Logo
 * AWS 和 RWA 黑客松台灣不需要顯示 logo
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

// 初始化 Firebase Admin
if (!admin.apps.length) {
  try {
    const privateKey = envVars.SERVICE_ACCOUNT_PRIVATE_KEY;
    const projectId = envVars.SERVICE_ACCOUNT_PROJECT_ID;
    const clientEmail = envVars.SERVICE_ACCOUNT_CLIENT_EMAIL;

    if (!privateKey || !projectId || !clientEmail) {
      throw new Error(`Missing Firebase credentials`);
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin 初始化成功\n');
  } catch (error) {
    console.error('❌ Firebase Admin 初始化失敗:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

// 需要移除 logo 的 sponsors（根據名稱）
const sponsorsToRemoveLogo = ['AWS', 'RWA 黑客松台灣'];

async function removeSpecificLogos() {
  try {
    console.log('🔍 開始移除特定 Sponsors 的 Logo...\n');

    const sponsorsSnapshot = await db.collection('extended-sponsors').get();

    console.log(`📊 找到 ${sponsorsSnapshot.size} 個贊助商\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const doc of sponsorsSnapshot.docs) {
      const sponsorData = doc.data();
      const sponsorName = sponsorData.name;
      const currentLogoUrl = sponsorData.logoUrl;

      console.log(`📌 檢查: ${sponsorName} (${doc.id})`);
      console.log(`   當前 logoUrl: ${currentLogoUrl || 'undefined'}`);

      // 檢查是否在移除列表中
      if (sponsorsToRemoveLogo.includes(sponsorName)) {
        if (currentLogoUrl) {
          // 移除 logo
          await doc.ref.update({
            logoUrl: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`   ✅ 已移除 logoUrl\n`);
          updatedCount++;
        } else {
          console.log(`   ⏭️  logoUrl 已經是空的\n`);
          skippedCount++;
        }
      } else {
        console.log(`   ⏭️  保持 logo\n`);
        skippedCount++;
      }
    }

    console.log(`${'='.repeat(60)}`);
    console.log('✅ 處理完成！');
    console.log(`   移除 logo: ${updatedCount} 個`);
    console.log(`   跳過: ${skippedCount} 個`);
    console.log(`${'='.repeat(60)}\n`);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

removeSpecificLogos()
  .then(() => {
    console.log('🎉 腳本執行完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 腳本執行失敗:', error);
    process.exit(1);
  });
