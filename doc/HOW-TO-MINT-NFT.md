# 如何鑄造 NFT？

## 🎯 快速指南

### 給管理員：如何設置 NFT 活動

有兩種方式：**自動設置（推薦）** 或 **手動設置**

---

## 🚀 方法 A：一鍵自動設置（推薦）

### 步驟 1: 創建 NFT 活動

1. 訪問管理頁面：
   ```
   http://localhost:3009/admin/nft/campaigns
   ```

2. 點擊「建立新活動」

3. 填寫活動資訊：
   - **活動名稱**：例如「RWA Hackathon 紀念 NFT」
   - **活動描述**：例如「感謝您參與 RWA Hackathon Taiwan 2025」
   - **上傳圖片**：選擇 NFT 的圖片
   - **選擇網路**：
     - `Sepolia` - 測試網（推薦先用這個測試）
     - `Ethereum` - 主網（需要真實 ETH）
     - `Arbitrum` - Arbitrum 網路（更低 gas 費）
   - **符合資格的電子郵件**：輸入白名單用戶的 email（每行一個）
     ```
     user1@example.com
     user2@example.com
     user3@example.com
     ```
   - **開始日期**：活動開始時間
   - **結束日期**：活動結束時間
   - **最大供應量**：例如 100（最多可鑄造 100 個）

4. 點擊「建立活動」

### 步驟 2: 一鍵自動設置

1. 在剛創建的活動卡片中，你會看到「🚀 自動部署和設置」區塊

2. 點擊「一鍵自動設置」按鈕

3. 系統會引導你：
   - 連接 MetaMask 錢包
   - 確認網路正確（Sepolia/Ethereum/Arbitrum）
   - 在終端部署合約：
     ```bash
     cd /home/reyerchu/hack/hack-dev/contracts
     npm run deploy:sepolia
     ```
   - 輸入已部署的合約地址

4. 系統自動完成：
   - ✅ 從 Firestore 獲取所有符合資格用戶的錢包地址
   - ✅ 批量添加地址到合約白名單
   - ✅ 啟用鑄造功能
   - ✅ 更新 Firestore 中的活動狀態

5. 完成！🎉

**優點**：
- ⚡ 只需點擊一次，自動完成所有設置
- 🔒 安全，使用你的 MetaMask 錢包
- 📊 即時顯示設置結果和統計

---

## 🔧 方法 B：手動設置（進階）

如果你喜歡完全控制每個步驟，可以手動執行：

### 步驟 1: 創建活動（同上）

### 步驟 2: 部署智能合約

1. 確保已配置環境變數（在項目根目錄的 `.env.local`）：
   ```bash
   DEPLOYER_PRIVATE_KEY=你的錢包私鑰（不含0x前綴）
   ETHERSCAN_API_KEY=你的Etherscan API密鑰（用於驗證合約）
   ```

2. 進入合約目錄並部署：
   ```bash
   cd /home/reyerchu/hack/hack-dev/contracts
   npm run deploy:sepolia
   ```

3. 部署成功後，複製合約地址

### 步驟 3: 更新 Firestore

在 Firebase Console 中手動添加 `contractAddress` 欄位

### 步驟 4: 添加白名單

```bash
cd contracts
node scripts/syncWhitelistFromFirestore.js <活動ID>
```

### 步驟 5: 啟用鑄造

```bash
node scripts/enableMinting.js <合約地址> true
```

### 步驟 6: 驗證設置

```bash
node scripts/getContractInfo.js <合約地址>
```

✅ **設置完成！**

---

### 給用戶：如何鑄造 NFT

#### 前置需求

