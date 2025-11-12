# 合約驗證最佳實踐

## 實施的改進

根據 Hardhat 最佳實踐，我們已經實施了以下改進：

### 1. ✅ 確保配置一致
```javascript
// hardhat.config.js
solidity: {
  version: '0.8.20',  // ✅ 版本必須精確匹配
  settings: {
    optimizer: {
      enabled: true,   // ✅ 優化設置必須匹配
      runs: 200,       // ✅ 運行次數必須匹配
    },
  },
}
```

### 2. ✅ 正確配置 Etherscan API
```javascript
etherscan: {
  apiKey: {
    sepolia: process.env.ETHERSCAN_API_KEY,
    mainnet: process.env.ETHERSCAN_API_KEY,
    arbitrumOne: process.env.ARBISCAN_API_KEY,
  },
}
```

### 3. ✅ 等待足夠的區塊確認
**這是最重要的改進！**

```javascript
// 在 NFTAutoSetup.tsx 中
await deployedContract.deployed();

// ⭐ 關鍵：在驗證前等待 5 個區塊確認
console.log('[AutoSetup] ⏳ Waiting for 5 block confirmations...');
const confirmations = 5;
await deployedContract.deployTransaction.wait(confirmations);
console.log(`[AutoSetup] ✅ Confirmed after ${confirmations} blocks`);

// 現在才開始驗證
await verifyContract(...);
```

**為什麼需要等待？**
- Etherscan 需要時間索引新部署的合約
- 如果太快驗證，Etherscan 可能還找不到合約
- 等待 3-5 個區塊是推薦的做法

### 4. ✅ 精確的 Constructor Arguments
```javascript
// 確保參數類型和順序完全匹配合約定義
constructorArguments: [
  name,        // string
  symbol,      // string
  maxSupply,   // uint256
  baseURI,     // string
  merkleRoot,  // bytes32
]
```

### 5. ✅ 重試機制
```javascript
// 在 verify-contract-hardhat.ts 中
const maxRetries = 3;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    // 嘗試驗證...
  } catch (error) {
    if (isTimeout && attempt < maxRetries) {
      console.log('Timeout, retrying in 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      continue;
    }
  }
}
```

### 6. ✅ 特殊字符轉義
```javascript
// 轉義 constructor 參數中的特殊字符
const escapedName = name.replace(/"/g, '\\"');
const escapedSymbol = symbol.replace(/"/g, '\\"');
const escapedBaseURI = baseURI.replace(/"/g, '\\"');
```

## 使用方式

### 自動部署＋驗證（前端）
1. 前往管理後台 NFT 頁面
2. 點擊「一鍵自動部署」
3. 系統會自動：
   - 上傳圖片到 IPFS
   - 生成 Merkle Tree
   - 部署合約
   - **等待 5 個區塊確認** ⭐
   - 自動驗證合約（最多重試 3 次）
   - 更新 Firestore 狀態

### 手動驗證（CLI）
如果自動驗證失敗，可以手動驗證：

```bash
cd contracts

# 方法 1: 使用 hardhat verify
npx hardhat verify --network sepolia \
  <CONTRACT_ADDRESS> \
  "<NAME>" \
  "<SYMBOL>" \
  <MAX_SUPPLY> \
  "<BASE_URI>" \
  "<MERKLE_ROOT>"

# 方法 2: 使用我們的腳本（推薦）
npx hardhat run scripts/deploy-and-verify.js --network sepolia
```

### API 手動重試
```bash
curl -X POST http://localhost:3008/api/admin/nft/verify-contract-hardhat \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x...",
    "network": "sepolia",
    "constructorArgs": {
      "name": "NFT Name",
      "symbol": "SYMBOL",
      "maxSupply": 100,
      "baseURI": "ipfs://...",
      "merkleRoot": "0x..."
    }
  }'
```

## 故障排除

### Headers Timeout Error
**原因：** Etherscan API 暫時不可用或過載

**解決方案：**
1. ✅ 系統已實作自動重試（3次）
2. ✅ 每次重試間隔 10 秒
3. 如果仍然失敗，等待 10-30 分鐘後手動重試
4. 確認 ETHERSCAN_API_KEY 有效且未超過速率限制

### Contract Not Found
**原因：** 合約剛部署，Etherscan 還沒索引到

**解決方案：**
1. ✅ 系統已實作等待 5 個區塊確認
2. 如果還是失敗，等待更長時間（1-2 分鐘）
3. 檢查交易是否真的成功（查看 Etherscan）

### Already Verified
**原因：** 合約已經驗證過了

**解決方案：**
- ✅ 系統會自動檢測並回傳成功
- 無需額外操作

### Compiler Version Mismatch
**原因：** 編譯器版本或設置不匹配

**解決方案：**
1. ✅ 確保 hardhat.config.js 中的版本是 `0.8.20`
2. ✅ 確保 optimizer 設置是 `enabled: true, runs: 200`
3. 不要手動修改這些設置

## 檢查清單

部署新合約前請確認：

- [ ] ✅ ETHERSCAN_API_KEY 已設置在 .env.local
- [ ] ✅ DEPLOYER_PRIVATE_KEY 已設置
- [ ] ✅ RPC URL 已配置（Sepolia/Arbitrum/Mainnet）
- [ ] ✅ 錢包有足夠的 ETH（gas）
- [ ] ✅ Constructor 參數準備完整
- [ ] ✅ 圖片已上傳到 IPFS
- [ ] ✅ Merkle Tree 已生成

部署後自動檢查：

- [ ] ✅ 合約地址已保存到 Firestore
- [ ] ✅ 等待 5 個區塊確認
- [ ] ✅ 驗證狀態已更新
- [ ] ✅ Etherscan 上顯示綠色勾勾
- [ ] ✅ 可以在 Etherscan 看到 Read/Write 功能

## 統計數據

| 指標 | 數值 |
|------|------|
| 區塊確認等待 | 5 blocks |
| 重試次數 | 3 times |
| 重試間隔 | 10 seconds |
| API 超時 | 120 seconds |
| 成功率估計 | 95%+ |

## 參考資料

- [Hardhat Verification Plugin](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify)
- [Etherscan API Documentation](https://docs.etherscan.io/)
- 內部文檔：
  - `AUTOMATIC-VERIFICATION-SYSTEM.md`
  - `MANUAL-VERIFY-GUIDE.md`
  - `ETHERSCAN-VERIFY-ISSUE.md`

