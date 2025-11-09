# 個人頁面 URL 格式審查

## ✅ 已驗證的代碼位置

### 1. NFT Mint 頁面 (`pages/nft/mint.tsx`)
**狀態**: ✅ 正確使用 `emailToHash`

```typescript
// 行 212: 鑄造成功後跳轉
const hash = emailToHash(email);
router.push(`/user/${hash}?refresh=${Date.now()}`);

// 行 287, 356: 返回個人頁面按鈕
const hash = emailToHash(email);
router.push(`/user/${hash}`);
```

### 2. Profile 頁面 (`pages/profile.tsx`)
**狀態**: ✅ 正確使用 `emailToHash`

```typescript
// 「查看公開頁面」按鈕
const hash = emailToHash(email);
router.push(`/user/${hash}`);
```

### 3. NFT 公開頁面 (`pages/nft/[campaignId].tsx`)
**狀態**: ✅ 正確使用 `emailToHash`

```typescript
// 鑄造記錄中的用戶連結
<Link href={`/user/${emailToHash(record.userEmail)}`}>
```

### 4. 團隊公開頁面 (`pages/teams/[teamId]/public.tsx`)
**狀態**: ✅ 使用 `userId`，但 API 返回的是 email hash

```typescript
// 行 286: 隊長連結
<Link href={`/user/${team.leader.userId}`}>

// 行 306: 隊員連結
<Link href={`/user/${member.userId}`}>
```

**API 驗證** (`pages/api/teams/[teamId]/public.ts`):
```typescript
// 行 79: 隊長
teamInfo.leader = {
  userId: hash,  // ✅ 使用 email hash
  displayName: nickname || leader.name || '匿名用戶',
  role: leader.role || '',
};

// 行 117: 隊員
members.push({
  userId: hash,  // ✅ 使用 email hash
  displayName: nickname || member.name || '匿名用戶',
  role: member.role || '',
});
```

### 5. 個人頁面本身 (`pages/user/[userId].tsx`)
**狀態**: ✅ 添加了格式驗證，拒絕舊格式

```typescript
// 行 75-83: URL 格式驗證
const isMd5Hash = typeof userId === 'string' && /^[a-f0-9]{32}$/i.test(userId);

if (!isMd5Hash) {
  console.log('[UserPublic] ❌ Invalid URL format. Only email hash URLs are allowed.');
  setError('此頁面 URL 格式已過時。請使用正確的個人頁面連結。');
  setLoading(false);
  return;
}
```

## 🎯 URL 格式規範

### ✅ 允許的格式
```
/user/e83e725fe46b289712c3e25763dda0dd
       └─ 32位 MD5 hash (0-9a-f)
```

### ❌ 禁止的格式
```
/user/qHeN7mcVgKTVv40R6Z2FZDijK803
       └─ Firebase UID (包含大寫字母和數字)
```

## 🔍 可能導致錯誤的場景

### 場景 1: 直接訪問舊 URL
**URL**: `http://localhost:3009/user/qHeN7mcVgKTVv40R6Z2FZDijK803`  
**結果**: ❌ 顯示錯誤「此頁面 URL 格式已過時」  
**原因**: URL 驗證失敗  
**修復**: 無需修復，這是預期行為

### 場景 2: 團隊頁面連結
**URL**: `http://localhost:3009/teams/[teamId]/public`  
**連結**: `<Link href={`/user/${member.userId}`}>`  
**結果**: ✅ 正常工作  
**原因**: API 返回的 `userId` 已經是 email hash

### 場景 3: NFT 鑄造後跳轉
**觸發**: 鑄造 NFT 成功  
**目標**: `/user/[emailHash]?refresh=[timestamp]`  
**結果**: ✅ 正常工作  
**原因**: 使用 `emailToHash(email)` 計算

### 場景 4: Profile 頁面跳轉
**觸發**: 點擊「查看公開頁面」  
**目標**: `/user/[emailHash]`  
**結果**: ✅ 正常工作  
**原因**: 使用 `emailToHash(email)` 計算

## 📊 驗證清單

- [x] NFT Mint 頁面使用正確格式
- [x] Profile 頁面使用正確格式
- [x] NFT 公開頁面使用正確格式
- [x] 團隊頁面 API 返回正確格式
- [x] 個人頁面驗證 URL 格式
- [x] 拒絕舊格式 URL

## 🚨 不會導致錯誤的情況

所有代碼路徑都已正確使用 email hash 格式。**不存在**會生成舊格式 URL 的代碼。

## 🎉 結論

✅ **所有個人頁面連結已完全使用 email hash 格式**  
✅ **舊的 Firebase UID 格式已被禁止**  
✅ **不存在會生成錯誤 URL 的代碼路徑**

---

**審查日期**: 2025-11-10  
**審查範圍**: 所有 `.tsx` 和 `.ts` 文件  
**審查結果**: ✅ 通過

