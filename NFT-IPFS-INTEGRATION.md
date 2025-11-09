# NFT 系統 IPFS 整合指南

## 📦 概述

NFT 管理系統現已完全整合 IPFS，實現**一鍵自動化**：
1. 上傳 NFT 圖片到 IPFS
2. 批量生成所有 Token 的 Metadata
3. 上傳 Metadata 到 IPFS
4. 部署智能合約（使用 IPFS baseURI）
5. 設置 Merkle Tree 白名單
6. 啟用鑄造功能

**所有操作通過 MetaMask 確認，無需手動輸入私鑰！**

---

## 🚀 快速上手

### 1. 配置 Pinata API

#### 註冊 Pinata
1. 訪問 https://pinata.cloud/
2. 註冊免費帳號（免費套餐足夠測試使用）
3. 登入後，點擊右上角頭像 → API Keys
4. 點擊 "New Key"
5. 權限選擇：
   - ✅ `pinFileToIPFS`
   - ✅ `pinJSONToIPFS`
6. 複製生成的 **JWT Token**

#### 設置環境變數

在項目根目錄的 `.env.local` 文件中添加：

```bash
# Pinata IPFS Configuration
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # 你的 JWT Token
PINATA_GATEWAY=gateway.pinata.cloud                    # 或你的自定義 Gateway
```

**⚠️ 注意：**
- JWT Token 保密，不要提交到 Git
- `.env.local` 應該已經在 `.gitignore` 中

---

### 2. 重啟開發服務器

```bash
npm run dev
```

---

## 🎯 使用流程

### 管理員創建 NFT 活動

1. **訪問管理頁面**
   ```
   http://localhost:3009/admin/nft/campaigns
   ```

2. **點擊「建立新活動」**

3. **填寫表單**
   - **活動名稱**: 例如 "RWA Hackathon Taiwan 2025"
   - **活動描述**: NFT 的詳細描述
   - **NFT 圖片**: 📤 直接上傳圖片文件（支持 PNG, JPG, GIF 等）
   - **區塊鏈網路**: 選擇 Sepolia / Ethereum / Arbitrum
   - **白名單郵箱**: 每行一個，或用逗號分隔
   - **開始/結束日期**: 設置鑄造期限
   - **最大供應量**: NFT 總數（例如：100）

4. **提交表單**
   - 活動將保存到 Firestore
   - 圖片文件暫存在前端 state

---

### 一鍵自動部署

創建活動後，在活動列表中點擊 **「一鍵自動設置」** 按鈕：

#### 📋 自動化流程

**步驟 1: 上傳到 IPFS（自動）**
```
☁️ 準備上傳到 IPFS！

這將：
1. 上傳 NFT 圖片到 IPFS
2. 生成所有 Token 的 Metadata
3. 上傳 Metadata 到 IPFS

請稍候...
```

系統會：
- 上傳圖片到 Pinata → 獲得 `imageCID`
- 生成 1.json, 2.json, ..., N.json（N = maxSupply）
- 每個 Metadata 包含：
  ```json
  {
    "name": "RWA Hackathon Taiwan 2025 #1",
    "description": "NFT description here",
    "image": "ipfs://QmImageCID",
    "attributes": [
      {
        "trait_type": "Edition",
        "value": "1 of 100"
      }
    ]
  }
  ```
- 上傳所有 Metadata → 獲得 `metadataCID`
- 生成 `baseURI`: `ipfs://QmMetadataCID/`

**步驟 2: 連接錢包**
```
🔗 連接 MetaMask...
```

系統會自動：
- 請求 MetaMask 連接
- 檢測當前網路
- 如果網路不匹配，自動切換到正確網路（例如 Sepolia）

**步驟 3: 部署智能合約**
```
📝 準備部署合約！

活動名稱: RWA Hackathon Taiwan 2025
符號: RWAHACK
最大供應量: 100
Base URI: ipfs://QmMetadataCID/

MetaMask 即將彈出，請確認部署交易。
⚠️ 這將花費一些 gas 費用。
```

- MetaMask 會彈出交易確認
- 合約參數自動填充（包括 IPFS baseURI）
- 等待鏈上確認

**步驟 4: 設置 Merkle Tree 白名單**
```
✅ 合約部署成功！

接下來系統會：
1. 生成 Merkle Tree (email 白名單)
2. 設置 Merkle Root 到合約
3. 啟用鑄造功能

請在 MetaMask 中確認交易。
```

- 系統計算所有 email 的 hash
- 生成 Merkle Tree 和 Proofs
- 調用 `setMerkleRoot()` → MetaMask 確認
- 調用 `setMintingEnabled(true)` → MetaMask 確認

**步驟 5: 完成**
```
✅ 設置完成！

合約地址: 0x1a944e994fb18091d5f440663ede719f4a3eed0f
Merkle Root: 0xabc123...
白名單郵箱數: 42

📦 IPFS 圖片 CID: QmPic123...
📦 IPFS Metadata CID: QmMeta456...
🔗 Base URI: ipfs://QmMeta456/

鑄造已啟用，用戶現在可以用 email 鑄造 NFT 了！
```

---

## 🔍 技術細節

### IPFS 上傳 API

**Endpoint**: `POST /api/admin/nft/upload-to-ipfs`

**請求**:
- `multipart/form-data`
- Fields:
  - `image`: 圖片文件
  - `name`: NFT 名稱
  - `description`: 描述
  - `maxSupply`: 最大供應量

**響應**:
```json
{
  "success": true,
  "imageCID": "QmPic...",
  "metadataCID": "QmMeta...",
  "baseURI": "ipfs://QmMeta.../"
}
```

### Metadata 結構

