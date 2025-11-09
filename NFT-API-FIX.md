# NFT 公開 API 修復

## 問題

訪問 NFT 公開頁面時出錯：
```
http://localhost:3009/nft/MWxmOcriDtTRsvuCFJ4o
無法載入 NFT 活動資訊
```

## 錯誤原因

### 錯誤 1: Firestore 導入錯誤
```
TypeError: firestore is not a function
```

**原因**：錯誤的導入方式
```typescript
// ❌ 錯誤
import { firestore } from '../../../../lib/admin/init';
```

`lib/admin/init.ts` 沒有導出 `firestore` 函數。

### 錯誤 2: Firestore 索引缺失
```
Error: The query requires an index
```

**原因**：使用了 `orderBy` 和 `where` 的複合查詢，需要創建索引。

## 解決方案

### 修復 1: 正確的 Firestore 導入

**修改檔案**：
- `pages/api/nft/campaigns/[campaignId].ts`
- `pages/api/nft/campaigns/[campaignId]/mints.ts`

**修改前**：
```typescript
import { firestore } from '../../../../lib/admin/init';

export default async function handler(req, res) {
  const db = firestore();
  // ...
}
```

**修改後**：
```typescript
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';

export default async function handler(req, res) {
  initializeApi();  // 初始化 Firebase Admin
  const db = firestore();
  // ...
}
```

**說明**：
1. 直接從 `firebase-admin` 導入 `firestore`
2. 導入 `initializeApi` 並在處理函數開始時調用
3. 這與其他 Admin API 的做法一致

### 修復 2: 移除 OrderBy，改用記憶體排序

**修改檔案**：
- `pages/api/nft/campaigns/[campaignId]/mints.ts`

**修改前**：
```typescript
const mintsSnapshot = await db
  .collection('nft-mints')
  .where('campaignId', '==', campaignId)
  .orderBy('mintedAt', 'desc')  // ❌ 需要索引
  .get();

const mints = mintsSnapshot.docs.map(doc => {
  // ...
});
```

**修改後**：
```typescript
const mintsSnapshot = await db
  .collection('nft-mints')
  .where('campaignId', '==', campaignId)
  .get();

const mints = mintsSnapshot.docs.map(doc => {
  // ...
});

// 在記憶體中排序（不需要索引）
mints.sort((a, b) => {
  const dateA = new Date(a.mintedAt).getTime();
  const dateB = new Date(b.mintedAt).getTime();
  return dateB - dateA;  // 降序（最新的在前）
});
```

**優點**：
- ✅ 不需要創建 Firestore 索引
- ✅ 對於小量資料（< 1000 筆）性能影響可忽略
- ✅ 簡化部署流程

## 測試結果

### API 測試

#### 1. 獲取活動資訊
```bash
curl http://localhost:3009/api/nft/campaigns/MWxmOcriDtTRsvuCFJ4o
```

**回應**：
```json
{
  "success": true,
  "campaign": {
    "id": "MWxmOcriDtTRsvuCFJ4o",
    "name": "NFT-1",
    "description": "1st NFT",
    "imageUrl": "/nft-images/nft-1762697173486-73475401.jpg",
    "network": "sepolia",
    "contractAddress": "0x52d8BdaeC6AFb0c54D24Fc14949dd9755424b86f",
    "maxSupply": 5,
    "currentSupply": 1,
    "status": "active"
  }
}
```

✅ **狀態**：成功

#### 2. 獲取鑄造記錄
```bash
curl http://localhost:3009/api/nft/campaigns/MWxmOcriDtTRsvuCFJ4o/mints
```

**回應**：
```json
{
  "success": true,
  "mints": [
    {
      "id": "vv34kHVmlOVO63Mdwrkx",
      "userEmail": "alphareyer@gmail.com",
      "tokenId": 1,
      "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "mintedAt": "2025-11-09T14:16:57.823Z"
    }
  ],
  "total": 1
}
```

✅ **狀態**：成功

### 頁面測試

#### 訪問 NFT 公開頁面
```
http://localhost:3009/nft/MWxmOcriDtTRsvuCFJ4o
```

✅ **狀態**：頁面正常載入，顯示完整資訊

## 修改的檔案

```
pages/api/nft/campaigns/[campaignId].ts
pages/api/nft/campaigns/[campaignId]/mints.ts
```

## 代碼對比

### `[campaignId].ts`

| 項目 | 修改前 | 修改後 |
|-----|-------|-------|
| Import | `import { firestore } from '../../../../lib/admin/init'` | `import { firestore } from 'firebase-admin'`<br>`import initializeApi from '../../../../lib/admin/init'` |
| 初始化 | 無 | `initializeApi()` |

### `mints.ts`

| 項目 | 修改前 | 修改後 |
|-----|-------|-------|
| Import | `import { firestore } from '../../../../../lib/admin/init'` | `import { firestore } from 'firebase-admin'`<br>`import initializeApi from '../../../../../lib/admin/init'` |
| 初始化 | 無 | `initializeApi()` |
| 排序 | `.orderBy('mintedAt', 'desc')` | 移除查詢排序，改用 `mints.sort()` |

## 經驗教訓

### 1. 統一導入方式
所有 API 應該使用相同的 Firebase Admin 導入方式：
```typescript
import { firestore, auth } from 'firebase-admin';
import initializeApi from '../../lib/admin/init';
```

### 2. 避免需要索引的查詢
- 對於小量資料，優先使用記憶體排序
- 複合查詢（`where` + `orderBy`）需要索引
- 單獨的 `where` 或 `orderBy` 通常不需要索引

### 3. 參考現有代碼
新增功能時，參考專案中已有的類似功能實現方式。

## 相關文件

- `lib/admin/init.ts` - Firebase Admin 初始化
- `pages/api/admin/nft/campaigns/create.ts` - 參考範例

## 部署狀態

✅ **已修復**  
✅ **已測試**  
✅ **伺服器運行正常**  
✅ **功能完整可用**

---

**修復時間**：2025-11-09  
**修復者**：AI Assistant  
**狀態**：✅ 完成

