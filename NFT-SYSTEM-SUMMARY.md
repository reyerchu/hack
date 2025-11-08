# NFT 鑄造系統 - 完整總結

## ✅ 已完成功能

### 1. Admin 管理介面
**位置**: `/admin/nft/campaigns`

**功能**:
- 創建 NFT 活動
- 上傳 NFT 圖片
- 設定白名單（email list）
- 選擇區塊鏈網路（Sepolia, Ethereum, Arbitrum）
- 設定活動時間和供應量
- 查看所有活動列表
- 全繁體中文介面

### 2. 用戶個人頁面整合
**位置**: `/user/[userId]`

**功能**:
- 檢查用戶是否符合鑄造資格
- 顯示「鑄造 NFT」按鈕（符合資格且未鑄造時）
- 顯示「已鑄造」狀態（已鑄造時）
- 只對用戶自己可見（`canEdit` 檢查）

### 3. NFT 鑄造頁面
**位置**: `/nft/mint`

**功能**:
- NFT 預覽和活動資訊
- 兩步驟鑄造流程：
  1. 連接 MetaMask 錢包
  2. 鑄造 NFT
- 處理多種狀態：
  - 不符合資格
  - 已鑄造
  - 正常鑄造流程
- 全繁體中文介面

### 4. API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/nft/check-eligibility` | GET | 檢查用戶鑄造資格 |
| `/api/nft/record-mint` | POST | 記錄鑄造完成 |
| `/api/admin/nft/campaigns/create` | POST | 創建 NFT 活動（Admin） |
| `/api/admin/nft/campaigns/list` | GET | 列出所有活動（Admin） |
| `/api/upload` | POST | 上傳圖片 |

### 5. 數據模型

#### Firestore Collections:

**nft-campaigns**:
```typescript
{
  id: string
  name: string
  description: string
  imageUrl: string
  network: 'sepolia' | 'ethereum' | 'arbitrum'
  contractAddress?: string
  eligibleEmails: string[]
  startDate: Timestamp
  endDate: Timestamp
  maxSupply: number
  currentSupply: number
  status: 'active' | 'inactive' | 'completed'
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**nft-mints**:
```typescript
{
  id: string
  campaignId: string
  userEmail: string
  userId: string
  walletAddress: string
  transactionHash: string
  mintedAt: Timestamp
}
```

## 📋 待完成功能

### Smart Contract Integration
- 部署 NFT 合約到測試網/主網
- 實現實際的鑄造交易
- 連接合約地址到活動

### 前端改進
- 顯示鑄造進度
- 更好的錯誤處理
- 交易狀態追蹤

## 🧪 測試流程

### 1. 創建 NFT 活動

1. 訪問 `http://localhost:3009/admin/nft/campaigns`
2. 點擊「建立新活動」
3. 填寫表單：
   - 活動名稱：測試 NFT
   - 活動描述：這是一個測試活動
   - 上傳圖片
   - 選擇網路：Sepolia（測試網）
   - 符合資格的電子郵件：輸入測試用戶的 email
   - 開始日期：現在
   - 結束日期：一週後
   - 最大供應量：100
4. 點擊「建立活動」

### 2. 測試用戶頁面

1. 以測試用戶身份登入
2. 訪問 `http://localhost:3009/user/{userId}`
3. 應該能看到「鑄造 NFT」按鈕

### 3. 測試鑄造流程

1. 點擊「鑄造 NFT」按鈕
2. 進入鑄造頁面 `/nft/mint`
3. 點擊「連接 MetaMask」
4. 確認錢包連接
5. 點擊「立即鑄造」
6. （目前會顯示「功能開發中」提示）

## ⚠️ 已知限制

1. **權限檢查暫時移除**：開發環境中 admin 權限檢查已暫時停用
2. **智能合約未整合**：鑄造功能目前是模擬的
3. **活動狀態**：需要手動在 Firestore 中將 `status` 設為 `'active'`

## 🔧 開發注意事項

- 所有 NFT 相關頁面都使用繁體中文
- 圖片上傳存儲在 `/public/nft-images/`
- 使用 `formidable` 處理檔案上傳
- NFT 資格檢查邏輯在 `lib/nft/check-eligibility.ts`

## 📦 相關檔案

### 前端頁面
- `/pages/admin/nft/campaigns.tsx` - Admin 管理頁面
- `/pages/nft/mint.tsx` - 鑄造頁面
- `/pages/user/[userId].tsx` - 用戶頁面（含鑄造按鈕）

### API 路由
- `/pages/api/nft/check-eligibility.ts`
- `/pages/api/nft/record-mint.ts`
- `/pages/api/admin/nft/campaigns/create.ts`
- `/pages/api/admin/nft/campaigns/list.ts`
- `/pages/api/upload.ts`

### 共享邏輯
- `/lib/nft/check-eligibility.ts` - 資格檢查邏輯
- `/types/nft.ts` - TypeScript 類型定義

### 智能合約
- `/contracts/NFTMinter.sol` - ERC-721 合約（未部署）
