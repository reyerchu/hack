# Hash 格式總結

## 📋 不同資源的 URL 格式

### 1. 用戶個人頁面
**URL 格式**: `/user/[emailHash]`  
**Hash 類型**: 32 位 MD5 (email)  
**示例**: `/user/e83e725fe46b289712c3e25763dda0dd`

```typescript
// 生成方式
const hash = emailToHash(email);  // 返回 32 位 MD5
router.push(`/user/${hash}`);
```

**驗證規則**:
```typescript
const isMd5Hash = /^[a-f0-9]{32}$/i.test(userId);
```

### 2. 團隊頁面
**URL 格式**: `/teams/[teamId]/public`  
**ID 類型**: Firestore 文檔 ID（不是 hash）  
**示例**: `/teams/FMBB4wssidPfWotgNWRK/public`

```typescript
// 生成方式 - 直接使用 Firestore ID
router.push(`/teams/${team.id}/public`);
```

**特點**:
- 不使用 hash，因為團隊沒有 email
- 使用 Firestore 自動生成的 20 字符 ID
- 包含大小寫字母和數字

### 3. NFT 活動頁面
**URL 格式**: `/nft/[campaignId]`  
**ID 類型**: Firestore 文檔 ID  
**示例**: `/nft/MWxmOcriDtTRsvuCFJ4o`

```typescript
// 生成方式
router.push(`/nft/${campaignId}`);
```

## 🔧 emailToHash 函數

### 當前實現 (已修復)

```typescript
// lib/utils/email-hash.ts

/**
 * 將 email 轉換為 MD5 hash
 * 使用完整的 32 位 MD5
 */
export function emailToHash(email: string): string {
  if (!email) return '';

  const hash = crypto.createHash('md5')
    .update(email.toLowerCase().trim())
    .digest('hex');

  // 返回完整的 32 位 MD5 hash
  return hash;  // ✅ 返回 32 位
}

/**
 * 驗證 hash 格式（32 位 MD5）
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{32}$/i.test(hash);
}
```

### ❌ 之前的錯誤實現

```typescript
// ❌ 只返回 12 位
return hash.substring(0, 12);

// ❌ 驗證 12 位
return /^[a-f0-9]{12}$/.test(hash);
```

**問題**: 導致所有用戶頁面連結失敗，因為：
- 生成的 hash 只有 12 位
- 但 URL 驗證期望 32 位
- API 查找也無法匹配

## 📊 使用 emailToHash 的位置

### 前端
1. **Profile 頁面** (`pages/profile.tsx`)
   - 「查看公開頁面」按鈕

2. **NFT Mint 頁面** (`pages/nft/mint.tsx`)
   - 鑄造成功後跳轉
   - 返回個人頁面按鈕

3. **NFT 公開頁面** (`pages/nft/[campaignId].tsx`)
   - 鑄造記錄中的用戶連結

4. **個人頁面** (`pages/user/[userId].tsx`)
   - URL 格式驗證

### 後端 API
1. **團隊公開 API** (`pages/api/teams/[teamId]/public.ts`)
   - 計算團隊報名者和隊員的 hash
   - 返回為 `userId` 字段

2. **用戶公開 API** (`pages/api/user/[userId]/public.ts`)
   - 使用 `isValidHash` 驗證
   - 遍歷查找匹配的 email

## 🎯 URL 示例對比

### 用戶頁面
```
✅ 正確: /user/e83e725fe46b289712c3e25763dda0dd (32 位 MD5)
❌ 錯誤: /user/e83e725fe46b (12 位，之前的 bug)
❌ 禁止: /user/qHeN7mcVgKTVv40R6Z2FZDijK803 (Firebase UID)
```

### 團隊頁面
```
✅ 正確: /teams/FMBB4wssidPfWotgNWRK/public (Firestore ID)
✅ 正確: /teams/SgJVf7mKYgNsJYsoXuEn/public (Firestore ID)
```

### NFT 頁面
```
✅ 正確: /nft/MWxmOcriDtTRsvuCFJ4o (Firestore ID)
```

