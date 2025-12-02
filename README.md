# RWA Hackathon Taiwan Portal

### _專業優雅的 Web3 黑客松活動管理平台_

[![Live Site](https://img.shields.io/badge/Live-hackathon.com.tw-blue)](https://hackathon.com.tw)
[![Version](https://img.shields.io/badge/version-1.0.7-green.svg)](https://github.com/reyerchu/hack)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

🌐 **正式網站**: [hackathon.com.tw](https://hackathon.com.tw)

基於 [HackPortal by ACM UTD](https://github.com/acmutd/hackportal) 開發

---

## 🎯 關於本專案

**RWA Hackathon Taiwan Portal** 是為台灣首屆 RWA（真實世界資產）黑客松設計的綜合平台。採用 Next.js 和 Firebase 建構，為參賽者、贊助商、導師和主辦方提供專業、優雅且友善的使用體驗。

---

## ✨ 主要功能

### 🏠 公開頁面

- **首頁** - 專業的登陸頁面，包含動態輪播、即時統計和優雅動畫
- **賽道挑戰** - 完整的贊助商賽道，包含詳細的挑戰說明和獎金資訊
- **時程表** - 互動式活動時程，支援日曆整合
- **導師評審** - 展示專業導師和評審的個人資料
- **得獎名單** - 優雅的得獎頁面，顯示各賽道獎項、團隊連結和標誌

### 🔐 使用者功能

#### 📝 註冊與個人檔案
- Email 和 Google OAuth 認證
- 完整的個人檔案管理
- 履歷上傳與管理
- 隱私設定控制
- 公開個人頁面（含獎項展示）

#### 👥 團隊管理
- **團隊報名** - 簡易的團隊組建與成員邀請系統
- **團隊編輯頁面** - 獨立的編輯介面，直覺的成員管理
- **公開團隊頁面** - 專業的團隊展示，包含專案連結和獎項
- **成員權限** - 細緻的團隊成員編輯權限
- **錢包整合** - EVM 和多鏈錢包地址管理
- **Demo Day 提交** - Demo Day 賽道參賽者的 PDF 上傳

#### 🤝 找隊友系統
- 發布團隊需求與角色說明
- 瀏覽可用機會
- 申請管理系統
- 即時申請通知
- 自動化 Email 通知

#### 🪙 NFT 系統
- **多鏈支援** - Ethereum、Sepolia、Arbitrum 等
- **Merkle Tree 白名單** - 高效的鏈上驗證，自動生成 Merkle Root
- **Email 資格驗證** - 與使用者註冊綁定的自動化白名單管理
- **自動部署** - 流程化的合約部署工作流程，含進度追蹤
- **鑄造追蹤** - 完整的鑄造歷史和分析儀表板
- **IPFS 整合** - 透過 Pinata 的去中心化元資料儲存
- **智慧白名單管理** - 新增/移除 Email，合約更新失敗時自動回滾資料庫
- **MetaMask 整合** - 無縫的錢包連接，用於鑄造和管理操作
- **合約驗證** - 部署後自動在 Etherscan 驗證

### 🛠️ 管理後台

#### 👥 使用者管理
- 檢視和管理所有註冊使用者
- 角色分配（管理員、超級管理員、贊助商）
- 使用者統計和分析
- 履歷下載和審閱

#### 👨‍👩‍👧‍👦 團隊管理
- 檢視所有參賽團隊
- 匯出團隊資料為 CSV
- 監控團隊報名
- 僅限管理員的團隊刪除權限

#### 🏢 贊助商管理
- 建立和管理贊助商資料
- 分配賽道權限
- 上傳贊助商標誌和素材
- 賽道專屬贊助商儀表板

#### 🎯 賽道與挑戰管理
- 建立自訂贊助商賽道
- 定義挑戰與獎金池
- 管理提交和評審
- 即時提交追蹤

#### 🎨 NFT 活動管理
- 建立 NFT 活動，含自訂圖片和元資料
- 一鍵生成和部署智能合約
- 使用 Merkle Tree 管理白名單，自動更新 Root
- 自動設定工作流程，含即時進度追蹤
- 在 Etherscan/區塊瀏覽器上驗證合約
- 鑄造監控和分析，含使用者追蹤
- **新增白名單（含回滾）** - MetaMask/合約更新失敗時自動撤銷資料庫變更
- **移除白名單** - 安全移除，含鑄造狀態檢查（防止移除已鑄造的 Email）
- **多語言支援** - 錯誤訊息以繁體中文顯示

#### 📢 通訊工具
- 推播通知系統
- 公告廣播
- Email 通知自動化
- 問答系統

#### 📊 分析與報表
- 即時出席追蹤
- 報到統計
- 團隊報名指標
- NFT 鑄造分析

---

## 🎨 設計理念

- **專業優雅** - 深藍色主題 (#1a3a6e)，乾淨現代的 UI
- **響應式設計** - 針對桌機、平板和手機優化
- **流暢動畫** - 細緻的過渡和懸停效果
- **無障礙設計** - 符合 WCAG 標準，使用語意化 HTML
- **效能優化** - 圖片優化、延遲載入和高效資料獲取

---

## 🚀 技術架構

- **前端**: Next.js 12, React 18, TypeScript
- **樣式**: Tailwind CSS, 自訂 CSS
- **後端**: Next.js API Routes, Firebase Functions
- **資料庫**: Firebase Firestore
- **認證**: Firebase Auth (Email/Google)
- **儲存**: Firebase Storage, IPFS (NFT 元資料)
- **區塊鏈**: Ethers.js, Hardhat
- **Email**: Nodemailer with SMTP
- **程序管理**: PM2
- **版本控制**: Git，含自動備份

---

## 🏗️ 專案結構

```
├── pages/                  # Next.js 頁面
│   ├── api/               # API 路由
│   ├── admin/             # 管理後台頁面
│   ├── sponsor/           # 贊助商儀表板
│   ├── teams/             # 團隊公開頁面
│   ├── nft/               # NFT 活動頁面
│   └── ...
├── components/            # React 元件
├── lib/                   # 工具函式庫
│   ├── firebase/         # Firebase 設定
│   ├── teamRegister/     # 團隊管理
│   └── nft/              # NFT 工具
├── public/               # 靜態資源
├── styles/               # 全域樣式
└── scripts/              # 部署與維護腳本
```

---

## 🔧 設定與部署

### 前置需求
- Node.js 16+
- npm 或 yarn
- Firebase 專案
- SMTP 憑證（用於 Email）

### 環境變數
建立 `.env.local` 並填入以下設定：

```bash
# ============================================
# Firebase Web App 設定（前端）
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_MEASUREMENT_ID=your_measurement_id

# ============================================
# Firebase Admin SDK（後端 - 服務帳戶）
# ============================================
SERVICE_ACCOUNT_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
SERVICE_ACCOUNT_PROJECT_ID=your_project_id

# ============================================
# Email 設定（SMTP）
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_app_password
EMAIL_FROM=your_email@domain.com

# ============================================
# Google OAuth 與日曆 API
# ============================================
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://your_domain.com/api/calendar/callback

# ============================================
# 網站設定
# ============================================
NEXT_PUBLIC_SITE_URL=https://your_domain.com
NEXT_PUBLIC_API_URL=http://localhost:3008

# ============================================
# NFT 與 IPFS 設定
# ============================================
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=gateway.pinata.cloud

# ============================================
# 區塊鏈設定
# ============================================
ETHERSCAN_API_KEY=your_etherscan_api_key
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# ============================================
# 管理員設定
# ============================================
ADMIN_EMAIL=your_admin_email@domain.com
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@domain.com

# ============================================
# 選用設定
# ============================================
NEXT_PUBLIC_RESUME_UPLOAD_PASSWORD=your_password
NEXT_PUBLIC_RESUME_UPLOAD_SERVICE_ACCOUNT=your_service_account
NEXT_PUBLIC_VAPID_KEY=your_vapid_key
```

#### 設定說明：

1. **Firebase 設定**：
   - 從 [Firebase Console](https://console.firebase.google.com/) 取得憑證
   - Web App 設定：專案設定 → 一般 → 您的應用程式
   - 服務帳戶：專案設定 → 服務帳戶 → 產生新的私密金鑰

2. **Email (SMTP)**：
   - 若使用 Gmail：啟用兩步驟驗證並產生[應用程式密碼](https://myaccount.google.com/apppasswords)
   - Port 587 用於 TLS，Port 465 用於 SSL

3. **Google OAuth**：
   - 在 [Google Cloud Console](https://console.cloud.google.com/) 設定
   - 新增授權的重新導向 URI：`https://your_domain.com/api/calendar/callback`

4. **NFT 與 IPFS**：
   - 從 [Pinata](https://www.pinata.cloud/) 取得 JWT
   - 用於 NFT 元資料儲存

5. **區塊鏈**：
   - 從 [Etherscan](https://etherscan.io/myapikey) 取得 API 金鑰
   - 用於合約驗證

6. **管理員設定**：
   - 將 `ADMIN_EMAIL` 設為您的管理員 Email 地址
   - 用於權限檢查和管理員通知

### 安裝
```bash
npm install
npm run dev          # 開發伺服器
npm run build        # 正式版建置
npm start            # 正式版伺服器
```

### 安全部署
```bash
./safe-deploy.sh    # 自動化部署，含健康檢查
```

---

## 🌟 特色功能

### 簡潔優雅的時程表（含分享功能）
- 乾淨、專業的活動時程介面
- 即時活動篩選和搜尋
- 一鍵分享至 Google 日曆
- 響應式設計，適用手機和桌機
- 時區支援，適合國際參與者

### NFT 自動設定與白名單管理
- 一鍵合約部署，含 IPFS 元資料上傳
- 自動化 Merkle Tree 生成和鏈上 Root 更新
- 在 Etherscan 驗證合約，含重試機制
- Email 白名單管理，支援新增/移除
- 多步驟進度追蹤，含即時狀態更新
- **原子操作** - 智能合約更新失敗時自動回滾資料庫變更
- **錯誤處理** - 完整的 MetaMask、錢包權限和合約錯誤訊息
- **管理員白名單面板** - 檢視所有白名單 Email，含鑄造狀態和一鍵移除

### 找隊友
- 技能配對系統
- 申請工作流程
- 自動化通知
- 與使用者個人檔案整合

### Email 自動化
- 新團隊報名通知
- 團隊編輯通知（含變更追蹤）
- Demo Day PDF 提交提醒
- 找隊友申請通知

---

## 📈 活動統計

- **30+ 團隊**參與 RWA Hackathon Taiwan 2025
- **多個賽道**：Demo Day、Self Protocol、Sui 等
- **超過 $10,000 獎金**分配於各賽道
- **NFT 參與徽章**發送給所有參與者

---

## 📝 授權

本專案基於 [HackPortal](https://github.com/acmutd/hackportal) by ACM UTD 開發。

---

## 🙏 致謝

- **原始專案**：[HackPortal by ACM UTD](https://github.com/acmutd/hackportal)
- **RWA Hackathon Taiwan 團隊**提供功能需求和測試
- **所有贊助商**的支持和賽道貢獻
- **參賽者**提供的寶貴回饋

---

## 📧 聯繫方式

**Email**: [reyerchu@defintek.io](mailto:reyerchu@defintek.io)

**網站**:
- [reyerchu.com](https://reyerchu.com) - 個人網站
- [rwa.nexus](https://rwa.nexus) - RWA 相關新創
- [defintek.io](https://defintek.io) - 線上 Web3 課程

---

以 ❤️ 和 Cursor AI w/ Claude Opus 4.5 打造，獻給台灣的 Web3 社群
