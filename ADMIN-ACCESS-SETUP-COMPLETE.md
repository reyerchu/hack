# ✅ 管理員權限設置完成

## 🎯 當前狀態

### 管理員帳號 ✅
```
Email: reyerchu@defintek.io
Permissions: ['super_admin']
可以訪問: /admin/nft/campaigns
```

### 一般用戶帳號 ❌
```
Email: alphareyer@gmail.com
Permissions: none
無法訪問: /admin/nft/campaigns
```

---

## 🔐 權限驗證結果

### ✅ `reyerchu@defintek.io`
- User ID: `uzzaaoqnViVklglHDTQ1KCCbSXt2`
- Collection: `users`
- Permissions: `['super_admin']`
- **可以訪問管理頁面** ✅

### ❌ `alphareyer@gmail.com`
- User ID: `YzxQ10RY2SNZhmKM4yO08So4EHS2`
- Collection: `registrations`
- Permissions: `none`
- **無法訪問管理頁面** ❌

---

## 📝 使用說明

### 管理員訪問步驟

#### Step 1: 登出當前帳號
```
http://localhost:3009/logout
```

或在 Console 執行：
```javascript
localStorage.clear();
sessionStorage.clear();
window.location.href = '/login';
```

#### Step 2: 登入管理員帳號
```
http://localhost:3009/login
```

輸入：
- **Email**: `reyerchu@defintek.io`
- **Password**: [你的密碼]

#### Step 3: 訪問管理頁面
```
http://localhost:3009/admin/nft/campaigns
```

**結果**：
- ✅ 成功進入管理頁面
- ✅ 可以看到 NFT campaigns 列表
- ✅ 可以創建新的 NFT 活動
- ✅ 可以使用「一鍵自動設置」

---

### 一般用戶訪問（驗證阻擋）

#### Step 1: 登入一般用戶帳號
```
Email: alphareyer@gmail.com
```

#### Step 2: 嘗試訪問管理頁面
```
http://localhost:3009/admin/nft/campaigns
```

**結果**：
- ❌ 顯示 alert:「此頁面僅限管理員訪問」
- ❌ 自動重定向到首頁 `/`
- ❌ API 返回: `403 Forbidden: Admin access required`

---

## 🔧 修復的問題

### 之前的問題
```
錯誤: 載入活動失敗：Forbidden: Admin access required
```

**原因**：
- 權限檢查已啟用
- 但 `reyerchu@defintek.io` 沒有管理員權限

### 解決方案
✅ 為 `reyerchu@defintek.io` 設置了 `super_admin` 權限

---

## 📊 權限對比表

| 帳號 | Email | Permissions | 訪問管理頁面 | 訪問用戶頁面 |
|------|-------|-------------|-------------|-------------|
| **管理員** | reyerchu@defintek.io | `['super_admin']` | ✅ 可以 | ✅ 可以 |
| **一般用戶** | alphareyer@gmail.com | `none` | ❌ 不行 | ✅ 可以（自己的） |

---

## 🎯 測試驗證

### 測試 1: 管理員訪問

```bash
# 1. 登入 reyerchu@defintek.io
# 2. 訪問管理頁面
curl -s "http://localhost:3009/admin/nft/campaigns" -H "Cookie: ..."
```

**預期結果**: ✅ 200 OK，顯示管理頁面

### 測試 2: 一般用戶訪問

```bash
# 1. 登入 alphareyer@gmail.com
# 2. 訪問管理頁面
```

**預期結果**: 
- ❌ 前端: Alert + 重定向
- ❌ API: 403 Forbidden

---

## 🔐 安全機制

### 雙重保護

#### 第一層：前端檢查
```typescript
// pages/admin/nft/campaigns.tsx
useEffect(() => {
  if (!authLoading) {
    const isAdmin = user?.permissions?.includes('super_admin');
    if (!isAdmin) {
      alert('此頁面僅限管理員訪問');
      router.push('/');
      return;
    }
  }
}, [user, authLoading, router]);
```

