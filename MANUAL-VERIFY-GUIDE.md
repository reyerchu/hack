# 手動驗證合約指南

## 合約資訊
- **合約地址**: `0x19A199B12Dfbbd59642c20d1EBDA18e476089688`
- **網路**: Sepolia Testnet
- **Etherscan 連結**: https://sepolia.etherscan.io/address/0x19A199B12Dfbbd59642c20d1EBDA18e476089688#code

## 驗證步驟

### 方法 1: 使用 Hardhat CLI（推薦）

```bash
cd contracts

# 驗證合約
npx hardhat verify --network sepolia \
  0x19A199B12Dfbbd59642c20d1EBDA18e476089688 \
  "test green" \
  "RWAHACK" \
  3 \
  "ipfs://QmPK1s3pNYLi49thSbCM5aXbD7ZdQw4gQ6E5s1KWzgXTkj" \
  "0x0000000000000000000000000000000000000000000000000000000000000000"
```

### 方法 2: 使用 Etherscan 網頁介面

1. 前往 https://sepolia.etherscan.io/verifyContract
2. 輸入合約地址：`0x19A199B12Dfbbd59642c20d1EBDA18e476089688`
3. 選擇編譯器類型：**Solidity (Single file)**
4. 選擇編譯器版本：**v0.8.20+commit.a1b79de6**
5. 選擇開源授權類型：**MIT License (MIT)**
6. 優化設定：
   - Optimization: **Yes**
   - Runs: **200**

7. 上傳合約原始碼：
   ```bash
   # 產生扁平化的合約檔案
   cd contracts
   npx hardhat flatten contracts/RWAHackathonNFT.sol > RWAHackathonNFT_flat.sol
   ```
   然後將 `RWAHackathonNFT_flat.sol` 的內容複製到 Etherscan 的 "Enter the Solidity Contract Code" 欄位

8. Constructor Arguments (ABI-encoded):
   ```bash
   # 使用此指令產生編碼後的 constructor arguments
   node scripts/encode-constructor-args.js
   ```
   
   或使用以下 ABI-encoded 值：
   ```
   00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a74657374206772656e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000752574148 41434b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003a697066733a2f2f516d504b3173334e594c69343974685362434d3561586244375a645177346751364535733146577a67585466a6a0000000000000000000
   ```

9. 點擊 "Verify and Publish"

## 常見問題

### Headers Timeout Error
如果遇到 `Headers Timeout Error`，這通常是 Etherscan API 暫時不可用或網路問題。請稍後重試。

### Constructor Arguments 錯誤
確保 constructor arguments 的編碼正確。您可以使用以下資訊：
- name: "test green"
- symbol: "RWAHACK"
- maxSupply: 3
- baseURI: "ipfs://QmPK1s3pNYLi49thSbCM5aXbD7ZdQw4gQ6E5s1KWzgXTkj"
- merkleRoot: "0x0000000000000000000000000000000000000000000000000000000000000000"

### 如何重試自動驗證
如果自動驗證失敗，您可以手動重試：
```bash
curl -X POST http://localhost:3008/api/admin/nft/verify-contract-direct \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x19A199B12Dfbbd59642c20d1EBDA18e476089688",
    "network": "sepolia",
    "constructorArgs": {
      "name": "test green",
      "symbol": "RWAHACK",
      "maxSupply": 3,
      "baseURI": "ipfs://QmPK1s3pNYLi49thSbCM5aXbD7ZdQw4gQ6E5s1KWzgXTkj",
      "merkleRoot": "0x0000000000000000000000000000000000000000000000000000000000000000"
    }
  }'
```

## 檢查驗證狀態
驗證完成後，前往 Etherscan 查看：
https://sepolia.etherscan.io/address/0x19A199B12Dfbbd59642c20d1EBDA18e476089688#code

您應該會看到綠色勾勾，並且可以查看合約原始碼和 Read/Write 功能。

