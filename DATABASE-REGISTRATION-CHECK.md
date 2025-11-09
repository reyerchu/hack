# 使用數據庫檢查註冊狀態 - 不再依賴 hasProfile

## 🎯 問題分析

### 原有邏輯的問題

**之前的邏輯**：
```typescript
const hasProfile = profile !== null;

if (!hasProfile) {
  router.push('/register');
}
```

**問題**：
1. `hasProfile` 依賴於 `profile` 狀態（內存中的變量）
2. `profile` 狀態可能因為各種原因變成 `null`：
   - 頁面刷新時 AuthContext 重新初始化
   - API 請求失敗或超時
   - 網絡問題
   - 狀態管理不一致
3. 即使用戶已在數據庫中註冊，如果 `profile` 為 `null`，仍會被重定向到註冊頁

### 根本問題

**狀態不應該是真相的唯一來源 (Single Source of Truth)**

數據庫才是真相的唯一來源。我們應該**直接查詢數據庫**來確定用戶是否已註冊，而不是依賴可能不穩定的前端狀態。

## ✅ 新的解決方案

### 核心思想

**每次需要檢查用戶是否註冊時，直接查詢數據庫**

### Profile 頁面 (`/pages/profile.tsx`)

#### 1. 添加狀態

```typescript
// 直接檢查數據庫中的註冊狀態，而不依賴 hasProfile
const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
const [checkingRegistration, setCheckingRegistration] = useState(true);
```

#### 2. 添加數據庫檢查

```typescript
useEffect(() => {
  const checkRegistrationStatus = async () => {
    if (!user?.id || !user?.token) {
      setCheckingRegistration(false);
      return;
    }

    console.log('[Profile] 🔍 Checking registration status for user:', user.id);
    
    try {
      const response = await fetch(`/api/userinfo?id=${encodeURIComponent(user.id)}`, {
        headers: { Authorization: user.token },
      });

      if (response.status === 200) {
        const data = await response.json();
        setIsRegistered(true);
        // 同時更新 profile 以保持一致性
        if (!profile) {
          updateProfile(data);
        }
      } else if (response.status === 404) {
        setIsRegistered(false);
      }
    } catch (error) {
      setIsRegistered(false);
    } finally {
      setCheckingRegistration(false);
    }
  };

  checkRegistrationStatus();
}, [user?.id, user?.token]);
```

#### 3. 更新渲染邏輯

```typescript
// 正在檢查註冊狀態
if (checkingRegistration) {
  return <div className="p-4 flex-grow text-center">載入中...</div>;
}

// 未登入
if (!isSignedIn) {
  return <div className="p-4 flex-grow text-center">請登入以查看您的個人中心！</div>;
}

// 已登入但未註冊（根據數據庫）
if (isRegistered === false) {
  router.push('/register');
  return <div className="p-4 flex-grow text-center">重定向到註冊頁面...</div>;
}

// 已註冊，正常渲染頁面
```

### Register 頁面 (`/pages/register.tsx`)

#### 1. 添加狀態

```typescript
const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
```

#### 2. 檢查是否已註冊

```typescript
const checkRedirect = async () => {
  if (typeof window === 'undefined') return;
  
  // 檢查數據庫中的註冊狀態
  if (user?.id && user?.token) {
    try {
      const response = await fetch(`/api/userinfo?id=${encodeURIComponent(user.id)}`, {
        headers: { Authorization: user.token },
      });
      
      if (response.status === 200) {
        // 用戶已註冊，跳轉到 profile
        router.push('/profile');
        return;
      } else {
        setIsRegistered(false);
      }
    } catch (error) {
      setIsRegistered(false);
    }
  }
  
  setLoading(false);
};
```

#### 3. 註冊成功後更新狀態

```typescript
// 註冊成功
updateProfile(response.data?.profile || registrationData);

console.log('[Register] ✅ Profile updated in AuthContext');
console.log('[Register] User should now be signed in and registered');

// 重定向到 profile
router.push('/profile');
```

## 📊 流程對比

### 之前的流程（有問題）

```
用戶訪問 /profile
↓
檢查 hasProfile (profile !== null)
↓
profile 可能為 null（即使數據庫有數據）
↓
重定向到 /register ❌
```

### 新的流程（正確）

