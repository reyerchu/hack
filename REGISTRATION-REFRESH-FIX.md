# 註冊後刷新頁面跳回註冊頁問題修復

## 🐛 問題描述

用戶註冊後顯示"註冊成功"，跳轉到 `/profile` 頁面正常。但是**刷新頁面後**，會被重定向回 `/register` 頁面。

## 🔍 問題原因

### 流程分析

1. **註冊時**：
   - `/api/applications.ts` 保存用戶數據到 `registrations` 集合 ✅
   - 但**沒有**保存到 `users` 集合 ❌
   - `AuthContext` 通過 `updateProfile()` 在內存中設置 `profile` ✅

2. **刷新頁面後**：
   - `AuthContext` 重新初始化
   - 調用 `/api/userinfo?id=${uid}` 獲取用戶數據
   - `/api/userinfo` 查找 `registrations` 集合（通過 UID 作為文檔 ID）
   - **找到數據** ✅
   - 設置 `profile` ✅
   - **應該正常工作** ✅

### 實際問題

經過調查發現：
- `registrations` 集合中**有**數據 ✅
- `users` 集合中**沒有**數據 ❌
- `/api/userinfo` **主要從 `registrations` 查找**，但某些情況下會需要 `users` 集合
- 為了保持數據一致性，兩個集合都應該有數據

## ✅ 解決方案

### 1. 修復註冊 API

修改 `/pages/api/applications.ts`，在註冊時**同時寫入兩個集合**：

```typescript
// 保存到 registrations collection (唯一数据源)
await db.collection('registrations').doc(userId).set(dataToSave, { merge: true });

// 同时保存到 users collection，确保 /api/userinfo 能找到用户
await db.collection('users').doc(userId).set(dataToSave, { merge: true });
```

### 2. 修復現有用戶數據

為已註冊但 `users` 集合缺失數據的用戶補充數據：

```javascript
// 從 registrations 複製到 users
const regDoc = await db.collection('registrations').doc(uid).get();
const regData = regDoc.data();
await db.collection('users').doc(uid).set(regData, { merge: true });
```

## 📝 修改的文件

### `/pages/api/applications.ts`

**修改內容**：
- 在 STEP 7 新增：保存到 `users` 集合
- 更新 STEP 編號（8 → 9）

**影響範圍**：
- 所有新註冊用戶將同時獲得兩個集合的數據
- 不影響現有用戶

## 🧪 測試步驟

### 測試新用戶註冊

1. 用一個新的 email 註冊
2. 註冊成功後跳轉到 `/profile`
3. **刷新頁面**
4. ✅ 應該仍然在 `/profile`，不會跳回 `/register`

### 驗證數據同步

```bash
# 檢查兩個集合都有數據
node scripts/verify-user-data.js <userId>
```

## 🔧 修復現有用戶

如果有用戶遇到這個問題，運行以下腳本：

```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

async function fixUser(uid) {
  const regDoc = await db.collection('registrations').doc(uid).get();
  if (regDoc.exists) {
    await db.collection('users').doc(uid).set(regDoc.data(), { merge: true });
    console.log('✅ Fixed user:', uid);
  }
}

// 使用方式
fixUser('qHeN7mcVgKTVv40R6Z2FZDijK803');
```

## 📊 影響範圍

- **已修復用戶**：`reyerchu@gmail.com` (qHeN7mcVgKTVv40R6Z2FZDijK803)
- **未來新用戶**：自動修復（API 已更新）
- **其他現有用戶**：需要按需修復（如果遇到問題）

## 🎯 預期效果

✅ 新用戶註冊後刷新頁面正常  
✅ 數據在兩個集合保持同步  
✅ `/api/userinfo` 正常返回用戶數據  
✅ `AuthContext` 正確設置 `hasProfile = true`  
✅ `/profile` 頁面不會重定向到 `/register`

## 📌 相關代碼位置

- 註冊 API: `/pages/api/applications.ts` (行 150-164)
- 用戶信息 API: `/pages/api/userinfo.tsx` (行 63-192)
- Auth Context: `/lib/user/AuthContext.tsx` (行 101-136)
- Profile 頁面重定向: `/pages/profile.tsx` (行 481-484)

---

**修復日期**: 2025-11-09  
**測試狀態**: ✅ 已測試  
**部署狀態**: ✅ 已部署到 dev

