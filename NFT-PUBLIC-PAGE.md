# NFT 公開頁面功能

## 概述

現在每個 NFT 活動都有一個**公開的詳細資訊頁面**，任何人都可以查看 NFT 活動的資訊和鑄造記錄。

## 功能特色

### 1. 公開訪問
- **無需登入**：任何人都可以查看 NFT 活動頁面
- **完整資訊**：顯示 NFT 的所有公開資訊
- **透明化**：展示所有鑄造記錄

### 2. 頁面內容

#### NFT 活動詳情
- NFT 圖片（高品質展示）
- 活動名稱和描述
- 活動狀態（進行中/已結束）
- 區塊鏈網路
- 鑄造進度（已鑄造數量/總供應量）
- 智能合約地址（可點擊查看區塊鏈瀏覽器）
- 活動截止日期
- 進度條視覺化

#### 鑄造記錄列表
- Token ID
- 鑄造用戶的 Email
- 鑄造時間
- 交易哈希（可點擊查看區塊鏈瀏覽器）

### 3. 多處入口

從以下位置都可以進入 NFT 詳情頁：

#### a. 管理員活動列表
- 網址：`http://localhost:3009/admin/nft/campaigns`
- 點擊任何活動的圖片或名稱
- 跳轉到：`/nft/[campaignId]`

#### b. 用戶個人頁面
- 網址：`http://localhost:3009/user/[userId]`
- 在「NFT 紀念品」區域
- 點擊任何 NFT 卡片的圖片或名稱
- 跳轉到：`/nft/[campaignId]`

## 技術實現

### 新增的檔案

#### 1. 公開頁面
**`pages/nft/[campaignId].tsx`**
- 顯示 NFT 活動的詳細資訊
- 包含響應式設計
- SEO 優化（Open Graph 標籤）
- 美觀的 UI 設計

#### 2. 公開 API 端點

**`pages/api/nft/campaigns/[campaignId].ts`**
- 獲取單個 NFT 活動的公開資訊
- 不需要認證
- 只返回公開資訊（不包含敏感資料如 merkleProofs、eligibleEmails 等）

**`pages/api/nft/campaigns/[campaignId]/mints.ts`**
- 獲取特定活動的所有鑄造記錄
- 不需要認證
- 按鑄造時間倒序排列

### 修改的檔案

#### 1. `pages/admin/nft/campaigns.tsx`
- 添加了 `Link` 組件
- 圖片和標題變成可點擊鏈接
- 指向公開的 NFT 詳情頁

#### 2. `pages/user/[userId].tsx`
- NFT 卡片添加了點擊功能
- 圖片和標題變成可點擊鏈接
- 添加 hover 效果提升用戶體驗

## 使用方式

### 查看 NFT 詳情

1. **從管理員頁面**：
   ```
   http://localhost:3009/admin/nft/campaigns
   → 點擊任何 NFT 活動
   → http://localhost:3009/nft/[campaignId]
   ```

2. **從用戶頁面**：
   ```
   http://localhost:3009/user/[userId]
   → 找到「NFT 紀念品」區域
   → 點擊任何 NFT 卡片
   → http://localhost:3009/nft/[campaignId]
   ```

3. **直接訪問**：
   ```
   http://localhost:3009/nft/[campaignId]
   ```
   將 `[campaignId]` 替換為實際的活動 ID

### 分享連結

NFT 詳情頁面的連結可以直接分享給任何人，無需登入即可查看：

```
http://localhost:3009/nft/abc123xyz
```

## API 端點

### 獲取 NFT 活動資訊

```bash
GET /api/nft/campaigns/[campaignId]
```

**回應範例：**
```json
{
  "success": true,
  "campaign": {
    "id": "abc123xyz",
    "name": "RWA Hackathon Taiwan 參與紀念 NFT",
    "description": "感謝參與第一屆 RWA 黑客松台灣",
    "imageUrl": "https://...",
    "network": "sepolia",
    "contractAddress": "0x...",
    "maxSupply": 100,
    "currentSupply": 45,
    "status": "active",
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### 獲取鑄造記錄

```bash
GET /api/nft/campaigns/[campaignId]/mints
```

**回應範例：**
```json
{
  "success": true,
  "mints": [
    {
      "id": "mint123",
      "userEmail": "user@example.com",
      "tokenId": 1,
      "transactionHash": "0x...",
      "mintedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

## 設計特色

### 1. 響應式設計
- 手機、平板、桌面完美適配
- 彈性佈局自動調整

### 2. 視覺設計
- 大圖展示 NFT 圖片
- 清晰的資訊層次
- 狀態標籤顏色區分（進行中/已結束）
- 進度條視覺化
- Hover 效果提升互動性

### 3. 區塊鏈整合
- 智能合約地址可點擊查看
- 交易哈希可點擊查看
- 自動識別不同網路（mainnet/sepolia/arbitrum 等）
- 正確的區塊鏈瀏覽器連結

### 4. SEO 優化
- 完整的 meta 標籤
- Open Graph 標籤（社群媒體分享）
- 麵包屑導航
- 語義化 HTML

## 權限設定

### 公開頁面（無需登入）
- ✅ `/nft/[campaignId]` - 查看 NFT 詳情
- ✅ `/api/nft/campaigns/[campaignId]` - 獲取活動資訊
- ✅ `/api/nft/campaigns/[campaignId]/mints` - 獲取鑄造記錄

### 管理員頁面（需要 super_admin）
- 🔒 `/admin/nft/campaigns` - 管理活動列表
- 🔒 `/api/admin/nft/campaigns/list` - 獲取活動列表
- 🔒 `/api/admin/nft/campaigns/create` - 創建新活動

### 用戶頁面（需要登入）
- 👤 `/user/[userId]` - 只有本人可以看到 NFT 紀念品區域
- 🌐 如果未登入，則只顯示基本資訊

## 未來擴展

### 可能的功能
1. **社群分享按鈕**：一鍵分享到社交媒體
2. **NFT 畫廊**：所有 NFT 活動的列表頁
3. **篩選和排序**：按網路、狀態、日期篩選
4. **統計資訊**：總鑄造數量、參與用戶數等
5. **評論功能**：用戶可以留言
6. **收藏功能**：用戶可以收藏 NFT 活動

## 測試清單

- [x] 創建公開 NFT 頁面
- [x] 創建公開 API 端點
- [x] 從管理員頁面跳轉
- [x] 從用戶頁面跳轉
- [x] 響應式設計測試
- [x] 區塊鏈瀏覽器連結測試
- [x] 無需登入即可訪問
- [x] SEO meta 標籤設定

## 注意事項

1. **資料隱私**：
   - Email 地址會顯示在鑄造記錄中
   - 如需隱私，考慮只顯示前幾位或使用暱稱

2. **效能優化**：
   - 大量鑄造記錄時考慮分頁
   - 使用快取減少資料庫查詢

3. **錯誤處理**：
   - 活動不存在時顯示 404
   - API 錯誤時顯示友善提示

## 部署

開發伺服器已重啟：
```bash
pm2 restart hack-dev
```

現在可以訪問：
- `http://localhost:3009/admin/nft/campaigns` - 管理員頁面
- `http://localhost:3009/nft/[campaignId]` - NFT 詳情頁（公開）

---

**建立日期**：2025-11-09  
**版本**：v1.0  
**狀態**：✅ 已完成

