# 📊 NFT 用戶頁面狀態說明

## 🔍 當前情況

### 用戶信息
```
User ID: YzxQ10RY2SNZhmKM4yO08So4EHS2
Email: alphareyer@gmail.com
Display Name: Reyer
```

### NFT Campaign 狀態
```json
{
  "campaignId": "MWxmOcriDtTRsvuCFJ4o",
  "name": "NFT-1",
  "description": "1st NFT",
  "network": "sepolia",
  "contractAddress": "0x52d8BdaeC6AFb0c54D24Fc14949dd9755424b86f",
  "maxSupply": 5,
  "currentSupply": 0,
  "eligible": true,         ← 可以鑄造
  "alreadyMinted": false,   ← 尚未鑄造
  "startDate": "2025-11-09",
  "endDate": "2025-11-11"
}
```

---

## ✅ 預期顯示

### 訪問頁面
```
http://localhost:3009/user/YzxQ10RY2SNZhmKM4yO08So4EHS2
```

### 應該看到

#### 1. 必須用本人帳號登入
- ❗ **重要**：必須用 `alphareyer@gmail.com` 帳號登入
- 如果用其他帳號登入，不會顯示 NFT 區塊（因為 `canEdit = false`）

#### 2. NFT 紀念品區塊
```
NFT 紀念品
───────────

┌─────────────────────────────────────┐
│                                     │ ← 紅色左邊框
│       [NFT 圖片]                    │
│       /nft-images/nft-...jpg        │
│                                     │
├─────────────────────────────────────┤
│ NFT-1                               │
│ 1st NFT                             │
│                                     │
│ [Sepolia] 0 / 5 已鑄造               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │       鑄造 NFT                  │ │ ← 紅色按鈕（可點擊）
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 3. 點擊「鑄造 NFT」後
會導向鑄造頁面：
```
http://localhost:3009/nft/mint?campaign=MWxmOcriDtTRsvuCFJ4o
```

---

## ❓ 如果沒有顯示 NFT 區塊

### 可能的原因

#### 1. 沒有用正確的帳號登入（最常見）
```
當前登入: 其他帳號
需要登入: alphareyer@gmail.com
```

**解決方法**：
1. 登出當前帳號
2. 用 `alphareyer@gmail.com` 重新登入
3. 刷新頁面

#### 2. URL 不對
```
錯誤: http://localhost:3009/user/abc9e87e1e0e
正確: http://localhost:3009/user/YzxQ10RY2SNZhmKM4yO08So4EHS2
```

**解決方法**：
- 使用正確的 User ID

#### 3. 瀏覽器緩存
**解決方法**：
- 硬刷新頁面（Ctrl + Shift + R）
- 或清除緩存

#### 4. 前端代碼檢查
檢查頁面 HTML 中是否有 NFT 區塊：

**打開開發者工具（F12）**：
1. 進入 Elements 標籤
2. 搜索 "NFT 紀念品"
3. 檢查是否有這個區塊

**檢查條件**：
```typescript
{canEdit && user.nftCampaigns && user.nftCampaigns.length > 0 && (
  // NFT 區塊只在這三個條件都滿足時顯示
)}
```

---

## 🧪 測試步驟

### Step 1: 確認登入狀態
1. 打開開發者工具（F12）
2. 進入 Console 標籤
3. 輸入：
```javascript
console.log('Logged in:', !!localStorage.getItem('token'));
```

應該顯示：`Logged in: true`

### Step 2: 檢查 canEdit
在 Console 中輸入：
```javascript
fetch('/api/user/YzxQ10RY2SNZhmKM4yO08So4EHS2/public')
  .then(r => r.json())
  .then(d => console.log('User data:', d));
