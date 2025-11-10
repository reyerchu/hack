const hre = require('hardhat');

async function main() {
  console.log('部署 RWA Hackathon NFT 合約...\n');

  // 從命令行參數或使用預設值
  const name = process.env.NFT_NAME || 'RWA Hackathon Taiwan 2025';
  const symbol = process.env.NFT_SYMBOL || 'RWAHACK';
  const maxSupply = process.env.NFT_MAX_SUPPLY || 100;
  const baseURI = process.env.NFT_BASE_URI || 'ipfs://QmPlaceholder/';

  console.log('合約參數:');
  console.log(`  名稱: ${name}`);
  console.log(`  符號: ${symbol}`);
  console.log(`  最大供應量: ${maxSupply}`);
  console.log(`  Base URI: ${baseURI}\n`);

  // 部署合約
  const RWAHackathonNFT = await hre.ethers.getContractFactory('RWAHackathonNFT');
  const nft = await RWAHackathonNFT.deploy(name, symbol, maxSupply, baseURI);

  // Wait for deployment (ethers v5)
  await nft.deployed();

  const contractAddress = nft.address;

  console.log(`✅ 合約已部署到: ${contractAddress}`);
  console.log(`   網路: ${hre.network.name}`);
  console.log(`   交易哈希: ${nft.deployTransaction.hash}\n`);

  // 等待幾個區塊確認
  if (hre.network.name !== 'localhost' && hre.network.name !== 'hardhat') {
    console.log('等待區塊確認...');
    await nft.deployTransaction.wait(5);
    console.log('✅ 已確認\n');

    // 驗證合約（如果在公開測試網或主網）
    try {
      console.log('開始驗證合約...');
      await hre.run('verify:verify', {
        address: contractAddress,
        constructorArguments: [name, symbol, maxSupply, baseURI],
      });
      console.log('✅ 合約已驗證\n');
    } catch (error) {
      console.log('⚠️  合約驗證失敗:', error.message);
    }
  }

  // 保存部署資訊
  const fs = require('fs');
  const path = require('path');

  const deploymentInfo = {
    network: hre.network.name,
    contractAddress,
    name,
    symbol,
    maxSupply,
    baseURI,
    deployedAt: new Date().toISOString(),
    deployer: (await hre.ethers.getSigners())[0].address,
  };

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}-${Date.now()}.json`);

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📝 部署資訊已保存到: ${deploymentFile}\n`);

  console.log('🎉 部署完成！');
  console.log('\n下一步:');
  console.log('1. 在 Firestore 的 nft-campaigns collection 中更新 contractAddress');
  console.log(`2. 複製合約地址: ${contractAddress}`);
  console.log('3. 執行 addWhitelist script 來添加白名單地址');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
