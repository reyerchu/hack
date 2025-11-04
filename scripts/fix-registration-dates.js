/**
 * 修复用户注册日期
 *
 * 问题：当用户更新个人资料时，timestamp 字段会被更新为当前时间
 * 解决方案：使用 Firebase Auth 的 creationTime 作为真正的注册时间
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && match[1].startsWith('SERVICE_ACCOUNT_')) {
    process.env[match[1]] = match[2];
  }
});

// Initialize Firebase
if (!admin.apps.length) {
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;
  if (privateKey && (privateKey.startsWith('"') || privateKey.startsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function fixRegistrationDates() {
  console.log('🔧 開始修復註冊日期...\n');

  try {
    // 獲取所有用戶記錄
    const registrationsSnapshot = await db.collection('registrations').get();
    console.log(`📊 找到 ${registrationsSnapshot.size} 個用戶記錄\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of registrationsSnapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();

      try {
        // 從 Firebase Auth 獲取用戶資訊
        const authUser = await auth.getUser(userId);

        // Firebase Auth creationTime 是 UTC 字符串，例如 "Tue, 03 Nov 2024 10:30:00 GMT"
        const creationTime = new Date(authUser.metadata.creationTime);
        const creationTimestamp = creationTime.getTime();

        const currentTimestamp = userData.timestamp;

        // 如果當前 timestamp 與創建時間不匹配（差異超過 1 小時），則更新
        if (!currentTimestamp || Math.abs(currentTimestamp - creationTimestamp) > 3600000) {
          await db
            .collection('registrations')
            .doc(userId)
            .update({
              timestamp: creationTimestamp,
              // 如果沒有 createdAt，也設置它
              ...(!userData.createdAt && {
                createdAt: admin.firestore.Timestamp.fromDate(creationTime),
              }),
            });

          const email =
            userData.email || userData.preferredEmail || userData.user?.preferredEmail || '無';
          console.log(`✅ 修復: ${email}`);
          console.log(
            `   舊時間: ${
              currentTimestamp ? new Date(currentTimestamp).toLocaleString('zh-TW') : '無'
            }`,
          );
          console.log(`   新時間: ${creationTime.toLocaleString('zh-TW')}\n`);

          fixedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ 處理用戶 ${userId} 時發生錯誤:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 修復完成統計:');
    console.log(`   ✅ 修復: ${fixedCount} 個用戶`);
    console.log(`   ⏭️  跳過: ${skippedCount} 個用戶（時間正確）`);
    console.log(`   ❌ 錯誤: ${errorCount} 個用戶`);
  } catch (error) {
    console.error('❌ 修復過程發生錯誤:', error);
    process.exit(1);
  }
}

// 執行修復
fixRegistrationDates()
  .then(() => {
    console.log('\n✅ 註冊日期修復完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  });
