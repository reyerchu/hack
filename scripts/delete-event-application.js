/**
 * 删除活动申请记录
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

async function deleteApplications() {
  try {
    const db = admin.firestore();
    
    // 查询该邮箱的所有申请
    const snapshot = await db
      .collection('event-applications')
      .where('definitekEmail', '==', 'reyerchu@defintek.io')
      .get();

    if (snapshot.empty) {
      console.log('✅ 没有找到相关的申请记录');
      process.exit(0);
    }

    console.log(`\n找到 ${snapshot.size} 条申请记录：\n`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Document ID: ${doc.id}`);
      console.log(`  活动: ${data.eventTitle}`);
      console.log(`  申请人: ${data.userName} (${data.userEmail})`);
      console.log(`  Defintek 邮箱: ${data.definitekEmail}`);
      console.log(`  申请时间: ${data.appliedAt}`);
      console.log('');
    });

    // 删除所有找到的记录
    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ 成功删除 ${snapshot.size} 条申请记录\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

deleteApplications();

