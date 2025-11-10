const hre = require('hardhat');

/**
 * Script to enable/disable minting
 * Usage: node scripts/enableMinting.js <contract_address> <true|false>
 */
async function main() {
  const contractAddress = process.argv[2];
  const enabled = process.argv[3];

  if (!contractAddress) {
    console.error('錯誤：請提供合約地址');
    console.log('用法: node scripts/enableMinting.js <contract_address> <true|false>');
    process.exit(1);
  }

  if (enabled !== 'true' && enabled !== 'false') {
    console.error('錯誤：第二個參數必須是 true 或 false');
    console.log('用法: node scripts/enableMinting.js <contract_address> <true|false>');
    process.exit(1);
  }

  const shouldEnable = enabled === 'true';

  console.log(`連接到合約: ${contractAddress}`);
  console.log(`網路: ${hre.network.name}`);
  console.log(`操作: ${shouldEnable ? '啟用' : '停用'}鑄造\n`);

  // Connect to contract
  const RWAHackathonNFT = await hre.ethers.getContractFactory('RWAHackathonNFT');
  const nft = RWAHackathonNFT.attach(contractAddress);

  // Check current status
  const currentStatus = await nft.mintingEnabled();
  console.log(`目前狀態: ${currentStatus ? '已啟用' : '已停用'}`);

  if (currentStatus === shouldEnable) {
    console.log(`\n⚠️  鑄造已經${shouldEnable ? '啟用' : '停用'}，無需更改`);
    return;
  }

  // Change status
  console.log(`\n正在${shouldEnable ? '啟用' : '停用'}鑄造...`);
  const tx = await nft.setMintingEnabled(shouldEnable);
  console.log(`交易已發送: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`✅ 交易已確認 (Gas used: ${receipt.gasUsed.toString()})`);

  // Verify change
  const newStatus = await nft.mintingEnabled();
  console.log(`\n新狀態: ${newStatus ? '已啟用' : '已停用'}`);

  console.log(`\n🎉 ${shouldEnable ? '鑄造已啟用！' : '鑄造已停用！'}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
