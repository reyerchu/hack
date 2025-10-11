/**
 * 遷移腳本：為舊的找隊友需求添加 ownerNickname
 *
 * 執行方式：
 * node scripts/migrate-team-nicknames.js
 */

// 載入環境變數
require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

// 初始化 Firebase Admin（使用環境變數）
if (!admin.apps.length) {
  try {
    // 檢查必要的環境變量
    if (
      !process.env.SERVICE_ACCOUNT_PROJECT_ID ||
      !process.env.SERVICE_ACCOUNT_CLIENT_EMAIL ||
      !process.env.SERVICE_ACCOUNT_PRIVATE_KEY
    ) {
      console.error('❌ 缺少必要的環境變量：');
      console.error('   - SERVICE_ACCOUNT_PROJECT_ID');
      console.error('   - SERVICE_ACCOUNT_CLIENT_EMAIL');
      console.error('   - SERVICE_ACCOUNT_PRIVATE_KEY');
      console.error('\n請確保 .env.local 文件包含這些變數');
      process.exit(1);
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
        clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
        privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function migrateNicknames() {
  console.log('🚀 開始遷移找隊友需求的 ownerNickname...\n');

  try {
    // 獲取所有需求
    const needsSnapshot = await db.collection('teamNeeds').get();
    console.log(`📊 找到 ${needsSnapshot.size} 個需求\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const needDoc of needsSnapshot.docs) {
      const needData = needDoc.data();
      const needId = needDoc.id;

      // 如果已經有 ownerNickname 且不為空，跳過
      if (needData.ownerNickname && needData.ownerNickname.trim()) {
        console.log(`⏭️  跳過需求 ${needId} (已有 nickname: ${needData.ownerNickname})`);
        skippedCount++;
        continue;
      }

      try {
        const ownerUserId = needData.ownerUserId;
        if (!ownerUserId) {
          console.log(`⚠️  需求 ${needId}: 沒有 ownerUserId`);
          errorCount++;
          continue;
        }

        // 嘗試從註冊資料獲取 nickname
        const registrationDoc = await db.collection('registrations').doc(ownerUserId).get();

        let nickname;
        if (registrationDoc.exists) {
          const registrationData = registrationDoc.data();
          nickname = registrationData.nickname || needData.ownerName || '匿名用戶';
        } else {
          // 如果沒有註冊資料，使用 ownerName
          nickname = needData.ownerName || '匿名用戶';
        }

        // 更新需求
        await needDoc.ref.update({
          ownerNickname: nickname,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✅ 更新需求 ${needId}: "${needData.title}" -> nickname: "${nickname}"`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ 需求 ${needId} 更新失敗:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 遷移統計：');
    console.log('='.repeat(60));
    console.log(`總需求數：     ${needsSnapshot.size}`);
    console.log(`✅ 更新成功：  ${updatedCount}`);
    console.log(`⏭️  跳過：      ${skippedCount} (已有 nickname)`);
    console.log(`❌ 錯誤：      ${errorCount}`);
    console.log('='.repeat(60));
    console.log('\n🎉 遷移完成！');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 遷移失敗:', error);
    process.exit(1);
  }
}

// 執行遷移
migrateNicknames();
