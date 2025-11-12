#!/usr/bin/env node

/**
 * 驗證已部署的 NFT 合約
 * 用法: node scripts/verify-contract.js <contract-address> <name> <symbol> <maxSupply> <baseURI> <merkleRoot>
 */

const { execSync } = require('child_process');

const args = process.argv.slice(2);

if (args.length < 6) {
  console.log('❌ 參數不足\n');
  console.log('用法:');
  console.log(
    '  node scripts/verify-contract.js <contract> <name> <symbol> <maxSupply> <baseURI> <merkleRoot>\n',
  );
  console.log('範例:');
  console.log('  node scripts/verify-contract.js \\');
  console.log('    0xE744C67219e200906C7A9393B02315B6180E7df0 \\');
  console.log('    "RWA Hackathon Taiwan 2025" \\');
  console.log('    "RWAHACK" \\');
  console.log('    104 \\');
  console.log('    "ipfs://QmYourMetadataCID" \\');
  console.log('    "0x1234...5678"\n');
  process.exit(1);
}

const [contractAddress, name, symbol, maxSupply, baseURI, merkleRoot] = args;

console.log('\n🔍 驗證合約參數:\n');
console.log(`Contract Address: ${contractAddress}`);
console.log(`Name:             ${name}`);
console.log(`Symbol:           ${symbol}`);
console.log(`Max Supply:       ${maxSupply}`);
console.log(`Base URI:         ${baseURI}`);
console.log(`Merkle Root:      ${merkleRoot}`);
console.log('\n');

try {
  console.log('📡 開始在 Etherscan 上驗證合約...\n');

  const command = `cd contracts && npx hardhat verify --network sepolia ${contractAddress} "${name}" "${symbol}" ${maxSupply} "${baseURI}" "${merkleRoot}"`;

  console.log(`執行命令: ${command}\n`);

  const output = execSync(command, {
    encoding: 'utf-8',
    stdio: 'inherit',
  });

  console.log('\n✅ 合約驗證成功！\n');
  console.log('🔗 查看合約:');
  console.log(`   https://sepolia.etherscan.io/address/${contractAddress}#code\n`);
  console.log('📝 現在你應該能看到:');
  console.log('   - Read Contract 標籤');
  console.log('   - Write Contract 標籤');
  console.log('   - 合約源代碼\n');
} catch (error) {
  console.error('\n❌ 驗證失敗\n');

  if (error.message.includes('Already Verified')) {
    console.log('✅ 合約已經驗證過了！');
    console.log(`   https://sepolia.etherscan.io/address/${contractAddress}#code\n`);
  } else {
    console.error('錯誤信息:', error.message);
    console.log('\n💡 可能的原因:');
    console.log('   1. ETHERSCAN_API_KEY 未設置在 .env.local');
    console.log('   2. 構造函數參數不正確');
    console.log('   3. 合約地址錯誤');
    console.log('   4. 網路連接問題\n');
    process.exit(1);
  }
}
