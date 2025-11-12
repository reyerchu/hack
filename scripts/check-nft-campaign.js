const path = require('path');

// Add parent directory to require path to access lib
require('module').globalPaths.push(path.resolve(__dirname, '..'));

const initializeApi = require('../lib/admin/init').default;
const { firestore } = require('firebase-admin');

// Initialize Firebase
initializeApi();
const db = firestore();

async function checkCampaign() {
  try {
    console.log('\n🔍 檢查 NFT Campaigns...\n');

    const campaignsSnapshot = await db.collection('nft-campaigns').get();

    console.log(`找到 ${campaignsSnapshot.docs.length} 個活動\n`);

    for (const doc of campaignsSnapshot.docs) {
      const data = doc.data();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📋 活動: ${data.name}`);
      console.log(`🆔 ID: ${doc.id}`);
      console.log(`📧 符合資格的郵箱 (${data.eligibleEmails?.length || 0}):`);

      if (data.eligibleEmails && data.eligibleEmails.length > 0) {
        data.eligibleEmails.forEach((email, index) => {
          console.log(`   ${index + 1}. ${email}`);
        });

        // Check if users have wallet addresses
        console.log('\n💰 檢查錢包地址:');
        for (const email of data.eligibleEmails) {
          const usersSnapshot = await db
            .collection('users')
            .where('preferredEmail', '==', email.toLowerCase().trim())
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userData = usersSnapshot.docs[0].data();
            if (userData.walletAddress) {
              console.log(`   ✓ ${email} -> ${userData.walletAddress}`);
            } else {
              console.log(`   ✗ ${email} (用戶存在但沒有錢包地址)`);
            }
          } else {
            console.log(`   ✗ ${email} (用戶不存在)`);
          }
        }
      } else {
        console.log('   (無)');
      }

      console.log(`\n🌐 網路: ${data.network || '未設定'}`);
      console.log(`📊 最大供應量: ${data.maxSupply || '未設定'}`);
      console.log(`📝 狀態: ${data.status || '未設定'}`);

      if (data.contractAddress) {
        console.log(`📜 合約地址: ${data.contractAddress}`);
      } else {
        console.log(`📜 合約地址: 尚未部署`);
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ 錯誤:', error);
  } finally {
    process.exit(0);
  }
}

checkCampaign();
