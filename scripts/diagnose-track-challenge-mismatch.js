const admin = require('firebase-admin');

// 使用 service account 文件初始化
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

async function diagnose(trackId, challengeId) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 賽道和挑戰數據一致性診斷');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. 查询赛道
    console.log(`📍 查詢賽道: ${trackId}`);
    const trackSnap = await db.collection('tracks').where('trackId', '==', trackId).limit(1).get();

    if (trackSnap.empty) {
      console.log('❌ 找不到該賽道\n');
      return;
    }

    const track = trackSnap.docs[0].data();
    console.log(`✅ 賽道: ${track.name}`);
    console.log(`   贊助商: ${track.sponsorName}\n`);

    // 2. 查询挑战
    console.log(`📍 查詢挑戰: ${challengeId}`);
    const challengeDoc = await db.collection('extended-challenges').doc(challengeId).get();

    if (!challengeDoc.exists) {
      console.log('❌ 找不到該挑戰\n');
      return;
    }

    const challenge = challengeDoc.data();
    console.log(`✅ 挑戰: ${challenge.title || '(無標題)'}`);
    console.log(`   trackId: ${challenge.trackId}`);
    console.log(`   贊助商: ${challenge.sponsorName}\n`);

    // 3. 检查匹配
    console.log('🔍 檢查 trackId 匹配...');
    if (challenge.trackId === trackId) {
      console.log('✅ trackId 匹配\n');
    } else {
      console.log('❌ trackId 不匹配！');
      console.log(`   挑戰的 trackId: ${challenge.trackId}`);
      console.log(`   賽道的 trackId: ${trackId}\n`);
    }

    // 4. 查询赛道的所有挑战
    console.log('📍 查詢該賽道的所有挑戰...');
    const allChallenges = await db
      .collection('extended-challenges')
      .where('trackId', '==', trackId)
      .where('status', '==', 'published')
      .get();

    console.log(`找到 ${allChallenges.size} 個挑戰:\n`);
    allChallenges.docs.forEach((doc, i) => {
      const c = doc.data();
      console.log(`   ${i + 1}. ${c.title || '(無標題)'}`);
      console.log(`      ID: ${doc.id}`);
      if (doc.id === challengeId) console.log(`      ⭐ 這是您點擊的挑戰`);
      console.log('');
    });

    // 5. 如果不匹配，查找实际赛道
    if (challenge.trackId !== trackId) {
      console.log(`📍 查詢挑戰實際所屬的賽道...`);
      const actualTrackSnap = await db
        .collection('tracks')
        .where('trackId', '==', challenge.trackId)
        .limit(1)
        .get();

      if (!actualTrackSnap.empty) {
        const actualTrack = actualTrackSnap.docs[0].data();
        console.log(`✅ 挑戰實際屬於: ${actualTrack.name}`);
        console.log(`\n⚠️  這個挑戰不應該出現在 "${track.name}" 賽道頁面！\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(challenge.trackId !== trackId ? '❌ 數據不一致' : '✅ 數據一致');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

const trackId = process.argv[2];
const challengeId = process.argv[3];

if (!trackId || !challengeId) {
  console.log(
    '\n使用方法: node scripts/diagnose-track-challenge-mismatch.js <trackId> <challengeId>\n',
  );
  process.exit(1);
}

diagnose(trackId, challengeId).then(() => process.exit(0));
