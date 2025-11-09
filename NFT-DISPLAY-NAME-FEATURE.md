# NFT 鑄造記錄顯示暱稱功能

## 功能說明

在 NFT 公開頁面的鑄造記錄表格中，現在會顯示用戶的暱稱而不是 email 地址。

## 實現邏輯

### 優先順序

系統會按照以下優先順序決定顯示名稱：

1. **preferredName**（首選名稱）
2. **firstName + lastName**（姓名）
3. **email**（email 地址，作為回退）

### 顯示方式

- **主要顯示**：暱稱或姓名（較大、粗體）
- **次要顯示**：如果顯示的是暱稱或姓名，會在下方顯示 email（較小、灰色）

```
┌─────────────────┐
│ Token #1        │
├─────────────────┤
│ 張三             │  ← 顯示名稱（preferredName 或 firstName lastName）
│ user@email.com  │  ← email（次要資訊）
└─────────────────┘
```

如果沒有設置暱稱或姓名，則只顯示 email：

```
┌─────────────────┐
│ Token #1        │
├─────────────────┤
│ user@email.com  │  ← 只顯示 email
└─────────────────┘
```

## 技術實現

### 後端 API 修改

**檔案**：`pages/api/nft/campaigns/[campaignId]/mints.ts`

#### 1. 獲取用戶資訊

```typescript
// Get unique user IDs from mint records
const userIds = [...new Set(mintsSnapshot.docs.map(doc => doc.data().userId).filter(Boolean))];

// Fetch user information for all users
const userInfoMap: { [userId: string]: any } = {};
await Promise.all(
  userIds.map(async (userId) => {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        userInfoMap[userId] = userDoc.data();
      }
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
    }
  })
);
```

**特點**：
- 批次獲取所有相關用戶的資訊（使用 `Promise.all`）
- 避免 N+1 查詢問題
- 錯誤處理：單個用戶查詢失敗不會影響其他記錄

#### 2. 決定顯示名稱

```typescript
const mints = mintsSnapshot.docs.map(doc => {
  const data = doc.data();
  const userId = data.userId || '';
  const userInfo = userInfoMap[userId];
  
  // Determine display name: preferredName > firstName lastName > email
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

**邏輯說明**：
1. 預設 `displayName` 為 email
2. 如果找到用戶資訊：
   - 優先使用 `preferredName`
   - 如果沒有，組合 `firstName` 和 `lastName`
   - 如果都沒有，保持使用 email

### 前端頁面修改

**檔案**：`pages/nft/[campaignId].tsx`

#### 1. 更新 TypeScript 介面

```typescript
interface MintRecord {
  id: string;
  userEmail: string;
  displayName: string;  // 新增
  tokenId: number;
  transactionHash: string;
  mintedAt: string;
}
```

#### 2. 更新表格顯示

```tsx
<td className="px-6 py-4 whitespace-nowrap">
  <div className="text-sm font-medium text-gray-900">{record.displayName}</div>
  {record.displayName !== record.userEmail && (
    <div className="text-xs text-gray-500">{record.userEmail}</div>
  )}
