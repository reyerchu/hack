/**
 * 清空特定活動的所有申請記錄
 */

const admin = require('firebase-admin');
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
  });
}

async function clearApplications() {
  try {
    const eventId = 'Elyt7SvclfTp43LPKmaq';
    
    console.log('\n════════════════════════════════════════');
    console.log('  清空活動申請記錄');
    console.log('════════════════════════════════════════\n');
    console.log(`活動 ID: ${eventId}\n`);
    
    const db = admin.firestore();
    
    // 查询该活动的所有申请
    const snapshot = await db
      .collection('event-applications')
      .where('eventId', '==', eventId)
      .get();

    if (snapshot.empty) {
      console.log('✅ 該活動沒有申請記錄\n');
      process.exit(0);
    }

    console.log(`找到 ${snapshot.size} 條申請記錄：\n`);

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.userName || 'Unknown'} (${data.userEmail})`);
      console.log(`   Defintek 郵箱: ${data.definitekEmail}`);
      console.log(`   申請時間: ${data.appliedAt}`);
      console.log('');
    });

    console.log('⚠️  即將刪除所有申請記錄...');
    console.log('等待 3 秒，按 Ctrl+C 取消\n');
    
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 删除所有找到的记录
    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    console.log('════════════════════════════════════════');
    console.log(`✅ 成功刪除 ${snapshot.size} 條申請記錄`);
    console.log('════════════════════════════════════════\n');
    console.log('🚀 Ready for production!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

clearApplications();

