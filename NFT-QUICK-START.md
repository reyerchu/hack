# 🚀 NFT 系統快速開始指南

## ✅ 當前狀態

- ✅ 數據庫已清空（沒有舊的 NFT campaigns）
- ✅ 系統已準備好創建新的 NFT 活動
- ✅ 用戶頁面 NFT 列表功能已就緒

---

## 📋 創建第一個 NFT Campaign

### Step 1: 訪問管理面板

打開瀏覽器訪問：
```
http://localhost:3009/admin/nft/campaigns
```

登入管理員帳號（`reyerchu@defintek.io`）

---

### Step 2: 創建新活動

點擊 **「建立新活動」** 按鈕

---

### Step 3: 填寫活動資訊

#### 基本資訊
```
活動名稱: RWA Hackathon Taiwan NFT
描述: 第一屆 RWA 黑客松台灣參與證明 NFT
```

#### 網路設置
```
網路: Sepolia (測試網) ← 選擇這個用於測試
符號: RWAHACK (可選)
```

#### 供應量
```
最大供應量: 100
```

#### 圖片上傳
```
點擊 [選擇檔案] 上傳 NFT 圖片
建議尺寸: 400x400 或更大
格式: PNG、JPG、GIF
```

#### 白名單 Email
```
符合資格的 Email (每行一個):

reyerchu@defintek.io
test@example.com
your-email@example.com
```

💡 **重要**：確保添加你要測試的用戶的 email

#### 時間設置
```
開始日期: 2025-11-09 (今天)
結束日期: 2025-12-31 (一個月後)
```

---

### Step 4: 建立活動

點擊 **「建立活動」** 按鈕

等待成功提示：「✅ 活動建立成功！請點擊「一鍵自動設置」部署合約。」

---

### Step 5: 一鍵自動設置（關鍵步驟）

在剛創建的活動卡片上，找到 **「一鍵自動設置」** 按鈕並點擊

#### 5.1 IPFS 上傳
```
☁️ 準備上傳到 IPFS！

這將：
1. 上傳 NFT 圖片到 IPFS
2. 生成所有 Token 的 Metadata
3. 上傳 Metadata 到 IPFS

請稍候...
```

等待上傳完成（約 10-30 秒）

#### 5.2 MetaMask 連接
```
🔗 連接錢包！

即將：
1. 連接 MetaMask
2. 檢查網路（切換到 Sepolia）
3. 準備部署合約

請點擊 [OK]
```

點擊 OK，然後：
- MetaMask 會彈出
- 選擇你的錢包
- 點擊「連接」

#### 5.3 切換網路
```
🔄 請切換網路！

當前網路: Ethereum Mainnet
需要網路: Sepolia

MetaMask 會提示你切換網路
```

在 MetaMask 中點擊「切換網路」

#### 5.4 部署合約
```
🚀 部署智能合約！

MetaMask 會請求簽署交易
這會在 Sepolia 上部署 NFT 合約

預估 Gas: 0.001-0.003 ETH

請在 MetaMask 中確認交易
```

在 MetaMask 中：
- 檢查 Gas Fee
- 點擊「確認」
- 等待交易確認（約 15-30 秒）

#### 5.5 設置 Merkle Root
```
📋 設置 Merkle Root！

設置白名單（Merkle Tree）
Email 數量: X

請在 MetaMask 中確認交易
```

再次在 MetaMask 中確認交易

#### 5.6 啟用鑄造
```
✅ 啟用鑄造！

最後一步：啟用用戶鑄造功能

請在 MetaMask 中確認交易
```

最後一次在 MetaMask 中確認交易

#### 5.7 完成！
```
✅ 設置完成！

合約地址: 0x...
Merkle Root: 0x...
白名單郵箱數: X

📦 IPFS 圖片 CID: QmXXX...
📦 IPFS Metadata CID: QmYYY...
🔗 Base URI: ipfs://QmYYY.../

鑄造已啟用，用戶現在可以用 email 鑄造 NFT 了！
```

🎉 **恭喜！NFT Campaign 創建完成！**

---

