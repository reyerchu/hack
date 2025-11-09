# NFT 系統快速參考

## 🔗 重要連結

### 開發環境
```
管理員頁面：  http://localhost:3009/admin/nft/campaigns
NFT 詳情頁：  http://localhost:3009/nft/[campaignId]
用戶頁面：    http://localhost:3009/user/[userId]
鑄造頁面：    http://localhost:3009/nft/mint?campaign=[campaignId]
```

### 生產環境
```
管理員頁面：  https://hackathon.com.tw/admin/nft/campaigns
NFT 詳情頁：  https://hackathon.com.tw/nft/[campaignId]
用戶頁面：    https://hackathon.com.tw/user/[userId]
鑄造頁面：    https://hackathon.com.tw/nft/mint?campaign=[campaignId]
```

## 📋 API 端點

### 公開 API（無需認證）
```bash
# 獲取活動資訊
GET /api/nft/campaigns/[campaignId]

# 獲取鑄造記錄
GET /api/nft/campaigns/[campaignId]/mints
```

### 管理員 API（需要 super_admin）
```bash
# 創建活動
POST /api/admin/nft/campaigns/create

# 獲取活動列表
GET /api/admin/nft/campaigns/list

# 上傳到 IPFS
POST /api/admin/nft/upload-to-ipfs
```

### 用戶 API（需要登入）
```bash
# 檢查鑄造資格
GET /api/nft/check-eligibility?email=[email]

# 記錄鑄造結果
POST /api/nft/record-mint
```

## 🛠️ 常用指令

### 伺服器管理
```bash
# 啟動開發伺服器
pm2 start ecosystem.config.js --only hack-dev

# 重啟伺服器
pm2 restart hack-dev

# 停止伺服器
pm2 stop hack-dev

# 查看日誌
pm2 logs hack-dev

# 查看最近 50 行日誌
pm2 logs hack-dev --lines 50
```

### 智能合約
```bash
# 編譯合約
cd contracts && npx hardhat compile

# 部署合約（透過前端自動化）
# 在 /admin/nft/campaigns 點擊「自動設置」

# 檢查合約資訊
cd contracts && node scripts/getContractInfo.js

# 啟用鑄造
cd contracts && node scripts/enableMinting.js

# 設置 Base URI
cd contracts && node scripts/setBaseURI.js
```

### 資料庫管理
```bash
# 清理 NFT 資料
node scripts/clean-nft-campaigns.js

# 檢查管理員權限
node scripts/check-admin-permissions.js [email]

# 設置管理員
node scripts/set-admin.js [email]

# 檢查鑄造記錄
node scripts/check-mint-records.js [email]

# 創建測試鑄造記錄
node scripts/create-test-mint-record.js
```

### 測試
```bash
# 測試公開 API
node test-nft-public-api.js [campaignId]
```

## 📊 Firestore 集合

```
nft-campaigns/          # NFT 活動
  - {campaignId}/
    - name              # 活動名稱
    - description       # 活動描述
    - imageUrl          # 圖片 URL
    - network           # 區塊鏈網路
    - contractAddress   # 合約地址
    - maxSupply         # 最大供應量
    - currentSupply     # 當前供應量
    - status            # 狀態 (draft/active/ended)
    - eligibleEmails    # 白名單 email
    - merkleRoot        # Merkle Root
    - merkleProofs      # Merkle Proofs
    - startDate         # 開始日期
    - endDate           # 結束日期

nft-mints/              # 鑄造記錄
  - {mintId}/
    - campaignId        # 活動 ID
    - userEmail         # 用戶 email
    - userId            # 用戶 ID
    - tokenId           # Token ID
    - transactionHash   # 交易哈希
    - walletAddress     # 錢包地址
    - mintedAt          # 鑄造時間

users/                  # 用戶資料
  - {userId}/
    - permissions       # 權限列表
    - ...
```

## 🔐 權限層級

```
無需認證：
  ✅ /nft/[campaignId]
  ✅ /api/nft/campaigns/[campaignId]
  ✅ /api/nft/campaigns/[campaignId]/mints

需要登入：
  🔑 /user/[userId] (本人)
  🔑 /nft/mint
  🔑 /api/nft/check-eligibility
  🔑 /api/nft/record-mint

需要管理員：
  🔒 /admin/nft/campaigns
  🔒 /api/admin/nft/campaigns/create
  🔒 /api/admin/nft/campaigns/list
  🔒 /api/admin/nft/upload-to-ipfs
```

## 🌐 支援的區塊鏈網路

| 網路 | Chain ID | 用途 | RPC |
|-----|----------|------|-----|
| Sepolia | 11155111 | 測試 | Alchemy |
| Arbitrum | 42161 | 生產 | Public |
| Mainnet | 1 | 生產 | Alchemy |

## 🎨 NFT Metadata 結構

```json
{
  "name": "RWA Hackathon Taiwan #1",
  "description": "感謝參與第一屆 RWA 黑客松台灣",
  "image": "ipfs://[CID]/image.png",
  "attributes": []
}
```

## 🔧 環境變數

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
SERVICE_ACCOUNT_PROJECT_ID=
SERVICE_ACCOUNT_CLIENT_EMAIL=
SERVICE_ACCOUNT_PRIVATE_KEY=

# Pinata (IPFS)
PINATA_API_KEY=
PINATA_API_SECRET=
PINATA_JWT=

# Alchemy (Blockchain)
ALCHEMY_API_KEY=
```

## 📖 完整文檔

| 文檔 | 說明 |
|-----|------|
| `NFT-SYSTEM-OVERVIEW.md` | 系統完整架構 |
| `NFT-SYSTEM-COMPLETE.md` | 系統完整功能 |
| `NFT-PUBLIC-PAGE.md` | 公開頁面功能 |
| `NFT-IPFS-INTEGRATION.md` | IPFS 整合說明 |
| `HOW-TO-USE-NFT-SYSTEM.md` | 詳細使用指南 |
| `NFT-QUICK-START.md` | 快速開始 |
| `NFT-DEBUG-GUIDE.md` | 除錯指南 |
| `FIX-NFT-IMAGE.md` | 圖片問題排查 |
| `ADMIN-ACCESS-SETUP-COMPLETE.md` | 管理員設定 |

## 🆘 常見問題速查

| 問題 | 解決方案 |
|-----|---------|
| 管理員頁面顯示 Forbidden | 執行 `node scripts/set-admin.js [email]` |
| NFT 圖片不顯示 | 查看 `FIX-NFT-IMAGE.md` |
| 鑄造失敗 | 檢查網路、白名單、是否已鑄造 |
| 用戶頁面沒有 NFT | 檢查活動狀態、白名單、鑄造記錄 |
| 無法連接 MetaMask | 檢查瀏覽器、MetaMask 是否解鎖 |

## 📞 獲取幫助

1. **查看文檔**：先查看相關的 .md 文檔
2. **檢查日誌**：`pm2 logs hack-dev`
3. **測試 API**：使用測試腳本
4. **查看資料庫**：直接查看 Firestore

---

**版本**：v2.0  
**最後更新**：2025-11-09  
**打印友好**：✅

