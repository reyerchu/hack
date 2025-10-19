# Sponsor User Setup Guide

## 如何為用戶設置 Sponsor 權限

### 方法 1: 使用 Firebase Console（推薦）

1. **登入 Firebase Console**
   - 前往: https://console.firebase.google.com/
   - 選擇您的專案

2. **打開 Firestore Database**
   - 在左側選單選擇 "Firestore Database"
   - 點擊 "users" collection

3. **找到並編輯用戶**
   - 搜尋用戶的 email: `alphareyer@gmail.com`
   - 或根據 UID 找到該用戶的 document
   - 點擊該 document 以編輯

4. **添加 sponsor 權限**
   - 找到 `permissions` 欄位（應該是一個 array）
   - 添加 `"sponsor"` 到 array 中
   
   例如，從：
   ```
   permissions: ["user"]
   ```
   
   改為：
   ```
   permissions: ["user", "sponsor"]
   ```

5. **儲存變更**
   - 點擊 "更新" 或 "儲存"

### 方法 2: 使用 Firebase Admin SDK Script

創建一個臨時腳本來設置權限：

```javascript
// scripts/set-sponsor-permission.js
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
    clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
    privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function setSponsorPermission(email) {
  try {
    // 1. Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`✅ Found user: ${email} (ID: ${userId})`);

    // 2. Update permissions
    const currentPermissions = userData.permissions || ['user'];
    
    if (currentPermissions.includes('sponsor')) {
      console.log(`ℹ️  User already has sponsor permission`);
      return;
    }

    const updatedPermissions = [...currentPermissions, 'sponsor'];

    await db.collection('users').doc(userId).update({
      permissions: updatedPermissions,
    });

    console.log(`✅ Successfully added sponsor permission!`);
    console.log(`   Old permissions: [${currentPermissions.join(', ')}]`);
    console.log(`   New permissions: [${updatedPermissions.join(', ')}]`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
const email = process.argv[2] || 'alphareyer@gmail.com';
setSponsorPermission(email);
```

運行腳本：
```bash
node scripts/set-sponsor-permission.js alphareyer@gmail.com
```

## 如何訪問 Sponsor Dashboard

### 自動導航（推薦）

一旦用戶被設置為 sponsor 角色：

1. **登出並重新登入**
   - 這確保 token 和 permissions 被刷新

2. **查看頂部導航欄**
   - 應該會看到 "賛助商" 鏈接出現在導航欄中
   - 點擊 "賛助商" 即可進入 Sponsor Dashboard

### 直接 URL

也可以直接訪問：
- **開發環境**: http://localhost:3009/sponsor/dashboard
- **生產環境**: https://hackathon.com.tw/sponsor/dashboard

### 權限驗證

訪問 Sponsor Dashboard 時，系統會自動檢查：
- ✅ 用戶是否已登入
- ✅ 用戶是否有 `sponsor`、`admin` 或 `super_admin` 權限

如果沒有權限，會自動重定向到登入頁面。

## 完整的 Sponsor 頁面列表

一旦設置為 sponsor 角色，用戶可以訪問：

### 主要頁面
- `/sponsor/dashboard` - 主儀表板（統計、快速操作）
- `/sponsor/reports` - 數據報告與分析
- `/sponsor/notifications` - 通知管理

### 賽道管理
- `/sponsor/tracks/[trackId]` - 賽道詳情
- `/sponsor/tracks/[trackId]/challenge` - 編輯挑戰內容
- `/sponsor/tracks/[trackId]/submissions` - 查看提交列表
- `/sponsor/tracks/[trackId]/judging` - 評審與決選

### 提交詳情
- `/sponsor/submissions/[submissionId]` - 單個提交的詳細信息

## 測試清單

設置完成後，請測試：

- [ ] 登入後能看到 "賛助商" 導航鏈接
- [ ] 能訪問 `/sponsor/dashboard`
- [ ] Dashboard 正常顯示（無權限錯誤）
- [ ] 能看到賽道列表（如果已分配賽道）
- [ ] 各個子頁面都能正常訪問

## 疑難排解

### 問題: 登入後看不到 "賛助商" 鏈接

**解決方法**:
1. 確認 Firestore 中該用戶的 `permissions` 包含 `"sponsor"`
2. 登出並重新登入
3. 清除瀏覽器緩存
4. 檢查瀏覽器 Console 是否有錯誤

### 問題: 訪問 dashboard 被重定向到登入頁

**解決方法**:
1. 確認已正確登入
2. 檢查 `permissions` 設置是否生效
3. 查看 Console 中的 `useAuthContext` 輸出
4. 確認 Firebase token 沒有過期

### 問題: Dashboard 顯示 "暫無賽道"

**說明**: 這是正常的！新的 sponsor 用戶需要：
1. 由管理員分配賽道
2. 在 `extended-sponsors` collection 中創建相應的記錄
3. 在 `sponsor-user-mappings` collection 中建立用戶與賽道的關聯

詳見: `SPONSOR-IMPLEMENTATION-PLAN.ts` 中的數據模型說明。

## 下一步

為用戶分配實際的賽道：
1. 創建 `extended-sponsors` document
2. 創建 `sponsor-user-mappings` document
3. 用戶即可在 Dashboard 中看到並管理自己的賽道

參考腳本: `scripts/migrations/seed-test-data.js`

