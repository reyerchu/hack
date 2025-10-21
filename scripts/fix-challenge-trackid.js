/**
 * 修复工具：更新挑战的 trackId
 * 
 * 使用方法：
 * node scripts/fix-challenge-trackid.js <challengeId> <newTrackId>
 */

const admin = require('firebase-admin');

// 初始化 Firebase Admin
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

async function fixChallengeTrackId(challengeId, newTrackId) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 更新挑戰的 trackId');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. 获取挑战
    console.log(`📍 查詢挑戰: ${challengeId}`);
    const challengeRef = db.collection('extended-challenges').doc(challengeId);
    const challengeDoc = await challengeRef.get();
    
    if (!challengeDoc.exists) {
      console.log('❌ 找不到該挑戰\n');
      return;
    }

    const challenge = challengeDoc.data();
    console.log(`✅ 挑戰: ${challenge.title || '(無標題)'}`);
    console.log(`   當前 trackId: ${challenge.trackId || '(無)'}`);
    console.log(`   新 trackId: ${newTrackId}\n`);

    // 2. 确认新的赛道存在
    console.log(`📍 驗證新賽道: ${newTrackId}`);
    const trackSnap = await db.collection('tracks').where('trackId', '==', newTrackId).limit(1).get();
    
    if (trackSnap.empty) {
      console.log('❌ 找不到該賽道！請確認 trackId 正確。\n');
      return;
    }

    const track = trackSnap.docs[0].data();
    console.log(`✅ 賽道: ${track.name}`);
    console.log(`   贊助商: ${track.sponsorName}\n`);

    // 3. 更新挑战的 trackId 和相关字段
    console.log('🔄 更新挑戰數據...');
    await challengeRef.update({
      trackId: newTrackId,
      track: track.name,
      sponsorId: track.sponsorId,
      sponsorName: track.sponsorName,
      organization: track.sponsorName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ 更新成功！\n');

    // 4. 验证更新
    const updatedDoc = await challengeRef.get();
    const updated = updatedDoc.data();
    console.log('📋 更新後的數據:');
    console.log(`   trackId: ${updated.trackId}`);
    console.log(`   track: ${updated.track}`);
    console.log(`   sponsorId: ${updated.sponsorId}`);
    console.log(`   sponsorName: ${updated.sponsorName}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 修復完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

const challengeId = process.argv[2];
const newTrackId = process.argv[3];

if (!challengeId || !newTrackId) {
  console.log('\n使用方法: node scripts/fix-challenge-trackid.js <challengeId> <newTrackId>');
  console.log('\n例如:');
  console.log('node scripts/fix-challenge-trackid.js "bLn3Yu4UuPzqRxRwFStu" "sui-賽道-835919"\n');
  process.exit(1);
}

fixChallengeTrackId(challengeId, newTrackId).then(() => process.exit(0));
