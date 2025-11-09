# 🎯 設置 NFT Base URI - 手動操作指南

## ✅ Step 1: 已完成 - Metadata 已上傳到 IPFS

你的 NFT metadata 已經成功上傳到 IPFS：

```
Metadata CID: QmXxNe85MgMRx4SsGzAxAiMdDULMVgjwoD6obezUipjpCw
Base URI: ipfs://QmXxNe85MgMRx4SsGzAxAiMdDULMVgjwoD6obezUipjpCw/
```

### 驗證 Metadata

你可以訪問以下網址確認 metadata 存在：

- Token #1: https://gateway.pinata.cloud/ipfs/QmXxNe85MgMRx4SsGzAxAiMdDULMVgjwoD6obezUipjpCw
- 內容包含: `{"1.json": {...}, "2.json": {...}, ...}`

---

## 🚀 Step 2: 通過 Etherscan 設置 Base URI（推薦）

### 操作步驟：

#### 1. 訪問合約的 Write Contract 頁面

打開瀏覽器，訪問：

```
https://sepolia.etherscan.io/address/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c#writeContract
```

#### 2. 連接 MetaMask

- 點擊頁面上的 **"Connect to Web3"** 按鈕
- 選擇 **MetaMask**
- 確認連接（必須使用合約 owner 的錢包）
- ⚠️ **重要**：確保你的 MetaMask 切換到 **Sepolia 測試網**

#### 3. 找到 `setBaseURI` 函數

- 往下滾動，找到 **"8. setBaseURI"** 函數
- 展開該函數

#### 4. 輸入 Base URI

在 `newBaseURI (string)` 輸入框中，**精確複製貼上**以下內容：

```
ipfs://QmXxNe85MgMRx4SsGzAxAiMdDULMVgjwoD6obezUipjpCw/
```

⚠️ **非常重要**：
- ✅ 必須包含 `ipfs://` 前綴
- ✅ 必須包含最後的斜線 `/`
- ❌ 不要有任何多餘的空格或換行

#### 5. 執行交易

1. 點擊 **"Write"** 按鈕
2. MetaMask 會彈出交易確認視窗
3. 檢查：
   - Gas Fee（應該很低，大約 0.0001-0.0005 ETH）
   - Network（確認是 Sepolia）
4. 點擊 **"確認"** 確認交易
5. 等待交易確認（約 15-30 秒）

#### 6. 確認成功

交易確認後，你會看到交易的 hash。點擊它可以查看交易詳情。

---

## 🔍 Step 3: 驗證設置

### 3.1 檢查 Base URI

訪問 Read Contract 頁面：

```
https://sepolia.etherscan.io/address/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c#readContract
```

1. 找到 **"baseTokenURI"** 函數
2. 點擊 **"Query"**
3. **應該顯示**：`ipfs://QmXxNe85MgMRx4SsGzAxAiMdDULMVgjwoD6obezUipjpCw/`

### 3.2 檢查 Token URI

在同一頁面：

1. 找到 **"tokenURI"** 函數
2. 輸入 `tokenId (uint256)`: **1**
3. 點擊 **"Query"**
4. **應該顯示**：`ipfs://QmXxNe85MgMRx4SsGzAxAiMdDULMVgjwoD6obezUipjpCw/1.json`

### 3.3 查看 NFT 圖片

訪問你的 NFT 頁面：

```
https://sepolia.etherscan.io/nft/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c/1
```

⏰ **等待 1-2 分鐘**，然後：
1. 刷新頁面
2. NFT 圖片應該會顯示！
3. Metadata 也會顯示（名稱、描述、屬性）

---

## 📱 完整操作截圖指南

### 步驟截圖：

1. **連接 MetaMask**
   - 點擊 "Connect to Web3"
   - 選擇你的錢包
   - 確認連接

2. **setBaseURI 函數**
   ```
   [輸入框顯示]
   newBaseURI (string): ipfs://QmXxNe85MgMRx4SsGzAxAiMdDULMVgjwoD6obezUipjpCw/
   
   [Write 按鈕]
   ```

3. **MetaMask 確認**
   ```
   Contract Interaction
   To: 0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c
   Function: setBaseURI
   
   [確認] [拒絕]
   ```

---

## 🆘 常見問題

### Q1: 點擊 "Write" 後沒有反應

**A**: 
1. 確認 MetaMask 已連接
2. 確認你的錢包是合約 owner
3. 確認你在 Sepolia 網絡上
4. 刷新頁面重試

### Q2: MetaMask 顯示 "execution reverted"

**A**: 可能原因：
- ❌ 你的錢包不是合約 owner
- ❌ Base URI 格式不正確（檢查是否有多餘空格）
- ❌ 合約被暫停（unlikely）

**解決方法**：
1. 確認 owner 地址：訪問 Read Contract → 查詢 `owner()` 函數
2. 切換到正確的 MetaMask 帳號
3. 重新嘗試

### Q3: 設置成功但圖片還是不顯示

**A**: 
1. ⏰ **等待 2-5 分鐘**（Etherscan 需要時間更新）
2. 清除瀏覽器緩存（Ctrl + Shift + Del）
3. 嘗試無痕模式打開 NFT 頁面
4. 驗證 tokenURI 是否正確（參考步驟 3.2）

### Q4: 我沒有 Sepolia ETH 支付 Gas

**A**: 
1. 訪問 Sepolia Faucet: https://sepoliafaucet.com/
2. 或者: https://www.alchemy.com/faucets/ethereum-sepolia
3. 輸入你的錢包地址獲取測試 ETH

### Q5: 不確定哪個錢包是 owner

**A**: 
1. 訪問: https://sepolia.etherscan.io/address/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c#readContract
2. 找到 `owner` 函數
3. 點擊 "Query"
4. 顯示的地址就是 owner 地址
5. 在 MetaMask 中切換到該地址

---

## 🎉 成功標誌

當你完成後，應該看到：

### ✅ Etherscan NFT 頁面
```
RWA Hackathon Taiwan NFT #1
[圖片顯示]

Attributes:
- Edition: 1 of 100
- Event: RWA Hackathon Taiwan 2025
- Type: Participation Certificate
```

### ✅ OpenSea 上也會顯示（需等待更久）
```
https://testnets.opensea.io/assets/sepolia/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c/1
```

---

## 📋 快速參考

### 合約信息
```
Contract Address: 0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c
Network: Sepolia Testnet
Base URI to Set: ipfs://QmXxNe85MgMRx4SsGzAxAiMdDULMVgjwoD6obezUipjpCw/
```

### 重要連結
- Write Contract: https://sepolia.etherscan.io/address/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c#writeContract
- Read Contract: https://sepolia.etherscan.io/address/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c#readContract
- NFT Page: https://sepolia.etherscan.io/nft/0xb7f3a468f0bf0e016c7bb99f3501cea12b0c356c/1

### 函數調用
```solidity
setBaseURI(string newBaseURI)
→ Input: ipfs://QmXxNe85MgMRx4SsGzAxAiMdDULMVgjwoD6obezUipjpCw/
```

---

## 💡 小提示

- 📱 可以在手機上使用 MetaMask Mobile App 操作
- 💰 準備少量 Sepolia ETH（約 0.001 ETH 足夠）
- ⏰ 設置後耐心等待 Etherscan 更新
- 🔄 如果一次不成功，可以多次設置（沒有限制）

---

**祝你操作順利！圖片很快就會顯示了！** 🎉🖼️

如果遇到任何問題，請告訴我具體的錯誤訊息，我會協助你解決！

