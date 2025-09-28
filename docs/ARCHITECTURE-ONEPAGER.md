## 技術棧（Stack）
Next.js（React + SSR/SSG + API Routes）、TypeScript、Firebase Admin/Client、MUI、DevExpress Scheduler、PWA（next-pwa）

## 專案結構（重點位置）
- pages/
  - index.tsx：首頁（SSR 經由內部 API 取得關鍵資料）
  - schedule/index.tsx：行程頁（DevExpress Scheduler，健壯時間戳解析）
  - dashboard/*：管理/總覽頁
  - auth/*：登入/註冊/登出
  - api/*：後端 API（未配置 Firebase 時返回 []）
- components/
  - homeComponents/*、adminComponents/*、AppHeader.tsx
- lib/
  - admin/init.ts：Firebase Admin 初始化（保護 dummy/缺失的環境變量）
  - firebase-client.ts：Firebase Client 初始化（保護 dummy 的 NEXT_PUBLIC_*）
  - user/AuthContext.tsx：認證 Context
  - request-helper.ts：fetch 包裝（失敗回傳安全的預設值）
  - service-worker/FCMContext.tsx：PWA/FCM
- public/：靜態資源、sw.js

## 資料流
SSR 頁面 → RequestHelper → pages/api/* → Firestore（若已配置）→ props → render。
API 在處理函式內取得 firestore() 並加上 try/catch；未配置時 → 回傳 []。

## 環境變量（必要）
- Client（NEXT_PUBLIC_*）：API_KEY、AUTH_DOMAIN、PROJECT_ID、STORAGE_BUCKET、MESSAGING_SENDER_ID、APP_ID、MEASUREMENT_ID（可選）
- Server（Admin）：SERVICE_ACCOUNT_PROJECT_ID、SERVICE_ACCOUNT_CLIENT_EMAIL、SERVICE_ACCOUNT_PRIVATE_KEY（注意 \n 換行）

## 建議模式（Patterns）
- 頁面需要資料：加入 SSR 的 getServerSideProps 並呼叫內部 API
- 新增 API：`pages/api/<resource>/index.tsx`，在 handler 內安全取得 firestore() 並加 try/catch
- 用 RequestHelper 發送請求（非 2xx → 回傳 []）
- UI 對空資料具韌性處理

## 主要端點（GET）
- /api/schedule、/api/challenges、/api/keynotespeakers、/api/members、/api/questions/faq、/api/sponsor、/api/announcements

## 新增功能（清單）
1) 定義路由（`pages/<route>/index.tsx`）與是否需要 SSR
2) 在 `pages/api/<resource>` 新增/擴充 API，並加入防護
3) 前端 UI 使用 RequestHelper 串接 API
4) 處理空資料狀態
5) 若需權限，擴充 AuthContext 與 API 權限檢查


