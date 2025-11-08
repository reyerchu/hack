# NFT 鑄造系統 - 當前狀態

## ✅ 已完成的功能

### 後端 API
1. ✅ **Admin API Routes**
   - `/api/admin/nft/campaigns/create` - 創建 NFT 活動
   - `/api/admin/nft/campaigns/list` - 列出所有活動
   - 包含完整的 admin 權限驗證

2. ✅ **User API Routes**
   - `/api/nft/check-eligibility` - 檢查用戶資格
   - `/api/nft/record-mint` - 記錄鑄造

3. ✅ **Data Models**
   - `types/nft.ts` - 完整的 TypeScript 類型定義

4. ✅ **Smart Contract**
   - `contracts/NFTMinter.sol` - ERC-721 合約with whitelist

### 前端頁面
1. ✅ **Admin Management Page**
   - `/admin/nft/campaigns` - 活動管理頁面
   - 創建新活動表單
   - 活動列表顯示
   - 已修復所有編譯錯誤

## 🔧 已修復的問題

### 1. Firebase/Auth 導入問題 ✅
- **問題**: `Module not found: Can't resolve '../../../lib/firebase/auth'`
- **解決**: 使用 `useAuthContext` 和正確的導入路徑
- **Commit**: `931fb84`

### 2. Firebase Admin 初始化 ✅
- **問題**: `getFirebaseAdmin` 不存在
- **解決**: 使用 `initializeApi()` 和 `firebase-admin`
- **Commit**: `931fb84`

### 3. Layout 組件問題 ✅
- **問題**: `Cannot find module '../../../components/Layout'`
- **解決**: 使用 `AdminHeader` 和 `Head` 組件
- **Commit**: `a2b2205`

### 4. Auth Token 獲取 ✅
- **問題**: `user.getIdToken()` 不存在
- **解決**: 使用 `user.token` (來自 AuthContext)
- **Commit**: `b322d79`

## 📋 當前狀態

### Dev 環境
- **開發服務器**: http://localhost:3009 ✅ 運行中
- **NFT Admin 頁面**: http://localhost:3009/admin/nft/campaigns ✅ 可訪問
- **編譯狀態**: ✅ 無錯誤

### 頁面功能
- ✅ Admin 可以訪問 NFT 管理頁面
- ✅ API 端點正確處理認證
- ✅ 頁面可以正常渲染
- ⚠️ 目前會顯示空列表（因為還沒有 campaigns）
- ⚠️ 需要登入並具有 admin 權限才能訪問

## 🎯 如何使用

### 創建第一個 NFT Campaign

1. **訪問管理頁面**
   ```
   http://localhost:3009/admin/nft/campaigns
   ```

2. **以 Admin 身份登入**
   - 需要具有 `admin` 權限的用戶帳號
   - 在 Firestore `users` collection 中，用戶文檔需要有 `role: 'admin'`

3. **點擊 "Create New Campaign"**

4. **填寫表單**:
   - Campaign Name: 例如 "Hackathon Taiwan 2025 NFT"
   - Description: 活動描述
   - Image URL: NFT 圖片 URL
   - Network: 選擇 Sepolia (測試網) 或 Ethereum
   - Eligible Emails: 一行一個 email，或用逗號分隔
   - Start Date/End Date: 活動開始和結束時間
   - Max Supply: 最大供應量

5. **提交**
   - Campaign 會被創建在 Firestore `nft-campaigns` collection 中
   - 狀態為 `draft`

## 📊 Firestore Collections

系統會使用以下 collections：

### `nft-campaigns`
```javascript
{
  id: string,
  name: string,
  description: string,
  imageUrl: string,
  contractAddress: string (optional),
  network: 'ethereum' | 'sepolia' | 'goerli',
  eligibleEmails: string[],
  startDate: timestamp,
  endDate: timestamp,
  maxSupply: number,
  currentSupply: number,
  status: 'draft' | 'active' | 'ended' | 'paused',
  createdBy: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### `nft-mints`
```javascript
{
  id: string,
  campaignId: string,
  userEmail: string,
  userId: string,
  walletAddress: string,
  tokenId: string,
  transactionHash: string,
  mintedAt: timestamp,
  imageUrl: string,
  metadata: object
}
```

## 🚧 待完成功能

1. **Smart Contract 部署** 🔄
   - 需要部署到 Sepolia 測試網
   - 獲取合約地址並更新到 campaign

2. **用戶鑄造頁面** 🔄
   - `/pages/nft/mint/[campaignId].tsx`
   - MetaMask 錢包連接
   - 鑄造流程 UI

3. **用戶個人頁面集成** 🔄
   - 在 `/user/[userId]` 頁面顯示鑄造按鈕
   - 顯示已鑄造的 NFT

4. **Web3 工具函數** 🔄
   - `/lib/web3/nftMinting.ts`
   - 錢包連接
   - 合約調用

## 🔐 權限要求

### Admin 頁面
- 需要登入
- 用戶的 Firestore 文檔需要 `role: 'admin'`
- API 會驗證 JWT token 和 admin 角色

### User 頁面（未來）
- 需要登入
- Email 需要在 campaign 的 `eligibleEmails` 列表中

## 📝 Git 提交歷史

```
b322d79 - fix: use correct auth token from AuthContext
a2b2205 - fix: replace Layout with AdminHeader in NFT campaigns page
931fb84 - fix: correct Firebase and Auth imports in NFT system
f9d0570 - feat: NFT minting system foundation
```

## 🎨 UI 預覽

### Admin Management Page
- 標題: "NFT Campaigns Management"
- "Create New Campaign" 按鈕 (藍色)
- 創建表單 (展開/收起)
- 活動列表卡片:
  - 顯示圖片、名稱、描述
  - 顯示狀態徽章 (draft/active/ended)
  - 顯示供應量、網絡、符合資格用戶數

## 🐛 已知問題

1. ⚠️ **"Failed to load campaigns" 提示**
   - 如果用戶未登入或沒有 admin 權限
   - 如果 Firestore 連接失敗
   - **解決方案**: 確保以 admin 身份登入

2. ⚠️ **空列表顯示**
   - 這是正常的，因為還沒有創建任何 campaigns
   - 點擊 "Create New Campaign" 創建第一個活動

## 🎯 下一步

要完整測試系統：

1. ✅ 訪問 http://localhost:3009/admin/nft/campaigns
2. ✅ 以 admin 身份登入
3. ✅ 創建測試 campaign
4. ⏳ 部署智能合約
5. ⏳ 開發用戶鑄造頁面
6. ⏳ 完整的 E2E 測試

## 📚 參考資源

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js Documentation](https://docs.ethers.org/v5/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Hardhat Documentation](https://hardhat.org/docs)

