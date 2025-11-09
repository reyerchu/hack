const { ethers } = require('ethers');

async function checkOnChain() {
  const contractAddress = '0x52d8BdaeC6AFb0c54D24Fc14949dd9755424b86f';
  
  // 使用公共 Sepolia RPC
  const provider = new ethers.providers.JsonRpcProvider('https://sepolia.gateway.tenderly.co');
  
  // NFT 合約的 ABI
  const abi = [
    "function totalSupply() view returns (uint256)",
    "function tokenByIndex(uint256 index) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
  ];
  
  console.log('🔍 檢查 Sepolia 鏈上 NFT 數據...\n');
  console.log('合約地址:', contractAddress);
  console.log('');
  
  try {
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    // 查詢總供應量
    const totalSupply = await contract.totalSupply();
    console.log('✅ Total Supply:', totalSupply.toString());
    console.log('');
    
    // 查詢每個 token 的擁有者
    console.log('📋 Token 擁有者列表:\n');
    for (let i = 0; i < totalSupply.toNumber(); i++) {
      try {
        const tokenId = await contract.tokenByIndex(i);
        const owner = await contract.ownerOf(tokenId);
        console.log(`Token #${tokenId}: ${owner}`);
      } catch (err) {
        console.log(`Token #${i}: ❌ 查詢失敗`);
      }
    }
    
    console.log('\n📊 查詢 Transfer 事件...\n');
    
    // 查詢最近的 Transfer 事件
    const filter = contract.filters.Transfer(null, null, null);
    const events = await contract.queryFilter(filter, -10000); // 最近 10000 個區塊
    
    console.log(`找到 ${events.length} 個 Transfer 事件:\n`);
    
    events.forEach((event, index) => {
      console.log(`事件 #${index + 1}:`);
      console.log(`  From: ${event.args.from}`);
      console.log(`  To: ${event.args.to}`);
      console.log(`  Token ID: ${event.args.tokenId.toString()}`);
      console.log(`  Tx Hash: ${event.transactionHash}`);
      console.log(`  Block: ${event.blockNumber}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    console.log('\n請訪問 Etherscan 手動查看:');
    console.log(`https://sepolia.etherscan.io/token/${contractAddress}`);
  }
}

checkOnChain()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('錯誤:', err);
    process.exit(1);
  });
