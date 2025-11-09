const { ethers } = require('ethers');

async function analyzeTxs() {
  const provider = new ethers.providers.JsonRpcProvider('https://sepolia.gateway.tenderly.co');
  
  const txHashes = [
    '0x4cc036801eab6b23f6f11c268dbc99c39f8ffc4a62cc0be00b9e08d8af30f2f9', // Token #1
    '0xdcd8a622e857e4a2aff367a5d3d63162d854c7cdef39852efe7e025e17c859af', // Token #2
    '0x43813ea9ff38890229188d67c9484acdcf8516b0b815fd12fbbdfec5cf418409', // Token #3
  ];
  
  console.log('🔍 分析鑄造交易...\n');
  
  for (let i = 0; i < txHashes.length; i++) {
    const txHash = txHashes[i];
    console.log(`\n📋 Token #${i + 1}:`);
    console.log(`交易 Hash: ${txHash}`);
    
    try {
      const tx = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      console.log(`發起者 (from): ${tx.from}`);
      console.log(`接收者 (to - contract): ${tx.to}`);
      console.log(`區塊: ${receipt.blockNumber}`);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`狀態: ${receipt.status === 1 ? '✅ 成功' : '❌ 失敗'}`);
      
      // 解析交易輸入數據
      if (tx.data && tx.data.length > 10) {
        const methodId = tx.data.substring(0, 10);
        console.log(`Method ID: ${methodId}`);
        
        // mint(bytes32 emailHash, bytes32[] proof) 的 method ID 是 0x...
        // 我們可以看到參數
        if (tx.data.length > 200) {
          // 嘗試提取 emailHash (第一個參數)
          const emailHashHex = '0x' + tx.data.substring(10, 74);
          console.log(`Email Hash (參數): ${emailHashHex}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ 查詢失敗: ${error.message}`);
    }
  }
  
  console.log('\n\n💡 結論:');
  console.log('需要根據交易中的 emailHash 參數來確定是哪個用戶鑄造的');
  console.log('emailHash 應該與 Merkle Tree 中的 email hash 匹配');
}

analyzeTxs()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('錯誤:', err);
    process.exit(1);
  });
