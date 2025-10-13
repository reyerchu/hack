/**
 * 检查所有用户的履历文件是否存在于 Storage，
 * 对于文件不存在的用户发送邮件通知
 */

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// 读取环境变量
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local 文件不存在');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

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
      value = value.replace(/\\n/g, '\n');
      env[key] = value;
    }
  });

  return env;
}

const env = loadEnvFile();

// 初始化 Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: env.SERVICE_ACCOUNT_PRIVATE_KEY,
    }),
    storageBucket:
      env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'hackathon-rwa-nexus.firebasestorage.app',
  });
}

// 配置邮件发送
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS || env.SMTP_PASSWORD,
  },
});

async function checkAndNotify() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║          檢查並通知用戶重新上傳履歷                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    // 1. 获取所有有履历记录的用户
    console.log('📋 步驟 1：獲取所有有履歷記錄的用戶...\n');
    const snapshot = await db.collection('registrations').get();

    const usersWithResume = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const resumes = data.resumes || (data.resume ? [data.resume] : []);

      if (resumes.length > 0) {
        usersWithResume.push({
          userId: doc.id,
          name: `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim(),
          email: data.user?.preferredEmail || '',
          nickname: data.nickname || data.user?.firstName || '',
          resumes: resumes,
        });
      }
    });

    console.log(`✅ 找到 ${usersWithResume.length} 個有履歷記錄的用戶\n`);

    // 2. 检查每个用户的文件是否存在于 Storage
    console.log('📋 步驟 2：檢查文件是否存在於 Storage...\n');
    const [allFiles] = await bucket.getFiles({ prefix: 'resumes/' });
    const storageFileNames = new Set(
      allFiles.map((file) => {
        const parts = file.name.split('/');
        return parts[parts.length - 1];
      }),
    );

    const usersWithMissingFiles = [];

    for (const user of usersWithResume) {
      const missingFiles = [];
      for (const resumeFile of user.resumes) {
        if (!storageFileNames.has(resumeFile)) {
          missingFiles.push(resumeFile);
        }
      }

      if (missingFiles.length > 0) {
        usersWithMissingFiles.push({
          ...user,
          missingFiles,
        });
      }
    }

    console.log(`⚠️  發現 ${usersWithMissingFiles.length} 個用戶的文件不存在\n`);

    if (usersWithMissingFiles.length === 0) {
      console.log('✅ 所有用戶的履歷文件都存在，無需通知！\n');
      process.exit(0);
    }

    // 3. 显示列表
    console.log('='.repeat(80));
    console.log('\n📧 需要通知的用戶列表:\n');
    usersWithMissingFiles.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.nickname})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   缺失文件: ${user.missingFiles.join(', ')}`);
      console.log('');
    });
    console.log('='.repeat(80));

    // 4. 确认是否发送邮件
    console.log('\n⚠️  即將發送 ' + usersWithMissingFiles.length + ' 封郵件\n');
    console.log('按 Ctrl+C 取消，或等待 5 秒後自動開始發送...\n');

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 5. 发送邮件
    console.log('📧 步驟 3：發送郵件通知...\n');

    let successCount = 0;
    let failCount = 0;

    for (const user of usersWithMissingFiles) {
      try {
        const mailOptions = {
          from: `"RWA 黑客松團隊" <${env.SMTP_USER}>`,
          to: user.email,
          subject: '【RWA 黑客松】請重新上傳履歷',
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a3a6e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #1a3a6e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .steps { background: white; padding: 20px; border-left: 4px solid #1a3a6e; margin: 20px 0; }
    .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RWA 黑客松</h1>
    </div>
    <div class="content">
      <h2>親愛的 ${user.name} 您好：</h2>
      
      <p>感謝您報名參加 <strong>RWA 黑客松</strong>！</p>
      
      <p>我們在系統升級過程中發現，您之前上傳的履歷文件未能成功儲存至雲端。我們對此造成的不便深感抱歉。</p>
      
      <p>為了確保您的參賽資料完整，煩請您重新上傳履歷：</p>
      
      <div style="text-align: center;">
        <a href="https://hackathon.com.tw/profile" class="button" style="color: white;">
          前往重新上傳履歷
        </a>
      </div>
      
      <div class="steps">
        <h3>📋 上傳步驟：</h3>
        <ol>
          <li>登入您的帳號</li>
          <li>進入「個人中心」</li>
          <li>在「履歷文件」區域上傳您的履歷</li>
          <li>確認上傳成功（文件會顯示在列表中）</li>
        </ol>
      </div>
      
      <p>📄 <strong>支援格式：</strong>PDF、DOC、DOCX（檔案大小限制 5MB）</p>
      
      <p>如有任何問題，歡迎隨時聯繫我們：<a href="mailto:reyerchu@defintek.io">reyerchu@defintek.io</a></p>
      
      <p>再次為造成的不便致歉，祝您黑客松順利！</p>
      
      <p>RWA 黑客松團隊<br>敬上</p>
      
      <div class="footer">
        <p>此郵件由系統自動發送，請勿直接回覆</p>
        <p>RWA Hackathon | https://hackathon.com.tw</p>
      </div>
    </div>
  </div>
</body>
</html>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [${successCount + 1}/${usersWithMissingFiles.length}] ${user.email}`);
        successCount++;

        // 延迟避免发送过快
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          `❌ [${successCount + failCount + 1}/${usersWithMissingFiles.length}] ${user.email} - ${
            error.message
          }`,
        );
        failCount++;
      }
    }

    // 6. 总结
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ 郵件發送完成\n');
    console.log(`成功：${successCount} 封`);
    console.log(`失敗：${failCount} 封`);
    console.log(`總計：${usersWithMissingFiles.length} 封\n`);

    // 生成 CSV 报告
    const csvContent = [
      'Name,Email,Nickname,Missing Files,Status',
      ...usersWithMissingFiles.map(
        (u) => `"${u.name}","${u.email}","${u.nickname}","${u.missingFiles.join('; ')}","已通知"`,
      ),
    ].join('\n');

    const csvPath = path.join(__dirname, 'notified-users-resume.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf8');

    console.log(`📄 報告已保存：${csvPath}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkAndNotify();
