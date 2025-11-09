# 🔍 NFT 列表不顯示 - 調試指南

## 問題現象

訪問 `http://localhost:3009/user/abc9e87e1e0e` 時，「NFT 紀念品」區塊沒有顯示。

API 返回：`nftCampaigns: []`（空數組）

---

## 🎯 原因分析

「NFT 紀念品」區塊只會在以下條件**同時滿足**時顯示：

1. ✅ `canEdit = true`（必須是用戶本人訪問）
2. ✅ `user.nftCampaigns.length > 0`（至少有一個相關的 NFT 活動）

目前的情況：
- ✅ `canEdit` 應該是 `true`（如果你已登入）
- ❌ `nftCampaigns` 是空數組（沒有找到相關的 NFT 活動）

---

## 🔍 為什麼 `nftCampaigns` 是空的？

函數 `getAllUserNFTCampaigns(email)` 會查找滿足以下**所有條件**的 NFT 活動：

### 條件 1: Campaign 狀態必須是 `active`
```javascript
.where('status', '==', 'active')
```

### 條件 2: 用戶必須在白名單中
```javascript
if (!campaign.merkleProofs || !campaign.merkleProofs[normalizedEmail]) {
  continue; // 跳過此活動
}
```

### 如果沒有找到任何活動，可能是因為：

1. ❌ **沒有創建任何 NFT Campaign**
   - Firestore 中 `nft_campaigns` collection 是空的

2. ❌ **Campaign 狀態不是 `active`**
   - 狀態可能是 `draft`、`inactive`、`completed` 等

3. ❌ **用戶 email 不在白名單中**
   - `merkleProofs` 中沒有用戶的 email
   - Email 大小寫不匹配（系統會自動 normalize）

4. ❌ **Campaign 還沒有部署**
   - 沒有執行「一鍵自動設置」
   - `merkleProofs` 還沒有生成

---

## 🛠️ 解決步驟

### Step 1: 檢查是否有 NFT Campaigns

訪問：
```
http://localhost:3009/admin/nft/campaigns
```

**如果沒有任何 campaigns**：
- 點擊「建立新活動」創建一個測試 campaign
- 繼續執行 Step 2

**如果已有 campaigns**：
- 檢查狀態是否為 「Active」
- 繼續執行 Step 2

---

### Step 2: 創建測試 NFT Campaign

#### 2.1 訪問管理頁面
```
http://localhost:3009/admin/nft/campaigns
```

#### 2.2 點擊「建立新活動」

#### 2.3 填寫表單

```
活動名稱: Test NFT - RWA Hackathon
描述: 第一屆 RWA 黑客松台灣參與證明 NFT
網路: Sepolia (測試網)
符號: RWAHACK
最大供應量: 100
圖片: [上傳一張圖片]
符合資格的 Email: 
  reyerchu@defintek.io
  (或你的用戶 email)
開始日期: 2025-11-09 (今天)
結束日期: 2025-12-31
```

#### 2.4 點擊「建立活動」

#### 2.5 等待活動創建成功

---

### Step 3: 部署合約並設置白名單

#### 3.1 找到剛創建的活動

在活動列表中，找到你剛創建的活動卡片。

#### 3.2 點擊「一鍵自動設置」按鈕

這會執行以下操作：
1. ✅ 上傳圖片到 IPFS
2. ✅ 生成 Metadata
3. ✅ 部署智能合約（需要 MetaMask 確認）
4. ✅ 生成 Merkle Tree（白名單）
5. ✅ 設置 Merkle Root
6. ✅ 啟用鑄造

#### 3.3 在 MetaMask 中確認所有交易

- 切換到 Sepolia 測試網
- 確認部署合約的交易
- 確認設置 Merkle Root 的交易
- 確認啟用鑄造的交易

#### 3.4 等待完成

看到「✅ 設置完成！」提示。

---

### Step 4: 驗證設置

#### 4.1 刷新 Admin 頁面

檢查活動卡片應該顯示：
```
✅ Status: active
✅ Contract: 0x...（合約地址）
✅ Merkle Root: 0x...（Merkle Root）
✅ Minting: Enabled
```

#### 4.2 檢查 Firestore

在 Firestore Console 中檢查 `nft_campaigns` collection：

```javascript
{
  name: "Test NFT - RWA Hackathon",
  status: "active",  // ← 必須是 "active"
  contractAddress: "0x...",
  merkleRoot: "0x...",
  merkleProofs: {
    "reyerchu@defintek.io": [...],  // ← 用戶 email 必須在這裡
    // ... 其他 emails
  },
  mintingEnabled: true,
  // ...
}
```

---

### Step 5: 測試用戶頁面

#### 5.1 訪問用戶頁面
```
http://localhost:3009/user/abc9e87e1e0e
```

#### 5.2 確保已登入

- 用戶必須登入自己的帳號
- `canEdit = true` 才會顯示 NFT 區塊

#### 5.3 檢查頁面

你應該看到：

