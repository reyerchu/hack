# 🎯 功能追蹤清單

> **重要**：每次添加或修改功能時，必須更新此文檔！

## 📊 當前實作的功能

### ✅ 團隊管理功能

#### 團隊註冊與編輯
- [x] 團隊基本資訊（名稱、成員）
- [x] 賽道選擇
- [x] 團隊領導者指定
- [x] 成員編輯權限設定
- [x] **錢包地址管理** ⚠️ **重要功能** - 已實作
  - EVM 錢包地址輸入
  - 其他錢包地址（多鏈支援）
  - 新增/刪除錢包地址
  - 文件位置：
    - Frontend: `pages/team-register.tsx`
    - Backend: `pages/api/team-register/[teamId].ts`
    - Email: `lib/teamRegister/email.ts`
  - 最後更新：2025-11-12
  - Stash 位置：`stash@{0}` (已恢復)

#### 團隊刪除功能
- [x] Admin 直接刪除權限
- [x] 團隊成員發送刪除請求
- [x] Email 通知 Admin
- [x] Admin 審核介面
  - 文件位置：
    - API: `pages/api/team-register/[teamId].ts` (handleDelete)
    - Component: `components/admin/TeamDeleteRequests.tsx`
    - API: `pages/api/admin/team-delete-requests.ts`
  - 最後更新：2025-11-12
  - Commit: (待提交)

### ✅ NFT 系統功能

#### NFT 鑄造
- [x] 錢包連接（MetaMask）
- [x] 網路自動切換
- [x] Merkle Tree 白名單驗證
- [x] 智能合約互動
  - 文件位置：
    - Frontend: `pages/nft/[campaignId].tsx`
    - Hook: `lib/hooks/useNFTContractMerkle.ts`
    - Contract: `contracts/contracts/RWAHackathonNFT.sol`
  - 最後更新：2025-11-08
  - Version: v5.0

#### NFT 管理
- [x] 創建 NFT 活動
- [x] 自動部署合約
- [x] 自動驗證合約（Etherscan）
- [x] Merkle Tree 自動生成
- [x] IPFS 圖片上傳
  - 文件位置：
    - Admin: `pages/admin/nft/campaigns.tsx`
    - Component: `components/admin/NFTAutoSetup.tsx`
  - 最後更新：2025-11-08

### ✅ 得獎名單功能

#### 得獎顯示
- [x] 集中式得獎資料 (`lib/winnersData.ts`)
- [x] 得獎名單頁面 (`pages/winners.tsx`)
- [x] 團隊公開頁面顯示獎項
- [x] 用戶公開頁面顯示獎項
- [x] 賽道 Logo 顯示
- [x] 多贏家並列顯示
  - 最後更新：2025-11-12
  - Version: v4.21+

### ✅ 其他核心功能

- [x] 用戶註冊與認證
- [x] 個人資料管理
- [x] 團隊挑戰提交
- [x] PDF 上傳功能
- [x] Admin 管理後台
- [x] 贊助商管理
- [x] 賽道管理
- [x] Email 通知系統

## ⚠️ 重要注意事項

### 🔴 高風險功能（修改前必須檢查）

1. **團隊錢包地址管理** - 已有實作，不可覆蓋！
   - 檔案：`pages/team-register.tsx`, `pages/api/team-register/[teamId].ts`
   - 資料庫欄位：`evmWalletAddress`, `otherWallets`

2. **NFT 鑄造系統** - 完整實作，不可覆蓋！
   - 檔案：`pages/nft/[campaignId].tsx`, `lib/hooks/useNFTContractMerkle.ts`

3. **得獎名單系統** - 集中式資料管理
   - 檔案：`lib/winnersData.ts`
   - 所有得獎顯示必須使用此檔案

## 📝 更新流程

### 添加新功能時：
1. ✅ 在此文檔中添加功能描述
2. ✅ 註明文件位置
3. ✅ 記錄最後更新時間
4. ✅ Commit 時引用此功能

### 修改現有功能時：
1. ⚠️ 先檢查此文檔確認功能範圍
2. ⚠️ 確保不會覆蓋其他功能
3. ⚠️ 更新文檔中的時間戳
4. ⚠️ 在 commit message 中說明修改內容

### 刪除功能時：
1. 🔴 **必須**先與團隊確認
2. 🔴 更新此文檔標記為已刪除
3. 🔴 說明刪除原因

## 🚨 緊急恢復指南

如果功能意外消失：

1. 檢查最近的 commit: `git log --oneline -20`
2. 檢查 stash: `git stash list`
3. 搜尋相關檔案歷史: `git log -S "功能關鍵字"`
4. 查看此文檔找到功能位置
5. 從 git history 或 stash 恢復

## 📊 功能依賴關係

```
團隊管理
├── 團隊註冊/編輯
│   ├── 基本資訊
│   ├── 賽道選擇
│   └── 錢包地址 ⚠️ 重要
├── 團隊刪除
│   ├── Admin 權限
│   └── 成員請求
└── 團隊提交
    └── PDF 上傳

NFT 系統
├── NFT 鑄造
│   ├── 錢包連接
│   ├── 白名單驗證
│   └── 合約互動
└── NFT 管理
    ├── 活動創建
    ├── 合約部署
    └── 合約驗證

得獎系統
├── winnersData.ts (集中資料)
├── winners 頁面
├── 團隊公開頁面
└── 用戶公開頁面
```

## 🔄 最近更新記錄

### 2025-11-12
- ✅ 恢復團隊錢包地址編輯功能（從 stash）
- ✅ 實作團隊刪除權限管理
- ✅ 添加 Admin 刪除請求審核功能
- ✅ 創建此功能追蹤文檔

### 2025-11-08
- ✅ NFT 鑄造 UI 優化 (v5.0)
- ✅ 錢包連接流程改進
- ✅ 合約自動驗證功能

### 2025-11-07
- ✅ 得獎名單集中化管理
- ✅ 團隊/用戶頁面獎項顯示

---

**維護者注意**：
- 📝 每次 PR 前必須檢查此文檔
- 🔍 每次修改現有檔案前必須確認功能範圍
- ⚠️ 發現功能消失立即報告並檢查 git history/stash

