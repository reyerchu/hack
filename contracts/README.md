# RWA Hackathon NFT Smart Contracts

這是 RWA Hackathon Taiwan 的 NFT 鑄造系統智能合約部分。

## 📁 項目結構

```
contracts/
├── RWAHackathonNFT.sol          # 主要的 NFT 合約
├── NFTMinter.sol                # 舊版合約（已棄用）
├── hardhat.config.js            # Hardhat 配置
├── package.json                 # 依賴管理
├── scripts/
│   ├── deploy.js                # 部署腳本
│   ├── addWhitelist.js          # 添加白名單腳本
│   ├── enableMinting.js         # 啟用/停用鑄造
│   ├── getContractInfo.js       # 查看合約信息
│   └── syncWhitelistFromFirestore.js  # 從 Firestore 同步白名單
├── deployments/                 # 部署記錄（自動生成）
├── DEPLOYMENT-GUIDE.md          # 詳細部署指南
└── README.md                    # 本文件
```

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 配置環境變數

複製 `.env.example` 到項目根目錄的 `.env.local`：

```bash
DEPLOYER_PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_api_key
```

### 3. 編譯合約

```bash
npm run compile
```

### 4. 部署到測試網

```bash
npm run deploy:sepolia
```

### 5. 管理合約

```bash
# 查看合約信息
node scripts/getContractInfo.js <CONTRACT_ADDRESS>

# 添加白名單
node scripts/addWhitelist.js <CONTRACT_ADDRESS> whitelist.txt

# 啟用鑄造
node scripts/enableMinting.js <CONTRACT_ADDRESS> true
```

## 📖 合約功能

### RWAHackathonNFT

基於 OpenZeppelin ERC-721 實現的 NFT 合約，具有以下功能：

- ✅ **白名單機制**：只有白名單中的地址可以鑄造
- ✅ **每地址限額**：每個地址只能鑄造一個 NFT
- ✅ **供應量控制**：設定最大供應量
- ✅ **鑄造開關**：管理員可以啟用/停用鑄造
- ✅ **批量白名單**：支持批量添加白名單地址
- ✅ **可升級 URI**：管理員可以更新 metadata URI

### 主要函數

#### 公開函數

- `mint()` - 鑄造 NFT（白名單地址）
- `canMint(address)` - 檢查地址是否可以鑄造
- `hasMinted(address)` - 檢查地址是否已經鑄造
- `totalSupply()` - 查看已鑄造數量

#### 管理員函數

- `addToWhitelist(address[])` - 添加白名單地址
- `removeFromWhitelist(address[])` - 移除白名單地址
- `setMintingEnabled(bool)` - 啟用/停用鑄造
- `setBaseURI(string)` - 更新 metadata URI

## 🔗 支援的網路

- **Sepolia Testnet** - 測試環境
- **Ethereum Mainnet** - 生產環境
- **Arbitrum One** - L2 解決方案（更低 gas 費）

## 📚 文檔

- [部署指南](./DEPLOYMENT-GUIDE.md) - 完整的部署和配置說明
- [Hardhat 文檔](https://hardhat.org/docs)
- [OpenZeppelin 合約](https://docs.openzeppelin.com/contracts)

## 🧪 測試

```bash
npm test
```

## 🔐 安全性

- 使用 OpenZeppelin 經過審計的合約庫
- 實現了 Ownable 訪問控制
- 所有狀態修改都有適當的權限檢查
- 使用 SafeMint 防止重入攻擊

## ⚠️ 重要提醒

1. **永遠不要提交私鑰**
2. **主網部署前充分測試**
3. **使用多簽錢包管理生產合約**
4. **定期備份部署信息**

## 📞 支持

遇到問題？查看：
- [常見問題](./DEPLOYMENT-GUIDE.md#常見問題)
- GitHub Issues
- 聯繫開發團隊

## 📝 許可證

MIT License

