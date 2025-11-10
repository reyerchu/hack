# 🚀 立即驗證你的合約

## ✅ 已獲取部署參數

我已經從資料庫中獲取了你的合約部署參數：

```json
{
  "contractAddress": "0xE744C67219e200906C7A9393B02315B6180E7df0",
  "network": "sepolia",
  "name": "test sepolia",
  "symbol": "RWAHACKTW",
  "maxSupply": 2,
  "baseURI": "ipfs://bafkreiaudnw2zbatzu2wjjbvlnqylqyfc35kjbwlginnl4lbdgrpcqbc6y",
  "merkleRoot": "0xd6838d9445c046611678b491e065787dad9c0218f498c58e34fe57ce6954e562"
}
```

## 📝 立即執行驗證

### 步驟 1: 獲取 Etherscan API Key

1. 訪問 https://etherscan.io/myapikey
2. 登入你的 Etherscan 帳號（如果沒有就註冊一個）
3. 點擊 **"Add"** 創建一個新的 API Key
4. 複製生成的 API Key

### 步驟 2: 添加 API Key 到環境變數

編輯 `.env.local` 文件，添加以下行：

```bash
ETHERSCAN_API_KEY=你的API_Key
```

### 步驟 3: 運行驗證命令

在終端執行：

```bash
cd contracts
npx hardhat verify --network sepolia \
  0xE744C67219e200906C7A9393B02315B6180E7df0 \
  "test sepolia" \
  "RWAHACKTW" \
  2 \
  "ipfs://bafkreiaudnw2zbatzu2wjjbvlnqylqyfc35kjbwlginnl4lbdgrpcqbc6y" \
  "0xd6838d9445c046611678b491e065787dad9c0218f498c58e34fe57ce6954e562"
```

或者一行命令：

```bash
cd /home/reyerchu/hack/hack/contracts && npx hardhat verify --network sepolia 0xE744C67219e200906C7A9393B02315B6180E7df0 "test sepolia" "RWAHACKTW" 2 "ipfs://bafkreiaudnw2zbatzu2wjjbvlnqylqyfc35kjbwlginnl4lbdgrpcqbc6y" "0xd6838d9445c046611678b491e065787dad9c0218f498c58e34fe57ce6954e562"
```

### 步驟 4: 驗證成功

驗證成功後，你會看到：

```
Successfully verified contract on Etherscan.
https://sepolia.etherscan.io/address/0xE744C67219e200906C7A9393B02315B6180E7df0#code
```

然後訪問：
https://sepolia.etherscan.io/address/0xE744C67219e200906C7A9393B02315B6180E7df0#readContract

你應該能看到：
✅ **Code** 標籤顯示合約源代碼
✅ **Read Contract** 標籤可用
✅ **Write Contract** 標籤可用

### 步驟 5: 測試 NFT Metadata

驗證成功後，測試 Token URI：

1. 訪問 **Read Contract** 標籤
2. 找到 `tokenURI` 函數
3. 輸入 Token ID: `1`
4. 點擊 **Query**
5. 你會看到返回：`ipfs://bafkreiaudnw2zbatzu2wjjbvlnqylqyfc35kjbwlginnl4lbdgrpcqbc6y`

### 步驟 6: 訪問 NFT 頁面

訪問：https://sepolia.etherscan.io/nft/0xE744C67219e200906C7A9393B02315B6180E7df0/1

**等待 10-15 分鐘**，Etherscan 會自動抓取 metadata 並顯示圖片。

## 🎉 完成！

驗證成功後：
- ✅ 合約在 Etherscan 上完全可見
- ✅ 可以通過 Read Contract 查看所有函數
- ✅ NFT metadata 可以被 Etherscan 讀取
- ✅ 圖片會在 NFT 頁面顯示

## ⚠️ 如果驗證失敗

### 錯誤 1: "Already Verified"

**好消息！** 合約已經驗證過了，直接訪問：
https://sepolia.etherscan.io/address/0xE744C67219e200906C7A9393B02315B6180E7df0#code

### 錯誤 2: "Constructor arguments do not match"

參數不匹配。請確認：
- 名稱、符號、supply 完全正確
- BaseURI 和 MerkleRoot 與部署時一致

### 錯誤 3: "Invalid API Key"

API Key 無效或未設置。請檢查 `.env.local` 文件。

### 錯誤 4: "Compiler version mismatch"

檢查 `contracts/hardhat.config.js` 中的 Solidity 版本是否為 `0.8.20`。

## 📞 需要幫助？

如果遇到問題，請提供：
1. 完整的錯誤訊息
2. Hardhat verify 命令的輸出
3. `hardhat.config.js` 的內容