## 🧪 測試 NFT 列表功能

### Step 6: 查看用戶頁面

訪問測試用戶的個人頁面：
```
http://localhost:3009/user/abc9e87e1e0e
```

**前提**：
- 必須用該用戶的帳號登入
- 該用戶的 email 必須在白名單中

### 預期結果

你應該看到：

#### 1. 「參與的團隊」區塊
```
參與的團隊
───────────
[團隊卡片...]
```

#### 2. 「NFT 紀念品」區塊（新增的！）
```
NFT 紀念品
───────────

┌─────────────────────────────────────┐
│                                     │
│       [NFT 圖片 - 192px 高]         │
│                                     │
├─────────────────────────────────────┤
│ RWA Hackathon Taiwan NFT            │
│ 第一屆 RWA 黑客松台灣參與證明 NFT     │
│                                     │
│ [Sepolia] 0 / 100 已鑄造             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │       鑄造 NFT                  │ │ ← 紅色按鈕
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🎯 測試鑄造功能

### Step 7: 點擊「鑄造 NFT」按鈕

會導向鑄造頁面：
```
http://localhost:3009/nft/mint?campaign=xxx
```

按照頁面指示完成鑄造流程

### Step 8: 鑄造成功後

刷新用戶頁面，NFT 卡片會變成：

```
┌─────────────────────────────────────┐
│                                     │ ← 綠色左邊框
│       [NFT 圖片]                    │
│                                     │
├─────────────────────────────────────┤
│ RWA Hackathon Taiwan NFT            │
│ 第一屆 RWA 黑客松台灣參與證明 NFT     │
│                                     │
│ [Sepolia] 1 / 100 已鑄造             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ 已鑄造                        │ │ ← 綠色背景
│ │    Token #1                     │ │
│ └─────────────────────────────────┘ │
│ 查看交易記錄 →                       │
└─────────────────────────────────────┘
```

---

## 🔧 進階功能

### 創建多個 NFT Campaigns

重複 Step 2-5，創建不同的活動：

**範例活動 1**：
```
名稱: RWA Hackathon - 參與證明
描述: 感謝參加第一屆 RWA 黑客松
Email: 所有參賽者
```

**範例活動 2**：
```
名稱: RWA Hackathon - 獲獎紀念
描述: 獲獎團隊限定 NFT
Email: 只有獲獎者
```

**範例活動 3**：
```
名稱: RWA Hackathon - Early Bird
描述: 早鳥報名者專屬
Email: 早期報名的用戶
```

### 測試多個 NFT 顯示

在用戶頁面上會看到**所有相關的 NFT 活動**：

```
NFT 紀念品
───────────

[NFT 卡片 1] [NFT 卡片 2]
[NFT 卡片 3] [NFT 卡片 4]
```

每個卡片獨立顯示狀態：
- ✅ 已鑄造（綠色）
- 🎯 可鑄造（紅色按鈕）
- ⏰ 不可鑄造（灰色，顯示原因）

---

## 📊 管理功能

### 查看所有 Campaigns

訪問：
```
http://localhost:3009/admin/nft/campaigns
```

可以看到：
- 所有已創建的活動
- 每個活動的狀態
- 合約地址
- 鑄造數量
- Merkle Root

### 清空所有 Campaigns（重新開始）

如果需要清空所有 campaigns 重新開始：

```bash
cd /home/reyerchu/hack/hack-dev
node scripts/clean-nft-campaigns.js
```

會刪除：
- ✅ 所有 NFT campaigns
- ✅ 所有 mint records

**注意**：智能合約仍然在區塊鏈上，只是 Firestore 的記錄被清除

---

## 🎨 自定義建議

### NFT 圖片設計

建議尺寸：
- **最小**: 400x400
- **推薦**: 1000x1000 或 1200x1200
- **格式**: PNG（支持透明）、JPG、GIF

設計建議：
- 使用活動 Logo
- 添加活動名稱和日期
- 使用品牌色系
- 保持簡潔清晰

### Email 白名單

來源：
- 從 Firestore `registrations` collection 匯出
- 從團隊報名表匯出
- 手動添加特定用戶

格式：
```
email1@example.com
email2@example.com
email3@example.com
```

每行一個 email，不要有多餘的空格

---

## ⚙️ 技術細節

### 系統架構

```
Admin 創建活動
     ↓