## 🔍 如何驗證格式

### 用戶頁面 Hash (32 位 MD5)
```typescript
const isUserHash = /^[a-f0-9]{32}$/i.test(id);
```

### Firestore ID (團隊/NFT)
```typescript
// Firestore ID 特徵：
// - 通常 20 字符
// - 包含大小寫字母和數字
// - 不是純小寫 hex
const isFirestoreId = id.length === 20 && /[A-Z]/.test(id);
```

### NFT Merkle Tree Hash (Keccak256)
```typescript
// Keccak256 特徵：
// - 66 字符 (0x + 64 hex)
// - 用於智能合約驗證
const isKeccak256 = /^0x[a-f0-9]{64}$/i.test(hash);
```

## 📝 計算示例

### Email to MD5 Hash (用於 URL)
```javascript
const crypto = require('crypto');

const email = 'reyerchu@gmail.com';
const hash = crypto.createHash('md5')
  .update(email.toLowerCase().trim())
  .digest('hex');

console.log(hash);
// 輸出: e83e725fe46b289712c3e25763dda0dd (32 位)
```

### Email to Keccak256 Hash (用於 NFT Merkle Tree)
```javascript
const { ethers } = require('ethers');

const email = 'reyerchu@gmail.com';
const normalized = email.toLowerCase().trim();
const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(normalized));

console.log(hash);
// 輸出: 0x1234567890abcdef... (66 字符: 0x + 64 hex)
```

## ✅ 修復驗證清單

- [x] `emailToHash` 返回 32 位 hash
- [x] `isValidHash` 驗證 32 位格式
- [x] 所有用戶頁面連結使用 32 位
- [x] API 正確計算和匹配 32 位 hash
- [x] 團隊頁面使用 Firestore ID（不使用 hash）
- [x] 團隊頁面中的用戶連結使用 32 位 hash
- [x] URL 驗證正確攔截舊格式

## 🔐 NFT Merkle Tree Hash (重要說明)

NFT 白名單驗證使用 **Keccak256**，不是 MD5！

### 為什麼不同？

1. **用戶頁面 URL (MD5)**:
   - 目的：隱私保護，不在 URL 中顯示 email
   - 特點：短（32 字符），適合 URL
   - 安全性：不需要加密安全

2. **NFT Merkle Tree (Keccak256)**:
   - 目的：智能合約白名單驗證
   - 特點：與 Solidity `keccak256` 函數兼容
   - 安全性：加密安全，用於鏈上驗證
   - 長度：66 字符（`0x` + 64 hex）

### 實現位置

```typescript
// lib/merkleTree.ts - NFT 白名單 hash
export function hashEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(normalized));
}

// lib/utils/email-hash.ts - 用戶頁面 URL hash  
export function emailToHash(email: string): string {
  const hash = crypto.createHash('md5')
    .update(email.toLowerCase().trim())
    .digest('hex');
  return hash;  // 32 位 MD5
}
```

### Hash 流程

1. **創建 NFT 活動**:
   ```
   Email → Keccak256 → Merkle Tree → Merkle Root → Smart Contract
   ```

2. **用戶鑄造 NFT**:
   ```
   Email → Keccak256 → Merkle Proof → Smart Contract 驗證
   ```

3. **訪問用戶頁面**:
   ```
   Email → MD5 (32 位) → URL: /user/{hash}
   ```

## 🎉 結論

- ✅ **用戶頁面 URL**: 統一使用 32 位 MD5 hash
- ✅ **NFT Merkle Tree**: 使用 Keccak256 (66 字符)
- ✅ **團隊頁面**: 使用 Firestore ID（~20 字符）
- ✅ **NFT 頁面**: 使用 Firestore ID
- ✅ **所有格式驗證**: 正確且一致
- ✅ **兩種 hash 獨立運作**: 互不影響

---

**文檔日期**: 2025-11-10  
**最後更新**: 修復 emailToHash 返回 32 位 hash + 說明 NFT Merkle Tree 使用 Keccak256  
**狀態**: ✅ 所有 hash 格式已統一並正確實現

