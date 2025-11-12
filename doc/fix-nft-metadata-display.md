# 🖼️ 修復 NFT 圖片在 Etherscan 上不顯示

## 問題診斷

NFT 在 Etherscan 上不顯示圖片的常見原因：

### 1️⃣ Metadata 格式問題
你的 metadata 需要包含以下字段：
```json
{
  "name": "NFT Name #1",
  "description": "NFT Description",
  "image": "ipfs://QmImageCID",
  "attributes": [...]
}
```

### 2️⃣ IPFS Gateway 無法訪問
Etherscan 使用自己的 IPFS gateway，可能無法立即訪問新上傳的文件。

### 3️⃣ Etherscan 緩存問題
Etherscan 會緩存 NFT metadata，更新需要時間。

## ✅ 解決方案

### 步驟 1: 檢查你的 TokenURI

1. 訪問合約讀取頁面：
   https://sepolia.etherscan.io/address/0xE744C67219e200906C7A9393B02315B6180E7df0#readContract

2. 找到 `tokenURI` 函數

3. 輸入 Token ID: `1`

4. 點擊 **Query**

5. 你會看到類似：`ipfs://QmXXXXXX`

### 步驟 2: 測試 IPFS 訪問

將你獲得的 IPFS URL 轉換為 HTTP gateway URL：

**方法 A: Pinata Gateway**
```
https://gateway.pinata.cloud/ipfs/QmXXXXXX
```

**方法 B: 公共 Gateway**
```
https://ipfs.io/ipfs/QmXXXXXX
```

**方法 C: Cloudflare Gateway**
```
https://cloudflare-ipfs.com/ipfs/QmXXXXXX
```

在瀏覽器中訪問這些 URL，確認 metadata JSON 可以正常訪問。

### 步驟 3: 檢查 Metadata 內容

確認 JSON 包含 `image` 字段，格式為：
```json
{
  "image": "ipfs://QmImageCID"
}
```

### 步驟 4: 測試圖片 URL

將 `image` 字段中的 IPFS URL 也轉換為 gateway URL 並測試：
```
https://gateway.pinata.cloud/ipfs/QmImageCID
```

確認圖片可以正常加載。

## 🔧 如果仍然不顯示

### 選項 A: 等待 Etherscan 刷新（推薦）
- **等待時間**: 10-30 分鐘
- **原因**: Etherscan 需要時間來索引新的 NFT
- **操作**: 定期刷新頁面查看

### 選項 B: 手動觸發刷新
在某些情況下，Etherscan 提供 "Refresh Metadata" 按鈕。

### 選項 C: 使用 HTTP Gateway URL (緊急修復)

如果你需要立即顯示，可以修改 metadata 使用 HTTP gateway URL 而不是 `ipfs://`：

**修改前**:
```json
{
  "image": "ipfs://QmXXXXXX"
}
```

**修改後**:
```json
{
  "image": "https://gateway.pinata.cloud/ipfs/QmXXXXXX"
}
```

⚠️ **注意**: 這會使 NFT 依賴於特定的 gateway，不是最佳實踐。

## 🎯 預防措施（未來部署）

### 1. 使用可靠的 IPFS 固定服務
- Pinata ✅
- NFT.Storage
- Web3.Storage

### 2. 測試 Metadata 可訪問性
在部署合約前，確認：
- ✅ Metadata JSON 可通過多個 gateway 訪問
- ✅ 圖片可通過多個 gateway 訪問
- ✅ JSON 格式正確

### 3. 添加 external_url
```json
{
  "name": "NFT Name",
  "description": "Description",
  "image": "ipfs://QmImage",
  "external_url": "https://your-website.com/nft/1"
}
```

## 📊 驗證清單

- [ ] TokenURI 可以從合約讀取
- [ ] TokenURI 指向有效的 IPFS CID
- [ ] Metadata JSON 可通過 gateway 訪問
- [ ] JSON 包含 `name`, `description`, `image` 字段
- [ ] Image URL 是有效的 IPFS CID
- [ ] 圖片可通過 gateway 訪問
- [ ] 等待 15 分鐘後刷新 Etherscan

## 🆘 需要幫助？

如果以上步驟都無法解決問題，請提供：
1. Contract Address
2. Token ID
3. TokenURI（從合約讀取的完整 URL）
4. Gateway URL 測試結果的截圖