```
用戶訪問 /profile
↓
檢查 isSignedIn
↓
如果已登入，查詢數據庫 /api/userinfo
↓
根據數據庫返回決定：
  - 200: 已註冊，顯示頁面 ✅
  - 404: 未註冊，重定向到 /register ✅
```

## 🎯 關鍵優勢

### 1. 數據庫是真相的唯一來源

- ✅ 不依賴前端狀態
- ✅ 即使狀態丟失，數據庫數據仍然存在
- ✅ 刷新頁面不會導致問題

### 2. 明確的檢查流程

- ✅ 顯示"載入中..."提示用戶正在檢查
- ✅ 異步檢查不阻塞頁面渲染
- ✅ 錯誤處理完善

### 3. 狀態一致性

- ✅ 查詢數據庫後，同時更新前端 `profile` 狀態
- ✅ 保持數據庫和前端狀態同步
- ✅ 後續操作可以使用 `profile` 狀態，無需重複查詢

## 🔍 調試日誌

### Profile 頁面日誌

```
[Profile] 🔍 Checking registration status for user: xxx
[Profile] 📥 Registration check response: 200
[Profile] ✅ User is registered in database
[Profile Page] ✅ User is registered, rendering page
```

### Register 頁面日誌

```
[Register] 🔍 Checking if user is already registered: xxx
[Register] ✅ User already registered, redirecting to /profile
```

或

```
[Register] ❌ User not registered yet (status: 404)
[用戶填寫表單並提交]
[Register] ✅ STEP 6: 註冊成功！
[Register] ✅ Profile updated in AuthContext
[Register] User should now be signed in and registered
[Register] 🔄 重定向到 /profile
```

## 📝 修改的文件

### 1. `/pages/profile.tsx`

**新增**：
- `isRegistered` 狀態
- `checkingRegistration` 狀態
- `checkRegistrationStatus` useEffect

**修改**：
- 渲染邏輯：從檢查 `hasProfile` 改為檢查 `isRegistered`
- 添加"載入中..."狀態

### 2. `/pages/register.tsx`

**新增**：
- `isRegistered` 狀態
- 數據庫檢查邏輯在 `checkRedirect`

**修改**：
- 註冊成功後更新 profile 的日誌
- 明確說明用戶狀態

## 🧪 測試步驟

### 測試 1：已註冊用戶訪問 profile

1. 以已註冊用戶登入
2. 訪問 `http://localhost:3009/profile`
3. ✅ 應該顯示"載入中..."
4. ✅ 然後顯示 profile 頁面
5. ✅ 刷新頁面，應該保持在 profile 頁面

### 測試 2：未註冊用戶訪問 profile

1. 以新用戶登入（未註冊）
2. 訪問 `http://localhost:3009/profile`
3. ✅ 應該顯示"載入中..."
4. ✅ 然後重定向到 `/register`

### 測試 3：註冊流程

1. 訪問 `http://localhost:3009/register`
2. 填寫表單並提交
3. ✅ 顯示"註冊成功！"
4. ✅ 重定向到 `/profile`
5. ✅ 顯示 profile 頁面（不會跳回 register）
6. ✅ 刷新頁面，保持在 profile 頁面

### 測試 4：已註冊用戶訪問 register

1. 以已註冊用戶登入
2. 訪問 `http://localhost:3009/register`
3. ✅ 應該自動重定向到 `/profile`

## 📌 重要提醒

### 關於 isSignedIn

用戶提到"on register page, when submited, isSignedIn should be true"

**解釋**：
- `isSignedIn = user !== null`（來自 AuthContext）
- 這取決於 Firebase Auth 的登入狀態
- 註冊時，用戶**必須先登入**（否則無法獲取 token）
- 所以在 register 頁面，`isSignedIn` **應該已經是 true**
- 如果 `isSignedIn` 為 false，register 頁面會重定向到 `/auth`（第 84-86 行）

```typescript
if (!user) {
  router.push('/auth');
  return;
}
```

### 完整流程

1. 用戶在 `/auth` 頁面登入（Firebase Auth）
2. `isSignedIn` 變為 true
3. 用戶可以訪問 `/register`
4. 填寫表單並提交
5. 數據保存到 Firestore
6. `updateProfile()` 更新前端狀態
7. 重定向到 `/profile`
8. `/profile` 查詢數據庫確認已註冊
9. 顯示 profile 頁面

---

**修復日期**: 2025-11-09  
**測試狀態**: ⏳ 待測試  
**部署狀態**: ✅ 已部署到 dev

