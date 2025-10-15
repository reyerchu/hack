# Google OAuth 資料存取權（Scopes）設定指南

## 📋 目的

為 Google Calendar 整合功能設定正確的 OAuth 2.0 Scopes（資料存取權），確保應用程式可以讀取和寫入使用者的 Google Calendar。

---

## 🔐 需要的 Scopes

對於我們的 Google Calendar 整合功能，需要以下兩個 scopes：

### 1. **讀取日曆事件**
```
https://www.googleapis.com/auth/calendar.readonly
```
- **用途：** 讀取使用者的日曆事件
- **權限等級：** 敏感範圍
- **是否必需：** 是

### 2. **管理日曆事件**
```
https://www.googleapis.com/auth/calendar.events
```
- **用途：** 建立、編輯、刪除日曆事件
- **權限等級：** 敏感範圍
- **是否必需：** 是

---

## 📝 設定步驟

### Step 1: 進入 Google Cloud Console

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的專案（例如：`hackathon-rwa-nexus`）

### Step 2: 進入 OAuth 同意畫面

1. 在左側選單找到 **APIs & Services** > **OAuth consent screen**
2. 或直接訪問：https://console.cloud.google.com/apis/credentials/consent

### Step 3: 編輯應用程式資訊

點擊 **EDIT APP** 按鈕

### Step 4: 填寫基本資訊（如果還沒填）

#### **應用程式資訊**
- **App name:** `RWA Hackathon 2025`
- **User support email:** `reyerchu@defintek.io`
- **App logo:** （選填，可上傳 logo 圖片）

#### **應用程式首頁**
- **Application home page:** `https://hackathon.com.tw`

#### **應用程式隱私權政策**
- **Application privacy policy link:** `https://hackathon.com.tw/privacy`

#### **應用程式服務條款**
- **Application terms of service link:** `https://hackathon.com.tw/terms`

#### **已授權網域**
- 點擊 **ADD DOMAIN**
- 輸入：`hackathon.com.tw`
- 點擊 **ADD DOMAIN**
- 輸入：`defintek.io`

#### **開發人員聯絡資訊**
- **Developer contact information:** `reyerchu@defintek.io`

點擊 **SAVE AND CONTINUE**

### Step 5: 設定 Scopes（資料存取權）⭐ 重點

1. 在 **Scopes** 頁面，點擊 **ADD OR REMOVE SCOPES**

2. 在彈出的視窗中，可以：
   - **方法 A - 手動輸入（推薦）：**
     - 找到 **Manually add scopes** 區塊
     - 在文字框中輸入：
       ```
       https://www.googleapis.com/auth/calendar.readonly, https://www.googleapis.com/auth/calendar.events
       ```
     - 點擊 **ADD TO TABLE**

   - **方法 B - 從列表選擇：**
     - 在搜尋框輸入 `calendar`
     - 勾選以下兩個 scopes：
       - ✅ `../auth/calendar.readonly` - See all your calendars
       - ✅ `../auth/calendar.events` - View and edit events on all your calendars

3. 確認已選擇的 Scopes 列表中顯示：

   | API | Scope | User-facing description |
   |-----|-------|------------------------|
   | Google Calendar API | ../auth/calendar.readonly | See all your calendars |
   | Google Calendar API | ../auth/calendar.events | View and edit events on all your calendars |

4. 點擊 **UPDATE** 按鈕

5. 確認 Scopes 頁面顯示：
   - **Your sensitive scopes:** 2 scopes
   - 顯示兩個 calendar scopes

6. 點擊 **SAVE AND CONTINUE**

### Step 6: 測試使用者（如果 User Type 是 Testing）

如果您的應用程式處於 **Testing** 狀態：

1. 點擊 **ADD USERS**
2. 輸入測試使用者的電子郵件地址，例如：
   ```
   reyerchu@defintek.io
   your-email@gmail.com
   participant1@example.com
   ```
3. 點擊 **ADD**
4. 點擊 **SAVE AND CONTINUE**

**注意：** 如果要讓所有人都能使用（不限測試使用者），需要發布應用程式（見 Step 7）

### Step 7: 發布應用程式（Production）

如果希望所有 Google 使用者都能使用（不僅限測試使用者）：

1. 回到 **OAuth consent screen** 主頁
2. 在 **Publishing status** 區塊，點擊 **PUBLISH APP**
3. 在確認對話框中，點擊 **CONFIRM**

**狀態變更：**
- **Before:** Testing（僅測試使用者可用）
- **After:** In production（所有 Google 使用者可用）

**注意：** 
- 對於我們使用的 Calendar scopes，通常不需要 Google 驗證審查
- 但如果使用更敏感的 scopes，可能需要提交驗證

