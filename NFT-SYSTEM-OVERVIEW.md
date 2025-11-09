# NFT 系統完整概覽

## 系統架構

RWA Hackathon Taiwan 的 NFT 系統是一個完整的去中心化 NFT 鑄造平台，包含以下核心功能：

### 1. 管理員功能
- 創建 NFT 活動
- 自動部署智能合約
- 管理白名單
- 監控鑄造狀態

### 2. 用戶功能
- 查看可鑄造的 NFT
- 連接錢包鑄造 NFT
- 查看已鑄造的 NFT
- 查看交易記錄

### 3. 公開功能
- 瀏覽 NFT 活動詳情
- 查看所有鑄造記錄
- 分享 NFT 連結

## 頁面結構

```
/admin/nft/campaigns          [管理員] NFT 活動管理
/nft/[campaignId]             [公開]   NFT 活動詳情
/nft/mint?campaign=xxx        [用戶]   NFT 鑄造頁面
/user/[userId]                [用戶]   個人頁面（包含 NFT 區域）
```

## 完整流程

### A. 管理員創建 NFT 活動

```
1. 訪問 /admin/nft/campaigns
   ↓
2. 填寫活動資訊
   - 活動名稱
   - 活動描述
   - 上傳圖片
   - 選擇區塊鏈網路
   - 設定供應量
   - 輸入白名單 email
   - 設定截止日期
   ↓
3. 點擊「建立活動」
   ↓
4. 系統創建活動記錄（狀態：draft）
   ↓
5. 點擊「自動設置」按鈕
   ↓
6. 自動化流程開始：
   
   Step 1: 上傳圖片到 IPFS
   - 圖片上傳到 Pinata
   - 生成每個 Token 的 metadata JSON
   - 上傳 metadata 到 IPFS
   - 獲得 Base URI
   
   Step 2: 連接錢包
   - 提示連接 MetaMask
   - 檢測並切換到正確的網路
   
   Step 3: 部署智能合約
   - 使用 MetaMask 簽署交易
   - 等待合約部署完成
   - 獲得合約地址
   
   Step 4: 設置 Merkle Tree
   - 計算每個 email 的 hash
   - 生成 Merkle Tree
   - 計算每個 email 的 proof
   - 呼叫合約設置 Merkle Root
   
   Step 5: 啟用鑄造
   - 呼叫合約的 enableMinting()
   - 設定活動狀態為 active
   
   ↓
7. ✅ 活動準備完成！用戶可以開始鑄造
```

### B. 用戶鑄造 NFT

```
1. 用戶登入系統
   ↓
2. 訪問個人頁面 /user/[userId]
   ↓
3. 看到「NFT 紀念品」區域
   - 顯示所有相關的 NFT 活動
   - 符合資格的顯示「鑄造 NFT」按鈕
   - 已鑄造的顯示「已鑄造」標記
   ↓
4. 點擊「鑄造 NFT」
   ↓
5. 跳轉到 /nft/mint?campaign=xxx
   ↓
6. 鑄造流程：
   
   Step 1: 連接錢包
   - 點擊「連接錢包」
   - MetaMask 彈出授權
   
   Step 2: 切換網路（如需要）
   - 自動檢測網路
   - 提示切換到正確的網路
   
   Step 3: 鑄造 NFT
   - 點擊「鑄造 NFT」
   - 系統獲取用戶的 Merkle Proof
   - 呼叫智能合約的 mint() 函數
   - MetaMask 彈出簽署請求
   - 用戶確認交易
   
   Step 4: 等待確認
   - 顯示交易哈希
   - 等待區塊鏈確認
   
   Step 5: 記錄結果
   - 記錄到 Firestore
   - 更新活動的 currentSupply
   
   ↓
7. ✅ 鑄造完成！
   - 顯示成功訊息
   - 提供區塊鏈瀏覽器連結
```

### C. 公開查看 NFT

```
1. 任何人訪問 /nft/[campaignId]
   ↓
2. 看到完整的 NFT 資訊：
   - NFT 圖片
   - 活動名稱和描述
   - 區塊鏈網路
   - 合約地址（可點擊查看）
   - 鑄造進度
   - 截止日期
   ↓
3. 看到所有鑄造記錄：
   - Token ID
   - 鑄造用戶
   - 鑄造時間
   - 交易哈希（可點擊查看）
   ↓
4. 可以分享此頁面給任何人
```

