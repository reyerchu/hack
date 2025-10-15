# 開放 Google OAuth 給所有 Gmail 用戶使用

## 問題描述
目前 Google Calendar OAuth 只有 `defintek.io` 域名的帳號可以使用，其他 Gmail 帳號無法通過授權。

## 原因
Google OAuth 應用程式被設置為「**內部**」用戶類型，只允許特定組織的用戶訪問。

---

## 解決方案：修改為「外部」用戶類型

### 步驟 1：進入 Google Cloud Console

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的專案（hackathon-rwa-nexus 或相關專案）

---

### 步驟 2：進入 OAuth 同意畫面設置

1. 在左側選單中，點擊 **「API 和服務」** > **「OAuth 同意畫面」**
2. 或直接訪問：https://console.cloud.google.com/apis/credentials/consent

---

### 步驟 3：修改用戶類型

#### 當前狀態（內部）：
```
用戶類型: 內部 (Internal)
- 只有 defintek.io 組織內的用戶可以訪問
```

#### 修改為外部：

1. **點擊「編輯應用程式」或「Edit App」**

2. **在「OAuth 同意畫面」頁面，找到「用戶類型」選項**
   - 選擇 **「外部 (External)」**
   
3. **填寫必要資訊：**
   - **應用程式名稱：** `RWA Hackathon Calendar Integration`
   - **用戶支援電郵：** 您的電子郵件
   - **應用程式標誌：** （可選）
   - **應用程式首頁：** `https://hackathon.com.tw`
   - **應用程式隱私權政策：** `https://hackathon.com.tw/privacy`（如果有）
   - **應用程式服務條款：** `https://hackathon.com.tw/terms`（如果有）
   - **已授權網域：** 
     - `hackathon.com.tw`
   - **開發人員聯絡資訊：** 您的電子郵件

4. **範圍 (Scopes)：**
   確保已添加以下範圍：
   ```
   .../auth/calendar.readonly
   .../auth/calendar.events
   ```

5. **測試使用者：**（可選，在「發布」前使用）
   - 如果應用程式處於「測試」狀態，可以添加測試用戶的 Gmail 地址
   - 點擊「ADD USERS」
   - 輸入允許測試的 Gmail 地址

6. **儲存並繼續**

---

### 步驟 4：發布應用程式（選項 A - 推薦用於測試）

#### 選項 A：保持「測試」狀態 + 添加測試用戶

**適用於：**
- 黑客松活動期間
- 不需要 Google 審核
- 最多 100 個測試用戶

**步驟：**
1. 在「OAuth 同意畫面」頁面
2. 保持「發布狀態：測試中 (Testing)」
3. 點擊「測試使用者」
4. 點擊「+ ADD USERS」
5. 輸入所有參與者的 Gmail 地址（每行一個）
6. 點擊「儲存」

**優點：**
- ✅ 不需要 Google 審核
- ✅ 立即生效
- ✅ 最多可添加 100 個測試用戶
- ✅ 適合黑客松短期活動

**缺點：**
- ⚠️ 需要手動添加每個用戶的 Gmail
- ⚠️ 用戶會看到「此應用程式尚未經過 Google 驗證」警告

---

#### 選項 B：發布為「正式版」（需要審核）

**適用於：**
- 長期公開使用
- 任何 Gmail 用戶都可以使用

**步驟：**
1. 在「OAuth 同意畫面」頁面
2. 點擊「發布應用程式 (PUBLISH APP)」
3. 確認發布

**注意：**
- ⚠️ 可能需要 Google 審核（1-2 週）
- ⚠️ 需要提供隱私權政策和服務條款連結
- ⚠️ 如果使用敏感或受限範圍，需要通過安全性評估

**暫時解決方案（在審核期間）：**
即使提交審核，您仍可以：
1. 點擊「返回測試模式 (BACK TO TESTING)」
2. 添加測試用戶
3. 讓測試用戶使用（繞過審核等待）

---

### 步驟 5：處理「未經驗證」警告

