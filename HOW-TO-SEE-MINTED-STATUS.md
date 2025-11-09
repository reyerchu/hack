# 🎯 如何看到「已鑄造」狀態

## 📊 當前情況

### 問題
用戶頁面沒有顯示「已鑄造」(minted) 信息

### 原因
**用戶還沒有鑄造任何 NFT！**

- ❌ Firestore 中沒有 mint 記錄
- ❌ `alreadyMinted: false`
- ❌ 用戶尚未執行鑄造操作

---

## ✅ 已完成的修復

### 1. 啟用了鑄造功能
```
Campaign: NFT-1
Minting: Disabled → Enabled ✅
```

現在用戶可以鑄造 NFT 了！

---

## 🚀 如何看到「已鑄造」狀態

### Step 1: 訪問用戶頁面
```
http://localhost:3009/user/YzxQ10RY2SNZhmKM4yO08So4EHS2
```

**確認登入**：必須用 `alphareyer@gmail.com` 登入

### Step 2: 查看 NFT 區塊

應該看到：

```
NFT 紀念品
───────────

┌─────────────────────────┐
│ [NFT 圖片]              │ ← 紅色左邊框
│ NFT-1                   │
│ 1st NFT                 │
│ [Sepolia] 0 / 5 已鑄造   │
│                         │
│ [  鑄造 NFT  ]          │ ← 紅色按鈕
└─────────────────────────┘
```

### Step 3: 點擊「鑄造 NFT」按鈕

會導向：
```
http://localhost:3009/nft/mint?campaign=MWxmOcriDtTRsvuCFJ4o
```

### Step 4: 完成鑄造流程

#### 4.1 連接 MetaMask
- 點擊「Connect Wallet」
- 選擇 MetaMask
- 確認連接

#### 4.2 切換網路
- 如果不在 Sepolia 測試網
- MetaMask 會提示切換
- 點擊「Switch Network」

#### 4.3 確認鑄造交易
- MetaMask 會彈出交易確認
- 檢查 Gas Fee
- 點擊「確認」

#### 4.4 等待交易確認
- 等待約 15-30 秒
- 頁面會顯示「✅ 鑄造成功！」

### Step 5: 回到用戶頁面

訪問：
```
http://localhost:3009/user/YzxQ10RY2SNZhmKM4yO08So4EHS2
```

**刷新頁面**（重要！）

### Step 6: 看到「已鑄造」狀態！

現在會顯示：

```
NFT 紀念品
───────────

┌─────────────────────────┐
│ [NFT 圖片]              │ ← 綠色左邊框 ✅
│ NFT-1                   │
│ 1st NFT                 │
│ [Sepolia] 1 / 5 已鑄造   │ ← 供應量增加
│                         │
│ ✅ 已鑄造                │ ← 綠色背景
│    Token #1             │ ← 顯示 Token ID
│ 查看交易記錄 →           │ ← Etherscan 連結
└─────────────────────────┘
```

---

## 🎨 視覺變化對比

### 鑄造前（當前狀態）
```
┌─────────────────────────┐
│                         │ ← 紅色左邊框
│ [鑄造 NFT]              │ ← 紅色按鈕
└─────────────────────────┘
```

### 鑄造後（目標狀態）
```
┌─────────────────────────┐
│                         │ ← 綠色左邊框
│ ✅ 已鑄造                │ ← 綠色標籤
│    Token #1             │
│ 查看交易記錄 →           │
└─────────────────────────┘
```

---

## 🧪 測試用快速鑄造

### 如果你想快速測試「已鑄造」狀態

#### 方法 1: 實際鑄造（推薦）
按照上面的 Step 1-6 完成真實的鑄造流程

#### 方法 2: 模擬鑄造記錄（僅測試用）
```bash
cd /home/reyerchu/hack/hack-dev
cat > create-test-mint.js << 'EOF'
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
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
}

const db = admin.firestore();

async function createTestMint() {
  const mintRef = db.collection('nft-mints').doc();
  
  await mintRef.set({
    campaignId: 'MWxmOcriDtTRsvuCFJ4o',
    userEmail: 'alphareyer@gmail.com',
    tokenId: 1,
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    mintedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Update campaign supply
  await db.collection('nft-campaigns').doc('MWxmOcriDtTRsvuCFJ4o').update({
    currentSupply: admin.firestore.FieldValue.increment(1)
  });
  
  console.log('✅ Test mint record created!');
  console.log('Now refresh the user page to see "已鑄造" status.');
  process.exit(0);
}

createTestMint();
EOF
node create-test-mint.js && rm create-test-mint.js
```

然後刷新用戶頁面。

⚠️ **注意**：這只是模擬記錄，並不是真正的區塊鏈交易。

---

## 📊 API 響應變化

### 鑄造前
```json
{
  "nftCampaigns": [
    {
      "eligible": true,
      "alreadyMinted": false,      ← 未鑄造
      "currentSupply": 0
    }
  ]
}
```

### 鑄造後
```json
{
  "nftCampaigns": [
    {
      "eligible": false,           ← 不能再鑄造
      "alreadyMinted": true,       ← 已鑄造 ✅
      "currentSupply": 1,
      "mintRecord": {              ← 新增記錄
        "mintedAt": "2025-11-09T...",
        "transactionHash": "0x...",
        "tokenId": 1
      }
    }
  ]
}
```

---

## 🔍 驗證「已鑄造」狀態

### 在瀏覽器 Console 中檢查

```javascript
// 檢查 API 返回
fetch('/api/user/YzxQ10RY2SNZhmKM4yO08So4EHS2/public')
  .then(r => r.json())
  .then(d => {
    const campaign = d.user.nftCampaigns[0];
    console.log('已鑄造？', campaign.alreadyMinted);
    console.log('Mint 記錄：', campaign.mintRecord);
  });

// 檢查頁面顯示
console.log('顯示已鑄造？', 
  document.body.textContent.includes('已鑄造'));
```

### 檢查 Firestore

```bash
# 檢查 mint 記錄
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
    console.log(`✅ Found ${s.size} mint(s) for alphareyer@gmail.com`);
    if (s.size > 0) {
      s.forEach(d => {
        const data = d.data();
        console.log('   Token ID:', data.tokenId);
        console.log('   TX Hash:', data.transactionHash);
        console.log('   Minted At:', data.mintedAt?.toDate());
      });
    }
    process.exit(0);
  });
EOF
node check.js && rm check.js
```

---

## 🎯 總結

### 為什麼看不到「已鑄造」？

**因為用戶還沒有鑄造 NFT！**

### 如何看到「已鑄造」？

**執行鑄造流程**：

1. ✅ 訪問用戶頁面（用正確帳號登入）
2. ✅ 點擊 [鑄造 NFT] 按鈕
3. ✅ 連接 MetaMask
4. ✅ 確認交易
5. ✅ 等待交易完成
6. ✅ 刷新頁面
7. ✅ 看到「已鑄造」狀態！

### 當前狀態

- ✅ Minting 已啟用
- ✅ 用戶在白名單中
- ✅ Campaign 是 active
- ✅ 合約已部署
- ⏳ 等待用戶執行鑄造

### 下一步

**開始鑄造**！
```
http://localhost:3009/user/YzxQ10RY2SNZhmKM4yO08So4EHS2
```

點擊紅色的 [鑄造 NFT] 按鈕，完成鑄造後就會看到綠色的「已鑄造」狀態了！

---

**需要我幫你創建一個測試的 mint 記錄嗎？這樣你就能立即看到「已鑄造」的效果，而不需要實際執行鑄造流程。** 🎯

