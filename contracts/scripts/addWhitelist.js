const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script to add wallet addresses to whitelist
 * Usage: node scripts/addWhitelist.js <contract_address> <addresses_file>
 * 
 * addresses_file format: One wallet address per line
 */
async function main() {
  const contractAddress = process.argv[2];
  const addressesFile = process.argv[3];

  if (!contractAddress) {
    console.error("錯誤：請提供合約地址");
    console.log("用法: node scripts/addWhitelist.js <contract_address> <addresses_file>");
    process.exit(1);
  }

  if (!addressesFile) {
    console.error("錯誤：請提供地址文件路徑");
    console.log("用法: node scripts/addWhitelist.js <contract_address> <addresses_file>");
    process.exit(1);
  }

  console.log(`正在讀取地址文件: ${addressesFile}`);

  // Read addresses from file
  const fileContent = fs.readFileSync(addressesFile, 'utf-8');
  const addresses = fileContent
    .split('\n')
    .map(addr => addr.trim())
    .filter(addr => addr && hre.ethers.isAddress(addr));

  if (addresses.length === 0) {
    console.error("錯誤：未找到有效的以太坊地址");
    process.exit(1);
  }

  console.log(`找到 ${addresses.length} 個有效地址\n`);

  // Connect to contract
  const RWAHackathonNFT = await hre.ethers.getContractFactory("RWAHackathonNFT");
  const nft = RWAHackathonNFT.attach(contractAddress);

  console.log(`連接到合約: ${contractAddress}`);
  console.log(`網路: ${hre.network.name}\n`);

  // Add to whitelist in batches (to avoid gas limits)
  const BATCH_SIZE = 50;
  let successCount = 0;

  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, Math.min(i + BATCH_SIZE, addresses.length));
    
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