---

## ✅ 驗證設定

### 檢查 Scopes 是否正確

1. 前往 **OAuth consent screen**
2. 確認顯示：
   - **Scopes for Google APIs:** 2 scopes
   - 點擊查看詳情，應該看到兩個 calendar scopes

### 測試 OAuth 流程

1. 訪問：https://hackathon.com.tw/schedule
2. 點擊「連接 Google Calendar」
3. 應該看到 Google 授權頁面，要求：
   - ✅ **See all your calendars**
   - ✅ **View and edit events on all your calendars**
4. 授權後應該可以成功連接

---

## 🔍 常見問題

### Q1: 找不到 "Manually add scopes" 選項？

**A:** 確保您在 **ADD OR REMOVE SCOPES** 彈出視窗中，滾動到最下方，會看到 **Manually add scopes** 區塊。

### Q2: Scope 輸入後顯示錯誤？

**A:** 確保複製完整的 scope URL，包括 `https://www.googleapis.com/auth/`

### Q3: 使用者看到「存取權已封鎖」訊息？

**A:** 可能原因：
1. 應用程式處於 Testing 狀態，但使用者不在測試使用者列表中
   - **解決方案：** 發布應用程式或將使用者加入測試列表
2. 授權網域設定不正確
   - **解決方案：** 確認 `hackathon.com.tw` 已加入授權網域

### Q4: 需要通過 Google 驗證嗎？

**A:** 對於我們使用的 Calendar scopes（readonly 和 events），通常不需要驗證。但如果：
- 應用程式處於 Production 狀態
- 使用更敏感的 scopes
- Google 認為需要審查

可能會收到驗證要求。大多數情況下，Calendar API 的基本 scopes 不需要驗證。

---

## 📊 Scopes 詳細說明

### calendar.readonly

```
https://www.googleapis.com/auth/calendar.readonly
```

**允許的操作：**
- ✅ 讀取日曆列表
- ✅ 讀取日曆事件
- ✅ 查看事件詳情
- ❌ 建立事件
- ❌ 編輯事件
- ❌ 刪除事件

### calendar.events

```
https://www.googleapis.com/auth/calendar.events
```

**允許的操作：**
- ✅ 讀取日曆列表
- ✅ 讀取日曆事件
- ✅ 建立新事件
- ✅ 編輯現有事件
- ✅ 刪除事件
- ❌ 修改日曆設定
- ❌ 刪除整個日曆

**注意：** 我們的應用程式需要兩個 scopes，因為：
- `readonly` - 用於讀取現有事件（檢查衝突）
- `events` - 用於建立和管理事件

---

## 🚀 快速檢查清單

完成以下所有項目：

- [ ] 進入 Google Cloud Console
- [ ] 選擇正確的專案
- [ ] 進入 OAuth consent screen
- [ ] 填寫應用程式基本資訊
- [ ] 設定隱私權政策 URL: `https://hackathon.com.tw/privacy`
- [ ] 設定服務條款 URL: `https://hackathon.com.tw/terms`
- [ ] 加入授權網域: `hackathon.com.tw`, `defintek.io`
- [ ] 加入 Scope: `calendar.readonly`
- [ ] 加入 Scope: `calendar.events`
- [ ] （可選）加入測試使用者
- [ ] （推薦）發布應用程式到 Production
- [ ] 測試 OAuth 流程
- [ ] 確認可以成功連接 Google Calendar

---

## 📞 需要協助？

如果遇到問題，請檢查：
1. 本指南的「常見問題」章節
2. Google Cloud Console 的錯誤訊息
3. 瀏覽器控制台的錯誤日誌

---

**建立日期：** 2025-01-15  
**適用版本：** Google Cloud Console (2025)  
**應用程式：** RWA Hackathon 2025

---

## 📸 參考截圖說明

### Scopes 設定畫面應該顯示：

```
┌─────────────────────────────────────────────────────────────┐
│  Scopes for Google APIs                                      │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  [ADD OR REMOVE SCOPES]                                      │
│                                                               │
│  Your non-sensitive scopes: 0 scopes                         │
│  Your sensitive scopes: 2 scopes                             │
│  Your restricted scopes: 0 scopes                            │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ API: Google Calendar API                              │  │
│  │ Scope: .../auth/calendar.readonly                     │  │
│  │ Description: See all your calendars                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ API: Google Calendar API                              │  │
│  │ Scope: .../auth/calendar.events                       │  │
│  │ Description: View and edit events on all your cals    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

完成設定後，您的 OAuth 應用程式就可以正常請求 Google Calendar 權限了！ 🎉