每個 Token 的 Metadata 遵循 OpenSea 標準：

```json
{
  "name": "Collection Name #TokenID",
  "description": "Collection description",
  "image": "ipfs://QmImageCID",
  "attributes": [
    {
      "trait_type": "Edition",
      "value": "1 of 100"
    },
    {
      "trait_type": "Collection",
      "value": "Collection Name"
    }
  ]
}
```

### 智能合約

合約在構造函數中設置 `baseURI`：

```solidity
constructor(
    string memory name_,
    string memory symbol_,
    uint256 maxSupply_,
    string memory baseURI_  // ipfs://QmMetaCID/
) ERC721(name_, symbol_) Ownable(msg.sender) {
    MAX_SUPPLY = maxSupply_;
    baseTokenURI = baseURI_;
    // ...
}
```

Token URI 自動生成：
```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory) {
    return string(abi.encodePacked(baseTokenURI, Strings.toString(tokenId), ".json"));
}
```

例如：
- Token #1 → `ipfs://QmMetaCID/1.json`
- Token #2 → `ipfs://QmMetaCID/2.json`

---

## 🔧 故障排除

### 問題 1: PINATA_JWT 環境變數未設置

**錯誤**:
```
❌ PINATA_JWT 環境變數未設置。
請在 .env.local 中添加 Pinata API 金鑰。
```

**解決**:
1. 檢查 `.env.local` 文件是否存在
2. 確保 `PINATA_JWT=...` 行已添加
3. 重啟開發服務器：`npm run dev`

---

### 問題 2: IPFS 上傳失敗

**可能原因**:
- Pinata JWT Token 無效或過期
- 圖片文件過大（超過 10MB）
- 網路連接問題

**解決**:
1. 檢查 JWT Token 是否正確
2. 壓縮圖片文件（建議 < 5MB）
3. 訪問 https://pinata.cloud/ 確認帳號狀態

---

### 問題 3: MetaMask 沒有彈出

**可能原因**:
- MetaMask 未安裝
- MetaMask 被瀏覽器阻擋

**解決**:
1. 安裝 MetaMask 瀏覽器擴展
2. 檢查瀏覽器是否阻擋彈出視窗
3. 手動點擊 MetaMask 圖標

---

### 問題 4: 合約部署失敗（Gas 不足）

**錯誤**:
```
insufficient funds for gas * price + value
```

**解決**:
1. 確保錢包有足夠的測試幣（Sepolia ETH）
2. 從水龍頭獲取測試幣：
   - Sepolia: https://sepoliafaucet.com/
   - Arbitrum Sepolia: https://faucet.quicknode.com/arbitrum/sepolia

---

### 問題 5: NFT 在 Etherscan 上沒有圖片

**原因**: IPFS 網關可能需要時間同步

**解決**:
1. 等待 1-2 分鐘讓 IPFS 傳播
2. 訪問以下 Gateway 測試：
   - `https://ipfs.io/ipfs/YOUR_CID`
   - `https://gateway.pinata.cloud/ipfs/YOUR_CID`
3. 如果圖片可以在 Gateway 上看到，Etherscan 很快就會顯示

---

## 📊 Gas 費用估算

部署和設置一個 NFT 活動的估算 Gas 費用（Sepolia 測試網）：

| 操作 | Gas 用量 | 估算費用 (Sepolia) |
|------|----------|-------------------|
| 部署合約 | ~2,000,000 gas | ~0.01 ETH |
| 設置 Merkle Root | ~50,000 gas | ~0.0002 ETH |
| 啟用鑄造 | ~30,000 gas | ~0.0001 ETH |
| **總計** | **~2,080,000 gas** | **~0.0103 ETH** |

**主網費用**會更高，取決於當時的 Gas Price。

---

## 🎓 相關文檔

- [MERKLE-TREE-NFT-SYSTEM.md](./MERKLE-TREE-NFT-SYSTEM.md) - Merkle Tree 白名單系統
- [HOW-TO-MINT-NFT.md](./HOW-TO-MINT-NFT.md) - 用戶鑄造指南
- [NFT-COMPLETE-SYSTEM.md](./NFT-COMPLETE-SYSTEM.md) - 完整系統文檔
- [Pinata Documentation](https://docs.pinata.cloud/) - Pinata API 文檔
- [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards) - NFT Metadata 標準

---

## ✅ 優勢

### 相比手動 IPFS 流程：

| 功能 | 手動流程 | 自動化流程 |
|------|---------|-----------|
| 圖片上傳 | 手動上傳到 Pinata | ✅ 自動 |
| Metadata 生成 | 手動創建 JSON | ✅ 自動批量生成 |
| Metadata 上傳 | 手動上傳文件夾 | ✅ 自動 |
| 合約部署 | 終端命令 | ✅ MetaMask 一鍵 |
| baseURI 設置 | 部署後手動設置 | ✅ 部署時自動 |
| 白名單設置 | 終端腳本 | ✅ 自動 Merkle Tree |
| **總時間** | **~30 分鐘** | **~3 分鐘** |

---

## 🔐 安全性

- ✅ **無私鑰洩漏風險**：所有交易通過 MetaMask 確認
- ✅ **IPFS 不可變性**：內容地址確保數據完整性
- ✅ **Merkle Tree 驗證**：高效的鏈上白名單驗證
- ✅ **智能合約審計**：使用 OpenZeppelin 標準庫

---

## 🎉 完成！

你的 NFT 系統現在已完全整合 IPFS！

管理員只需：
1. 上傳圖片
2. 填寫表單
3. 點擊「一鍵自動設置」
4. 在 MetaMask 中確認交易

系統會自動處理所有技術細節！🚀

