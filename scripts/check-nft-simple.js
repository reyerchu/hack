const admin = require('firebase-admin');
const fs = require('fs');

// Read service account from file
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found:', serviceAccountPath);
  console.log('請設置 GOOGLE_APPLICATION_CREDENTIALS 環境變數或放置 serviceAccountKey.json');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function main() {
  try {
    console.log('\n🔍 檢查 NFT Campaigns...\n');

    const snapshot = await db.collection('nft-campaigns').get();
    console.log(`找到 ${snapshot.docs.length} 個活動\n`);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`活動: ${data.name}`);
      console.log(`ID: ${doc.id}`);
      console.log(`郵箱 (${data.eligibleEmails?.length || 0}):`);
      
      if (data.eligibleEmails) {
        data.eligibleEmails.forEach((email, i) => {
          console.log(`  ${i + 1}. ${email}`);
        });
      }
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

main();

