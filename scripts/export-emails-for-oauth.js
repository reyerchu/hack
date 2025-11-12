/**
 * 從 Firestore 導出所有註冊者的 email
 * 用於添加到 Google OAuth 測試用戶清單
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 初始化 Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('✅ Firebase Admin SDK 初始化成功');
  } catch (error) {
    console.error('❌ Firebase 初始化失敗:', error.message);
    console.log('\n請確保已設置 GOOGLE_APPLICATION_CREDENTIALS 環境變數');
    console.log('或將 service account key JSON 檔案放在專案根目錄');
    process.exit(1);
  }
}

const db = admin.firestore();

async function exportEmails() {
  try {
    console.log('📊 正在從 Firestore 讀取註冊資料...\n');

    // 讀取所有註冊資料
    const snapshot = await db.collection('registrations').get();

    if (snapshot.empty) {
      console.log('⚠️  沒有找到註冊資料');
      return;
    }

    console.log(`✅ 找到 ${snapshot.size} 筆註冊資料\n`);

    const emails = [];
    const invalidEntries = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      // 嘗試從不同欄位獲取 email
      let email = null;

      if (data.user?.preferredEmail) {
        email = data.user.preferredEmail;
      } else if (data.preferredEmail) {
        email = data.preferredEmail;
      } else if (data.email) {
        email = data.email;
      }

      if (email) {
        // 驗證 email 格式
        if (email.includes('@')) {
          emails.push(email.toLowerCase().trim());
        } else {
          invalidEntries.push({ id: doc.id, email });
        }
      } else {
        invalidEntries.push({ id: doc.id, reason: 'no email field' });
      }
    });

    // 去重
    const uniqueEmails = [...new Set(emails)];

    // 依類型分類
    const gmailEmails = uniqueEmails.filter((e) => e.endsWith('@gmail.com'));
    const deftekEmails = uniqueEmails.filter((e) => e.endsWith('@defintek.io'));
    const otherEmails = uniqueEmails.filter(
      (e) => !e.endsWith('@gmail.com') && !e.endsWith('@defintek.io'),
    );

    // 輸出統計
    console.log('📧 Email 統計：');
    console.log(`   總計: ${uniqueEmails.length} 個`);
    console.log(`   Gmail: ${gmailEmails.length} 個`);
    console.log(`   defintek.io: ${deftekEmails.length} 個`);
    console.log(`   其他: ${otherEmails.length} 個`);

    if (invalidEntries.length > 0) {
      console.log(`   ⚠️  無效/缺失: ${invalidEntries.length} 個`);
    }
    console.log('');

    // 輸出為文字檔（每行一個 email）
    const outputFile = path.join(__dirname, '..', 'oauth-test-users.txt');
    fs.writeFileSync(outputFile, uniqueEmails.join('\n'));
    console.log(`✅ 已導出到: ${outputFile}\n`);

    // 輸出為 JSON（包含詳細資訊）
    const jsonFile = path.join(__dirname, '..', 'oauth-test-users.json');
    fs.writeFileSync(
      jsonFile,
      JSON.stringify(
        {
          total: uniqueEmails.length,
          gmail: gmailEmails.length,
          defintek: deftekEmails.length,
          other: otherEmails.length,
          emails: uniqueEmails,
          gmailEmails,
          deftekEmails,
          otherEmails,
          invalidEntries,
        },
        null,
        2,
      ),
    );
    console.log(`✅ 詳細資訊已存至: ${jsonFile}\n`);

    // 顯示前 10 個 email 作為預覽
    console.log('📋 Email 清單預覽（前 10 個）：');
    console.log('─'.repeat(50));
    uniqueEmails.slice(0, 10).forEach((email, i) => {
      console.log(`${i + 1}. ${email}`);
    });
    if (uniqueEmails.length > 10) {
      console.log(`... 還有 ${uniqueEmails.length - 10} 個`);
    }
    console.log('─'.repeat(50));
    console.log('');

    // 顯示無效條目
    if (invalidEntries.length > 0) {
      console.log('⚠️  無效/缺失 email 的條目：');
      console.log('─'.repeat(50));
      invalidEntries.slice(0, 5).forEach((entry, i) => {
        if (entry.email) {
          console.log(`${i + 1}. ID: ${entry.id}, Email: ${entry.email}`);
        } else {
          console.log(`${i + 1}. ID: ${entry.id}, 原因: ${entry.reason}`);
        }
      });
      if (invalidEntries.length > 5) {
        console.log(`... 還有 ${invalidEntries.length - 5} 個`);
      }
      console.log('─'.repeat(50));
      console.log('');
    }

    // 使用說明
    console.log('📝 下一步：');
    console.log('');
    console.log('1️⃣  複製 oauth-test-users.txt 的內容：');
    console.log(`   cat ${outputFile}`);
    console.log('');
    console.log('2️⃣  前往 Google Cloud Console：');
    console.log('   https://console.cloud.google.com/apis/credentials/consent');
    console.log('');
    console.log('3️⃣  向下滾動到「測試使用者」區塊');
    console.log('');
    console.log('4️⃣  點擊「+ ADD USERS」');
    console.log('');
    console.log('5️⃣  貼上複製的 email 清單');
    console.log('');
    console.log('6️⃣  點擊「儲存」');
    console.log('');
    console.log('✅ 完成！所有用戶都可以使用 Google Calendar 整合了');
    console.log('');

    // 如果有超過 100 個，提示需要發布
    if (uniqueEmails.length > 100) {
      console.log('⚠️  注意：測試用戶最多只能添加 100 個');
      console.log('   您有 ' + uniqueEmails.length + ' 個 email');
      console.log('');
      console.log('建議：發布應用程式為正式版');
      console.log('   1. 前往 OAuth 同意畫面');
      console.log('   2. 點擊「PUBLISH APP」');
      console.log('   3. 確認發布');
      console.log('');
    }
  } catch (error) {
    console.error('❌ 錯誤:', error);
    throw error;
  }
}

// 執行
exportEmails()
  .then(() => {
    console.log('🎉 導出完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 導出失敗:', error);
    process.exit(1);
  });
