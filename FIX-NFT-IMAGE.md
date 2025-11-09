# 🖼️ 修復 NFT 圖片不顯示問題

## 問題描述

你的 NFT 在 Etherscan 上不顯示圖片：
- 合約地址：`0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c`
- 網路：Sepolia
- URL：https://sepolia.etherscan.io/nft/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c/1

**原因**：合約部署時 `baseURI` 是空的，所以 `tokenURI()` 返回的是無效的路徑。

---

## 🚀 解決方案

### 方案 A：使用自動化腳本（推薦）

#### 步驟 1：準備你的 IPFS Metadata CID

如果你還沒有上傳 metadata 到 IPFS，先上傳：

```bash
cd /home/reyerchu/hack/hack-dev

# 測試 IPFS 上傳（如果需要）
# 這會生成一個測試 metadata 並返回 CID
```

或者使用之前測試時的 CID：`QmZ43cZMtXrmNqZcz4o14nExvfiVZcdSifnnakg9m6nMYT`

#### 步驟 2：設置環境變數並運行腳本

```bash
cd /home/reyerchu/hack/hack-dev/contracts

# 設置合約地址和 Base URI
export CONTRACT_ADDRESS=0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c
export BASE_URI=ipfs://QmZ43cZMtXrmNqZcz4o14nExvfiVZcdSifnnakg9m6nMYT/

# 運行腳本（Sepolia 測試網）
npx hardhat run scripts/setBaseURI.js --network sepolia
```

#### 步驟 3：等待確認

腳本會：
1. ✅ 檢查當前 baseURI 狀態
2. ✅ 發送交易設置新的 baseURI
3. ✅ 等待交易確認
4. ✅ 驗證更新成功
5. ✅ 顯示 IPFS Gateway 鏈接

#### 步驟 4：驗證

等待 1-2 分鐘後，訪問：
```
https://sepolia.etherscan.io/nft/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c/1
```

圖片應該會顯示！

---

### 方案 B：通過 Etherscan 手動設置

如果你不想用腳本，可以直接在 Etherscan 上操作：

#### 步驟 1：訪問 Write Contract 頁面

```
https://sepolia.etherscan.io/address/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c#writeContract
```

#### 步驟 2：連接錢包

點擊 "Connect to Web3" 按鈕，連接你的 MetaMask（必須是合約 owner 的錢包）

#### 步驟 3：找到 setBaseURI 函數

往下滾動找到 `setBaseURI` 函數

#### 步驟 4：輸入 Base URI

在 `newBaseURI (string)` 輸入框中輸入：

```
ipfs://QmZ43cZMtXrmNqZcz4o14nExvfiVZcdSifnnakg9m6nMYT/
```

⚠️ **重要**：
- 必須包含 `ipfs://` 前綴
- 必須包含尾部斜線 `/`

#### 步驟 5：執行交易

1. 點擊 "Write" 按鈕
2. 在 MetaMask 中確認交易
3. 等待交易確認（~15-30 秒）

#### 步驟 6：驗證

刷新 NFT 頁面，圖片應該會顯示！

---

## 📝 Base URI 格式說明

### 正確格式

```
ipfs://QmZ43cZMtXrmNqZcz4o14nExvfiVZcdSifnnakg9m6nMYT/
```

- ✅ 包含 `ipfs://` 前綴
- ✅ 包含尾部斜線 `/`
- ✅ 使用你的實際 Metadata CID

### 錯誤格式

❌ `QmZ43cZMtXrmNqZcz4o14nExvfiVZcdSifnnakg9m6nMYT`（缺少前綴和斜線）

❌ `ipfs://QmZ43cZMtXrmNqZcz4o14nExvfiVZcdSifnnakg9m6nMYT`（缺少尾部斜線）

❌ `https://gateway.pinata.cloud/ipfs/QmZ...`（不要用 HTTP gateway）

### TokenURI 生成

當你設置 `baseURI = ipfs://QmZ43.../` 後：

- Token #1: `ipfs://QmZ43.../1.json`
- Token #2: `ipfs://QmZ43.../2.json`
- Token #N: `ipfs://QmZ43.../N.json`

