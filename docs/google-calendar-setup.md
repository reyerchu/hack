# Google Calendar 整合設置指南

## 功能說明

這個功能允許用戶連接他們的 Google Calendar，自動檢查：
- 哪些活動已經添加到日曆
- 哪些活動與日曆中的其他事件有時間衝突
- 哪些活動尚未添加

## 設置步驟

### 1. 創建 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案或選擇現有專案
3. 啟用 Google Calendar API：
   - 在左側選單選擇「API 和服務」 > 「庫」
   - 搜索 "Google Calendar API"
   - 點擊「啟用」

### 2. 創建 OAuth 2.0 憑證

1. 在 Google Cloud Console 中，前往「API 和服務」 > 「憑證」
2. 點擊「+ 創建憑證」 > 「OAuth 用戶端 ID」
3. 如果這是第一次創建，需要先配置 OAuth 同意畫面：
   - 選擇「外部」用戶類型（如果是公開應用）
   - 填寫應用名稱、用戶支援電子郵件等必填資訊
   - 添加授權網域（例如：yourdomain.com）
   - 添加範圍：
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/calendar.events`
   - 保存並繼續

4. 回到創建 OAuth 用戶端 ID：
   - 應用程式類型：選擇「網頁應用程式」
   - 名稱：任意（例如：RWA Hackathon Schedule）
   - 授權的 JavaScript 來源：
     - `http://localhost:3009` (開發環境)
     - `https://yourdomain.com` (生產環境)
   - 授權的重新導向 URI：
     - `http://localhost:3009/api/calendar/callback` (開發環境)
     - `https://yourdomain.com/api/calendar/callback` (生產環境)
   - 點擊「創建」

5. 記下以下資訊：
   - **用戶端 ID** (Client ID)
   - **用戶端密鑰** (Client Secret)

### 3. 設置環境變數

在專案根目錄的 `.env` 或 `.env.local` 文件中添加以下變數：

```bash
# Google Calendar API (Dev Branch - Port 3009)
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3009/api/calendar/callback
NEXT_PUBLIC_SITE_URL=http://localhost:3009
```

生產環境：

```bash
# Google Calendar API (Production)
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/callback
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 4. 重啟開發伺服器

```bash
npm run dev
```

或

```bash
./start-dev.sh
```

## 使用流程

### 用戶流程

1. **連接 Google Calendar**
   - 訪問 `/schedule` 頁面
   - 點擊「連接 Google Calendar」按鈕
   - 重定向到 Google 授權頁面
   - 授予應用訪問 Google Calendar 的權限
   - 自動返回時程表頁面

2. **檢查日曆**
   - 連接成功後，點擊「檢查日曆」按鈕
   - 系統會自動比對時程表中的活動與 Google Calendar 中的事件
   - 顯示檢查結果：
     - ✓ 已添加 (綠色)
     - ⚠ 有衝突 (紅色)
     - + 可添加 (藍色)

3. **斷開連接**
   - 點擊「斷開連接」按鈕可清除本地存儲的授權資訊

## 按鈕狀態說明

| 按鈕文字 | 顏色 | 說明 |
|---------|------|------|
| 連接 Google Calendar | 藍色 | 尚未連接，點擊開始授權 |
| 檢查中... | 藍色（半透明） | 正在檢查日曆，請稍候 |
| 檢查日曆 | 綠色 | 已連接，點擊檢查 |
| 斷開連接 | 紅色 | 已連接，點擊斷開 |

## 活動按鈕狀態

| 按鈕文字 | 顏色 | 說明 |
|---------|------|------|
| + 加入日曆 | 藍色 | 尚未添加，點擊添加 |
| ✓ 已添加 | 綠色 | 已在 Google Calendar 中 |
| + 加入日曆（有衝突） | 紅色 | 時間與其他事件衝突 |

## 技術細節

### API 端點

1. **GET `/api/calendar/auth`**
   - 生成 Google OAuth 授權 URL
   - 返回：`{ authUrl: string }`

2. **POST `/api/calendar/auth`**
   - 交換授權碼獲取 access token
   - 請求體：`{ code: string }`
   - 返回：`{ tokens: { access_token, refresh_token, ... } }`

3. **GET `/api/calendar/callback`**
   - Google OAuth 回調端點
   - 自動重定向到 `/schedule?auth_code=...`

4. **GET `/api/calendar/events`**
   - 獲取用戶的 Google Calendar 事件
   - Headers: `Authorization: Bearer {access_token}`
   - Query: `timeMin`, `timeMax`, `q` (可選)
   - 返回：`{ events: [...], count: number }`

### 前端狀態管理

- `googleAccessToken`: Google Calendar API 的 access token
- `calendarStatus`: 連接狀態（'disconnected' | 'connected' | 'checking'）
- `isCheckingCalendar`: 是否正在檢查日曆
- `addedEvents`: 已添加到 Google Calendar 的活動 ID 集合
- `conflictingEvents`: 有時間衝突的活動 ID 集合

### LocalStorage

- `googleCalendarToken`: access token
- `googleCalendarRefreshToken`: refresh token（用於長期訪問）
- `addedCalendarEvents`: 已添加的活動 ID 陣列

## 安全注意事項

### 生產環境建議

1. **Token 加密**
   - 目前 token 存儲在 localStorage 中（僅客戶端）
   - 建議在生產環境中使用加密存儲或服務器端 session

2. **Token 刷新**
   - 目前未實現自動 token 刷新
   - access token 通常在 1 小時後過期
   - 可以使用 refresh_token 獲取新的 access token

3. **HTTPS**
   - 生產環境必須使用 HTTPS
   - Google OAuth 要求回調 URL 使用 HTTPS

4. **CORS 配置**
   - 確保 Google Cloud Console 中的授權來源和回調 URI 正確配置

## 故障排除

### 錯誤：缺少 Google OAuth 配置

**問題**: 後端返回「缺少 Google OAuth 配置」錯誤

**解決方法**:
- 確認已設置 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 環境變數
- 重啟開發伺服器

### 錯誤：授權已失效

**問題**: 檢查日曆時顯示「授權已失效」

**解決方法**:
- 點擊「斷開連接」
- 重新點擊「連接 Google Calendar」授權

### 錯誤：redirect_uri_mismatch

**問題**: Google 授權頁面顯示 redirect_uri_mismatch 錯誤

**解決方法**:
- 檢查 Google Cloud Console 中的「授權的重新導向 URI」是否與 `GOOGLE_REDIRECT_URI` 環境變數一致
- 確保 URI 完全匹配（包括 http/https、端口、路徑）

### 錯誤：沒有檢測到已添加的活動

**問題**: 明明已經添加到 Google Calendar，但檢查後仍顯示「未添加」

**解決方法**:
- 檢查活動標題是否相同（系統會比對標題）
- 檢查時間是否重疊超過 80%
- 確認添加到了「主要日曆」（primary calendar）

## 未來改進

- [ ] 實現 refresh token 自動刷新機制
- [ ] 添加服務器端 token 存儲（更安全）
- [ ] 支持多個日曆（不僅是主要日曆）
- [ ] 批量添加活動到 Google Calendar
- [ ] 雙向同步（從 Google Calendar 導入活動）
- [ ] 更智能的活動匹配算法

## 參考資料

- [Google Calendar API 文檔](https://developers.google.com/calendar/api/guides/overview)
- [Google OAuth 2.0 文檔](https://developers.google.com/identity/protocols/oauth2)
- [googleapis npm 套件](https://www.npmjs.com/package/googleapis)