## 技術棧

### 前端
- **框架**：Next.js (React)
- **樣式**：Tailwind CSS
- **Web3**：ethers.js v5
- **錢包**：MetaMask

### 後端
- **框架**：Next.js API Routes
- **資料庫**：Firebase Firestore
- **認證**：Firebase Auth

### 區塊鏈
- **合約標準**：ERC-721
- **開發框架**：Hardhat
- **網路支援**：Ethereum, Sepolia, Arbitrum
- **白名單機制**：Merkle Tree

### 儲存
- **圖片和 Metadata**：IPFS (Pinata)
- **標準**：OpenSea Metadata Standard

## 資料結構

### Firestore Collections

#### `nft-campaigns`
```javascript
{
  id: string,                    // 活動 ID
  name: string,                  // 活動名稱
  description: string,           // 活動描述
  imageUrl: string,              // IPFS 圖片 URL
  network: string,               // 區塊鏈網路
  contractAddress: string,       // 智能合約地址
  maxSupply: number,             // 最大供應量
  currentSupply: number,         // 當前已鑄造數量
  status: string,                // 狀態 (draft/active/ended)
  eligibleEmails: string[],      // 白名單 email 列表
  merkleRoot: string,            // Merkle Tree Root
  merkleProofs: {                // 每個 email 的 Merkle Proof
    [email]: string[]
  },
  ipfsImageCid: string,          // IPFS 圖片 CID
  ipfsMetadataCid: string,       // IPFS Metadata CID
  baseURI: string,               // NFT Base URI
  startDate: Timestamp,          // 開始日期
  endDate: Timestamp,            // 結束日期
  createdAt: Timestamp,          // 創建時間
  updatedAt: Timestamp           // 更新時間
}
```

#### `nft-mints`
```javascript
{
  id: string,                    // 鑄造記錄 ID
  campaignId: string,            // 活動 ID
  userEmail: string,             // 用戶 email
  userId: string,                // 用戶 ID
  tokenId: number,               // Token ID
  transactionHash: string,       // 交易哈希
  walletAddress: string,         // 錢包地址
  mintedAt: Timestamp            // 鑄造時間
}
```

### Smart Contract

```solidity
// RWAHackathonNFT.sol
contract RWAHackathonNFT is 
    ERC721, 
    ERC721Enumerable, 
    ERC721URIStorage, 
    Pausable, 
    Ownable 
{
    // Merkle Root for whitelist
    bytes32 public merkleRoot;
    
    // Minting enabled flag
    bool public mintingEnabled;
    
    // Tracking minted addresses
    mapping(address => bool) public hasMinted;
    
    // Tracking minted emails (hashed)
    mapping(bytes32 => bool) public hasEmailMinted;
    
    // Base URI for metadata
    string private baseTokenURI;
    
    // Functions
    function setMerkleRoot(bytes32 _merkleRoot)
    function enableMinting()
    function disableMinting()
    function setBaseURI(string memory baseURI)
    function mint(bytes32 emailHash, bytes32[] calldata merkleProof)
    function tokenURI(uint256 tokenId)
}
```

## API 端點

### 管理員 API (需要 super_admin 權限)

```
POST   /api/admin/nft/campaigns/create           創建活動
GET    /api/admin/nft/campaigns/list             獲取活動列表
POST   /api/admin/nft/upload-to-ipfs             上傳到 IPFS
```

### 用戶 API (需要登入)

```
GET    /api/nft/check-eligibility?email=xxx      檢查鑄造資格
POST   /api/nft/record-mint                      記錄鑄造結果
GET    /api/user/[userId]/public                 獲取用戶資訊（包含 NFT）
```

### 公開 API (無需認證)

```
GET    /api/nft/campaigns/[campaignId]           獲取活動資訊
GET    /api/nft/campaigns/[campaignId]/mints     獲取鑄造記錄
```

## 安全機制

### 1. 智能合約層面
- ✅ 使用 Merkle Tree 白名單（節省 gas）
- ✅ 每個 email 只能鑄造一次
- ✅ 可暫停鑄造（Pausable）
- ✅ Owner 權限控制（Ownable）
- ✅ 使用 OpenZeppelin 標準庫

### 2. 後端層面
- ✅ Firebase Auth 認證
- ✅ Admin 權限檢查
- ✅ Email 白名單驗證
- ✅ 重複鑄造檢查

