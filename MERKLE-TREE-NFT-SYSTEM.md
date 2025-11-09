# 🌳 Merkle Tree NFT 白名單系統

## 概述

基於 Merkle Tree 的 NFT 白名單系統，使用 **email hash** 而不是錢包地址進行白名單管理。

### 🎯 關鍵優勢

1. **極低 Gas 費用**：只需存儲 32 bytes 的 Merkle Root，節省 95%+ 的 gas
2. **Email-based**：用戶不需要預先註冊錢包地址
3. **無限擴展**：支持任意數量的白名單 email
4. **隱私保護**：只存儲 email hash，不暴露實際 email
5. **防重複**：每個 email 只能鑄造一次
6. **100% 安全**：所有交易通過 MetaMask 簽名

---

## 系統架構

### 1. 智能合約 (`contracts/RWAHackathonNFT.sol`)

**主要功能：**
- 存儲 Merkle Root（32 bytes）
- 驗證 Merkle Proof
- 追蹤已鑄造的 email hash
- ERC721 標準 NFT

**關鍵函數：**
```solidity
// 設置 Merkle Root（管理員）
function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner

// 鑄造 NFT（用戶）
function mint(bytes32 emailHash, bytes32[] calldata merkleProof) external

// 檢查 email 是否已鑄造
function hasEmailMinted(bytes32 emailHash) public view returns (bool)

// 驗證白名單（不鑄造）
function verifyWhitelist(bytes32 emailHash, bytes32[] calldata merkleProof) public view returns (bool)
```

### 2. Merkle Tree 工具庫 (`lib/merkleTree.ts`)

**主要功能：**
- Hash email 地址
- 生成 Merkle Tree
- 生成 Merkle Proof
- 驗證 Proof

**關鍵函數：**
```typescript
// Hash email
hashEmail(email: string): string

// 創建 Merkle Tree
createMerkleTree(emails: string[]): { tree: MerkleTree, root: string }

// 生成 Proof
generateMerkleProof(email: string, emails: string[]): string[] | null

// 驗證 Proof
verifyMerkleProof(email: string, proof: string[], root: string): boolean

// 導出完整數據
exportMerkleTreeData(emails: string[]): { root: string, proofs: Record<string, string[]> }
```

### 3. 後端 APIs

#### `/api/admin/nft/campaigns/generate-merkle-tree`
生成 Merkle Tree 並存儲到 Firestore

**請求：**
```json
{
  "campaignId": "xxx"
}
```

**響應：**
```json
{
  "success": true,
  "root": "0x...",
  "totalEmails": 100
}
```

#### `/api/nft/get-merkle-proof`
獲取用戶的 Merkle Proof

**請求：**
```
GET /api/nft/get-merkle-proof?email=user@example.com&campaignId=xxx
```

**響應：**
```json
{
  "success": true,
  "eligible": true,
  "proof": ["0x...", "0x..."],
  "emailHash": "0x...",
  "contractAddress": "0x...",
  "network": "sepolia"
}
```

#### `/api/nft/check-eligibility`
檢查用戶是否有資格鑄造

**請求：**
```
GET /api/nft/check-eligibility?email=user@example.com
```

**響應：**
```json
{
  "eligible": true,
  "alreadyMinted": false,
  "campaign": {
    "id": "xxx",
    "name": "RWA Hackathon NFT",
    "contractAddress": "0x...",
    "network": "sepolia"
  }
}
```

### 4. 前端組件

#### Admin Setup (`components/admin/NFTAutoSetup.tsx`)
一鍵部署和設置 NFT 系統

**流程：**
1. 連接 MetaMask
2. 檢測/切換網路
3. 部署合約（MetaMask 確認）
4. 生成 Merkle Tree
5. 設置 Merkle Root（MetaMask 確認）
6. 啟用鑄造（MetaMask 確認）
7. 更新 Firestore

#### Minting Page (`pages/nft/mint.tsx`)
用戶鑄造 NFT 頁面

**流程：**
1. 檢查用戶資格
2. 獲取 Merkle Proof
3. 連接 MetaMask
4. 驗證白名單狀態
5. 鑄造 NFT（MetaMask 確認）
6. 記錄到 Firestore

#### NFT Hook (`lib/hooks/useNFTContractMerkle.ts`)
React Hook 用於與 NFT 合約交互

**功能：**
- 連接合約
- 檢查鑄造狀態
- 執行鑄造
- 監聽事件

---

## 完整流程

### 管理員流程

1. **創建 NFT 活動**
   - 訪問：`http://localhost:3009/admin/nft/campaigns`
   - 點擊「建立新活動」
   - 填寫資訊：
     - 名稱、描述、圖片
     - 選擇網路（Sepolia/Ethereum/Arbitrum）
     - 輸入白名單 emails（每行一個）
     - 設置日期和供應量

2. **一鍵自動設置**
   - 在活動卡片中點擊「一鍵自動設置」
   - MetaMask 彈出 → 確認「部署合約」
   - 等待部署完成
   - 系統自動生成 Merkle Tree
   - MetaMask 彈出 → 確認「設置 Merkle Root」
   - MetaMask 彈出 → 確認「啟用鑄造」
   - 完成！

### 用戶流程

1. **登入系統**
   - 使用 email 登入
   - 訪問個人頁面

