/**
 * 查看挑战的实际数据
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const serviceAccount = require('../firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin 初始化成功\n');
  } catch (error) {
    console.error('❌ 無法初始化 Firebase Admin');
    console.error('請確保 firebase-service-account.json 文件存在\n');
    process.exit(1);
  }
}

const db = admin.firestore();

async function checkChallengeData(challengeId) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 查看挑戰數據');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const doc = await db.collection('extended-challenges').doc(challengeId).get();

    if (!doc.exists) {
      console.log('❌ 找不到該挑戰\n');
      return;
    }

    const data = doc.data();

    console.log('📋 挑戰基本信息:');
    console.log(`   ID: ${challengeId}`);
    console.log(`   標題: ${data.title || '(無)'}`);
    console.log(`   trackId: ${data.trackId || '(無)'}`);
    console.log('');

    console.log('💰 獎金相關字段:');
    console.log('   prizes 類型:', typeof data.prizes);
    console.log('   prizes 內容:', JSON.stringify(data.prizes, null, 2));
    console.log('   prizeDetails 類型:', typeof data.prizeDetails);
    console.log('   prizeDetails 內容:', data.prizeDetails || '(空)');
    console.log('');

    console.log('📝 提交要求相關字段:');
    console.log('   submissionRequirements 類型:', typeof data.submissionRequirements);
    console.log(
      '   submissionRequirements 內容:',
      JSON.stringify(data.submissionRequirements, null, 2),
    );
    console.log('   requirements 類型:', typeof data.requirements);
    console.log('   requirements 內容:', JSON.stringify(data.requirements, null, 2));
    console.log('');

    console.log('📄 完整數據 (JSON):');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

const challengeId = process.argv[2] || 'bLn3Yu4UuPzqRxRwFStu';
checkChallengeData(challengeId).then(() => process.exit(0));