### 3. 前端層面
- ✅ MetaMask 簽署（不儲存私鑰）
- ✅ 網路檢測和切換
- ✅ 交易狀態追蹤
- ✅ 錯誤處理和用戶提示

## 監控和維護

### 管理員工具

```bash
# 檢查活動資訊
node contracts/scripts/getContractInfo.js

# 啟用鑄造
node contracts/scripts/enableMinting.js

# 設置 Base URI
node contracts/scripts/setBaseURI.js

# 清理測試資料
node scripts/clean-nft-campaigns.js

# 檢查管理員權限
node scripts/check-admin-permissions.js <email>

# 設置管理員
node scripts/set-admin.js <email>
```

### 測試工具

```bash
# 測試公開 API
node test-nft-public-api.js <campaignId>

# 創建測試鑄造記錄
node scripts/create-test-mint-record.js

# 檢查鑄造記錄
node scripts/check-mint-records.js <email>
```

## 區塊鏈網路配置

### Sepolia Testnet (測試網)
```javascript
{
  name: 'sepolia',
  chainId: 11155111,
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/...',
  explorer: 'https://sepolia.etherscan.io'
}
```

### Arbitrum (Layer 2)
```javascript
{
  name: 'arbitrum',
  chainId: 42161,
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  explorer: 'https://arbiscan.io'
}
```

### Ethereum Mainnet
```javascript
{
  name: 'mainnet',
  chainId: 1,
  rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/...',
  explorer: 'https://etherscan.io'
}
```

## 常見問題排查

### 1. NFT 圖片不顯示
- 檢查 IPFS 連線
- 檢查 Base URI 設定
- 檢查 metadata JSON 格式

詳見：`FIX-NFT-IMAGE.md`

### 2. 鑄造失敗
- 檢查網路是否正確
- 檢查 email 是否在白名單
- 檢查是否已鑄造過
- 檢查合約是否啟用鑄造

詳見：`NFT-DEBUG-GUIDE.md`

### 3. 管理員無法訪問
- 檢查用戶是否有 `super_admin` 權限
- 使用 `check-admin-permissions.js` 檢查
- 使用 `set-admin.js` 設置權限

詳見：`ADMIN-ACCESS-SETUP-COMPLETE.md`

## 效能優化

### 1. 前端優化
- 圖片懶加載
- 分頁載入鑄造記錄
- 快取 API 回應

### 2. 後端優化
- Firestore 索引優化
- API 回應快取
- 批次查詢

### 3. 區塊鏈優化
- 使用 Merkle Tree（節省 gas）
- 批次設置（減少交易數）
- 最佳化合約程式碼

## 成本估算

### Gas 費用（以 Sepolia 為例）
- 部署合約：~0.01 ETH
- 設置 Merkle Root：~0.001 ETH
- 啟用鑄造：~0.0005 ETH
- 單次鑄造：~0.001 ETH (用戶支付)

### IPFS 儲存（Pinata）
- 免費方案：1GB
- 圖片：~1MB/張
- Metadata：~1KB/個

## 路線圖

### 已完成 ✅
- [x] 基本 NFT 系統架構
- [x] 管理員創建活動
- [x] 自動化部署流程
- [x] Merkle Tree 白名單
- [x] IPFS 整合
- [x] 用戶鑄造功能
- [x] 公開頁面展示
- [x] 完整文檔

### 未來功能 🚀
- [ ] NFT 畫廊頁面
- [ ] 批次鑄造（多個 NFT）
- [ ] 動態 NFT（可更新 metadata）
- [ ] NFT 交易市場整合
- [ ] 社群分享功能
- [ ] Email 通知系統
- [ ] 統計和分析儀表板

## 相關文檔

- `NFT-SYSTEM-COMPLETE.md` - 系統完整說明
- `NFT-IPFS-INTEGRATION.md` - IPFS 整合說明
- `NFT-PUBLIC-PAGE.md` - 公開頁面說明
- `NFT-QUICK-START.md` - 快速開始指南
- `NFT-DEBUG-GUIDE.md` - 除錯指南
- `ADMIN-ACCESS-SETUP-COMPLETE.md` - 管理員設定

## 聯絡和支援

如有問題或需要協助，請：
1. 查看相關文檔
2. 檢查常見問題排查
3. 使用測試工具診斷
4. 查看系統日誌

---

**系統版本**：v2.0  
**最後更新**：2025-11-09  
**狀態**：✅ 生產就緒

