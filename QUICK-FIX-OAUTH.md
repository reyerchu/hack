# Google OAuth 快速修復指南

## 當前狀態
✅ 用戶類型：**外部 (External)**  
❌ 問題：只有 defintek.io 用戶可以使用

---

## 🎯 解決方案（二選一）

### 方案 A：添加測試用戶（≤ 100 人）⭐ 推薦

**適合：黑客松活動、小型活動**

```bash
# 1. 從註冊資料導出 email
cd scripts
node export-emails-for-oauth.js

# 2. 查看導出的 email 清單
cat ../oauth-test-users.txt

# 3. 複製所有內容
```

然後：
1. 前往：https://console.cloud.google.com/apis/credentials/consent
2. 向下滾動到「**測試使用者**」
3. 點擊「**+ ADD USERS**」
4. **貼上所有 email**（每行一個）
5. 點擊「**儲存**」
6. ✅ **完成！立即生效**

---

### 方案 B：發布應用程式（無限用戶）

**適合：超過 100 人、公開活動**

1. 前往：https://console.cloud.google.com/apis/credentials/consent
2. 點擊「**PUBLISH APP**」
3. 確認發布
4. ✅ **完成！所有人都可以使用**

---

## 📧 通知已經嘗試過的用戶

如果有用戶之前嘗試過但失敗，請他們：

1. 前往：https://myaccount.google.com/permissions
2. 找到並移除「hackathon-com-tw」或您的應用名稱
3. 重新訪問：https://hackathon.com.tw/schedule
4. 點擊「連接 Google Calendar」

---

## ✅ 驗證

設置完成後，請測試用戶：
- 訪問 https://hackathon.com.tw/schedule
- 點擊「連接 Google Calendar」
- 應該可以順利授權（會有「未經驗證」警告，這是正常的）
- 點擊「進階」→「前往 hackathon.com.tw」→「允許」

---

## 🆘 還有問題？

查看詳細文檔：
- `fix-oauth-test-users.md` - 完整步驟說明
- `GOOGLE-OAUTH-PUBLIC-ACCESS.md` - 深入指南

或運行檢查腳本：
```bash
./check-oauth-config.sh
```

