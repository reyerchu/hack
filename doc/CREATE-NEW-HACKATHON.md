# 創建新黑客松指南

## 🎯 平台架構說明

這個 HackPortal 平台目前是設計為**單一黑客松系統**，用於運行一個特定的黑客松活動。

## 選項 1：在當前黑客松內創建活動（Events）

### 適用場景
- 創建工作坊（Workshops）
- 創建贊助商活動（Sponsor Events）
- 創建社交活動（Social Events）

### 步驟
1. 確保您有 `super_admin` 權限
2. 訪問 https://hackathon.com.tw/admin/events
3. 點擊「Add Event」
4. 填寫活動資訊並提交

### 可創建的活動類型
- **Workshop Event**：技術工作坊、講座
- **Sponsor Event**：贊助商活動、展示
- **Social Event**：社交聚會、破冰活動

## 選項 2：創建全新的黑客松實例（需要修改程式碼）

### 當前限制
平台目前不支持多個獨立的黑客松實例。如果需要運行新的黑客松，有以下選項：

### 方法 A：重新配置當前平台（推薦）

1. **更新首頁內容**
   - 修改 `components/homeComponents/BackgroundCarousel.tsx`
   - 更新標題、日期、地點資訊

2. **清空舊資料**（可選）
   - 在 Firebase Firestore 中清除舊的：
     - `users` collection（保留 admins）
     - `applications` collection
     - `schedule` collection
     - `challenges` collection
     - `announcements` collection

3. **更新配置**
   - 修改 `hackportal.config.ts` 的註冊表單
   - 更新網站 metadata（`pages/index.tsx` 的 `<Head>` 標籤）

### 方法 B：部署新的獨立實例

1. **Clone 專案**
   ```bash
   git clone <repository> new-hackathon
   cd new-hackathon
   ```

2. **創建新的 Firebase 專案**
   - 訪問 https://console.firebase.google.com/
   - 創建新專案
   - 設定 Authentication、Firestore

3. **更新環境變數**
   - 複製 `.env.local.example` 為 `.env.local`
   - 填入新的 Firebase 配置

4. **部署到新的域名/子域名**

### 方法 C：擴展為多黑客松平台（需要開發）

這需要大量的程式碼修改：

1. **資料模型更新**
   - 添加 `hackathons` collection
   - 所有資料（users、events、challenges）關聯到特定 hackathon

2. **路由更新**
   - 改為 `/hackathon/[id]/...` 結構
   - 或使用子域名：`event1.hackathon.com.tw`

3. **UI 更新**
   - 添加黑客松選擇器
   - 管理員可以創建/管理多個黑客松

## 🔧 快速重新配置當前黑客松

### 1. 更新首頁資訊

編輯 `components/homeComponents/BackgroundCarousel.tsx`:
```tsx
<h1>2026 NEW Hackathon</h1>
<h2>Location</h2>
<div>新日期</div>
```

### 2. 更新 metadata

編輯 `pages/index.tsx`:
```tsx
<Head>
  <title>新黑客松名稱</title>
  <meta name="description" content="新的描述" />
</Head>
```

### 3. 清空舊資料（Firebase Console）

僅保留：
- Super admin 用戶
- 必要的配置

刪除：
- 舊的參賽者資料
- 舊的活動 schedule
- 舊的公告

## 📊 資料結構概覽

```
Firestore Collections:
├── users/              # 用戶資料（包含 permissions）
├── applications/       # 註冊申請
├── schedule/          # 活動時程（工作坊、講座等）
├── challenges/        # 挑戰/賽道
├── announcements/     # 公告
├── questions/         # Q&A
└── scans/            # QR code 掃描記錄
```

## ⚠️ 重要提醒

1. **備份資料**：在清空或修改前，先備份 Firebase 資料
2. **測試環境**：建議先在測試環境測試所有變更
3. **通知用戶**：如果要清空資料，請先通知所有用戶

## 🆘 需要幫助？

如果您需要：
- 添加多黑客松支援
- 自動化黑客松創建流程
- 其他客製化功能

請提供具體需求，我可以協助開發相關功能。

