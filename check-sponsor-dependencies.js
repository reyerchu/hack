const admin = require('firebase-admin');
const serviceAccount = require('/home/reyerchu/hack/hack/firebase-admin-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkSponsor() {
  const sponsorId = 'test-sponsor-001';

  console.log('\n========================================');
  console.log('检查 sponsor:', sponsorId);
  console.log('========================================\n');

  // 1. Check if sponsor exists
  const sponsorSnapshot = await db
    .collection('extended-sponsors')
    .where('id', '==', sponsorId)
    .get();

  console.log('1. Sponsor 存在:', !sponsorSnapshot.empty);
  if (!sponsorSnapshot.empty) {
    console.log('   Sponsor 数据:', JSON.stringify(sponsorSnapshot.docs[0].data(), null, 2));
  }

  // 2. Check tracks
  const tracksSnapshot = await db.collection('tracks').where('sponsorId', '==', sponsorId).get();

  console.log('\n2. 關聯的 Tracks:', tracksSnapshot.size);
  if (tracksSnapshot.size > 0) {
    tracksSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log('   -', data.trackId, '/', data.name);
    });
  }

  // 3. Check challenges
  const challengesSnapshot = await db
    .collection('extended-challenges')
    .where('sponsorId', '==', sponsorId)
    .get();

  console.log('\n3. 關聯的 Challenges:', challengesSnapshot.size);
  if (challengesSnapshot.size > 0) {
    challengesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log('   -', data.challengeId || data.trackId, '/', data.title || data.name);
    });
  }

  console.log('\n========================================');
  if (tracksSnapshot.empty && challengesSnapshot.empty) {
    console.log('✅ 可以安全刪除此 sponsor');
  } else {
    console.log('❌ 無法刪除：有關聯數據');
    console.log('\n建議操作：');
    if (!tracksSnapshot.empty) {
      console.log('   1. 先在 /admin/track-management 重新分配這些 tracks');
    }
    if (!challengesSnapshot.empty) {
      console.log('   2. 或者刪除這些關聯的 challenges');
    }
  }
  console.log('========================================\n');
}

checkSponsor()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
