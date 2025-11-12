#!/usr/bin/env node

/**
 * 從 Firestore 獲取合約部署參數
 * 用於驗證合約
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function getContractParams(contractAddress) {
  console.log(`\n🔍 查找合約: ${contractAddress}\n`);

  try {
    // Search for campaign with this contract address
    const campaignsSnapshot = await db
      .collection('nft-campaigns')
      .where('contractAddress', '==', contractAddress)
      .limit(1)
      .get();

    if (campaignsSnapshot.empty) {
      console.log('❌ 找不到此合約地址的活動\n');
      console.log('💡 請確認合約地址是否正確，或檢查 Firestore 中的 nft-campaigns collection\n');
      process.exit(1);
    }

    const campaign = campaignsSnapshot.docs[0].data();

    console.log('✅ 找到活動！\n');
    console.log('📋 合約部署參數:\n');
    console.log(`Campaign ID:      ${campaignsSnapshot.docs[0].id}`);
    console.log(`Contract Address: ${campaign.contractAddress}`);
    console.log(`Name:             ${campaign.name}`);
    console.log(`Symbol:           ${campaign.symbol || 'RWAHACK'}`);
    console.log(`Max Supply:       ${campaign.maxSupply}`);
    console.log(`Network:          ${campaign.network}`);

    // Check if we have deployment info
    if (campaign.deploymentProgress?.deployment) {
      const deployment = campaign.deploymentProgress.deployment;
      console.log(`\nDeployment Info:`);
      console.log(`  Transaction:    ${deployment.transactionHash}`);
      console.log(`  Deployed At:    ${deployment.completedAt?.toDate?.() || 'N/A'}`);
    }

    // Check for IPFS/metadata info
    if (campaign.deploymentProgress?.ipfs) {
      const ipfs = campaign.deploymentProgress.ipfs;
      console.log(`\nIPFS Info:`);
      console.log(`  Image CID:      ${ipfs.imageCID}`);
      console.log(`  Metadata CID:   ${ipfs.metadataCID}`);
      console.log(`  Base URI:       ${ipfs.baseURI}`);
    }

    // Check for Merkle Tree info
    if (campaign.merkleRoot) {
      console.log(`\nMerkle Tree:`);
      console.log(`  Root:           ${campaign.merkleRoot}`);
    }

    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 驗證合約命令:\n');

    const baseURI = campaign.deploymentProgress?.ipfs?.baseURI || 'ipfs://MISSING';
    const merkleRoot =
      campaign.merkleRoot || '0x0000000000000000000000000000000000000000000000000000000000000000';

    console.log(`node scripts/verify-contract.js \\`);
    console.log(`  ${campaign.contractAddress} \\`);
    console.log(`  "${campaign.name}" \\`);
    console.log(`  "${campaign.symbol || 'RWAHACK'}" \\`);
    console.log(`  ${campaign.maxSupply} \\`);
    console.log(`  "${baseURI}" \\`);
    console.log(`  "${merkleRoot}"`);
    console.log('\n');

    if (baseURI === 'ipfs://MISSING') {
      console.log('⚠️  警告: Base URI 缺失！這可能導致驗證失敗。\n');
      console.log('💡 請先確保已經上傳 metadata 到 IPFS。\n');
    }
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
  }
}

// Get contract address from command line
const contractAddress = process.argv[2];

if (!contractAddress) {
  console.log('\n用法: node scripts/get-contract-params.js <contract-address>\n');
  console.log('範例:');
  console.log('  node scripts/get-contract-params.js 0xE744C67219e200906C7A9393B02315B6180E7df0\n');
  process.exit(1);
}

getContractParams(contractAddress);
