## 概覽

- **框架**: Next.js（React + SSR/SSG + API Routes）
- **語言/工具**: TypeScript、Firebase Admin/Client、Material-UI/MUI、DevExpress Scheduler、PWA（next-pwa）
- **運行方式**: `next start`（可接 Apache 反向代理）
- **環境變量**: `.env.local`（當前為 dummy，API 已加保護：未初始化 Firebase 時返回空陣列）

## 目錄結構與職責

- `pages/`
  - Next.js 頁面與路由；可含 `getServerSideProps`（SSR）。
  - 範例路由：
    - `pages/index.tsx`: 首頁。SSR 透過 `/api/*` 取得 `keynotespeakers/challenges/faq/members/sponsor`。
    - `pages/schedule/index.tsx`: 行程頁。使用 DevExpress Scheduler 呈現；SSR 讀取 `/api/schedule`。前端具空資料與時間戳健壯解析保護。
    - `pages/dashboard/*`: 儀表頁與子頁（管理與展示）。
    - `pages/auth/*`: 登入/註冊/登出頁。
    - `pages/profile.tsx`: 個人資料頁。
  - `pages/api/*`: 服務端 API Routes
    - `api/announcements`: 公告（POST 發佈、GET 列表）
    - `api/challenges`: 挑戰（GET/POST/DELETE）
    - `api/keynotespeakers`: 主講者（GET）
    - `api/members`: 團隊成員（GET）
    - `api/questions/faq`: FAQ（GET）
    - `api/schedule`: 行程（GET/POST/DELETE）
    - `api/sponsor`: 贊助（GET）
    - 說明：以上 API 均在每次請求內部取得 `firestore()` 並包 `try/catch`；若 Firebase 未初始化則回傳 `[]`，避免 500。

- `components/`
  - 可重用 UI 元件。
  - `components/homeComponents/*`: 首頁區塊（Speakers、Sponsors、Team、Challenges 等）。
  - `components/adminComponents/*`: 後台/管理 UI。
  - `components/AppHeader.tsx`: 全站頭部。

- `lib/`
  - 服務與工具層。
  - `lib/admin/init.ts`: 初始化 Firebase Admin（服務端）。檢查 dummy/缺失環境變量；未配置則跳過並記錄警告。
  - `lib/firebase-client.ts`: 初始化 Firebase Client（瀏覽器端），使用 `NEXT_PUBLIC_*`；dummy 值時跳過並警告。
  - `lib/user/AuthContext.tsx`: 使用者認證 Context（Google Sign-In 等）。
  - `lib/request-helper.ts`: fetch 請求封裝（`get/post/delete`），錯誤時回傳空資料以保 SSR/CSR 穩定。
  - `lib/service-worker/FCMContext.tsx`: PWA 推播（需要真實 Firebase 與 VAPID Key）。

- `public/`
  - 靜態資源、icons、PWA `sw.js`。

- 根目錄
  - `next.config.js`: Next.js 與 PWA 設定。
  - `package.json`: 指令與依賴。
  - `.env.local`: 環境變量（目前為 dummy；API 以保護方式運行）。

## 資料流與執行時行為

- 頁面 SSR（以 `pages/index.tsx` 為例）
  1. `getServerSideProps` 經由 `RequestHelper.get` 呼叫內部 `/api/*` 取資料。
  2. API 端以 `firestore()` 讀取資料；若 Firebase 未初始化/為 dummy → 回傳 `[]`。
  3. SSR 將資料帶入 props，前端渲染具空態保護避免例外。

- 認證
  - `AuthContext` 維護使用者狀態與 Google 登入流程（Firebase Client）。未配置 Firebase 時會跳過初始化。

- 行程頁（`pages/schedule/index.tsx`）
  - 使用 DevExpress Scheduler 呈現資料。
  - 已移除瀏覽器端 `firebase` 依賴，新增健壯時間戳解析（支援 `seconds/_seconds/Date/number/string/toDate()`）。
  - 空資料顯示空態，不拋錯。

- PWA/通知
  - 若啟用 FCM：`FCMContext` 註冊 SW 並嘗試取得 Token；需真實 Firebase + `NEXT_PUBLIC_VAPID_KEY`。

## 環境變量（必要）

- Firebase Client（瀏覽器端，NEXT_PUBLIC_*）
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
  - `NEXT_PUBLIC_MEASUREMENT_ID`（可選）

- Firebase Admin（服務端）
  - `SERVICE_ACCOUNT_PROJECT_ID`
  - `SERVICE_ACCOUNT_CLIENT_EMAIL`
  - `SERVICE_ACCOUNT_PRIVATE_KEY`（注意換行 `\n`）

備註：在 v0.1，本專案即使未配置 Firebase，API 也會返回 `[]` 以確保穩定上線。

## 如何新增功能

- 新增/修改頁面（UI + SSR）
  - 在 `pages/<route>/index.tsx` 添加 UI 與 `getServerSideProps`。
  - 需要資料時：新增/擴充對應 `pages/api/<resource>/index.tsx`。

- 新增 API（服務端）
  - `pages/api/<resource>/index.tsx` 中新增 `handleGetRequest/handlePostRequest/...`。
  - 需要資料庫：在函數內 `const db = firestore()` 並加 try/catch；未配置時回傳 `[]` 或對應空結果。

- 前端資料請求（SSR/CSR）
  - 使用 `lib/request-helper.ts` 的 `RequestHelper.get/post/delete`。
  - 失敗或非 2xx 回傳空資料，避免頁面崩潰。

- 認證/使用者狀態
  - 擴充 `lib/user/AuthContext.tsx` 的 user 欄位或登入流程。

- 通知/PWA
  - `lib/service-worker/FCMContext.tsx`（需 Firebase 與 SW）。

## 快速範例：新增文章清單頁與 API

- API：`pages/api/articles/index.tsx`
  - GET：先回傳 `[]`（未配置 Firebase 前可先打通 UI 流程）。

- 頁面：`pages/articles/index.tsx`
  - `getServerSideProps` → `RequestHelper.get('/api/articles')` 取得資料。
  - UI 列表渲染，空資料顯示提示，不拋錯。


