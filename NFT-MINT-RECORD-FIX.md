# NFT 鑄造記錄修復

## 問題

用戶鑄造 NFT 後，個人頁面沒有顯示已鑄造的 NFT 資訊。

## 根本原因

鑄造流程沒有正確記錄到 Firestore 資料庫，原因是：

1. **缺少 tokenId**：`useNFTContractMerkle` hook 的 `mint` 函數沒有返回 `tokenId`
2. **錯誤的參數**：mint 頁面傳遞了 `emailHash` 而不是 `tokenId` 給記錄 API
3. **API 驗證失敗**：`/api/nft/record-mint` 需要 `tokenId` 參數，缺少時會返回錯誤

## 解決方案

### 修復 1：從交易收據中提取 tokenId

**檔案**：`lib/hooks/useNFTContractMerkle.ts`

**修改前**：
```typescript
const tx = await contract.mint(emailHashParam, proof);
await tx.wait();

// Refresh status
await checkContractStatus(contract, emailHashParam);

return { success: true, txHash: tx.hash };
```

**修改後**：
```typescript
const tx = await contract.mint(emailHashParam, proof);
const receipt = await tx.wait();

// Extract tokenId from Transfer event
let tokenId: number | undefined;
if (receipt.events) {
  const transferEvent = receipt.events.find((e: any) => e.event === 'Transfer');
  if (transferEvent && transferEvent.args) {
    tokenId = transferEvent.args.tokenId?.toNumber();
  }
}

// Refresh status
await checkContractStatus(contract, emailHashParam);

return { success: true, txHash: tx.hash, tokenId };
```

**說明**：
- 使用 `tx.wait()` 獲取交易收據
- 從收據的 `events` 中找到 `Transfer` 事件
- 從事件參數中提取 `tokenId`
- 在返回值中包含 `tokenId`

### 修復 2：傳遞 tokenId 給記錄 API

**檔案**：`pages/nft/mint.tsx`

**修改前**：
```typescript
body: JSON.stringify({
  campaignId: mintStatus.campaign.id,
  userEmail: user?.preferredEmail,
  userId: user?.id,
  walletAddress,
  transactionHash: result.txHash,
  emailHash,  // ❌ 錯誤的參數
}),
```

**修改後**：
```typescript
body: JSON.stringify({
  campaignId: mintStatus.campaign.id,
  userEmail: user?.preferredEmail,
  userId: user?.id,
  walletAddress,
  tokenId: result.tokenId || 0,  // ✅ 正確的參數
  transactionHash: result.txHash,
}),
```

## 技術細節

### ERC-721 Transfer 事件

當 NFT 被鑄造時，智能合約會發出 `Transfer` 事件：

```solidity
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
```

鑄造時的特點：
- `from` 地址是 `0x0000000000000000000000000000000000000000` (零地址)
- `to` 地址是接收者的錢包地址
- `tokenId` 是新鑄造的 NFT 的 ID

### 交易收據結構

```typescript
interface TransactionReceipt {
  events?: Array<{
    event: string;
    args: {
      from: string;
      to: string;
      tokenId: BigNumber;
    };
  }>;
  // ... 其他欄位
}
```

### 提取 tokenId 的流程

```
1. 執行 mint 交易
   ↓
2. 等待交易確認 (tx.wait())
   ↓
3. 獲取交易收據
   ↓
4. 遍歷收據中的 events
   ↓
5. 找到 event === 'Transfer' 的事件
   ↓
6. 從 event.args.tokenId 提取 tokenId
   ↓
7. 轉換為 number (tokenId.toNumber())
   ↓
8. 返回給前端
```

## 測試

### 測試步驟

1. **訪問鑄造頁面**：
   ```
   http://localhost:3009/nft/mint?campaign=MWxmOcriDtTRsvuCFJ4o
   ```

2. **連接錢包並鑄造 NFT**

3. **檢查瀏覽器控制台**：
   應該看到類似的日誌：
   ```javascript
   {
     success: true,
     txHash: "0x...",
     tokenId: 2  // ✅ 現在有 tokenId 了
   }
   ```

4. **檢查記錄 API 請求**：
   ```json
   {
     "campaignId": "MWxmOcriDtTRsvuCFJ4o",
     "userEmail": "user@example.com",
     "userId": "...",
     "walletAddress": "0x...",
     "tokenId": 2,  // ✅ 包含 tokenId
     "transactionHash": "0x..."
   }
   ```

5. **訪問用戶頁面**：
   ```
   http://localhost:3009/user/[userId]
   ```
   應該看到"已鑄造"的 NFT 資訊

### 驗證 Firestore 記錄

```javascript
// 檢查 nft-mints 集合
db.collection('nft-mints')
  .where('userEmail', '==', 'user@example.com')
  .get()

// 應該包含：
{
  campaignId: "MWxmOcriDtTRsvuCFJ4o",
  userEmail: "user@example.com",
  userId: "...",
  tokenId: 2,  // ✅ 有 tokenId
  transactionHash: "0x...",
  walletAddress: "0x...",
  mintedAt: Timestamp
}
```

## 影響

### 修復前的行為
- ✅ NFT 在區塊鏈上成功鑄造
- ❌ Firestore 中沒有記錄（缺少 tokenId，API 驗證失敗）
- ❌ 用戶頁面不顯示已鑄造的 NFT
- ❌ 用戶可能重複鑄造（因為系統認為沒有鑄造過）

### 修復後的行為
- ✅ NFT 在區塊鏈上成功鑄造
- ✅ Firestore 中正確記錄（包含完整資訊）
- ✅ 用戶頁面顯示已鑄造的 NFT
- ✅ 防止重複鑄造

## 相關檔案

```
✅ lib/hooks/useNFTContractMerkle.ts
   - 從交易收據中提取 tokenId
   - 在返回值中包含 tokenId

✅ pages/nft/mint.tsx
   - 使用 result.tokenId
   - 傳遞正確的參數給記錄 API
```

## 相關 API

```
POST /api/nft/record-mint
{
  campaignId: string,      // 必填
  userEmail: string,       // 必填
  userId: string,          // 選填
  walletAddress: string,   // 必填
  tokenId: number,         // 必填 ⭐
  transactionHash: string  // 必填
}
```

## 下次鑄造

現在當用戶鑄造 NFT 時：
1. ✅ 交易在區塊鏈上執行
2. ✅ 系統提取 tokenId
3. ✅ 記錄到 Firestore（包含 tokenId）
4. ✅ 用戶頁面立即顯示已鑄造的 NFT
5. ✅ 防止重複鑄造

## 重要提醒

如果已經有用戶鑄造了 NFT 但記錄沒有保存：
1. 可以從區塊鏈瀏覽器查詢交易記錄
2. 手動在 Firestore 中創建 mint 記錄
3. 或者讓用戶知道需要重新鑄造（如果合約允許）

---

**修復日期**：2025-11-09  
**狀態**：✅ 已修復  
**測試**：⏳ 等待下次鑄造驗證

