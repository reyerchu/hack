const hre = require("hardhat");

/**
 * Script to get contract information
 * Usage: node scripts/getContractInfo.js <contract_address>
 */
async function main() {
  const contractAddress = process.argv[2];

  if (!contractAddress) {
    console.error("錯誤：請提供合約地址");
    console.log("用法: node scripts/getContractInfo.js <contract_address>");
    process.exit(1);
  }

  console.log(`連接到合約: ${contractAddress}`);
  console.log(`網路: ${hre.network.name}\n`);

  // Connect to contract
  const RWAHackathonNFT = await hre.ethers.getContractFactory("RWAHackathonNFT");
  const nft = RWAHackathonNFT.attach(contractAddress);

  try {
    // Get basic info
    const [name, symbol, maxSupply, totalSupply, baseURI, mintingEnabled, owner] = await Promise.all([
      nft.name(),
      nft.symbol(),
      nft.MAX_SUPPLY(),
      nft.totalSupply(),
      nft.baseTokenURI(),
      nft.mintingEnabled(),
      nft.owner(),
    ]);

    console.log("📋 合約資訊");
    console.log("━".repeat(50));
    console.log(`名稱:         ${name}`);
    console.log(`符號:         ${symbol}`);
    console.log(`最大供應量:   ${maxSupply.toString()}`);
    console.log(`已鑄造數量:   ${totalSupply.toString()}`);
    console.log(`剩餘數量:     ${(maxSupply - totalSupply).toString()}`);
    console.log(`Base URI:     ${baseURI}`);
    console.log(`鑄造狀態:     ${mintingEnabled ? '✅ 已啟用' : '❌ 已停用'}`);
    console.log(`擁有者:       ${owner}`);
    console.log("━".repeat(50));

    // Progress bar
    const progress = Number(totalSupply) / Number(maxSupply);
    const progressBarLength = 30;
    const filledLength = Math.floor(progress * progressBarLength);
    const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);
    
    console.log(`\n鑄造進度: [${progressBar}] ${(progress * 100).toFixed(1)}%\n`);

  } catch (error) {
    console.error("❌ 錯誤:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

