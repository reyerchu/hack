# NFT 系統問題和修復方案

## 🐛 問題 1: NFT Symbol 硬編碼為 "RWAHACK"

### 當前狀況
- 所有 NFT 合約的 symbol 都是 "RWAHACK"
- Symbol 在 `contracts/scripts/deploy.js` 中硬編碼
- 管理員無法自定義 Symbol

### 解決方案

#### 步驟 1: 添加 Symbol 輸入到管理員界面

修改 `pages/admin/nft/campaigns.tsx`：
```tsx
// 添加 symbol 狀態
const [campaignSymbol, setCampaignSymbol] = useState('');

// 在表單中添加輸入欄位
<input
  type="text"
  placeholder="NFT 符號（例如：ARBNFT）"
  value={campaignSymbol}
  onChange={(e) => setCampaignSymbol(e.target.value.toUpperCase())}
  maxLength={10}
/>
```

#### 步驟 2: 傳遞 Symbol 到自動設置組件

修改 `components/admin/NFTAutoSetup.tsx`：
```tsx
interface NFTAutoSetupProps {
  // ... existing props
  symbol: string;  // 新增
}

// 在部署合約時使用
await factory.deploy(
  campaign.name,
  campaign.symbol,  // 使用用戶輸入的 symbol
  campaign.maxSupply.toString(),
  baseURI
);
```

#### 步驟 3: 更新部署腳本

修改 `contracts/scripts/deploy.js`：
```javascript
async function main() {
  const name = process.env.NFT_NAME || "RWA Hackathon Taiwan 2025";
  const symbol = process.env.NFT_SYMBOL || "RWAHACK";  // 從環境變量讀取
  
  // ... deploy with symbol
}
```

---

## 🐛 問題 2: IPFS Metadata 結構錯誤

### 當前狀況

**錯誤的結構**（當前）：
```
ipfs://QmZApZXypEEDVkAm2jcLPCKsn6gAeAzaV3x867CrruUjaA
↓ 這是一個 JSON 對象，不是文件夾
{
  "1.json": { "name": "...", "image": "..." },
  "2.json": { "name": "...", "image": "..." }
}
```

**正確的結構**（應該）：
```
ipfs://QmXXXXXX/
├── 1.json  ← 獨立文件
├── 2.json  ← 獨立文件
└── 3.json  ← 獨立文件
```

### 問題原因

`pages/api/admin/nft/upload-to-ipfs.ts` 中：
```javascript
// ❌ 錯誤：上傳一個 JSON 對象
const metadataFiles = {
  "1.json": {...},
  "2.json": {...}
};

await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
  body: JSON.stringify({ pinataContent: metadataFiles })
});
```

### 解決方案

需要使用 Pinata 的文件夾上傳 API，每個 token 的 metadata 作為獨立文件上傳。

#### 方案 A: 使用 Pinata SDK (推薦)

```javascript
const { PinataSDK } = require("pinata-web3");
const pinata = new PinataSDK({ pinataJwt: process.env.PINATA_JWT });

// 創建臨時文件夾
const tempDir = path.join(os.tmpdir(), `nft-metadata-${Date.now()}`);
fs.mkdirSync(tempDir, { recursive: true });

// 為每個 token 創建 JSON 文件
for (let i = 1; i <= totalSupply; i++) {
  const metadata = {
    name: `${name} #${i}`,
    description: description,
    image: imageURL,
    attributes: [...]
  };
  
  fs.writeFileSync(
    path.join(tempDir, `${i}.json`),
    JSON.stringify(metadata, null, 2)
  );
}

// 上傳整個文件夾
const upload = await pinata.upload.folder(tempDir);
const metadataCID = upload.IpfsHash;

// 清理臨時文件
fs.rmSync(tempDir, { recursive: true });
```

#### 方案 B: 手動創建 CAR 文件（複雜）

使用 `ipfs-car` 和 `ipfs-unixfs` 創建正確的 IPFS 目錄結構。

### 對已部署合約的影響

**重要**：已部署的合約（如 0xcE44EcFFD74e2aE35B9F20c7196303c4d0f95355）使用了錯誤的 IPFS 結構。

修復選項：

1. **重新上傳 IPFS 並更新 baseURI**（推薦）
   ```javascript
   // 使用正確方式重新上傳
   const newMetadataCID = await uploadCorrectly();
   
   // 調用合約的 setBaseURI
   await contract.setBaseURI(`ipfs://${newMetadataCID}/`);
   ```

2. **修改智能合約的 tokenURI 函數**（需要重新部署）
   ```solidity
   // 修改合約代碼以適應當前 IPFS 結構
   function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
       string memory baseURI = _baseURI();
       // 去掉 ".json"，讓合約直接返回 baseURI + tokenId
       // 這樣 IPFS gateway 會解析 JSON 對象中的 "1.json" 屬性
   }
   ```

3. **保持現狀，使用自定義 metadata resolver**（不推薦）
   - 在前端/後端添加中間層來解析錯誤的 IPFS 結構
   - 對 OpenSea 等市場不友好

---

## 📝 推薦修復順序

### 階段 1: 快速修復（立即）

1. ✅ 修正 eligibility API（已完成）
2. ✅ 合併鑄造記錄表格（已完成）
3. ⏳ **添加 Symbol 輸入欄位到管理員界面**
   - 修改 `pages/admin/nft/campaigns.tsx`
   - 修改 `components/admin/NFTAutoSetup.tsx`
   - 傳遞 symbol 到合約部署

### 階段 2: IPFS 修復（需要測試）

1. ⏳ **重構 IPFS 上傳邏輯**
   - 使用 Pinata SDK 或手動創建文件夾結構
   - 為每個 token 創建獨立的 JSON 文件
   - 測試確保 OpenSea 能正確顯示

2. ⏳ **為已部署合約更新 baseURI**
   - 重新上傳正確的 metadata
   - 調用 `setBaseURI` 更新合約

### 階段 3: 驗證（測試環境）

1. 在 Sepolia 測試網部署新合約
2. 驗證 OpenSea Testnet 能正確顯示圖片和 metadata
3. 驗證 Arbiscan 能正確顯示 NFT 圖片

---

## 🔗 相關鏈接

- Arbitrum NFT #1: https://arbiscan.io/nft/0xcE44EcFFD74e2aE35B9F20c7196303c4d0f95355/1
- 當前 IPFS CID: QmZApZXypEEDVkAm2jcLPCKsn6gAeAzaV3x867CrruUjaA
- Pinata API Docs: https://docs.pinata.cloud/
- OpenSea Metadata Standards: https://docs.opensea.io/docs/metadata-standards

---

## ⚠️ 注意事項

1. **IPFS 修復需要重新上傳**
   - 已部署的合約需要調用 `setBaseURI`
   - 或者重新部署合約

2. **測試環境優先**
   - 先在 Sepolia 測試新的 IPFS 結構
   - 確認無誤後再應用到主網

3. **Symbol 修改只對新合約有效**
   - 已部署的合約 symbol 無法更改
   - 只能重新部署新合約

