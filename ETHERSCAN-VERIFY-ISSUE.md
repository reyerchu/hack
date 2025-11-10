# Etherscan 驗證問題報告

## 問題描述
自動驗證合約時遇到以下錯誤：
```
You are using a deprecated V1 endpoint, switch to Etherscan API V2 using https://docs.etherscan.io/v2-migration
```

## 當前狀態
- **合約地址**: 0x19A199B12Dfbbd59642c20d1EBDA18e476089688
- **網路**: Sepolia Testnet
- **狀態**: 已部署但未驗證（無綠色勾勾）

## 解決方案

### 選項 1: 手動驗證（最快）
請參考 `MANUAL-VERIFY-GUIDE.md` 文件中的步驟進行手動驗證。

### 選項 2: 等待 API 更新
Etherscan 已棄用 V1 API endpoint。我們需要：
1. 參考 https://docs.etherscan.io/v2-migration 更新 API 調用
2. 更新 `pages/api/admin/nft/verify-contract-direct.ts`
3. 重新測試驗證流程

### 選項 3: 使用 Hardhat 插件
Hardhat 的 etherscan 插件應該會自動處理 API 版本。嘗試：
```bash
cd contracts
npx hardhat verify --network sepolia \
  0x19A199B12Dfbbd59642c20d1EBDA18e476089688 \
  "test green" \
  "RWAHACK" \
  3 \
  "ipfs://QmPK1s3pNYLi49thSbCM5aXbD7ZdQw4gQ6E5s1KWzgXTkj" \
  "0x0000000000000000000000000000000000000000000000000000000000000000"
```

注意：如果遇到 "Headers Timeout Error"，請稍後重試或使用手動驗證。

## 臨時解決方案
在自動驗證系統修復之前，新部署的合約需要手動驗證。請按照以下步驟：

1. 前往 Etherscan 驗證頁面
2. 使用扁平化的合約程式碼
3. 提供正確的 constructor arguments

詳細步驟請參考 `MANUAL-VERIFY-GUIDE.md`。

## 技術細節
- Etherscan API V1 已被標記為棄用
- 需要遷移到 V2 endpoint
- V2 API URL 可能是：`https://api-sepolia.etherscan.io/v2/api`（待確認）
- API 參數格式可能需要調整

## 下一步行動
1. 閱讀 Etherscan V2 遷移文件
2. 更新驗證 API
3. 測試新的驗證流程
4. 更新自動部署流程

## 緊急聯絡
如果需要立即驗證合約，請使用手動驗證方式。

