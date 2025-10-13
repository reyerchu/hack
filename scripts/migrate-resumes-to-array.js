/**
 * 遷移腳本：將 resume 字段（單個字符串）轉換為 resumes 數組
 * 用法：node scripts/migrate-resumes-to-array.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 手動加載 .env.local 文件
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
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
}

loadEnvFile();

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'hackathon-rwa-nexus.firebasestorage.app',
  });
}

const db = admin.firestore();

async function migrateResumes() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║          📦 履歷數據遷移：單個 → 數組                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    const registrationsRef = db.collection('registrations');
    const snapshot = await registrationsRef.get();

    console.log(`📊 總用戶數：${snapshot.size}\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userId = doc.id;

      // 檢查是否已經有 resumes 數組
      if (data.resumes && Array.isArray(data.resumes)) {
        console.log(`⏭️  跳過 ${userId}: 已有 resumes 數組 (${data.resumes.length} 個文件)`);
        skipped++;
        continue;
      }

      // 檢查是否有舊的 resume 字段
      if (data.resume && typeof data.resume === 'string') {
        try {
          // 創建 resumes 數組
          const resumes = [data.resume];

          await registrationsRef.doc(userId).update({
            resumes: resumes,
            // 保留 resume 字段以保持向後兼容
          });

          console.log(`✅ 更新 ${userId}: "${data.resume}" → [1 個文件]`);
          updated++;
        } catch (error) {
          console.error(`❌ 更新失敗 ${userId}:`, error.message);
          errors++;
        }
      } else {
        // 沒有 resume 字段或為空
        try {
          await registrationsRef.doc(userId).update({
            resumes: [],
            resume: null,
          });
          console.log(`✅ 更新 ${userId}: 空數組`);
          updated++;
        } catch (error) {
          console.error(`❌ 更新失敗 ${userId}:`, error.message);
          errors++;
        }
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║          ✅ 遷移完成                                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log('📊 統計：');
    console.log(`   • 總用戶數：${snapshot.size}`);
    console.log(`   • 已更新：${updated}`);
    console.log(`   • 已跳過：${skipped}`);
    console.log(`   • 錯誤：${errors}\n`);

    if (errors > 0) {
      console.log('⚠️  有錯誤發生，請檢查日誌\n');
      process.exit(1);
    } else {
      console.log('🎉 所有數據遷移成功！\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ 遷移失敗：', error);
    process.exit(1);
  }
}

// 執行遷移
console.log('⚠️  這個腳本將修改數據庫中的用戶資料');
console.log('   將 resume (字符串) → resumes (數組)\n');
console.log('開始遷移...\n');

setTimeout(() => {
  migrateResumes();
}, 1000);