上傳圖片到 IPFS (Pinata)
     ↓
生成 Metadata (OpenSea 標準)
     ↓
部署智能合約 (ERC-721)
     ↓
生成 Merkle Tree (白名單)
     ↓
設置 Merkle Root (on-chain)
     ↓
啟用鑄造
     ↓
用戶查看個人頁面
     ↓
顯示所有相關 NFT 列表
     ↓
用戶點擊 [鑄造 NFT]
     ↓
連接錢包 & 鑄造
     ↓
更新狀態為 [已鑄造]
```

### Firestore 數據結構

**nft_campaigns**:
```javascript
{
  name: string
  description: string
  status: "active" | "draft" | "completed"
  network: "sepolia" | "mainnet" | "arbitrum"
  contractAddress: string
  merkleRoot: string
  merkleProofs: {
    [email: string]: string[]
  }
  imageUrl: string
  maxSupply: number
  currentSupply: number
  startDate: Timestamp
  endDate: Timestamp
  mintingEnabled: boolean
  createdAt: Timestamp
}
```

**nft_mints**:
```javascript
{
  campaignId: string
  userEmail: string
  tokenId: number
  transactionHash: string
  mintedAt: Timestamp
}
```

---

## 🔗 相關文檔

- **NFT-USER-PAGE-LIST.md** - 用戶頁面 NFT 列表功能說明
- **NFT-SYSTEM-COMPLETE.md** - 完整的 NFT 系統文檔
- **NFT-IPFS-INTEGRATION.md** - IPFS 整合技術細節
- **NFT-DEBUG-GUIDE.md** - 問題調試指南
- **FIX-NFT-IMAGE.md** - NFT 圖片問題修復
- **SET-BASE-URI-INSTRUCTIONS.md** - 手動設置 Base URI

---

## 🎯 快速檢查清單

開始前確認：
- [ ] 已安裝 MetaMask
- [ ] MetaMask 有 Sepolia 測試網 ETH
- [ ] 已切換到 Sepolia 網路
- [ ] 已登入管理員帳號
- [ ] 準備好 NFT 圖片

創建時確認：
- [ ] 填寫了活動名稱和描述
- [ ] 上傳了圖片
- [ ] 添加了至少一個 email 到白名單
- [ ] 設置了開始和結束日期
- [ ] 點擊了「建立活動」

部署時確認：
- [ ] 點擊了「一鍵自動設置」
- [ ] 在 MetaMask 中確認了所有 3 個交易
- [ ] 看到了「✅ 設置完成！」提示
- [ ] 活動卡片顯示合約地址和 Merkle Root

測試時確認：
- [ ] 用戶已登入
- [ ] 用戶 email 在白名單中
- [ ] 訪問的是正確的用戶頁面
- [ ] 看到了「NFT 紀念品」區塊
- [ ] 可以點擊「鑄造 NFT」按鈕

---

## 💡 小提示

1. **測試網 ETH 不足？**
   - 訪問：https://sepoliafaucet.com/
   - 或：https://www.alchemy.com/faucets/ethereum-sepolia

2. **圖片太大？**
   - 使用線上工具壓縮：https://tinypng.com/
   - 建議 < 2MB

3. **Email 匹配問題？**
   - 系統會自動轉為小寫
   - 去除前後空格
   - 確保 Firestore 中的 email 一致

4. **MetaMask 交易失敗？**
   - 檢查 Gas 是否足夠
   - 刷新頁面重試
   - 檢查網路連接

5. **想要修改已部署的 Campaign？**
   - 無法直接修改合約
   - 可以創建新的 Campaign
   - 或使用腳本清空重新開始

---

**準備好了嗎？開始創建你的第一個 NFT Campaign 吧！** 🚀

如有任何問題，參考 `NFT-DEBUG-GUIDE.md` 或詢問我！