```

檢查返回的數據中：
- ✅ `nftCampaigns` 應該是陣列且不為空
- ✅ `nftCampaigns[0].eligible` 應該是 `true`
- ✅ `nftCampaigns[0].alreadyMinted` 應該是 `false`

### Step 3: 檢查頁面元素
在 Console 中輸入：
```javascript
document.querySelector('h2')?.textContent.includes('NFT 紀念品');
```

應該返回：`true`

如果返回 `false` 或 `undefined`，說明區塊沒有渲染。

---

## 🎯 鑄造後的預期變化

### 鑄造前（當前狀態）
```json
{
  "eligible": true,
  "alreadyMinted": false
}
```

顯示：**[鑄造 NFT]** 按鈕（紅色）

### 鑄造後
```json
{
  "eligible": false,
  "alreadyMinted": true,
  "mintRecord": {
    "mintedAt": "2025-11-09T...",
    "transactionHash": "0x...",
    "tokenId": 1
  }
}
```

顯示：
```
┌─────────────────────────────────────┐
│                                     │ ← 綠色左邊框
│       [NFT 圖片]                    │
│                                     │
├─────────────────────────────────────┤
│ NFT-1                               │
│ 1st NFT                             │
│                                     │
│ [Sepolia] 1 / 5 已鑄造               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ 已鑄造                        │ │ ← 綠色背景
│ │    Token #1                     │ │
│ └─────────────────────────────────┘ │
│ 查看交易記錄 →                       │ ← 連結到 Etherscan
└─────────────────────────────────────┘
```

---

## 🔧 調試命令

### 檢查 API 返回
```bash
curl -s "http://localhost:3009/api/user/YzxQ10RY2SNZhmKM4yO08So4EHS2/public" | python3 -m json.tool
```

### 檢查 Mint 記錄
```bash
cd /home/reyerchu/hack/hack-dev
cat > check.js << 'EOF'
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });
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
admin.firestore().collection('nft-mints')
  .where('userEmail', '==', 'alphareyer@gmail.com')
  .get()
  .then(s => {
    console.log(`Found ${s.size} mints`);
    s.forEach(d => console.log(d.data()));
    process.exit(0);
  });
EOF
node check.js && rm check.js
```

---

## 📝 總結

### 當前狀態
- ✅ 用戶在 NFT Campaign 的白名單中
- ✅ NFT Campaign 是 active 狀態
- ✅ 用戶尚未鑄造 NFT（`alreadyMinted: false`）
- ✅ 用戶可以鑄造（`eligible: true`）

### 預期行為
- ✅ 顯示「NFT 紀念品」區塊
- ✅ 顯示 [鑄造 NFT] 紅色按鈕
- ✅ 點擊後進入鑄造流程

### 如果沒有顯示
最可能的原因是：
1. **沒有用正確的帳號登入**（`alphareyer@gmail.com`）
2. **訪問的不是正確的 User ID**
3. **瀏覽器緩存**

### 測試建議
1. 確認用 `alphareyer@gmail.com` 登入
2. 訪問：`http://localhost:3009/user/YzxQ10RY2SNZhmKM4yO08So4EHS2`
3. 應該看到 NFT 區塊和鑄造按鈕
4. 點擊鑄造按鈕測試鑄造流程

---

**問題**：你說「didn't show the minted NFT」

**回答**：這是正常的！因為用戶**還沒有鑄造**任何 NFT（`alreadyMinted: false`）。

頁面應該顯示的是 **[鑄造 NFT]** 按鈕（讓用戶可以去鑄造），而不是「已鑄造」標籤。

如果你想看「已鑄造」的狀態，需要先完成鑄造流程。

---

**需要確認的事項**：
1. ✅ 用 `alphareyer@gmail.com` 登入了嗎？
2. ✅ 訪問的是正確的 URL 嗎？
3. ✅ 看到「NFT 紀念品」區塊了嗎？
4. ✅ 看到 [鑄造 NFT] 按鈕了嗎？

如果以上都是 ✅，那就是正常的！點擊「鑄造 NFT」按鈕開始鑄造流程。

如果以上有 ❌，請告訴我具體哪一步有問題！