---

## 🔍 驗證步驟

### 1. 檢查 baseTokenURI

訪問 Read Contract 頁面：
```
https://sepolia.etherscan.io/address/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c#readContract
```

找到 `baseTokenURI` 函數並點擊 "Query"

**應該返回**：`ipfs://QmZ43cZMtXrmNqZcz4o14nExvfiVZcdSifnnakg9m6nMYT/`

### 2. 檢查 tokenURI

在同一頁面找到 `tokenURI` 函數

輸入 `tokenId: 1` 並點擊 "Query"

**應該返回**：`ipfs://QmZ43cZMtXrmNqZcz4o14nExvfiVZcdSifnnakg9m6nMYT/1.json`

### 3. 測試 IPFS Gateway

訪問（替換為你的實際 CID）：
```
https://gateway.pinata.cloud/ipfs/QmZ43cZMtXrmNqZcz4o14nExvfiVZcdSifnnakg9m6nMYT/1.json
```

**應該顯示**：
```json
{
  "name": "Collection Name #1",
  "description": "...",
  "image": "ipfs://QmImageCID...",
  "attributes": [...]
}
```

### 4. 檢查 NFT 頁面

訪問：
```
https://sepolia.etherscan.io/nft/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c/1
```

**應該看到**：NFT 圖片和 metadata

---

## 🆘 常見問題

### Q1: 執行腳本時報錯 "caller is not the owner"

**A**: 你需要使用合約 owner 的錢包。檢查：
1. `.env.local` 中的 `PRIVATE_KEY` 是否是 owner 的私鑰
2. 或者確保你的 MetaMask 切換到了 owner 帳號

### Q2: 設置後圖片還是不顯示

**A**: 嘗試以下步驟：
1. 等待 2-5 分鐘（Etherscan 需要時間更新）
2. 清除瀏覽器緩存
3. 驗證 IPFS Gateway 可以訪問你的 metadata
4. 檢查 metadata 中的 `image` 欄位是否正確

### Q3: 我的 metadata 還沒上傳到 IPFS

**A**: 使用我們的自動化系統：
1. 訪問：`http://localhost:3009/admin/nft/campaigns`
2. 創建新活動並上傳圖片
3. 系統會自動上傳到 IPFS 並返回 CID
4. 使用這個 CID 設置 baseURI

### Q4: 我想重新部署合約

**A**: 如果這是測試合約，重新部署更簡單：
1. 訪問 Admin 頁面創建新活動
2. 點擊「一鍵自動設置」
3. 系統會自動部署新合約（baseURI 已正確設置）

---

## 📋 快速命令參考

### 設置 Base URI（使用你的實際值）

```bash
# Sepolia 測試網
cd /home/reyerchu/hack/hack-dev/contracts
CONTRACT_ADDRESS=0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c \
BASE_URI=ipfs://YOUR_METADATA_CID/ \
npx hardhat run scripts/setBaseURI.js --network sepolia

# Ethereum 主網
CONTRACT_ADDRESS=0x... \
BASE_URI=ipfs://YOUR_METADATA_CID/ \
npx hardhat run scripts/setBaseURI.js --network mainnet

# Arbitrum
CONTRACT_ADDRESS=0x... \
BASE_URI=ipfs://YOUR_METADATA_CID/ \
npx hardhat run scripts/setBaseURI.js --network arbitrum
```

### 檢查合約信息

```bash
cd /home/reyerchu/hack/hack-dev/contracts
CONTRACT_ADDRESS=0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c \
npx hardhat run scripts/getContractInfo.js --network sepolia
```

---

## 🎯 總結

1. **最快方式**：通過 Etherscan Write Contract 手動設置（3 分鐘）
2. **自動化方式**：使用 Hardhat 腳本（5 分鐘）
3. **最佳方式**：下次使用 Admin 系統創建活動（自動處理所有事情）

**你的 NFT 圖片很快就會在 Etherscan 上顯示了！** 🎉

---

**需要幫助？** 告訴我你遇到的具體錯誤訊息，我可以協助你排查！

