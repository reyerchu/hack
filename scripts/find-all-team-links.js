const admin = require('firebase-admin');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: (
        process.env.FIREBASE_PRIVATE_KEY ||
        process.env.SERVICE_ACCOUNT_PRIVATE_KEY ||
        ''
      ).replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// 所有 30 個團隊名稱
const teamNames = [
  'Star Vaults',
  'RBJJH',
  'Solasui',
  '長按以編輯',
  '估值1B的獨角獸',
  '就愛觀光組',
  '可以不要用這種讓人誤會的名字嗎',
  '力力歪力艾克斯',
  'blygccrryryy',
  '塊點會點',
  'Cryptonite',
  'StatelessGuard',
  '好藝術家',
  'ReCode Health重編醫鏈',
  'twin3',
  '五告Sui',
  'VoucherFi',
  'Zzyzx Labs',
  '艾米佳的FVM',
  '幣流徵信社',
  'Foundry Trust',
  'GreenFi Labs',
  'NomadFi 遊牧星球',
  'BlueLink',
  '上鏈夢想家',
  'TaxCoin',
  '我先上鏈的!',
  'ReadFi 知識星球',
  'RWACE',
  '王者清華大學區塊鏈研究社',
];

async function findAllTeamLinks() {
  console.log('🔍 正在查詢所有 30 個團隊的 teamId...\n');

  const results = [];

  for (const teamName of teamNames) {
    try {
      const snapshot = await db
        .collection('team-registrations')
        .where('teamName', '==', teamName)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const teamId = snapshot.docs[0].id;
        const teamData = snapshot.docs[0].data();
        results.push({
          name: teamName,
          teamId: teamId,
          link: `https://hackathon.com.tw/teams/${teamId}/public`,
          found: true,
        });
        console.log(`✅ ${teamName}`);
        console.log(`   ID: ${teamId}`);
        console.log(`   Link: https://hackathon.com.tw/teams/${teamId}/public\n`);
      } else {
        results.push({
          name: teamName,
          teamId: null,
          link: null,
          found: false,
        });
        console.log(`❌ ${teamName} - 未找到\n`);
      }
    } catch (error) {
      console.error(`❌ 查詢 ${teamName} 時出錯:`, error.message);
      results.push({
        name: teamName,
        teamId: null,
        link: null,
        found: false,
        error: error.message,
      });
    }
  }

  // 統計
  const foundCount = results.filter((r) => r.found).length;
  const notFoundCount = results.filter((r) => !r.found).length;

  console.log('\n' + '='.repeat(60));
  console.log(`📊 統計結果：`);
  console.log(`   ✅ 找到: ${foundCount} 個團隊`);
  console.log(`   ❌ 未找到: ${notFoundCount} 個團隊`);
  console.log('='.repeat(60));

  if (notFoundCount > 0) {
    console.log(`\n❌ 未找到的團隊：`);
    results
      .filter((r) => !r.found)
      .forEach((r) => {
        console.log(`   - ${r.name}`);
      });
  }

  process.exit(0);
}

findAllTeamLinks().catch((error) => {
  console.error('❌ 執行錯誤:', error);
  process.exit(1);
});