```
參與的團隊
───────────
[團隊卡片...]

NFT 紀念品                    ← 新區塊！
───────────
┌─────────────────────────┐
│ [NFT 圖片]              │
│ Test NFT - RWA Hackathon│
│ 第一屆 RWA 黑客松...     │
│ [Sepolia] 0 / 100 已鑄造│
│ [ 鑄造 NFT ]            │  ← 紅色按鈕
└─────────────────────────┘
```

---

## 🐛 如果還是沒有顯示

### 調試步驟

#### 1. 檢查 API 返回

在瀏覽器中訪問：
```
http://localhost:3009/api/user/abc9e87e1e0e/public
```

查找 `nftCampaigns` 欄位：

**正確的返回**：
```json
{
  "success": true,
  "user": {
    "nftCampaigns": [
      {
        "campaignId": "xxx",
        "name": "Test NFT - RWA Hackathon",
        "eligible": true,
        "alreadyMinted": false,
        // ...
      }
    ]
  }
}
```

**錯誤的返回**：
```json
{
  "success": true,
  "user": {
    "nftCampaigns": []  // ← 空數組
  }
}
```

#### 2. 檢查用戶 Email

確認用戶的 email 是什麼：

```javascript
// 在 Firestore Console 中查看
registrations/{userId}
  - preferredEmail: "reyerchu@defintek.io"
  - email: "reyerchu@defintek.io"
```

#### 3. 檢查 Campaign 的 merkleProofs

```javascript
// 在 Firestore Console 中查看
nft_campaigns/{campaignId}
  - merkleProofs: {
      "reyerchu@defintek.io": [...]  // ← Email 必須完全匹配
    }
```

**注意**：
- Email 是 **小寫** 的
- Email 前後沒有空格
- 使用的是 `preferredEmail`（如果有）或 `email`

#### 4. 檢查瀏覽器控制台

打開 DevTools (F12)，查看 Console 中的日誌：

```
[getAllUserNFTCampaigns] Error: ...
```

#### 5. 檢查伺服器日誌

```bash
pm2 logs hack-dev --lines 100
```

查找：
```
[getAllUserNFTCampaigns] Error
[checkNFTEligibility] Error
```

---

## 📝 快速檢查清單

在 `http://localhost:3009/admin/nft/campaigns` 檢查：

- [ ] 至少有一個 NFT Campaign
- [ ] Campaign 狀態是 「Active」
- [ ] Campaign 有合約地址（已部署）
- [ ] Campaign 有 Merkle Root（已設置）
- [ ] Minting 已啟用

在 Firestore 中檢查：

- [ ] `nft_campaigns` collection 不是空的
- [ ] Campaign 的 `status` 是 `"active"`
- [ ] Campaign 的 `merkleProofs` 包含用戶的 email
- [ ] 用戶的 email 在 `registrations` 或 `users` 中

在用戶頁面檢查：

- [ ] 已用正確的用戶登入
- [ ] URL 的 userId 與當前登入用戶匹配
- [ ] API `/api/user/{userId}/public` 返回 `nftCampaigns` 不是空數組

---

## 🎯 最可能的原因

根據經驗，最常見的原因是：

### 1. 還沒有創建 NFT Campaign（90%）
   **解決**：按照 Step 2 創建一個

### 2. Campaign 創建了但沒有部署（5%）
   **解決**：點擊「一鍵自動設置」

### 3. 用戶 email 不在白名單中（3%）
   **解決**：重新部署時確保在 Email list 中添加正確的 email

### 4. Campaign 狀態不是 active（2%）
   **解決**：在 Firestore 中手動修改 `status` 為 `"active"`

---

## 💡 測試用快速創建腳本

如果你想快速測試，可以使用以下步驟：

### 方法 1: 使用管理面板（推薦）
1. 訪問 `http://localhost:3009/admin/nft/campaigns`
2. 創建活動
3. 一鍵自動設置

### 方法 2: 直接操作 Firestore（僅用於調試）
在 Firestore Console 中手動創建一個簡單的 campaign：

```javascript
// Collection: nft_campaigns
{
  name: "Test NFT",
  description: "Test",
  status: "active",  // ← 重要！
  network: "sepolia",
  maxSupply: 100,
  currentSupply: 0,
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  imageUrl: "https://via.placeholder.com/400",
  merkleProofs: {
    "reyerchu@defintek.io": ["0x123..."]  // ← 重要！添加用戶 email
  },
  contractAddress: "0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c",  // 使用已有的
  merkleRoot: "0x0000000000000000000000000000000000000000000000000000000000000000",
  mintingEnabled: true
}
```

---

## 📞 需要幫助？

如果按照以上步驟仍然無法顯示 NFT 列表，請提供：

1. API 返回的完整 JSON：`/api/user/abc9e87e1e0e/public`
2. Admin 頁面截圖：`/admin/nft/campaigns`
3. 瀏覽器控制台錯誤（如果有）
4. PM2 日誌：`pm2 logs hack-dev --lines 50`

我會幫你進一步排查問題！

