# 🔧 修復 OAuth 錯誤：已封鎖存取權

## 問題原因
Google OAuth 客戶端沒有授權 `localhost:3008`

## 🚀 快速修復步驟

### **步驟 1：前往 Google Cloud Console**
```
https://console.cloud.google.com/apis/credentials?project=hackathon-rwa-nexus
```

### **步驟 2：找到並編輯 OAuth 2.0 客戶端**
客戶端 ID：`321605417911-n7irojuojeukee9c9bksrecgmrjv8m8l`

點擊編輯（鉛筆圖示）

### **步驟 3：添加授權的 JavaScript 來源**
在 **"Authorized JavaScript origins"** 區塊中，確認包含：

```
http://localhost:3008
http://localhost:3009
https://hackathon.com.tw
```

**重要：** 每個 URI 要單獨添加（點擊 "ADD URI" 按鈕）

### **步驟 4：添加授權的重新導向 URI**
在 **"Authorized redirect URIs"** 區塊中，確認包含：

```
http://localhost:3008/api/calendar/callback
http://localhost:3009/api/calendar/callback
https://hackathon.com.tw/api/calendar/callback
https://hackathon-rwa-nexus.firebaseapp.com/__/auth/handler
```

**重要：** 每個 URI 要單獨添加（點擊 "ADD URI" 按鈕）

### **步驟 5：儲存變更**
點擊底部的 **"SAVE"** 按鈕

### **步驟 6：等待生效**
⏱️ 更改可能需要 **1-5 分鐘**才會生效

### **步驟 7：測試**
1. 清除瀏覽器快取（或使用無痕模式）
2. 訪問 http://localhost:3008
3. 前往時程表頁面
4. 點擊「連接 Google Calendar」

---

## 📸 視覺指南

### OAuth 客戶端設定應該看起來像這樣：

**Authorized JavaScript origins:**
```
✅ http://localhost:3008
✅ http://localhost:3009
✅ https://hackathon.com.tw
```

**Authorized redirect URIs:**
```
✅ http://localhost:3008/api/calendar/callback
✅ http://localhost:3009/api/calendar/callback
✅ https://hackathon.com.tw/api/calendar/callback
✅ https://hackathon-rwa-nexus.firebaseapp.com/__/auth/handler
```

---

## 🔍 當前配置檢查

### 環境變數（已設定）：
```
GOOGLE_CLIENT_ID=321605417911-n7irojuojeukee9c9bksrecgmrjv8m8l.apps.googleusercontent.com
GOOGLE_REDIRECT_URI=http://localhost:3008/api/calendar/callback
NEXT_PUBLIC_SITE_URL=http://localhost:3008
```

✅ 本地配置正確
❌ Google Cloud Console 需要更新

---

## ⚠️ 常見錯誤

### 錯誤 1：「已封鎖存取權：「hackathon-com-tw」的要求無效」
**原因：** Redirect URI 不在授權列表中
**解決：** 按照上述步驟添加 URI

### 錯誤 2：「redirect_uri_mismatch」
**原因：** Redirect URI 不完全匹配
**解決：** 確保 URI 完全一致（包括 `http://` 而非 `https://`）

---

## 📞 需要幫助？

如果完成以上步驟後仍有問題，請提供：
1. Google Cloud Console 中的錯誤訊息截圖
2. 瀏覽器控制台的錯誤訊息
3. `/tmp/hackathon-3008.log` 的最後 50 行

