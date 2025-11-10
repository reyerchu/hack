const hre = require('hardhat');
const admin = require('firebase-admin');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

/**
 * Script to sync whitelist from Firestore campaign to smart contract
 * Usage: node scripts/syncWhitelistFromFirestore.js <campaign_id>
 */

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function main() {
  const campaignId = process.argv[2];

  if (!campaignId) {
    console.error('錯誤：請提供 campaign ID');
    console.log('用法: node scripts/syncWhitelistFromFirestore.js <campaign_id>');
    process.exit(1);
  }

  console.log(`正在從 Firestore 讀取活動: ${campaignId}\n`);

  // Get campaign from Firestore
  const campaignDoc = await db.collection('nft-campaigns').doc(campaignId).get();

  if (!campaignDoc.exists) {
    console.error(`錯誤：找不到活動 ${campaignId}`);
    process.exit(1);
  }

  const campaign = campaignDoc.data();

  if (!campaign.contractAddress) {
    console.error('錯誤：活動沒有設置 contractAddress');
    process.exit(1);
  }

  if (!campaign.eligibleEmails || campaign.eligibleEmails.length === 0) {
    console.error('錯誤：活動沒有 eligibleEmails');
    process.exit(1);
  }

  console.log(`活動名稱: ${campaign.name}`);
  console.log(`合約地址: ${campaign.contractAddress}`);
  console.log(`符合資格的 Email 數量: ${campaign.eligibleEmails.length}\n`);

  // Get wallet addresses for these emails
  console.log('正在查找用戶錢包地址...');

  const walletAddresses = [];
  const notFoundEmails = [];

  for (const email of campaign.eligibleEmails) {
    // Try to find user by email
    const usersSnapshot = await db
      .collection('users')
      .where('preferredEmail', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userData = usersSnapshot.docs[0].data();
      if (userData.walletAddress && hre.ethers.isAddress(userData.walletAddress)) {
        walletAddresses.push(userData.walletAddress);
        console.log(`  ✓ ${email} -> ${userData.walletAddress}`);
      } else {
        notFoundEmails.push(email);
        console.log(`  ✗ ${email} (無錢包地址)`);
      }
    } else {
      notFoundEmails.push(email);
      console.log(`  ✗ ${email} (找不到用戶)`);
    }
  }

  console.log(`\n找到 ${walletAddresses.length} 個錢包地址`);

  if (notFoundEmails.length > 0) {
    console.log(`\n⚠️  以下 ${notFoundEmails.length} 個 email 沒有錢包地址：`);
    notFoundEmails.forEach((email) => console.log(`  - ${email}`));
    console.log('\n繼續添加已找到的地址...\n');
  }

  if (walletAddresses.length === 0) {
    console.log('❌ 沒有找到任何錢包地址，退出');
    process.exit(0);
  }

  // Connect to contract
  const RWAHackathonNFT = await hre.ethers.getContractFactory('RWAHackathonNFT');
  const nft = RWAHackathonNFT.attach(campaign.contractAddress);

  console.log(`連接到合約: ${campaign.contractAddress}`);
  console.log(`網路: ${hre.network.name}\n`);

  // Add to whitelist in batches
  const BATCH_SIZE = 50;
  let successCount = 0;

  for (let i = 0; i < walletAddresses.length; i += BATCH_SIZE) {
    const batch = walletAddresses.slice(i, Math.min(i + BATCH_SIZE, walletAddresses.length));

    console.log(`正在添加第 ${i + 1} 到 ${i + batch.length} 個地址...`);

    try {
      const tx = await nft.addToWhitelist(batch);
      console.log(`  交易已發送: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`  ✅ 交易已確認 (Gas used: ${receipt.gasUsed.toString()})`);

      successCount += batch.length;
    } catch (error) {
      console.error(`  ❌ 錯誤:`, error.message);
    }
  }

  console.log(`\n🎉 完成！成功添加 ${successCount} 個地址到白名單`);

  if (notFoundEmails.length > 0) {
    console.log(`\n⚠️  注意：${notFoundEmails.length} 個 email 未能添加（無錢包地址）`);
    console.log('請提醒這些用戶在系統中綁定錢包地址');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
