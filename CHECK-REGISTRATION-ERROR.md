# 檢查註冊錯誤指南

## 📋 可能的錯誤原因

### 1. **Firebase Admin SDK 未初始化**

檢查環境變數是否正確設定：
```bash
# 檢查 .env.local 文件
cat .env.local | grep SERVICE_ACCOUNT
```

應該包含：
- `SERVICE_ACCOUNT_PROJECT_ID`
- `SERVICE_ACCOUNT_CLIENT_EMAIL`
- `SERVICE_ACCOUNT_PRIVATE_KEY`

### 2. **該帳號已經註冊過**

錯誤訊息：「Profile already exists」

解決方案：
- 使用不同的 email
- 或在 Firebase Console 中刪除舊的註冊記錄

### 3. **Firebase Firestore 權限問題**

確保 Firestore 規則允許寫入：
- 訪問 Firebase Console → Firestore Database → Rules
- 檢查是否允許寫入 `registrations` collection

### 4. **網路或 Firebase 連線問題**

檢查：
- Firebase 專案狀態
- 網路連線
- Firebase quota 是否用完

## 🔧 檢查日誌

### 查看服務器日誌

```bash
# 查看最近的日誌
pm2 logs --lines 50
```

或如果使用 npm start：
```bash
# 日誌會在啟動服務的終端顯示
```

尋找以下訊息：
- ✅ `Successfully created profile for user: [user-id]`
- ❌ `Profile already exists for user: [user-id]`
- ❌ `Error creating application: [error details]`
- ❌ `Could not parse request JSON body`

## 📊 在 Firebase Console 檢查

### 檢查用戶是否成功註冊

1. 訪問 Firebase Console
2. 進入 Firestore Database
3. 查看 `registrations` collection
4. 搜尋對應的 user ID 或 email

### 檢查 Authentication

1. Firebase Console → Authentication
2. 查看 Users 列表
3. 確認 `reyerchu@gmail.com` 是否存在
4. 檢查 email 是否已驗證

## 🧪 測試步驟

1. **清除舊資料（如果需要）**
   - 從 Firestore 的 `registrations` collection 刪除舊記錄
   - 從 `miscellaneous/allusers` 中移除用戶

2. **確保用戶已登入**
   - 訪問 `/auth` 頁面
   - 使用 Google 或 Email/Password 登入
   - 確認 email 已驗證

3. **填寫註冊表單**
   - 訪問 `/register`
   - 填寫所有必填欄位（標記 * 的）
   - 特別注意：性別（Gender）是必填的

4. **提交並檢查**
   - 點擊「提交」
   - 如果成功：會看到「註冊成功！」並跳轉到 profile 頁面
   - 如果失敗：會顯示錯誤訊息

## 🐛 常見錯誤及解決方案

### 錯誤：「註冊失敗，請稍後再試」

**可能原因**：
1. Firebase Admin SDK 未初始化
2. Firestore 寫入失敗
3. 網路問題

**解決方案**：
1. 檢查環境變數
2. 查看服務器日誌獲取詳細錯誤
3. 確認 Firebase 專案狀態

### 錯誤：「表單中有無效的欄位」

**原因**：表單驗證失敗

**解決方案**：
- 確保所有必填欄位都已填寫
- 檢查 email 格式是否正確
- 確認所有下拉選單都已選擇

### 錯誤：「Profile already exists」

**原因**：該用戶已經註冊過

**解決方案**：
1. 直接訪問 `/profile` 查看現有資料
2. 或在 Firebase Console 中刪除舊記錄後重新註冊

## 📞 獲取幫助

如果問題持續，請提供：
1. 使用的 email
2. 看到的具體錯誤訊息
3. 瀏覽器 Console 的錯誤（按 F12 查看）
4. 服務器日誌的相關內容

