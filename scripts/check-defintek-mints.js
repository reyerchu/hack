const admin = require('firebase-admin');

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function checkMints() {
  const email = 'reyerchu@defintek.io';

  console.log(`\n🔍 檢查 ${email} 的鑄造記錄...\n`);

  // 查找所有鑄造記錄
  const mintsSnapshot = await db.collection('nft-mints').where('userEmail', '==', email).get();

  if (mintsSnapshot.empty) {
    console.log('❌ 找不到任何鑄造記錄');
  } else {
    console.log(`✅ 找到 ${mintsSnapshot.size} 條鑄造記錄:\n`);

    mintsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('記錄 ID:', doc.id);
      console.log('  Campaign ID:', data.campaignId);
      console.log('  User Email:', data.userEmail);
      console.log('  Token ID:', data.tokenId);
      console.log('  Transaction:', data.transactionHash);
      console.log('  Minted At:', data.mintedAt?.toDate());
      console.log('');
    });
  }

  // 檢查 NFT-1 活動
  const campaignSnapshot = await db.collection('nft-campaigns').where('name', '==', 'NFT-1').get();

  if (!campaignSnapshot.empty) {
    const campaign = campaignSnapshot.docs[0];
    console.log('📋 NFT-1 活動信息:');
    console.log('  Campaign ID:', campaign.id);
    console.log('  Contract:', campaign.data().contractAddress);
    console.log('  Current Supply:', campaign.data().currentSupply);
    console.log('  Eligible Emails:', campaign.data().eligibleEmails);
    console.log('');
  }
}

checkMints()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('錯誤:', err);
    process.exit(1);
  });