#### 第二層：API 檢查
```typescript
// pages/api/admin/nft/campaigns/list.ts
if (!userData || !userData.permissions?.includes('super_admin')) {
  return res.status(403).json({ 
    error: 'Forbidden: Admin access required'
  });
}
```

---

## 📝 如何添加其他管理員

### 方法 1: 使用腳本

```bash
cd /home/reyerchu/hack/hack-dev

# 創建腳本
cat > add-admin.js << 'EOF'
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
  let pk = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;
  if (pk.startsWith('"')) pk = pk.slice(1, -1);
  pk = pk.replace(/\\n/g, '\n');
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: pk,
    }),
  });
}

async function addAdmin(email) {
  const db = admin.firestore();
  
  // Find user
  let snapshot = await db.collection('users')
    .where('preferredEmail', '==', email)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    snapshot = await db.collection('registrations')
      .where('preferredEmail', '==', email)
      .limit(1)
      .get();
  }
  
  if (snapshot.empty) {
    console.log('❌ User not found:', email);
    process.exit(1);
  }
  
  const doc = snapshot.docs[0];
  
  // Update permissions
  await doc.ref.update({
    permissions: admin.firestore.FieldValue.arrayUnion('super_admin')
  });
  
  // Ensure in users collection
  const usersRef = db.collection('users').doc(doc.id);
  const usersDoc = await usersRef.get();
  
  if (!usersDoc.exists) {
    await usersRef.set({
      ...doc.data(),
      permissions: ['super_admin'],
    });
  } else {
    await usersRef.update({
      permissions: admin.firestore.FieldValue.arrayUnion('super_admin')
    });
  }
  
  console.log('✅ Admin permissions granted to:', email);
  process.exit(0);
}

addAdmin(process.argv[2]);
EOF

# 使用腳本添加管理員
node add-admin.js new-admin@example.com
rm add-admin.js
```

### 方法 2: 直接在 Firestore Console

1. 訪問 Firestore Console
2. 進入 `users` collection
3. 找到用戶文檔（通過 UID 或 email）
4. 編輯文檔，添加或更新：
   ```json
   {
     "permissions": ["super_admin"]
   }
   ```
5. 保存

---

## 🆘 常見問題

### Q1: 登入後還是無法訪問管理頁面

**A**: 清除瀏覽器緩存和 token
```javascript
localStorage.clear();
sessionStorage.clear();
window.location.href = '/login';
```

重新登入後應該就可以了。

### Q2: API 返回 403 Forbidden

**A**: 檢查 Firestore 中的權限設置
```javascript
// 在 Console 檢查
fetch('/api/auth/me', {
  headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
})
.then(r => r.json())
.then(d => console.log('Permissions:', d.permissions));
```

### Q3: 忘記管理員密碼

**A**: 使用 Firebase Console 重置密碼
1. 訪問 Firebase Console
2. Authentication → Users
3. 找到用戶
4. 點擊 "..." → Reset Password

---

## ✅ 總結

### 當前設置

- ✅ `reyerchu@defintek.io` 有管理員權限
- ✅ `alphareyer@gmail.com` 沒有管理員權限
- ✅ 管理頁面受到保護
- ✅ 雙重權限檢查（前端 + API）

### 使用方法

**管理員**：
1. 登入 `reyerchu@defintek.io`
2. 訪問 `http://localhost:3009/admin/nft/campaigns`
3. 管理 NFT campaigns

**一般用戶**：
1. 登入 `alphareyer@gmail.com`
2. 訪問 `http://localhost:3009/user/YzxQ10RY2SNZhmKM4yO08So4EHS2`
3. 查看自己的 NFT（需要用本人帳號登入）

---

**設置完成！** 🎉

現在：
1. **登出**當前帳號
2. **登入** `reyerchu@defintek.io`
3. **訪問** `http://localhost:3009/admin/nft/campaigns`
4. 應該可以正常使用了！

如果還有問題，告訴我！😊