2. **檢查資格**
   - 系統自動檢查 email 是否在白名單
   - 如果符合資格，顯示「鑄造 NFT」按鈕

3. **鑄造 NFT**
   - 點擊「鑄造 NFT」
   - 進入鑄造頁面
   - 連接 MetaMask
   - 系統顯示白名單驗證狀態
   - 點擊「立即鑄造」
   - MetaMask 彈出 → 確認交易
   - 完成！顯示「已鑄造」狀態

---

## Gas 費用比較

### 傳統方式（地址白名單）

```
addToWhitelist(address[] addresses)
- 每個地址：~21,000 gas
- 100 地址：~2,100,000 gas
- 1000 地址：~21,000,000 gas

Sepolia 上：~$10-50
Ethereum 上：~$50-1000+
```

### Merkle Tree 方式

```
setMerkleRoot(bytes32 root)
- 固定：~50,000 gas
- 無論多少 email！

Sepolia 上：~$0.5-2
Ethereum 上：~$1-10

節省：95%+ ！
```

---

## 數據結構

### Firestore - nft-campaigns

```javascript
{
  id: string,
  name: string,
  description: string,
  imageUrl: string,
  network: 'ethereum' | 'sepolia' | 'arbitrum',
  eligibleEmails: string[], // Original email list
  merkleRoot: string, // "0x..."
  merkleProofs: {
    "user@example.com": ["0x...", "0x..."], // email -> proof mapping
    ...
  },
  contractAddress: string,
  startDate: Timestamp,
  endDate: Timestamp,
  maxSupply: number,
  currentSupply: number,
  status: 'draft' | 'active' | 'ended',
  createdAt: Timestamp,
  updatedAt: Timestamp,
  merkleTreeGeneratedAt: Timestamp
}
```

### Firestore - nft-mints

```javascript
{
  campaignId: string,
  userEmail: string,
  userId: string,
  walletAddress: string,
  emailHash: string, // "0x..."
  transactionHash: string,
  mintedAt: Timestamp
}
```

---

## 安全考慮

### 1. Email Hash 隱私
- Email 通過 keccak256 hash
- 鏈上只存儲 hash，不暴露實際 email
- 無法從 hash 反推 email（除非暴力破解）

### 2. 防重複鑄造
- 合約追蹤 `hasMinted[emailHash]`
- 每個 email hash 只能鑄造一次
- Firestore 也記錄鑄造歷史

### 3. MetaMask 簽名
- 所有交易都需要 MetaMask 確認
- 私鑰永不離開用戶錢包
- 用戶可以看到並拒絕任何交易

### 4. Merkle Proof 驗證
- 使用 OpenZeppelin MerkleProof 庫
- 鏈上驗證，無法偽造
- Gas 高效（只需驗證 log(n) 個 hash）

---

## 測試指南

### 1. 準備環境

```bash
# 確保在 dev 分支
cd /home/reyerchu/hack/hack-dev

# 安裝依賴
npm install

# 啟動 dev server
npm run dev
```

### 2. 獲取測試 ETH

訪問 Sepolia Faucet：
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### 3. 創建測試活動

1. 訪問：`http://localhost:3009/admin/nft/campaigns`
2. 創建活動，使用測試 emails
3. 執行一鍵設置
4. 記錄合約地址

### 4. 測試鑄造

1. 使用白名單中的 email 登入
2. 訪問個人頁面
3. 點擊「鑄造 NFT」
4. 連接 MetaMask
5. 完成鑄造

### 5. 驗證

- 檢查 Sepolia Etherscan
- 確認 NFT 已鑄造
- 檢查 Firestore 記錄
- 確認「已鑄造」狀態顯示

---

## 故障排查

### 問題：MetaMask 未彈出

**解決：**
- 檢查 MetaMask 是否已安裝
- 檢查是否已連接到正確的網路
- 刷新頁面重試

### 問題：Merkle Proof 無效

**解決：**
- 確認 email 在白名單中
- 確認 email 格式正確（小寫、trim）
- 重新生成 Merkle Tree

### 問題：已鑄造但未顯示

**解決：**
- 等待交易確認（可能需要幾分鐘）
- 刷新頁面
- 檢查 Firestore 中的記錄

### 問題：Gas 估算失敗

**解決：**
- 確認錢包有足夠 ETH
- 確認 Merkle Root 已設置
- 確認鑄造已啟用

---

## 維護

### 更新白名單

如果需要更新白名單：
1. 更新 Firestore 中的 `eligibleEmails`
2. 重新生成 Merkle Tree
3. 調用 `setMerkleRoot` 更新鏈上 root

### 監控

定期檢查：
- 合約餘額
- 鑄造數量
- Gas 費用
- 錯誤日誌

---

## 未來改進

- [ ] 支持批量鑄造
- [ ] 添加 reveal 機制
- [ ] NFT metadata 動態生成
- [ ] 支持 ERC-1155
- [ ] 添加二級市場版稅
- [ ] 跨鏈支持

---

## 參考資料

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Merkle Tree JS](https://github.com/merkletreejs/merkletreejs)
- [EIP-721](https://eips.ethereum.org/EIPS/eip-721)
- [Ethers.js](https://docs.ethers.org/)

---

**系統版本：** v2.0.0  
**最後更新：** 2025-01-09  
**作者：** RWA Hackathon Taiwan Team

