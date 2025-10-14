# Google OAuth 設置檢查清單

## 🎯 問題症狀
- ❌ 錯誤訊息：「連接 Google Calendar 已封鎖存取權：『hackathon-com-tw』的要求無效」
- ❌ Error 400: redirect_uri_mismatch
- ❌ 無法從 hackathon.com.tw 登入

## ✅ 解決方案檢查清單

### 📋 第一部分：Firebase Authentication 設定

#### 1. Firebase Console - 授權域名設置
前往：https://console.firebase.google.com/project/hackathon-rwa-nexus/authentication/settings

**需要添加的授權域名：**
- [ ] `localhost`
- [ ] `hackathon-rwa-nexus.firebaseapp.com`
- [ ] `hackathon.com.tw`

**操作步驟：**
1. 點擊 **Authentication（驗證）**
2. 選擇 **Settings（設定）** 標籤
3. 找到 **Authorized domains（授權網域）**
4. 點擊 **Add domain（新增網域）**
5. 輸入 `hackathon.com.tw`
6. 點擊 **Add（新增）**

---

### 📋 第二部分：Google Cloud Console - OAuth 2.0 設定

#### 2. Google Cloud Console - 憑證設置
前往：https://console.cloud.google.com/apis/credentials?project=hackathon-rwa-nexus

**找到您的 OAuth 2.0 客戶端 ID：**
- Client ID: `YOUR_CLIENT_ID.apps.googleusercontent.com`

#### 3. 編輯 OAuth 2.0 客戶端

**Authorized JavaScript origins（已授權的 JavaScript 來源）：**
- [ ] `https://hackathon.com.tw`
- [ ] `http://localhost:3008`
- [ ] `http://localhost:3009`

**Authorized redirect URIs（已授權的重新導向 URI）：**

**Firebase Authentication 重定向：**
- [ ] `https://hackathon.com.tw/__/auth/handler`
- [ ] `https://hackathon-rwa-nexus.firebaseapp.com/__/auth/handler`
- [ ] `http://localhost:3008/__/auth/handler`
- [ ] `http://localhost:3009/__/auth/handler`

**Google Calendar API 重定向：**
- [ ] `https://hackathon.com.tw/api/calendar/callback`
- [ ] `http://localhost:3008/api/calendar/callback`
- [ ] `http://localhost:3009/api/calendar/callback`

**操作步驟：**
1. 點擊 OAuth 2.0 客戶端 ID 旁邊的 ✏️ 編輯圖示
2. 在 **Authorized JavaScript origins** 區域點擊 **+ ADD URI（新增 URI）**
3. 逐一添加上述所有 JavaScript origins
4. 在 **Authorized redirect URIs** 區域點擊 **+ ADD URI（新增 URI）**
5. 逐一添加上述所有 redirect URIs
6. 點擊 **SAVE（儲存）**

---

### 📋 第三部分：環境變數檢查

#### 4. 檢查 .env.local 配置

**當前配置：**
```bash
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:3008/api/calendar/callback
NEXT_PUBLIC_SITE_URL=http://localhost:3008
```

**生產環境配置（如果需要）：**
```bash
# 如果在生產環境 (hackathon.com.tw) 使用，需要設置：
NEXT_PUBLIC_SITE_URL=https://hackathon.com.tw
GOOGLE_REDIRECT_URI=https://hackathon.com.tw/api/calendar/callback
```

**檢查項目：**
- [ ] GOOGLE_CLIENT_ID 正確
- [ ] GOOGLE_CLIENT_SECRET 正確
- [ ] GOOGLE_REDIRECT_URI 與當前環境匹配
- [ ] NEXT_PUBLIC_SITE_URL 正確

---

### 📋 第四部分：完成後測試步驟

#### 5. 測試流程

**準備工作：**
- [ ] 等待 1-2 分鐘讓 Google 同步設置
- [ ] 清除瀏覽器快取和 Cookies
- [ ] 關閉所有相關分頁

**測試登入：**
1. [ ] 訪問 `https://hackathon.com.tw`
2. [ ] 點擊「登入」或「Sign In」
3. [ ] 選擇 Google 登入
4. [ ] 確認能成功完成授權流程

**測試 Google Calendar 連接：**
1. [ ] 登入後進入個人資料或設定頁面
2. [ ] 找到「連接 Google Calendar」選項
3. [ ] 點擊連接
4. [ ] 確認能成功授權並返回

---

## 🔍 常見問題排查

### 問題 1：仍然顯示 redirect_uri_mismatch
**解決方法：**
- 檢查 Google Cloud Console 中的 redirect URI 是否完全匹配（包含 https/http）
- 確認沒有多餘的空格或特殊字符
- 等待 5-10 分鐘讓設置生效

### 問題 2：localhost 可以但 hackathon.com.tw 不行
**解決方法：**
- 確認 Firebase 授權域名中有 `hackathon.com.tw`
- 確認使用 HTTPS（不是 HTTP）
- 檢查瀏覽器控制台的錯誤訊息

### 問題 3：授權後返回錯誤
**解決方法：**
- 檢查 `/api/calendar/callback` 端點是否正常運作
- 查看服務器日誌：`sudo journalctl -u hackathon-main.service -f`
- 確認環境變數已正確加載

---

## 📝 快速命令參考

### 檢查服務狀態
```bash
sudo systemctl status hackathon-main.service
```

### 查看服務日誌
```bash
sudo journalctl -u hackathon-main.service -f
```

### 重啟服務（如果修改了 .env.local）
```bash
sudo systemctl restart hackathon-main.service
```

### 檢查環境變數
```bash
cd /home/reyerchu/hack/hack
grep -E "GOOGLE_CLIENT|GOOGLE_REDIRECT|SITE_URL" .env.local
```

---

## ✅ 完成確認

當您完成所有步驟後，請確認：
- [ ] 可以從 `https://hackathon.com.tw` 登入
- [ ] 可以從 `http://localhost:3008` 登入
- [ ] 可以連接 Google Calendar
- [ ] 沒有 redirect_uri_mismatch 錯誤

---

## 📞 需要幫助？

如果仍有問題：
1. 檢查 Firebase Console 的驗證日誌
2. 檢查 Google Cloud Console 的配額和使用情況
3. 確認 OAuth 同意畫面配置正確

**建議截圖保存：**
- Firebase 授權域名設置
- Google Cloud OAuth 2.0 設定
- 錯誤訊息的完整內容

---

*最後更新：2025-10-14*
*項目：RWA Hackathon Taiwan*