當用戶首次授權時，會看到此警告：
```
此應用程式尚未經過 Google 驗證
此應用程式未經 Google 驗證，請謹慎使用
```

**如何繼續授權：**
1. 點擊「進階 (Advanced)」
2. 點擊「前往 hackathon.com.tw (不安全) (Go to hackathon.com.tw (unsafe))」
3. 點擊「允許 (Allow)」

**告知用戶：**
- 這是正常的，因為應用程式處於測試階段
- 對於黑客松活動來說是安全的
- 我們只會讀取和添加日曆事件

---

## 推薦方案（黑客松活動）

### 🎯 最佳方案：測試模式 + 批量添加測試用戶

```
1. 用戶類型：外部 (External)
2. 發布狀態：測試中 (Testing)
3. 測試使用者：添加所有參與者的 Gmail
```

### 📝 獲取參與者 Gmail 清單的方法：

#### 方法 1：從註冊資料庫導出
如果您的 Firestore 中有註冊者資料：

```javascript
// 使用 Firebase Console 或腳本導出
// 導出所有註冊者的 email
```

#### 方法 2：建立 Gmail 收集表單
1. 建立 Google Form
2. 請參與者填寫 Gmail 地址
3. 導出為 CSV
4. 批量添加到測試用戶清單

#### 方法 3：設置自助添加頁面
在黑客松網站上：
```
「需要使用 Google Calendar 功能嗎？」
請提供您的 Gmail 地址，我們會添加您為測試用戶。
[Gmail 地址輸入框]
[提交]
```

---

## 立即測試步驟

### 測試不同帳號：

1. **清除目前的授權：**
   - 前往：https://myaccount.google.com/permissions
   - 找到「RWA Hackathon Calendar Integration」
   - 點擊「移除存取權」

2. **使用不同 Gmail 帳號測試：**
   - 確保已添加為測試用戶
   - 訪問 https://hackathon.com.tw/schedule
   - 點擊「連接 Google Calendar」
   - 應該可以順利授權

---

## 驗證設置

### 確認清單：

- [ ] OAuth 同意畫面：用戶類型 = **外部**
- [ ] 發布狀態：**測試中** 或 **已發布**
- [ ] 已添加測試用戶（測試模式）
- [ ] 範圍包含：`calendar.readonly` 和 `calendar.events`
- [ ] 已授權網域：`hackathon.com.tw`
- [ ] OAuth 2.0 客戶端 ID：已建立並配置

---

## 常見問題

### Q1: 如果改為「外部」會影響現有用戶嗎？
**A:** 不會，現有的 defintek.io 用戶仍然可以正常使用。

### Q2: 測試用戶有數量限制嗎？
**A:** 是的，最多 100 個測試用戶。

### Q3: 可以在活動期間動態添加測試用戶嗎？
**A:** 可以！隨時可以在 Google Cloud Console 中添加新的測試用戶，立即生效。

### Q4: 如果超過 100 個參與者怎麼辦？
**A:** 需要提交應用程式審核並發布為正式版，或考慮其他日曆整合方案。

### Q5: 審核需要多久？
**A:** 通常 1-2 週，但對於基本的日曆範圍，可能更快。

---

## 緊急備案

如果來不及修改或遇到問題，可以考慮：

### 選項 1：使用傳統 Google Calendar 連結
不需要 OAuth，直接產生 Google Calendar 新增事件的連結：
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=...
```
（目前程式碼已有此 fallback 功能）

### 選項 2：提供 ICS 檔案下載
讓用戶下載 `.ics` 檔案並手動匯入日曆。

---

## 需要協助？

如果在設置過程中遇到問題：

1. 檢查 Google Cloud Console 的錯誤訊息
2. 確認專案已啟用 Google Calendar API
3. 確認 OAuth 客戶端 ID 和密鑰正確設置在 `.env.local`

---

**建議：**
對於黑客松活動，**推薦使用「測試模式 + 添加測試用戶」方案**，這樣可以立即生效，無需等待審核。

