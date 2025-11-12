/**
 * 查找工具：找到 SUI RWA 挑战
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

async function findSuiChallenge() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 查找 SUI RWA 挑戰');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const targetTrackId = 'sui-賽道-835919';
    const wrongChallengeId = 'bLn3Yu4UuPzqRxRwFStu';

    // 1. 查看错误的挑战ID对应的内容
    console.log(`📍 檢查 challengeId: ${wrongChallengeId}`);
    const wrongDoc = await db.collection('extended-challenges').doc(wrongChallengeId).get();

    if (wrongDoc.exists) {
      const wrong = wrongDoc.data();
      console.log(`❌ 當前顯示的挑戰:`);
      console.log(`   標題: ${wrong.title || '(無)'}`);
      console.log(`   trackId: ${wrong.trackId || '(無)'}`);
      console.log(`   描述: ${(wrong.description || '').substring(0, 50)}...`);
      console.log('');
    }

    // 2. 查找标题包含 "Sui" 或 "RWA" 的挑战
    console.log('📍 搜索包含 "Sui" 或 "RWA" 的挑戰...\n');
    const allChallenges = await db.collection('extended-challenges').get();

    const suiChallenges = [];
    allChallenges.docs.forEach((doc) => {
      const data = doc.data();
      const title = (data.title || '').toLowerCase();
      const desc = (data.description || '').toLowerCase();

      if (
        title.includes('sui') ||
        title.includes('rwa') ||
        desc.includes('sui') ||
        desc.includes('rwa')
      ) {
        suiChallenges.push({
          id: doc.id,
          title: data.title,
          trackId: data.trackId,
          description: data.description,
          prizes: data.prizes,
          status: data.status,
        });
      }
    });

    console.log(`找到 ${suiChallenges.length} 個相關挑戰:\n`);

    suiChallenges.forEach((c, i) => {
      console.log(`${i + 1}. ${c.title || '(無標題)'}`);
      console.log(`   ID: ${c.id}`);
      console.log(`   trackId: ${c.trackId || '(無)'}`);
      console.log(`   狀態: ${c.status || '(無)'}`);

      if (c.trackId === targetTrackId) {
        console.log(`   ✅ 這個挑戰的 trackId 正確！`);
      } else {
        console.log(`   ⚠️  trackId 不匹配 (應該是: ${targetTrackId})`);
      }

      if (c.description && c.description.includes('最佳 Sui RWA')) {
        console.log(`   ⭐ 這可能是正確的挑戰！`);
      }

      if (c.prizes) {
        console.log(`   獎金: ${JSON.stringify(c.prizes)}`);
      }
      console.log('');
    });

    // 3. 查找 sui-賽道-835919 的所有挑战
    console.log(`\n📍 查找賽道 "${targetTrackId}" 的所有挑戰...\n`);
    const trackChallenges = await db
      .collection('extended-challenges')
      .where('trackId', '==', targetTrackId)
      .get();

    console.log(`找到 ${trackChallenges.size} 個挑戰:\n`);

    trackChallenges.docs.forEach((doc, i) => {
      const c = doc.data();
      console.log(`${i + 1}. ${c.title || '(無標題)'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   描述: ${(c.description || '').substring(0, 80)}...`);
      if (c.prizes) {
        console.log(`   獎金: ${JSON.stringify(c.prizes)}`);
      }
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 建議');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const correctChallenge = suiChallenges.find(
      (c) => c.trackId === targetTrackId && (c.title || '').includes('RWA'),
    );

    if (correctChallenge) {
      console.log('找到正確的挑戰！');
      console.log(`Challenge ID: ${correctChallenge.id}`);
      console.log(`標題: ${correctChallenge.title}`);
      console.log('\n修復方法：');
      console.log('1. 如果這不是您看到的挑戰，請檢查前端 URL');
      console.log('2. 如果其他挑戰的 trackId 錯誤，使用修復腳本更新\n');
    } else {
      console.log('未找到完全匹配的挑戰。');
      console.log('請檢查上面列出的挑戰，找到正確的並使用修復腳本更新 trackId。\n');
    }
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

findSuiChallenge().then(() => process.exit(0));
