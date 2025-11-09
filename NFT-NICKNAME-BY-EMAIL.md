# NFT 鑄造記錄通過 Email 查找暱稱

## 問題

NFT 公開頁面顯示 email 而不是暱稱：
```
Token #1
alphareyer@gmail.com
```

## 原因

1. **Mint 記錄缺少 userId**：測試鑄造記錄中的 `userId` 欄位為空
2. **無法查找用戶資訊**：原本的 API 只通過 `userId` 查找用戶，當 userId 為空時無法獲取暱稱

## 解決方案

### 1. 增強 API 查找邏輯

修改 API 端點以支援**雙重查找**：
1. 優先通過 `userId` 查找
2. 如果 userId 為空，通過 `email` 查找

**檔案**：`pages/api/nft/campaigns/[campaignId]/mints.ts`

#### 步驟 1：收集 email 列表

```typescript
// Get unique user IDs and emails
const userIds = [...new Set(mintsSnapshot.docs.map(doc => doc.data().userId).filter(Boolean))];
const userEmails = [...new Set(mintsSnapshot.docs.map(doc => doc.data().userEmail).filter(Boolean))];
```

#### 步驟 2：通過 userId 查找並建立 email 映射

```typescript
const userInfoMap: { [key: string]: any } = {};

await Promise.all(
  userIds.map(async (userId) => {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      // 按 userId 存儲
      userInfoMap[`id:${userId}`] = userData;
      // 同時按 email 存儲，方便後續查找
      if (userData.email || userData.preferredEmail) {
        const email = (userData.email || userData.preferredEmail).toLowerCase().trim();
        userInfoMap[`email:${email}`] = userData;
      }
    }
  })
);
```

#### 步驟 3：通過 email 查找（針對沒有 userId 的記錄）

```typescript
await Promise.all(
  userEmails.map(async (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    // 跳過已經通過 userId 找到的用戶
    if (userInfoMap[`email:${normalizedEmail}`]) return;
    
    // 先嘗試 email 欄位
    let usersSnapshot = await db
      .collection('users')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      userInfoMap[`email:${normalizedEmail}`] = usersSnapshot.docs[0].data();
      return;
    }
    
    // 再嘗試 preferredEmail 欄位
    usersSnapshot = await db
      .collection('users')
      .where('preferredEmail', '==', normalizedEmail)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      userInfoMap[`email:${normalizedEmail}`] = usersSnapshot.docs[0].data();
    }
  })
);
```

#### 步驟 4：查找用戶資訊時支援雙重查找

```typescript
const mints = mintsSnapshot.docs.map(doc => {
  const data = doc.data();
  const userId = data.userId || '';
  const userEmail = (data.userEmail || '').toLowerCase().trim();
  
  // 優先通過 userId 查找，然後通過 email 查找
  let userInfo = userId ? userInfoMap[`id:${userId}`] : null;
  if (!userInfo && userEmail) {
    userInfo = userInfoMap[`email:${userEmail}`];
  }
  
  // 決定顯示名稱
  let displayName = data.userEmail || '';
  if (userInfo) {
    if (userInfo.preferredName) {
      displayName = userInfo.preferredName;
    } else if (userInfo.firstName || userInfo.lastName) {
      displayName = [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ');
    }
  }
  
  return {
    id: doc.id,
    userEmail: data.userEmail || '',
    displayName: displayName,
    tokenId: data.tokenId || 0,
    transactionHash: data.transactionHash || '',
    mintedAt: data.mintedAt?.toDate?.()?.toISOString() || data.mintedAt || '',
  };
});
```

### 2. 為測試用戶創建用戶文檔

如果用戶在 Firebase 中不存在，需要創建：

```javascript
const db = admin.firestore();

await db.collection('users').doc().set({
  preferredEmail: 'alphareyer@gmail.com',
  email: 'alphareyer@gmail.com',
  preferredName: 'Alpha Reyer',  // 設置暱稱
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## 查找策略

### 映射鍵格式

使用前綴來區分不同的查找方式：

```typescript
userInfoMap = {
  'id:abc123': { ...userData },        // 通過 userId 查找
  'email:user@example.com': { ...userData }  // 通過 email 查找
}
```

### 查找順序

```
1. 嘗試 userId
   ↓
2. 如果沒有 userId，嘗試 email 欄位
   ↓
3. 如果 email 欄位沒找到，嘗試 preferredEmail 欄位
   ↓
4. 如果都找不到，回退到顯示 email
```

## 效能優化

### 批次查詢
所有用戶查詢都使用 `Promise.all` 並行執行：

```typescript
await Promise.all([
  // 所有 userId 查詢並行
  userIds.map(async (userId) => { /* ... */ }),
  // 所有 email 查詢並行
  userEmails.map(async (email) => { /* ... */ })
]);
```

### 去重和跳過
- 使用 `Set` 去除重複的 email
- 如果通過 userId 已經找到用戶，跳過 email 查詢

### 快取
userInfoMap 同時儲存 `id:xxx` 和 `email:xxx` 兩種鍵，避免重複查詢。

## 測試結果

### API 回應

**之前**：
```json
{
  "displayName": "alphareyer@gmail.com"
}
```

**之後**：
```json
{
  "displayName": "Alpha Reyer"
}
```

### 前端顯示

**之前**：
```
Token #1
alphareyer@gmail.com
```

**之後**：
```
Token #1
Alpha Reyer
```

## 數據結構

### Mint 記錄
```typescript
{
  campaignId: string,
  userEmail: string,       // 一定有
  userId: string,          // 可能為空
  tokenId: number,
  transactionHash: string,
  mintedAt: Timestamp
}
```

### User 文檔
```typescript
{
  email?: string,          // 可能為空
  preferredEmail?: string, // 可能為空
  preferredName?: string,  // 首選名稱
  firstName?: string,      // 名字
  lastName?: string        // 姓氏
}
```

## 未來改進

### 1. Mint 時記錄 userId

在 `pages/api/nft/record-mint.ts` 中確保記錄 userId：

```typescript
const mintData = {
  campaignId,
  userEmail: userEmail.toLowerCase().trim(),
  userId: userId || '',  // 確保傳入 userId
  walletAddress,
  tokenId,
  transactionHash,
  mintedAt: new Date()
};
```

### 2. Email 標準化

統一使用小寫並去除空格：

```typescript
const normalizeEmail = (email: string) => email.toLowerCase().trim();
```

### 3. 建立索引

為頻繁查詢的欄位建立 Firestore 索引：
- `users` 集合的 `email` 欄位
- `users` 集合的 `preferredEmail` 欄位

### 4. 快取策略

考慮使用 Redis 或記憶體快取來減少 Firestore 查詢：

```typescript
const cache = new Map();
const cacheKey = `user:${email}`;
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
```

## 相關檔案

```
✅ pages/api/nft/campaigns/[campaignId]/mints.ts
   - 增強用戶查找邏輯
   - 支援通過 email 查找
```

## 相關文檔

- `NFT-DISPLAY-NAME-FEATURE.md` - 暱稱顯示功能
- `NFT-PUBLIC-PAGE.md` - 公開頁面功能
- `NFT-API-FIX.md` - API 修復記錄

---

**實現日期**：2025-11-09  
**狀態**：✅ 已完成  
**測試**：✅ 已驗證  
**效果**：✅ 正常顯示暱稱

