# 🔧 修復用戶頁面 NFT 顯示問題

## 🚨 問題總結

### 1. 圖片沒有顯示
- 圖片文件存在：`/public/nft-images/nft-1762697173486-73475401.jpg`
- 路徑：`/nft-images/nft-1762697173486-73475401.jpg`

### 2. NFT 區塊沒有顯示
- NFT 區塊需要 `canEdit = true`
- 只有**本人登入**才能看到自己的 NFT

### 3. 管理頁面只能管理員訪問
- 這是正常的設計
- 需要管理員權限

---

## ✅ 解決方案

### 問題 1: 圖片顯示

圖片路徑是正確的。如果圖片不顯示，可能是：

#### 原因 A: 圖片還在加載
**解決**: 等待幾秒或刷新頁面

#### 原因 B: 瀏覽器緩存
**解決**: 硬刷新（Ctrl + Shift + R）

#### 原因 C: 圖片路徑錯誤
檢查圖片是否可訪問：
```
http://localhost:3009/nft-images/nft-1762697173486-73475401.jpg
```

直接在瀏覽器訪問這個 URL，如果能看到圖片，說明路徑正確。

---

### 問題 2: NFT 區塊沒有顯示

**核心問題**: NFT 區塊只在 `canEdit = true` 時顯示

```typescript
{canEdit && user.nftCampaigns && user.nftCampaigns.length > 0 && (
  // NFT 區塊
)}
```

這意味著**必須滿足三個條件**：

#### 條件 1: `canEdit = true`
- ✅ 必須用 `alphareyer@gmail.com` 登入
- ✅ 訪問的 URL 必須是自己的 User ID

#### 條件 2: `user.nftCampaigns` 存在
- ✅ API 正確返回（已驗證）

#### 條件 3: `user.nftCampaigns.length > 0`
- ✅ 有至少一個 NFT campaign（已驗證）

---

## 🎯 逐步排查

### Step 1: 確認登入狀態

打開瀏覽器開發者工具（F12），在 Console 輸入：

```javascript
// 檢查是否登入
console.log('Token:', localStorage.getItem('token') ? '存在' : '不存在');

// 檢查當前用戶
fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => {
  console.log('當前用戶 email:', d.email);
  console.log('需要的 email:', 'alphareyer@gmail.com');
  console.log('匹配？', d.email === 'alphareyer@gmail.com');
});
```

**如果沒有登入或 email 不匹配**：
1. 登出當前帳號
2. 用 `alphareyer@gmail.com` 重新登入
3. 重新訪問頁面

### Step 2: 檢查 API 返回

在 Console 輸入：

```javascript
fetch('/api/user/YzxQ10RY2SNZhmKM4yO08So4EHS2/public')
  .then(r => r.json())
  .then(d => {
    console.log('=== API 返回 ===');
    console.log('NFT Campaigns:', d.user.nftCampaigns);
    console.log('數量:', d.user.nftCampaigns?.length);
    if (d.user.nftCampaigns?.length > 0) {
      console.log('第一個 NFT:');
      console.log('  Name:', d.user.nftCampaigns[0].name);
      console.log('  已鑄造:', d.user.nftCampaigns[0].alreadyMinted);
      console.log('  圖片:', d.user.nftCampaigns[0].imageUrl);
    }
  });
```

**預期輸出**：
```
NFT Campaigns: Array(1)
數量: 1
第一個 NFT:
  Name: NFT-1
  已鑄造: true
  圖片: /nft-images/nft-1762697173486-73475401.jpg
```

### Step 3: 檢查 canEdit

在 Console 輸入：

```javascript
// 檢查頁面是否認為你可以編輯
const userId = 'YzxQ10RY2SNZhmKM4yO08So4EHS2';
const currentUserEmail = 'alphareyer@gmail.com'; // 你的 email

// 計算 email hash (簡化版檢查)
console.log('URL User ID:', userId);
console.log('當前登入:', currentUserEmail);
console.log('需要匹配才能看到 NFT 區塊');
```

### Step 4: 檢查頁面元素

在 Console 輸入：

```javascript
// 檢查 NFT 區塊是否存在
const hasNFTSection = document.body.textContent.includes('NFT 紀念品');
console.log('NFT 區塊存在？', hasNFTSection);

if (!hasNFTSection) {
  console.log('❌ NFT 區塊沒有渲染');
  console.log('可能原因:');
  console.log('  1. canEdit = false (沒有用正確帳號登入)');
  console.log('  2. nftCampaigns 是空的');
  console.log('  3. 組件渲染問題');
}
```

---

## 🔐 登入流程

### 如果你還沒有登入或登入錯誤帳號

#### Step 1: 登出
訪問：
```
http://localhost:3009/logout
```

或在 Console 執行：
```javascript
localStorage.clear();
sessionStorage.clear();
window.location.href = '/login';
```

#### Step 2: 登入
訪問：
```
http://localhost:3009/login
```

輸入：
- Email: `alphareyer@gmail.com`
- Password: [你的密碼]

