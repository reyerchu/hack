# 🔧 手動驗證合約（Etherscan 網頁界面）

由於 Hardhat 驗證出現超時，使用 Etherscan 網頁界面手動驗證更可靠！

## 📋 準備好的文件

✅ 扁平化的合約源代碼：`/tmp/RWAHackathonNFT_flat.sol` (4424 行)

## 🚀 手動驗證步驟

### 步驟 1: 訪問 Etherscan 驗證頁面

直接訪問：
```
https://sepolia.etherscan.io/verifyContract?a=0xE744C67219e200906C7A9393B02315B6180E7df0
```

### 步驟 2: 填寫基本信息

**Contract Address** (已自動填入)
```
0xE744C67219e200906C7A9393B02315B6180E7df0
```

**Compiler Type**
```
選擇: Solidity (Single file)
```

**Compiler Version**
```
選擇: v0.8.20+commit.a1b79de6
```

**Open Source License Type**
```
選擇: 3) MIT License (MIT)
```

點擊 **Continue**

### 步驟 3: 輸入合約源代碼

**Contract Source Code:**

複製扁平化的合約內容：

```bash
cat /tmp/RWAHackathonNFT_flat.sol
```

將**完整內容**複製並貼到 Etherscan 的文本框中。

### 步驟 4: 優化設置

**Optimization**
```
選擇: Yes
```

**Runs (Optimizer)**
```
輸入: 200
```

### 步驟 5: 構造函數參數 (ABI-encoded)

**Constructor Arguments ABI-encoded:**

從部署交易中獲取：

1. 訪問部署交易：
   https://sepolia.etherscan.io/address/0xE744C67219e200906C7A9393B02315B6180E7df0

2. 點擊第一筆交易（Contract Creation）

3. 在交易詳情頁面，找到 **Input Data** 區塊

4. 點擊 **View Input As > UTF-8**

5. 你會看到一串很長的十六進制數據，複製從 **bytecode 之後** 的部分

**或者，手動輸入參數：**

如果 Etherscan 提供 "Add Arguments" 按鈕，點擊它並輸入：

```
Argument [0] (string): test sepolia
Argument [1] (string): RWAHACKTW
Argument [2] (uint256): 2
Argument [3] (string): ipfs://bafkreiaudnw2zbatzu2wjjbvlnqylqyfc35kjbwlginnl4lbdgrpcqbc6y
Argument [4] (bytes32): 0xd6838d9445c046611678b491e065787dad9c0218f498c58e34fe57ce6954e562
```

### 步驟 6: 驗證並發布

1. 完成 reCAPTCHA 驗證

2. 點擊 **Verify and Publish**

3. 等待 10-30 秒處理

## ✅ 驗證成功

驗證成功後，你會看到：

```
✓ Contract Source Code Verified
```

然後你可以訪問：

- **合約源代碼**: https://sepolia.etherscan.io/address/0xE744C67219e200906C7A9393B02315B6180E7df0#code
- **Read Contract**: https://sepolia.etherscan.io/address/0xE744C67219e200906C7A9393B02315B6180E7df0#readContract
- **Write Contract**: https://sepolia.etherscan.io/address/0xE744C67219e200906C7A9393B02315B6180E7df0#writeContract
- **NFT 頁面**: https://sepolia.etherscan.io/nft/0xE744C67219e200906C7A9393B02315B6180E7df0/1

## ⏰ NFT 圖片顯示

驗證成功後：
- **等待 10-15 分鐘**
- Etherscan 會自動抓取 IPFS metadata
- 圖片會在 NFT 頁面顯示

## 📝 快速檢查清單

- [ ] 訪問驗證頁面
- [ ] 選擇 Solidity (Single file)
- [ ] 選擇 Compiler v0.8.20
- [ ] 選擇 MIT License
- [ ] 貼上扁平化的合約代碼
- [ ] 啟用 Optimization，設為 200
- [ ] 輸入構造函數參數
- [ ] 完成 reCAPTCHA
- [ ] 點擊 Verify and Publish
- [ ] 等待驗證完成

## ⚠️ 常見錯誤

### "Constructor arguments are invalid"

**解決方法：** 從部署交易的 Input Data 複製正確的編碼參數

### "Compiler version mismatch"

**解決方法：** 確保選擇 `v0.8.20+commit.a1b79de6`

### "Source code does not match"

**解決方法：**
1. 確保使用扁平化的合約（`/tmp/RWAHackathonNFT_flat.sol`）
2. 確保 Optimization 設為 Yes，Runs 為 200

## 🎉 完成！

驗證成功後，你的 NFT 合約就完全可見了！

- ✅ 合約源代碼公開
- ✅ Read/Write Contract 功能可用
- ✅ NFT metadata 可被讀取
- ✅ 圖片會自動顯示在 Etherscan 上

---

**需要幫助？** 截圖任何錯誤訊息並告訴我！

