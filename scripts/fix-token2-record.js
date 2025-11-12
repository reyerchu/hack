const admin = require('firebase-admin');

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

async function fixToken2() {
  console.log('🔧 修復 Token #2 的鑄造記錄...\n');

  const mintRecord = {
    campaignId: 'MWxmOcriDtTRsvuCFJ4o',
    userEmail: 'reyerchu@defintek.io',
    userId: 'uzzaaoqnViVklglHDTQ1KCCbSXt2',
    walletAddress: '0xE424469cA505f85240Ca811Dfe6901DEa9cc0754',
    tokenId: 2,
    transactionHash: '0xdcd8a622e857e4a2aff367a5d3d63162d854c7cdef39852efe7e025e17c859af',
    mintedAt: admin.firestore.Timestamp.fromDate(new Date('2025-11-09T15:30:00Z')), // 根據區塊時間估算
    createdAt: admin.firestore.Timestamp.now(),
  };

  console.log('準備寫入記錄:');
  console.log(JSON.stringify(mintRecord, null, 2));
  console.log('');

  const docRef = await db.collection('nft-mints').add(mintRecord);

  console.log('✅ 記錄已創建，ID:', docRef.id);
  console.log('');

  // 驗證
  const savedDoc = await docRef.get();
  console.log('驗證保存的數據:');
  console.log(JSON.stringify(savedDoc.data(), null, 2));
}

fixToken2()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 錯誤:', err);
    process.exit(1);
  });
