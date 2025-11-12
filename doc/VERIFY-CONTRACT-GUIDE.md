# 🔐 驗證合約指南

## 問題
你的合約 `0xE744C67219e200906C7A9393B02315B6180E7df0` 在 Etherscan 上**沒有被驗證**，所以：
- ❌ 看不到 Read Contract / Write Contract 標籤
- ❌ 看不到合約源代碼
- ❌ NFT metadata 無法顯示
- ❌ 圖片無法在 Etherscan 上顯示

## ✅ 解決方案：驗證合約

### 方法 1: 使用 Hardhat 自動驗證（推薦）

#### 步驟 1: 確保有 Etherscan API Key

檢查 `.env.local` 文件中是否有：
```bash
ETHERSCAN_API_KEY=your_api_key_here
```

如果沒有：
1. 訪問 https://etherscan.io/myapikey
2. 登入並創建 API Key
3. 添加到 `.env.local`

#### 步驟 2: 獲取合約部署參數

你需要知道部署合約時使用的**精確參數**：
1. **name** - NFT 集合名稱
2. **symbol** - NFT 符號
3. **maxSupply** - 最大供應量
4. **baseURI** - IPFS metadata URI
5. **merkleRoot** - Merkle tree 根

**從管理後台獲取這些參數**：
- 登入 https://hackathon.com.tw/admin/nft/campaigns
- 找到對應的活動
- 記下所有參數

#### 步驟 3: 運行驗證命令

```bash
cd contracts

npx hardhat verify --network sepolia \
  0xE744C67219e200906C7A9393B02315B6180E7df0 \
  "RWA Hackathon Taiwan 2025" \
  "RWAHACK" \
  104 \
  "ipfs://QmYourMetadataCID" \
  "0xYourMerkleRoot"
```

**替換以下值**：
- `"RWA Hackathon Taiwan 2025"` → 你的實際 NFT 名稱
- `"RWAHACK"` → 你的實際符號
- `104` → 你的實際 maxSupply
- `"ipfs://QmYourMetadataCID"` → 你的實際 IPFS CID
- `"0xYourMerkleRoot"` → 你的實際 Merkle Root

### 方法 2: 使用 Etherscan 網頁界面驗證

#### 步驟 1: 訪問驗證頁面
https://sepolia.etherscan.io/verifyContract?a=0xE744C67219e200906C7A9393B02315B6180E7df0

#### 步驟 2: 選擇編譯器版本
- **Compiler Type**: Solidity (Single file)
- **Compiler Version**: `v0.8.20+commit.a1b79de6` (檢查 `contracts/hardhat.config.js`)
- **License**: MIT

#### 步驟 3: 上傳合約源代碼

合約文件位於：
```
contracts/contracts/RWAHackathonNFT.sol
```

你需要上傳**扁平化**的合約代碼。運行：

```bash
cd contracts
npx hardhat flatten contracts/RWAHackathonNFT.sol > RWAHackathonNFT_flat.sol
```

然後將 `RWAHackathonNFT_flat.sol` 的內容複製到 Etherscan 的表單中。

#### 步驟 4: 輸入構造函數參數

Etherscan 需要 ABI 編碼的構造函數參數。

**獲取 ABI 編碼的參數**：

```bash
cd contracts
node -e "
const ethers = require('ethers');
const args = [
  'RWA Hackathon Taiwan 2025',  // name
  'RWAHACK',                     // symbol
  104,                           // maxSupply
  'ipfs://QmYourCID',           // baseURI
  '0xYourMerkleRoot'            // merkleRoot
];
const iface = new ethers.utils.Interface([
  'constructor(string memory, string memory, uint256, string memory, bytes32)'
]);
const encoded = iface.encodeDeploy(args);
// Remove '0x' and the first 8 characters (function selector)
console.log(encoded.slice(2));
"
```

將輸出的編碼複製到 "Constructor Arguments" 欄位。

### 方法 3: 查找部署交易獲取參數

#### 步驟 1: 找到部署交易
https://sepolia.etherscan.io/address/0xE744C67219e200906C7A9393B02315B6180E7df0

點擊第一筆交易（Contract Creation）

#### 步驟 2: 查看 Input Data

在交易詳情頁面，找到 "Input Data" 欄位。

點擊 "Decode Input Data"（如果可用）來查看構造函數參數。

## 驗證成功後

驗證成功後，你應該能看到：

✅ **Contract** 標籤旁邊有綠色勾選標記
✅ **Code** 標籤顯示合約源代碼
✅ **Read Contract** 標籤可用
✅ **Write Contract** 標籤可用
✅ NFT 頁面顯示圖片和 metadata

## 常見問題

### Q: "Constructor arguments provided do not match"

**A**: 構造函數參數不正確。請確保參數的**順序、類型、值**都完全匹配部署時使用的參數。

### Q: "Compiler version does not match"

**A**: 檢查 `hardhat.config.js` 中的 Solidity 版本，必須與驗證時選擇的版本一致。

### Q: "Contract source code already verified"

**A**: 合約已經驗證過了！刷新頁面應該就能看到 Read/Write Contract 標籤。

### Q: 如何確認 Merkle Root？

**A**: 查看你的資料庫或部署日誌。也可以從合約讀取（如果合約已部署）。

## 🆘 需要幫助？

如果驗證失敗，請提供：
1. Etherscan 錯誤訊息截圖
2. 部署時的完整參數
3. `hardhat.config.js` 中的 Solidity 版本

