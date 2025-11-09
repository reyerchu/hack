# /api/userinfo API 修復 - 解決 "API resolved without sending a response" 錯誤

## 🐛 問題描述

用戶註冊後訪問 `/profile` 頁面時，控制台出現大量警告：
```
API resolved without sending a response for /api/userinfo?id=xxx, this may result in stalled requests.
```

導致：
- API 請求超時
- `AuthContext` 無法獲取用戶數據
- `profile` 保持為 `null`
- `hasProfile = false`
- `/profile` 頁面重定向到 `/register`

## 🔍 問題根因

### 代碼問題

在 `/pages/api/userinfo.tsx` 第 217-228 行：

```typescript
export default async function handleScanTypes(
  req: NextApiRequest,
  res: NextApiResponse<ApplicationsResponse>,
) {
  const { method } = req;

  if (method === 'GET') {
    handleUserInfo(req, res);  // ❌ 沒有 await 或 return
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
```

**問題**：
- `handleUserInfo` 是一個異步函數
- 但調用時沒有 `await`，也沒有 `return`
- 導致 Next.js 認為請求已處理完成，但實際上異步操作還在進行中
- Next.js 發出警告 "API resolved without sending a response"
- 最終請求超時，客戶端收不到響應

## ✅ 解決方案

### 1. 修復主處理函數

```typescript
export default async function handleScanTypes(
  req: NextApiRequest,
  res: NextApiResponse<ApplicationsResponse>,
) {
  const { method } = req;

  if (method === 'GET') {
    return await handleUserInfo(req, res);  // ✅ 添加 return await
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
```

### 2. 確保所有返回語句都使用 `return`

在 `handleUserInfo` 函數中，所有 `res.status().json()` 和 `res.status().send()` 都添加 `return`：

```typescript
// ❌ 之前
res.status(200).json(snapshot.data());

// ✅ 修復後
return res.status(200).json(snapshot.data());
```

### 3. 添加詳細日誌

添加了詳細的日誌輸出，幫助診斷問題：

```typescript
console.log('[/api/userinfo] 🔍 Start handling request for:', req.query.id);
console.log('[/api/userinfo] 🔑 Checking authorization for:', id);
console.log('[/api/userinfo] 🔐 Authorization result:', isAuthorized);
console.log('[/api/userinfo] 🔎 Searching registrations collection by UID:', userID);
console.log('[/api/userinfo] 📊 Registration doc exists:', snapshot.exists);
console.log('[/api/userinfo] ✅ Returning user data');
```

## 📝 修改的文件

### `/pages/api/userinfo.tsx`

**修改內容**：
1. 第 224 行：`handleUserInfo(req, res);` → `return await handleUserInfo(req, res);`
2. 第 40-69 行：添加日誌
3. 第 73-75 行：添加日誌
4. 第 79 行：添加日誌
5. 第 199-204 行：添加日誌，確保所有返回都有 `return`
6. 第 206-210 行：添加日誌，確保錯誤處理有 `return`

## 🧪 測試步驟

### 1. 清除日誌並重啟服務器

```bash
cd /home/reyerchu/hack/hack-dev
pm2 flush hack-dev
pm2 restart hack-dev
```

### 2. 測試流程

1. 清除瀏覽器緩存或使用無痕模式
2. 登入 `reyerchu@gmail.com`
3. 訪問 `http://localhost:3009/profile`
4. **刷新頁面**
5. 檢查：
   - ✅ 頁面保持在 `/profile`
   - ✅ 沒有跳回 `/register`
   - ✅ 控制台沒有 "API resolved without sending a response" 警告

### 3. 檢查日誌

```bash
pm2 logs hack-dev --lines 50
```

應該看到：
```
[/api/userinfo] 🔍 Start handling request for: qHeN7mcVgKTVv40R6Z2FZDijK803
[/api/userinfo] 🔑 Checking authorization for: qHeN7mcVgKTVv40R6Z2FZDijK803
[/api/userinfo] 🔐 Authorization result: true
[/api/userinfo] ✅ Authorized, fetching user data for: qHeN7mcVgKTVv40R6Z2FZDijK803
[/api/userinfo] 🔎 Searching registrations collection by UID: qHeN7mcVgKTVv40R6Z2FZDijK803
[/api/userinfo] 📊 Registration doc exists: true
[/api/userinfo] ✅ Returning user data
```

**不應該看到**：
```
API resolved without sending a response for /api/userinfo
```

## 🎯 預期效果

### 成功標誌

✅ API 正常返回響應  
✅ 沒有 "API resolved without sending a response" 警告  
✅ `AuthContext` 正確獲取用戶數據  
✅ `profile` 正確設置  
✅ `hasProfile = true`  
✅ `/profile` 頁面不會重定向到 `/register`  
✅ 刷新頁面後保持在 `/profile`

### 日誌輸出

正常流程的日誌應該顯示：
1. 🔍 收到請求
2. 🔑 檢查授權
3. 🔐 授權成功
4. ✅ 授權通過
5. 🔎 查找用戶數據
6. 📊 找到用戶數據
7. ✅ 返回用戶數據

## 🔗 相關修復

此修復與之前的修復相結合：
1. **註冊 API 修復** (`REGISTRATION-REFRESH-FIX.md`)：同時寫入 `registrations` 和 `users` 集合
2. **本修復**：確保 `/api/userinfo` 正確返回響應

兩個修復共同解決了"註冊後刷新頁面跳回註冊頁"的問題。

## 📌 技術細節

### Next.js API 路由最佳實踐

在 Next.js API 路由中，**必須**確保：
1. 所有異步函數調用都使用 `await`
2. 主處理函數 `return` 異步調用結果
3. 所有響應語句都使用 `return res.status().json()`

**錯誤示例**：
```typescript
export default async function handler(req, res) {
  if (req.method === 'GET') {
    handleGet(req, res);  // ❌ 沒有 await/return
  }
}

async function handleGet(req, res) {
  const data = await fetchData();
  res.json(data);  // ❌ 沒有 return
}
```

**正確示例**：
```typescript
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return await handleGet(req, res);  // ✅ return await
  }
}

async function handleGet(req, res) {
  const data = await fetchData();
  return res.json(data);  // ✅ return
}
```

---

**修復日期**: 2025-11-09  
**測試狀態**: ⏳ 待測試  
**部署狀態**: ✅ 已部署到 dev

