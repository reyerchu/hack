# 設定 Super Admin 指南

## 方法 1：使用 Firebase Console（推薦，最簡單）

1. 訪問 Firebase Console: https://console.firebase.google.com/
2. 選擇您的專案
3. 左側選單點擊「Firestore Database」
4. 找到 `users` collection
5. 搜尋 email 為 `reyerchu@defintek.io` 的文檔
6. 點擊該文檔，找到 `permissions` 欄位
7. 將 `permissions` 改為：`["super_admin"]`
8. 點擊「Update」儲存

## 方法 2：使用腳本（需要 Firebase Admin SDK 憑證）

### 前提條件
確保您的 `.env.local` 文件包含以下環境變數：
```
SERVICE_ACCOUNT_PROJECT_ID=your-project-id
SERVICE_ACCOUNT_CLIENT_EMAIL=your-service-account@...
SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 執行腳本
```bash
node scripts/set-super-admin.js reyerchu@defintek.io
```

## 方法 3：手動 API 請求（需要現有 admin 帳號）

如果您已經有一個 admin 或 super_admin 帳號，可以使用 `/api/users/roles` API：

```bash
curl -X PUT http://localhost:3000/api/users/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "permissions": ["super_admin"]
  }'
```

## Super Admin 權限

設定為 `super_admin` 後，該用戶將擁有：
- ✅ 完整的管理員權限
- ✅ 訪問 `/admin` 頁面
- ✅ 訪問 `/admin/stats` 頁面（僅 super_admin）
- ✅ 管理用戶、活動、挑戰等
- ✅ 掃描 QR code
- ✅ 查看統計數據

## 驗證設定

設定完成後，請：
1. 登出並重新登入
2. 訪問 https://hackathon.com.tw/admin
3. 應該能看到完整的管理員介面
4. 訪問 https://hackathon.com.tw/admin/stats 驗證 super_admin 權限

## 疑難排解

如果設定後仍無法訪問：
1. 清除瀏覽器快取
2. 完全登出並重新登入
3. 檢查瀏覽器 Console 是否有錯誤
4. 確認 Firestore 中 permissions 欄位確實是 `["super_admin"]`