#### Step 3: 驗證
登入後，在 Console 檢查：
```javascript
fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => console.log('✅ 登入為:', d.email));
```

#### Step 4: 訪問用戶頁面
```
http://localhost:3009/user/YzxQ10RY2SNZhmKM4yO08So4EHS2
```

---

## 🎨 完整測試流程

### 1. 確保正確登入
```bash
# 在瀏覽器 Console
fetch('/api/auth/me', {
  headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
})
.then(r => r.json())
.then(d => console.log('當前用戶:', d.email));
```

預期: `當前用戶: alphareyer@gmail.com`

### 2. 訪問用戶頁面
```
http://localhost:3009/user/YzxQ10RY2SNZhmKM4yO08So4EHS2
```

### 3. 應該看到

```
參與的團隊
───────────
[團隊卡片...]

NFT 紀念品           ← 應該顯示這個標題
───────────

┌─────────────────────────┐
│                         │ ← 綠色左邊框
│ [NFT 圖片]              │
│                         │
├─────────────────────────┤
│ NFT-1                   │
│ 1st NFT                 │
│ [Sepolia] 1 / 5 已鑄造   │
│ ✅ 已鑄造                │
│    Token #1             │
│ 查看交易記錄 →           │
└─────────────────────────┘
```

---

## 🔧 如果還是不顯示

### 終極調試腳本

在瀏覽器 Console 執行完整診斷：

```javascript
(async function diagnose() {
  console.log('=== 🔍 NFT 顯示診斷 ===\n');
  
  // 1. 檢查登入
  const token = localStorage.getItem('token');
  console.log('1. Token 存在:', !!token);
  
  if (!token) {
    console.log('❌ 未登入！請先登入。');
    return;
  }
  
  // 2. 檢查當前用戶
  try {
    const meRes = await fetch('/api/auth/me', {
      headers: {'Authorization': `Bearer ${token}`}
    });
    const me = await meRes.json();
    console.log('2. 當前用戶:', me.email);
    
    // 3. 檢查 User ID hash
    const userId = 'YzxQ10RY2SNZhmKM4yO08So4EHS2';
    console.log('3. URL User ID:', userId);
    
    // 4. 檢查 API 數據
    const userRes = await fetch(`/api/user/${userId}/public`);
    const userData = await userRes.json();
    console.log('4. NFT Campaigns 數量:', userData.user.nftCampaigns?.length || 0);
    
    if (userData.user.nftCampaigns?.length > 0) {
      const nft = userData.user.nftCampaigns[0];
      console.log('   第一個 NFT:');
      console.log('     Name:', nft.name);
      console.log('     已鑄造:', nft.alreadyMinted);
      console.log('     圖片:', nft.imageUrl);
    }
    
    // 5. 檢查頁面渲染
    const hasSection = document.body.textContent.includes('NFT 紀念品');
    console.log('5. NFT 區塊已渲染:', hasSection);
    
    // 總結
    console.log('\n=== 診斷結果 ===');
    if (!hasSection) {
      console.log('❌ NFT 區塊沒有顯示');
      console.log('\n可能原因:');
      console.log('• Email 不匹配（需要 alphareyer@gmail.com）');
      console.log('• User ID hash 不匹配');
      console.log('• canEdit = false');
      console.log('\n解決方法:');
      console.log('1. 登出並用正確帳號重新登入');
      console.log('2. 確保訪問正確的 User ID');
    } else {
      console.log('✅ NFT 區塊應該已顯示');
      console.log('如果圖片沒有顯示，檢查圖片 URL');
    }
  } catch (error) {
    console.error('診斷失敗:', error);
  }
})();
```

---

## 📝 問題 3: 管理頁面

### 這是正常的設計！

```
http://localhost:3009/admin/nft/campaigns
```

這個頁面**只能管理員訪問**，這是安全設計。

#### 如何成為管理員？

檢查 Firestore：
```
users/{userId}/permissions
```

應該包含 `'super_admin'` 或 `'admin'`

#### 如果你是管理員但無法訪問

1. 檢查 token 是否有效
2. 檢查 permissions 是否正確
3. 重新登入

---

## 🎯 快速解決方案

### 最可能的問題：沒有用正確帳號登入

#### 解決步驟：

1. **登出**
   ```
   http://localhost:3009/logout
   ```

2. **登入**
   ```
   http://localhost:3009/login
   ```
   使用: `alphareyer@gmail.com`

3. **訪問**
   ```
   http://localhost:3009/user/YzxQ10RY2SNZhmKM4yO08So4EHS2
   ```

4. **刷新**
   Ctrl + Shift + R（硬刷新）

5. **應該看到**
   - ✅ 「NFT 紀念品」標題
   - ✅ NFT 卡片（綠色邊框）
   - ✅ 「已鑄造」標籤
   - ✅ NFT 圖片

---

## 🆘 還是不行？

提供以下信息：

1. **瀏覽器 Console 的完整診斷輸出**（使用上面的診斷腳本）
2. **當前登入的 email**
3. **頁面截圖**
4. **Network 標籤中 API 請求的響應**

我會幫你進一步排查！

