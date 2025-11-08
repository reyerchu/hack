# NFT 鑄造系統開發文檔

## 系統概述

這是一個完整的 NFT 鑄造系統，允許管理員創建 NFT Campaign，並讓符合資格的用戶鑄造 NFT。

## 已完成的組件

### 1. 數據模型 (`types/nft.ts`)
- ✅ NFTCampaign: 活動資料結構
- ✅ NFTMint: 鑄造記錄
- ✅ MintStatus: 資格檢查回應

### 2. Smart Contract (`contracts/NFTMinter.sol`)
- ✅ ERC-721 NFT 合約
- ✅ Whitelist 功能
- ✅ 每個地址只能鑄造一次
- ✅ 供應量上限控制

### 3. Admin API Routes
- ✅ `/api/admin/nft/campaigns/create` - 創建活動
- ✅ `/api/admin/nft/campaigns/list` - 列出所有活動

### 4. User API Routes
- ✅ `/api/nft/check-eligibility` - 檢查資格
- ✅ `/api/nft/record-mint` - 記錄鑄造

### 5. Admin Management Page
- ✅ `/admin/nft/campaigns` - 活動管理頁面
  - 創建新活動
  - 上傳圖片
  - 設定 email 白名單
  - 設定開始/結束時間
  - 查看所有活動狀態

## 需要完成的組件

### 6. 用戶鑄造頁面 (`pages/nft/mint/[campaignId].tsx`)

需要實現：
```typescript
- 連接錢包 (MetaMask)
- 顯示 NFT 預覽
- 檢查用戶資格
- 執行鑄造交易
- 顯示交易狀態
- 記錄到 Firestore
```

### 7. 用戶個人頁面集成 (`pages/user/[userId].tsx`)

需要添加：
```typescript
- 檢查用戶 email 是否有資格鑄造 NFT
- 顯示「鑄造 NFT」按鈕（如果符合資格且未鑄造）
- 顯示已鑄造的 NFT 資訊（如果已鑄造）
```

### 8. Web3 工具函數 (`lib/web3/nftMinting.ts`)

需要實現：
```typescript
- connectWallet(): 連接 MetaMask
- mintNFT(): 調用智能合約鑄造
- checkNetwork(): 檢查網絡
- switchNetwork(): 切換網絡
```

## 部署流程

### 1. Smart Contract 部署

```bash
# 安裝 Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# 編譯合約
npx hardhat compile

# 部署到測試網
npx hardhat run scripts/deploy.ts --network sepolia
```

### 2. Firestore Collections

需要創建以下 collections：

**nft-campaigns**
```
- id: string (auto-generated)
- name: string
- description: string
- imageUrl: string
- contractAddress: string
- network: string
- eligibleEmails: array
- startDate: timestamp
- endDate: timestamp
- maxSupply: number
- currentSupply: number
- status: string
- createdBy: string
- createdAt: timestamp
- updatedAt: timestamp
```

**nft-mints**
```
- id: string (auto-generated)
- campaignId: string
- userEmail: string
- userId: string
- walletAddress: string
- tokenId: string
- transactionHash: string
- mintedAt: timestamp
- imageUrl: string
- metadata: object
```

### 3. 環境變數設置

在 `.env.local` 添加：
```
# Ethereum Configuration
NEXT_PUBLIC_ETHEREUM_NETWORK=sepolia
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...

# Infura or Alchemy
NEXT_PUBLIC_INFURA_ID=your_infura_id
NEXT_PUBLIC_ALCHEMY_KEY=your_alchemy_key
```

## 使用流程

### Admin 流程

1. 訪問 `/admin/nft/campaigns`
2. 點擊「Create New Campaign」
3. 填寫活動資訊：
   - 名稱、描述
   - 上傳 NFT 圖片
   - 選擇網絡 (Sepolia testnet 或 Ethereum mainnet)
   - 提供符合資格的 email 列表
   - 設定開始和結束日期
   - 設定最大供應量
4. 創建活動（status: 'draft'）
5. 部署 Smart Contract
6. 更新活動，添加 contract address
7. 激活活動（status: 'active'）

### User 流程

1. 用戶登入後訪問個人頁面 `/user/[userId]`
2. 系統檢查用戶 email 是否在活動白名單中
3. 如果符合資格：
   - 顯示「鑄造 NFT」按鈕
   - 點擊後跳轉到 `/nft/mint/[campaignId]`
4. 鑄造頁面流程：
   a. 連接 MetaMask 錢包
   b. 檢查網絡（需要匹配 campaign network）
   c. 確認鑄造（調用智能合約）
   d. 等待交易確認
   e. 記錄到 Firestore
5. 鑄造後：
   - 「鑄造 NFT」按鈕消失
   - 顯示已鑄造資訊（時間、transaction hash）
   - 用戶可以在 OpenSea 查看 NFT

## 安全考量

1. **Admin 權限驗證**：所有 admin API 都需要驗證用戶角色
2. **Email 驗證**：確保用戶使用註冊的 email
3. **重複鑄造防護**：合約和後端都檢查防止重複鑄造
4. **時間限制**：活動有開始和結束時間
5. **供應量限制**：合約和後端都控制最大供應量

## 測試

### Testnet Testing

1. 使用 Sepolia testnet
2. 獲取測試 ETH: https://sepoliafaucet.com/
3. 測試完整流程
4. 驗證 Firestore 記錄正確

### Production Deployment

1. 確保合約已審計
2. 部署到 Ethereum mainnet
3. 更新環境變數
4. 通知用戶

## 下一步

要完成系統，需要：

1. ✅ 創建用戶鑄造頁面組件
2. ✅ 集成到用戶個人頁面
3. ✅ 實現 Web3 工具函數
4. ✅ 部署 Smart Contract
5. ✅ 測試完整流程
6. ✅ 更新文檔

## 相關資源

- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/
- Ethers.js Documentation: https://docs.ethers.org/v5/
- MetaMask Documentation: https://docs.metamask.io/
- Hardhat Documentation: https://hardhat.org/docs

