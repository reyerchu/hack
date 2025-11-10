# NFT 部署斷點續傳功能說明

## 概述

NFT 自動部署流程現在支持**斷點續傳**功能，即使某個步驟失敗，下次執行時會自動從失敗的地方繼續，而不需要重新開始整個流程。

## 部署流程（3 個步驟）

### ✅ 步驟 1: 上傳到 IPFS
- **操作**: 上傳 NFT 圖片和 metadata 到 IPFS
- **保存內容**: 
  - `imageCID`: 圖片的 IPFS CID
  - `metadataCID`: Metadata 的 IPFS CID
  - `baseURI`: NFT 的 Base URI
- **失敗處理**: 如果上傳失敗，下次執行會重新上傳

### ✅ 步驟 2: 生成 Merkle Tree
- **操作**: 從白名單郵箱生成 Merkle Tree
- **保存內容**:
  - `merkleRoot`: Merkle Tree 的根哈希
  - `totalEmails`: 白名單郵箱數量
- **失敗處理**: 如果生成失敗，下次執行會重新生成

### ✅ 步驟 3: 部署合約
- **操作**: 部署 NFT 智能合約到區塊鏈
- **保存內容**:
  - `contractAddress`: 合約地址
  - `transactionHash`: 部署交易哈希
  - `network`: 部署的網路
- **失敗處理**: 如果部署失敗，下次執行會重新部署

## 數據庫結構

```typescript
interface DeploymentProgress {
  currentStep: 'idle' | 'ipfs' | 'merkle' | 'deploying' | 'complete';
  lastUpdated: Date;
  
  ipfs?: {
    imageCID: string;
    metadataCID: string;
    baseURI: string;
    completedAt: Date;
  };
  
  merkle?: {
    root: string;
    totalEmails: number;
    completedAt: Date;
  };
  
  deployment?: {
    contractAddress: string;
    transactionHash: string;
    network: string;
    completedAt: Date;
  };
}
```

## 使用場景

### 場景 1: 首次部署
1. 用戶點擊「一鍵部署」
2. 系統執行步驟 1 → 2 → 3
3. 每個步驟完成後自動保存進度

### 場景 2: IPFS 上傳失敗
1. 用戶點擊「一鍵部署」
2. 步驟 1 失敗（網絡問題）
3. 用戶重新點擊按鈕
4. 系統顯示「繼續部署」
5. 從步驟 1 重新開始

### 場景 3: 合約部署失敗
1. 用戶點擊「一鍵部署」
2. 步驟 1 ✅ 完成（保存到數據庫）
3. 步驟 2 ✅ 完成（保存到數據庫）
4. 步驟 3 ❌ 失敗（MetaMask 取消）
5. 用戶重新點擊按鈕
6. 系統顯示「繼續部署」
7. 系統自動跳過步驟 1 和 2
8. 直接執行步驟 3

### 場景 4: 頁面刷新後繼續
1. 用戶在步驟 2 時刷新頁面
2. 系統從數據庫載入進度
3. 顯示已完成的步驟（綠色勾選）
4. 用戶點擊「繼續部署」
5. 從步驟 3 開始

## UI 顯示

### 進度條
```
部署進度                                67%
██████████████████░░░░░░░░░

✅ IPFS 上傳 (QmXXXXXX...)
✅ Merkle Tree (104 emails)
⏳ 合約部署
```

### 按鈕狀態
- **首次部署**: 🚀 一鍵部署
- **有未完成進度**: ▶️ 繼續部署
- **部署中**: 🚀 正在部署合約...（禁用）
- **完成**: ✅ 設置完成！

### 提示信息
當檢測到未完成的部署時：
```
💡 檢測到未完成的部署，點擊按鈕將從中斷處繼續
```

## API 端點

### 保存進度
```typescript
POST /api/admin/nft/campaigns/update-deployment-progress

Body:
{
  campaignId: string;
  progress: DeploymentProgress;
}
```

### 讀取進度
```typescript
GET /api/admin/nft/campaigns/{campaignId}

Response:
{
  ...campaignData,
  deploymentProgress: DeploymentProgress
}
```

## 測試流程

### 測試 1: 正常流程
1. 創建新的 NFT campaign
2. 點擊「一鍵部署」
3. 驗證每個步驟都正常執行
4. 驗證數據庫中保存了完整的進度

### 測試 2: IPFS 失敗恢復
1. 斷開網絡
2. 點擊「一鍵部署」
3. IPFS 上傳失敗
4. 恢復網絡
5. 重新點擊按鈕
6. 驗證從 IPFS 步驟重新開始

### 測試 3: MetaMask 取消後恢復
1. 點擊「一鍵部署」
2. 在 MetaMask 彈窗中點擊「拒絕」
3. 驗證步驟 1 和 2 的數據已保存
4. 重新點擊按鈕
5. 驗證直接跳到步驟 3

### 測試 4: 頁面刷新恢復
1. 開始部署
2. 在步驟 2 完成後刷新頁面
3. 驗證進度條顯示正確
4. 驗證已完成步驟顯示綠色勾選
5. 點擊「繼續部署」
6. 驗證從步驟 3 繼續

## 注意事項

1. **IPFS 上傳**: 
   - 如果圖片文件丟失（頁面刷新後），系統會嘗試從 `campaign.imageUrl` 重新下載
   - 如果無法下載，會提示用戶重新上傳

2. **Merkle Tree**:
   - 如果白名單發生變化，需要重新生成
   - 系統會自動檢測並重新生成

3. **合約部署**:
   - 一旦部署成功，就無法重新部署
   - 如果需要修改合約參數，需要創建新的 campaign

4. **數據一致性**:
   - 每個步驟都是原子操作
   - 保存進度使用事務確保一致性

## 常見問題

### Q: 如果在步驟 2 失敗，步驟 1 的 IPFS 數據還在嗎？
A: 是的，步驟 1 的數據已經保存到數據庫，下次會直接使用。

### Q: 如何重置部署進度？
A: 在管理後台刪除 campaign 的 `deploymentProgress` 字段，或創建新的 campaign。

### Q: 進度保存在哪裡？
A: 保存在 Firestore 的 `nft-campaigns` collection 中，每個 campaign 的 `deploymentProgress` 字段。

### Q: 如果修改了白名單，需要重新部署嗎？
A: 不需要！可以使用「添加白名單」或「移除白名單」功能，然後更新合約的 Merkle Root。

## 版本歷史

- **v2.0** (2024-11-10): 新增斷點續傳功能
- **v1.0** (2024-11-09): 初始版本，一次性部署

