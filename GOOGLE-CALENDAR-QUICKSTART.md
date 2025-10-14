# Google Calendar 整合 - 快速開始

## 🎯 功能說明

「檢查日曆」功能可以自動檢查您的 Google Calendar，顯示：
- ✅ **已添加** - 活動已在您的日曆中
- ⚠️ **有衝突** - 活動時間與其他事件衝突
- ➕ **可添加** - 活動尚未添加

---

## 🚀 快速設置（5 分鐘）

### 步驟 1: 獲取 Google API 憑證

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案（或選擇現有專案）
3. 啟用 **Google Calendar API**
4. 創建 **OAuth 2.0 憑證**：
   - 類型：「網頁應用程式」
   - 授權 JavaScript 來源：`http://localhost:3009`
   - 授權重新導向 URI：`http://localhost:3009/api/calendar/callback`
5. 記下 **Client ID** 和 **Client Secret**

**詳細步驟**: 請參考 [`docs/google-calendar-setup.md`](./docs/google-calendar-setup.md)

### 步驟 2: 設置環境變數

在專案根目錄創建 `.env.local` 文件（如果沒有的話）：

```bash
# Google Calendar API (Dev Branch - Port 3009)
GOOGLE_CLIENT_ID=你的_client_id_這裡.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=你的_client_secret_這裡
GOOGLE_REDIRECT_URI=http://localhost:3009/api/calendar/callback
NEXT_PUBLIC_SITE_URL=http://localhost:3009
```

### 步驟 3: 重啟開發伺服器

```bash
npm run dev
```

或

```bash
./start-dev.sh
```

---

## 💻 使用方式

### 1️⃣ 連接 Google Calendar

1. 訪問時程表頁面：`http://localhost:3009/schedule` (Dev Branch)
2. 點擊頁面頂部的 **「連接 Google Calendar」** 按鈕（藍色）
3. 在 Google 授權頁面點擊「允許」
4. 自動返回時程表頁面，連接完成！

### 2️⃣ 檢查日曆

1. 點擊 **「檢查日曆」** 按鈕（綠色）
2. 等待幾秒鐘（系統會自動比對活動）
3. 查看檢查結果：
   ```
   檢查完成！
   
   已添加：3 個活動
   時間衝突：1 個活動
   未添加：10 個活動
   
   按鈕顏色說明：
   🟢 綠色 = 已添加
   🔴 紅色 = 有衝突
   🔵 藍色 = 可添加
   ```

### 3️⃣ 查看活動狀態

每個活動右側會顯示對應的按鈕：

| 按鈕 | 顏色 | 說明 |
|------|------|------|
| **✓ 已添加** | 🟢 綠色 | 活動已在您的 Google Calendar 中 |
| **+ 加入日曆（有衝突）** | 🔴 紅色 | 時間與其他事件衝突，仍可添加 |
| **+ 加入日曆** | 🔵 藍色 | 活動尚未添加，可正常添加 |

### 4️⃣ 斷開連接（可選）

- 點擊 **「斷開連接」** 按鈕（紅色小按鈕）可清除授權
- 下次需要重新授權才能使用檢查功能

---

## 🔧 故障排除

### ❌ 問題：找不到「連接 Google Calendar」按鈕

**原因**: 環境變數未設置或設置錯誤

**解決方法**:
1. 確認 `.env.local` 文件中已設置所有必需的環境變數
2. 確認沒有拼寫錯誤
3. 重啟開發伺服器

---

### ❌ 問題：點擊「連接」後顯示錯誤

**可能的錯誤訊息**:
- `redirect_uri_mismatch`
- `invalid_client`
- `access_denied`

**解決方法**:
1. **redirect_uri_mismatch**: 
   - 檢查 Google Cloud Console 中的「授權的重新導向 URI」
   - 確保與 `GOOGLE_REDIRECT_URI` 環境變數完全一致
   - 包括 `http://` 和端口號 `:3009`

2. **invalid_client**:
   - 檢查 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 是否正確
   - 確認沒有多餘的空格或換行

3. **access_denied**:
   - 用戶拒絕了授權
   - 重新點擊「連接」按鈕並授予權限

---

### ❌ 問題：檢查後顯示「授權已失效」

**原因**: Access token 通常在 1 小時後過期

**解決方法**:
1. 點擊「斷開連接」
2. 重新點擊「連接 Google Calendar」
3. 重新授權

---

### ❌ 問題：明明已添加但仍顯示「未添加」

**可能原因**:
- 活動標題不同
- 時間不匹配
- 添加到了其他日曆（非主要日曆）

**解決方法**:
1. 確認活動標題是否完全相同
2. 確認添加到了「主要日曆」（不是其他日曆）
3. 確認時間是否正確

---

## 📖 完整文檔

- **詳細設置指南**: [`docs/google-calendar-setup.md`](./docs/google-calendar-setup.md)
- **API 文檔**: 見上述文件中的「API 端點」章節
- **技術細節**: 見上述文件中的「技術細節」章節

---

## 🎨 UI 截圖說明

### 連接前（未連接狀態）
```
┌────────────────────────────────────────┐
│ [+ 新增活動] [連接 Google Calendar]    │ ← 藍色按鈕
└────────────────────────────────────────┘
```

### 連接後（已連接狀態）
```
┌────────────────────────────────────────────────────┐
│ [+ 新增活動] [檢查日曆] [斷開連接]                 │
│                     ↑ 綠色      ↑ 紅色（小）       │
└────────────────────────────────────────────────────┘
```

### 檢查中（檢查狀態）
```
┌────────────────────────────────────────┐
│ [+ 新增活動] [檢查中...]               │ ← 半透明，禁用
└────────────────────────────────────────┘
```

### 活動按鈕狀態
```
活動 1: RWA 代幣化論壇
[✓ 已添加] ← 綠色邊框

活動 2: imToken
[+ 加入日曆（有衝突）] ← 紅色邊框

活動 3: 流動性質押
[+ 加入日曆] ← 藍色邊框
```

---

## ⚠️ 注意事項

1. **首次設置需要 5-10 分鐘**
   - Google API 配置
   - 環境變數設置
   - 重啟伺服器

2. **Token 有效期**
   - Access token 通常在 1 小時後過期
   - 需要重新連接（未來會實現自動刷新）

3. **僅檢查主要日曆**
   - 目前只檢查用戶的主要日曆
   - 其他日曆中的事件不會被檢測到

4. **時間匹配邏輯**
   - 標題需要相同或包含
   - 時間重疊需超過 80%
   - 才會被標記為「已添加」

---

## 🎉 開始使用！

1. ✅ 設置 Google API 憑證
2. ✅ 配置環境變數
3. ✅ 重啟開發伺服器
4. ✅ 訪問 `/schedule` 頁面
5. ✅ 點擊「連接 Google Calendar」
6. ✅ 點擊「檢查日曆」
7. ✅ 查看活動狀態

**祝您使用愉快！** 🚀

如有問題，請參考完整文檔：[`docs/google-calendar-setup.md`](./docs/google-calendar-setup.md)

