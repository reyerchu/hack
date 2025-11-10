# 自動驗證系統說明

## 系統架構

我們實作了一個全自動的合約驗證系統，使用 Hardhat CLI 進行驗證，並包含以下功能：

### 1. Hardhat CLI 驗證
- 使用 `npx hardhat verify` 指令
- 正確傳遞 `--network` 參數
- 自動處理 constructor arguments

### 2. 重試機制
- 最多重試 3 次
- 每次重試間隔 10 秒
- 專門處理 Etherscan API 超時錯誤

### 3. 智能錯誤處理
- 自動檢測合約是否已驗證
- 區分不同類型的錯誤（超時、已驗證、其他）
- 提供詳細的錯誤訊息

## API Endpoint

### `/api/admin/nft/verify-contract-hardhat`

**請求格式：**
```json
{
  "contractAddress": "0x...",
  "network": "sepolia",
  "constructorArgs": {
    "name": "NFT Name",
    "symbol": "SYMBOL",
    "maxSupply": 100,
    "baseURI": "ipfs://...",
    "merkleRoot": "0x..."
  }
}
```

**成功回應：**
```json
{
  "success": true,
  "message": "Contract verified successfully",
  "contractAddress": "0x...",
  "network": "sepolia",
  "etherscanUrl": "https://sepolia.etherscan.io/address/0x...#code",
  "output": "驗證輸出..."
}
```

## 整合到部署流程

在 `NFTAutoSetup.tsx` 中，自動驗證已整合為部署流程的一部分：

```typescript
// STEP 3.5: Auto-Verify Contract on Etherscan
console.log('[AutoSetup] 🔍 Starting automatic contract verification...');
setStep('Verifying contract on Etherscan...');

try {
  const verifyResponse = await fetch('/api/admin/nft/verify-contract-hardhat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contractAddress,
      network,
      constructorArgs: { ... },
    }),
  });

  const verifyResult = await verifyResponse.json();

  if (verifyResult.success) {
    console.log('[AutoSetup] ✅ Contract verified on Etherscan!');
    // 保存驗證狀態到 Firestore
    await saveProgress({
      currentStep: 'deploying',
      deployment: {
        ...existingDeployment,
        verified: true,
        verifiedAt: new Date(),
        etherscanUrl: verifyResult.etherscanUrl,
      },
    });
  }
} catch (verifyError: any) {
  console.warn('[AutoSetup] ⚠️ Verification error:', verifyError.message);
  // 不中斷部署流程，允許稍後手動驗證
}
```

## 常見問題

### Q: 為什麼還是遇到 Headers Timeout Error？
A: 這是 Etherscan API 的問題，不是我們的程式碼問題。系統會自動重試 3 次，每次間隔 10 秒。

### Q: 如何手動重試驗證？
A: 可以通過 API 手動觸發：
```bash
curl -X POST http://localhost:3008/api/admin/nft/verify-contract-hardhat \
  -H "Content-Type: application/json" \
  -d '{ "contractAddress": "0x...", "network": "sepolia", "constructorArgs": {...} }'
```

### Q: 驗證失敗會影響部署嗎？
A: 不會。驗證失敗只會記錄警告，不會中斷整個部署流程。合約仍然可以正常使用。

### Q: 如何確認驗證成功？
A: 檢查以下位置：
1. Firestore 中的 `deploymentProgress.deployment.verified` 欄位
2. Etherscan 頁面上的綠色勾勾
3. API 回應中的 `success: true`

## 優勢

1. **自動化**：無需手動操作，部署後自動驗證
2. **可靠性**：重試機制處理 API 超時
3. **容錯性**：驗證失敗不影響合約功能
4. **可追溯**：所有驗證狀態記錄在 Firestore

## 技術細節

- **使用工具**: Hardhat etherscan plugin
- **超時設置**: 120 秒
- **重試次數**: 3 次
- **重試間隔**: 10 秒
- **支援網路**: Sepolia, Arbitrum, Ethereum Mainnet

## 未來改進

1. 支援更多網路
2. 動態調整重試間隔
3. 添加驗證隊列系統
4. 實作 webhook 通知