</td>
```

**顯示邏輯**：
- 主要顯示：`displayName`（粗體、較大）
- 次要顯示：如果 `displayName` 不等於 `userEmail`，顯示 email（灰色、較小）

## API 回應格式

### 之前

```json
{
  "success": true,
  "mints": [
    {
      "id": "vv34kHVmlOVO63Mdwrkx",
      "userEmail": "alphareyer@gmail.com",
      "tokenId": 1,
      "transactionHash": "0x...",
      "mintedAt": "2025-11-09T14:16:57.823Z"
    }
  ]
}
```

### 現在

```json
{
  "success": true,
  "mints": [
    {
      "id": "vv34kHVmlOVO63Mdwrkx",
      "userEmail": "alphareyer@gmail.com",
      "displayName": "張三",
      "tokenId": 1,
      "transactionHash": "0x...",
      "mintedAt": "2025-11-09T14:16:57.823Z"
    }
  ]
}
```

## 用戶資料結構

系統會從 `users` 集合中讀取以下欄位：

```typescript
interface UserInfo {
  preferredName?: string;  // 首選名稱（優先）
  firstName?: string;      // 名字
  lastName?: string;       // 姓氏
  email?: string;          // Email
  // ... 其他欄位
}
```

## 效能考量

### 批次查詢
使用 `Promise.all` 並行查詢所有用戶資訊：

```typescript
await Promise.all(
  userIds.map(async (userId) => {
    // 並行查詢
  })
);
```

**優點**：
- 所有用戶查詢同時進行
- 總耗時 ≈ 單次查詢耗時（而非 N × 單次查詢）

### 去重優化
```typescript
const userIds = [...new Set(mintsSnapshot.docs.map(doc => doc.data().userId).filter(Boolean))];
```

**作用**：
- 如果同一用戶鑄造多個 NFT，只查詢一次
- 過濾掉空的 userId

### 快取（未來改進）
可以考慮添加記憶體快取：
```typescript
const userCache = new Map();
// 查詢前先檢查快取
```

## 隱私考量

### 顯示的資訊
- ✅ 顯示暱稱或姓名（用戶主動設置）
- ✅ 顯示 email（鑄造記錄本就公開）
- ❌ 不顯示其他敏感資訊（電話、地址等）

### 可選改進
未來可以添加隱私設置：
```typescript
interface UserPrivacySettings {
  showRealName: boolean;      // 是否顯示真名
  showEmailInPublic: boolean; // 是否在公開頁面顯示 email
}
```

## 測試

### 測試場景 1：有暱稱的用戶

**用戶資料**：
```json
{
  "preferredName": "張三",
  "email": "user@example.com"
}
```

**顯示**：
```
張三
user@example.com
```

### 測試場景 2：有姓名的用戶

**用戶資料**：
```json
{
  "firstName": "三",
  "lastName": "張",
  "email": "user@example.com"
}
```

**顯示**：
```
三 張
user@example.com
```

### 測試場景 3：只有 email

**用戶資料**：
```json
{
  "email": "user@example.com"
}
```

**顯示**：
```
user@example.com
```

### 測試場景 4：沒有 userId

**Mint 資料**：
```json
{
  "userEmail": "user@example.com",
  "userId": ""
}
```

**顯示**：
```
user@example.com
```

## 修改的檔案

```
✅ pages/api/nft/campaigns/[campaignId]/mints.ts
   - 添加用戶資訊查詢
   - 添加 displayName 邏輯
   
✅ pages/nft/[campaignId].tsx
   - 更新 MintRecord 介面
   - 更新表格顯示邏輯
```

## 相關文檔

- `NFT-PUBLIC-PAGE.md` - NFT 公開頁面功能
- `NFT-API-FIX.md` - API 修復記錄
- `NFT-DATE-FIX.md` - 日期顯示修復

## 未來改進

### 1. 頭像顯示
```tsx
<div className="flex items-center gap-3">
  {userInfo.photoURL && (
    <img src={userInfo.photoURL} className="w-8 h-8 rounded-full" />
  )}
  <div>
    <div className="font-medium">{displayName}</div>
    <div className="text-xs text-gray-500">{email}</div>
  </div>
</div>
```

### 2. 用戶頁面連結
```tsx
<Link href={`/user/${userId}`}>
  <a className="text-blue-600 hover:underline">{displayName}</a>
</Link>
```

### 3. 隱私控制
讓用戶選擇是否在公開頁面顯示真名。

### 4. 國際化
支援不同語言的姓名顯示順序（中文：姓在前，英文：名在前）。

---

**實現日期**：2025-11-09  
**狀態**：✅ 已完成  
**測試**：✅ 已驗證

