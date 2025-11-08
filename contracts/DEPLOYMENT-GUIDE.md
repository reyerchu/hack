# NFT 合約部署指南

本指南將幫助您部署和配置 RWA Hackathon NFT 智能合約。

## 📋 前置需求

1. Node.js >= 16
2. 部署者錢包（含足夠的 ETH/測試幣支付 gas）
3. Etherscan API Key（用於驗證合約）
4. RPC URL（如果使用私有節點）

## 🔧 環境設置

### 1. 安裝依賴

```bash
cd contracts
npm install
```

### 2. 配置環境變數

在項目根目錄的 `.env.local` 文件中添加：

```bash
# 部署者私鑰（不要提交到 git！）
DEPLOYER_PRIVATE_KEY=your_private_key_here

# RPC URLs（可選，不填則使用公共節點）
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# Etherscan API Keys（用於驗證合約）
ETHERSCAN_API_KEY=your_etherscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key

# NFT 配置（可選）
NFT_NAME=RWA Hackathon Taiwan 2025
NFT_SYMBOL=RWAHACK
NFT_MAX_SUPPLY=100
NFT_BASE_URI=ipfs://YOUR_BASE_URI/
```

## 🚀 部署流程

### 步驟 1: 編譯合約

```bash
cd contracts
npm run compile
```

### 步驟 2: 部署到測試網（Sepolia）

```bash
npm run deploy:sepolia
```

或使用自定義參數：

```bash
NFT_NAME="My NFT Collection" \
NFT_SYMBOL="MYNFT" \
NFT_MAX_SUPPLY=200 \
NFT_BASE_URI="ipfs://QmYourHash/" \
npm run deploy:sepolia
```

### 步驟 3: 記錄合約地址

部署成功後，您會看到：

```
✅ 合約已部署到: 0x1234...5678
   網路: sepolia
```

**重要**：將此地址記錄下來，您需要將它添加到 Firestore 的 `nft-campaigns` collection 中。

### 步驟 4: 準備白名單地址

創建一個文本文件 `whitelist.txt`，每行一個錢包地址：

```
0x1111111111111111111111111111111111111111
0x2222222222222222222222222222222222222222
0x3333333333333333333333333333333333333333
```

### 步驟 5: 添加白名單

```bash
node scripts/addWhitelist.js <CONTRACT_ADDRESS> whitelist.txt
```

例如：

```bash
node scripts/addWhitelist.js 0x1234...5678 whitelist.txt
```

### 步驟 6: 啟用鑄造

```bash
node scripts/enableMinting.js <CONTRACT_ADDRESS> true
```

### 步驟 7: 驗證部署

查看合約狀態：

```bash
node scripts/getContractInfo.js <CONTRACT_ADDRESS>
```

### 步驟 8: 更新 Firestore

在 Firestore 的 `nft-campaigns` collection 中，找到對應的活動文件並添加/更新：

```javascript
{
  contractAddress: "0x1234...5678",
  network: "sepolia",
  // ... 其他欄位
}
```

## 📊 管理合約

### 查看合約信息

```bash
node scripts/getContractInfo.js <CONTRACT_ADDRESS>
```

### 添加更多白名單地址

```bash
node scripts/addWhitelist.js <CONTRACT_ADDRESS> more_addresses.txt
```

### 停用鑄造

```bash
node scripts/enableMinting.js <CONTRACT_ADDRESS> false
```

### 再次啟用鑄造

```bash
node scripts/enableMinting.js <CONTRACT_ADDRESS> true
```

## 🌐 部署到其他網路

### Arbitrum 主網

```bash
npm run deploy:arbitrum
```

### Ethereum 主網（謹慎！）

```bash
# 確保您有足夠的 ETH 支付 gas
npm run deploy:ethereum
```

## 🔍 驗證合約

如果自動驗證失敗，可以手動驗證：

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> \
  "RWA Hackathon Taiwan 2025" \
  "RWAHACK" \
  100 \
  "ipfs://YOUR_BASE_URI/"
```

## 📱 將錢包地址加入白名單

有兩種方式可以獲得用戶的錢包地址：

### 方法 1: 從 Firestore 導出

如果用戶已經在系統中綁定了錢包，可以從 Firestore 導出。

### 方法 2: 用戶自行提供

創建一個表單讓用戶提交他們的錢包地址，然後批量添加。

### Email 到錢包地址的映射

建議在 Firestore 中創建 `user-wallets` collection：

```javascript
{
  email: "user@example.com",
  walletAddress: "0x...",
  addedToWhitelist: true,
  addedAt: Timestamp
}
```

## ⚠️ 安全注意事項

1. **永遠不要提交私鑰到 git**
2. **在主網部署前充分測試**
3. **使用 Gnosis Safe 等多簽錢包管理生產合約**
4. **定期備份部署信息**
5. **監控合約活動，設置警報**

## 🐛 常見問題

### Q: 部署失敗，顯示 "insufficient funds"
A: 確保部署者錢包有足夠的 ETH/測試幣。

### Q: 白名單添加失敗
A: 檢查地址格式是否正確，確保您是合約 owner。

### Q: 用戶無法鑄造，顯示 "Not whitelisted"
A: 確認用戶的錢包地址已正確添加到白名單。

### Q: 顯示 "Minting is not enabled"
A: 運行 `enableMinting.js` 腳本啟用鑄造。

## 📞 支持

如有問題，請查看：
- [Hardhat 文檔](https://hardhat.org/docs)
- [OpenZeppelin 文檔](https://docs.openzeppelin.com/)
- [Ethers.js 文檔](https://docs.ethers.org/)

## 🎉 部署檢查清單

- [ ] 已編譯合約
- [ ] 已部署到測試網
- [ ] 已驗證合約（Etherscan）
- [ ] 已添加白名單地址
- [ ] 已啟用鑄造
- [ ] 已在 Firestore 更新 contractAddress
- [ ] 已測試用戶鑄造流程
- [ ] 已設置監控和警報
- [ ] 已備份部署信息和私鑰
- [ ] （如果部署到主網）已使用多簽錢包管理

