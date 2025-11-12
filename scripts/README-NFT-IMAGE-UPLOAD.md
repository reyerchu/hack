# NFT 圖片上傳工具

## 問題描述

NFT campaign `gowcTOCfgjEwHWzvg3ss` 的圖片文件 `/nft-images/nft-1762733956077-798510506.jpg` 不存在，導致網頁無法顯示圖片。

## 解決方案

提供了兩個腳本來修復這個問題：

### 選項 1：快速修復 - 更新圖片 URL（推薦）

**腳本**：`update-nft-image-url.js`

**功能**：
- 複製圖片文件到 `public/nft-images/`
- 更新資料庫中的 `imageUrl`

**使用方法**：

```bash
# 方法 A：複製本地圖片文件
cd /home/reyerchu/hack/hack/scripts
node update-nft-image-url.js gowcTOCfgjEwHWzvg3ss /path/to/your/image.jpg

# 方法 B：使用現有的圖片 URL（如果圖片已在 IPFS 上）
node update-nft-image-url.js gowcTOCfgjEwHWzvg3ss https://gateway.pinata.cloud/ipfs/QmXXX... --url

# 方法 C：使用現有的其他 NFT 圖片
node update-nft-image-url.js gowcTOCfgjEwHWzvg3ss /home/reyerchu/hack/hack/public/nft-images/nft-1762727592843-476355122.png
```

### 選項 2：完整解決方案 - 上傳到 IPFS（最佳）

**腳本**：`upload-nft-image-to-ipfs.js`

**功能**：
- 上傳圖片到 IPFS（Pinata）
- 獲得永久的去中心化 URL
- 更新資料庫中的 `imageUrl` 和 `deploymentProgress`

**使用方法**：

```bash
cd /home/reyerchu/hack/hack/scripts
node upload-nft-image-to-ipfs.js gowcTOCfgjEwHWzvg3ss /path/to/your/image.jpg
```

**前提條件**：
- 需要設置環境變數 `PINATA_JWT`
- 或確保 `.env.local` 中有 `PINATA_JWT`

## 範例

### 使用現有的最新圖片文件

```bash
cd /home/reyerchu/hack/hack/scripts

# 使用最新的圖片文件（11/10 06:33）
node update-nft-image-url.js gowcTOCfgjEwHWzvg3ss \
  ../public/nft-images/nft-1762727592843-476355122.png
```

### 從外部路徑複製新圖片

```bash
# 假設您有一個新圖片在 /tmp/nft-image.jpg
node update-nft-image-url.js gowcTOCfgjEwHWzvg3ss /tmp/nft-image.jpg
```

### 使用 IPFS URL（如果已知）

```bash
# 如果圖片已經在 IPFS 上
node update-nft-image-url.js gowcTOCfgjEwHWzvg3ss \
  https://gateway.pinata.cloud/ipfs/QmYourImageHash --url
```

## 下一步

執行完腳本後：

1. 訪問 NFT 頁面確認圖片顯示：
   https://hackathon.com.tw/nft/gowcTOCfgjEwHWzvg3ss

2. 檢查瀏覽器 Console 確認 `imageUrl` 已更新

3. 如果使用本地文件路徑，建議稍後上傳到 IPFS 以獲得永久性

## 注意事項

⚠️ **本地文件的限制**：
- `public/nft-images/` 中的文件不在 git 中
- 伺服器重啟或部署可能導致文件丟失
- **建議最終使用 IPFS URL**

✅ **IPFS 的優勢**：
- 去中心化存儲
- 永久性（只要有人 pin 住）
- 更符合 NFT 標準
- 不依賴特定伺服器

