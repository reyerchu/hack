# NFT IPFS Upload 指南

此文件夾包含準備上傳到 IPFS 的 NFT 資源。

## 📁 文件夾結構

```
nft-ipfs-upload/
├── images/          # 放置 NFT 圖片
│   ├── 1.png
│   ├── 2.png
│   └── ...
├── metadata/        # Metadata JSON 文件
│   ├── 1.json
│   ├── 2.json
│   └── ...
└── README.md        # 本文件
```

## 🎨 步驟 1：準備圖片

1. 將你的 NFT 圖片放入 `images/` 文件夾
2. 命名為：`1.png`, `2.png`, `3.png` 等
3. 推薦尺寸：1000x1000 或更大
4. 格式：PNG 或 JPG

## ☁️ 步驟 2：上傳圖片到 IPFS

### 使用 Pinata（推薦）

1. 訪問 https://pinata.cloud/ 並註冊
2. 點擊 "Upload" → "Folder"
3. 選擇 `images/` 文件夾
4. 上傳完成後，複製 CID
5. 記下這個 CID，格式如：`QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### 使用 NFT.Storage

1. 訪問 https://nft.storage/
2. 註冊並登入
3. 使用他們的上傳工具
4. 獲取 CID

## 📝 步驟 3：更新 Metadata

在 `metadata/` 文件夾中的每個 JSON 文件：

1. 打開 `1.json`, `2.json` 等
2. 找到 `"image": "ipfs://REPLACE_WITH_YOUR_IMAGE_CID"`
3. 替換為你的實際圖片 CID：

如果你的圖片文件夾 CID 是 `QmABC123...`：
- 對於 `1.json`: `"image": "ipfs://QmABC123.../1.png"`
- 對於 `2.json`: `"image": "ipfs://QmABC123.../2.png"`
- 等等...

## ☁️ 步驟 4：上傳 Metadata 到 IPFS

1. 更新完所有 metadata JSON 後
2. 使用 Pinata 或 NFT.Storage
3. 上傳整個 `metadata/` 文件夾
4. 獲得 metadata 文件夾的 CID，例如：`QmDEF456...`

## 🔧 步驟 5：設置合約 baseURI

在終端執行：

```bash
cd /home/reyerchu/hack/hack-dev/contracts

CONTRACT_ADDRESS=0x1a944e994fb18091d5f440663ede719f4a3eed0f \
BASE_URI=ipfs://YOUR_METADATA_FOLDER_CID/ \
npx hardhat run scripts/setBaseURI.js --network sepolia
```

⚠️ **重要**：
- 替換 `YOUR_METADATA_FOLDER_CID` 為你的 metadata CID
- BASE_URI 結尾必須有斜線 `/`

例如：
```bash
BASE_URI=ipfs://QmDEF456XXXXXXXXXXXXXXXXXXXXX/ \
```

## ✅ 步驟 6：驗證

1. 等待交易確認（約 15-30 秒）
2. 訪問 Sepolia Etherscan：
   https://sepolia.etherscan.io/nft/0x1a944e994fb18091d5f440663ede719f4a3eed0f/1
3. 刷新頁面，應該會看到圖片和 metadata！

## 🔗 測試 IPFS 鏈接

你可以通過以下網關測試你的 IPFS 鏈接：

- `https://ipfs.io/ipfs/YOUR_CID`
- `https://gateway.pinata.cloud/ipfs/YOUR_CID`
- `https://cloudflare-ipfs.com/ipfs/YOUR_CID`

## 💡 快速範例

假設：
- 圖片 CID: `QmPicture123...`
- Metadata CID: `QmMetadata456...`

則：
- 圖片 URL: `ipfs://QmPicture123.../1.png`
- Metadata URL: `ipfs://QmMetadata456.../1.json`
- Base URI: `ipfs://QmMetadata456.../`

## 🆘 需要幫助？

如果遇到問題：
1. 檢查 JSON 格式是否正確
2. 確認 CID 是否正確
3. 確認 BASE_URI 結尾有斜線
4. 查看合約 logs

---

**準備好了嗎？開始上傳你的 NFT 到 IPFS！** ☁️