1. ✅ 已在網站註冊並登入
2. ✅ 你的 email 在活動白名單中
3. ✅ 安裝了 [MetaMask 錢包](https://metamask.io/)
4. ✅ 錢包切換到正確的網路（Sepolia/Ethereum/Arbitrum）
5. ✅ 錢包有少量 ETH 支付 gas 費
   - **測試網**：從 [Sepolia Faucet](https://sepoliafaucet.com/) 免費獲取
   - **主網**：需要真實的 ETH

#### 鑄造步驟

**步驟 1: 查看個人頁面**

1. 登入網站
2. 進入你的個人頁面：
   ```
   http://localhost:3009/user/<你的用戶ID>
   ```
   或點擊右上角的「個人資料」

3. 如果你符合資格，會看到：
   ```
   🎨 鑄造 NFT
   ```
   按鈕

**步驟 2: 進入鑄造頁面**

1. 點擊「鑄造 NFT」按鈕
2. 你會看到 NFT 的預覽和資訊

**步驟 3: 連接 MetaMask 錢包**

1. 點擊「連接 MetaMask」
2. MetaMask 會彈出，點擊「連接」
3. 選擇你要使用的錢包地址
4. 確認連接

**步驟 4: 鑄造 NFT**

1. 連接成功後，你會看到：
   - ✅ 合約鑄造狀態：已開放
   - ✅ 你的狀態：可鑄造
   - 當前供應量 / 最大供應量

2. 點擊「立即鑄造」按鈕

3. MetaMask 會彈出交易確認窗口：
   - 檢查 gas 費（通常只需要幾美元）
   - 點擊「確認」

4. 等待交易確認（約 10-30 秒）

5. 成功！🎉
   - 你會看到交易哈希
   - 頁面會自動跳轉回個人頁面
   - 「鑄造 NFT」按鈕會變成「已鑄造」

**步驟 5: 查看你的 NFT**

- 在個人頁面會顯示「已鑄造」狀態
- 在 [Etherscan](https://etherscan.io/)（主網）或 [Sepolia Etherscan](https://sepolia.etherscan.io/)（測試網）搜索你的錢包地址
- 在 MetaMask 中可以看到你的 NFT

---

## 🔧 故障排除

### 問題 1: 看不到「鑄造 NFT」按鈕

**可能原因：**
- ❌ 你的 email 不在白名單中
- ❌ 活動還沒開始或已結束
- ❌ 合約地址未設置
- ❌ 合約鑄造未啟用

**解決方法：**
1. 確認你使用正確的 email 登入
2. 聯繫管理員確認你在白名單中
3. 檢查活動時間

### 問題 2: 顯示「不符合鑄造條件」

**可能原因：**
- ❌ 你的錢包地址不在合約白名單中
- ❌ 活動已達到最大供應量
- ❌ 合約鑄造未啟用

**解決方法：**
1. 確認你的錢包地址正確
2. 聯繫管理員將你的錢包地址加入白名單

### 問題 3: 交易失敗

**可能原因：**
- ❌ Gas 費不足
- ❌ 錢包網路不正確
- ❌ 已經鑄造過了

**解決方法：**
1. 確認錢包有足夠的 ETH 支付 gas
2. 確認 MetaMask 切換到正確的網路
3. 檢查錯誤訊息

### 問題 4: MetaMask 沒有彈出

**解決方法：**
1. 檢查 MetaMask 是否已安裝
2. 刷新頁面
3. 檢查瀏覽器是否阻擋了彈出窗口

---

## 📊 網路選擇指南

| 網路 | 適用場景 | Gas 費 | 測試 ETH |
|------|---------|--------|----------|
| **Sepolia** | 測試 | 免費 | [Faucet](https://sepoliafaucet.com/) |
| **Ethereum** | 生產環境 | 較高 | 需購買 |
| **Arbitrum** | 生產環境（省 gas） | 較低 | 需購買 |

**建議流程：**
1. 先在 Sepolia 測試網測試所有功能
2. 確認無誤後再部署到主網

---

## 💡 重要提醒

### 給管理員：
- ⚠️ **絕不要**將私鑰提交到 git
- ⚠️ **絕不要**分享你的私鑰
- ⚠️ 主網部署前務必在測試網充分測試
- ⚠️ 考慮使用多簽錢包管理生產合約
- ⚠️ 定期備份合約地址和部署信息

### 給用戶：
- ⚠️ 確認網站 URL 正確，防止釣魚
- ⚠️ 檢查合約地址是否正確
- ⚠️ 不要在公開場合分享私鑰
- ⚠️ 鑄造前確認 gas 費合理

---

## 📞 需要幫助？

### 詳細文檔：
- [快速開始指南](./QUICKSTART.md)
- [完整部署指南](./contracts/DEPLOYMENT-GUIDE.md)
- [系統完整文檔](./NFT-COMPLETE-SYSTEM.md)

### 常用命令速查：

```bash
# 查看合約狀態
cd contracts && node scripts/getContractInfo.js <合約地址>

# 添加白名單
node scripts/addWhitelist.js <合約地址> whitelist.txt

# 啟用鑄造
node scripts/enableMinting.js <合約地址> true

# 停用鑄造
node scripts/enableMinting.js <合約地址> false

# 從 Firestore 同步
node scripts/syncWhitelistFromFirestore.js <活動ID>
```

---

## 🎉 祝你鑄造成功！

如有任何問題，請參考詳細文檔或聯繫開發團隊。

