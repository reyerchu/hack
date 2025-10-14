# Firebase VAPID Key 設置指南

## 🎯 問題症狀
- ❌ `InvalidAccessError: Failed to execute 'subscribe' on 'PushManager'`
- ❌ `The provided applicationServerKey is not valid`
- ❌ 推播通知無法正常運作

## 🔍 原因
當前使用的是無效的 dummy VAPID key：
```
NEXT_PUBLIC_VAPID_KEY=dummy-vapid-key
```

## ✅ 快速解決方案

### 方法 1：使用自動化腳本（推薦）⭐

```bash
cd /home/reyerchu/hack/hack
./update-vapid-key.sh
```

腳本會引導您：
1. 📋 顯示當前的 VAPID key
2. 📍 提供 Firebase Console 連結
3. 🔐 驗證輸入的 VAPID key 格式
4. 💾 自動備份原始設定
5. 🔄 可選擇自動重啟服務

---

### 方法 2：手動設置

#### 步驟 1：獲取 VAPID Key

1. 前往 Firebase Console 的 Cloud Messaging 設定：
   ```
   https://console.firebase.google.com/project/hackathon-rwa-nexus/settings/cloudmessaging
   ```

2. 找到 **Web configuration** 區域

3. 在 **Web Push certificates** 下：
   - 如果已有 Key pair，直接複製
   - 如果沒有，點擊 **Generate key pair** 按鈕

4. 複製生成的 Key pair（格式類似）：
   ```
   BHx7aBcD...eFgHiJkL（約 88 個字符）
   ```

#### 步驟 2：更新 .env.local

**備份原始文件：**
```bash
cd /home/reyerchu/hack/hack
cp .env.local .env.local.backup
```

**編輯 .env.local：**
```bash
nano .env.local
# 或使用您喜歡的編輯器
```

**找到並替換：**
```bash
# 舊值
NEXT_PUBLIC_VAPID_KEY=dummy-vapid-key

# 新值（替換為您的真實 key）
NEXT_PUBLIC_VAPID_KEY=BHx7aBcD...eFgHiJkL
```

#### 步驟 3：重啟服務

```bash
sudo systemctl restart hackathon-main.service
```

#### 步驟 4：驗證

```bash
# 檢查服務狀態
sudo systemctl status hackathon-main.service

# 查看日誌
sudo journalctl -u hackathon-main.service -f
```

---

## 📝 VAPID Key 格式說明

**有效的 VAPID key 特徵：**
- ✅ 以字母 `B` 開頭
- ✅ 長度約 88 個字符
- ✅ 包含大小寫字母、數字、連字符（-）和底線（_）
- ✅ Base64 URL 安全編碼

**範例格式：**
```
BHx7aBcDefGhIjKlMnOpQrStUvWxYz0123456789-_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcd
```

**無效的格式：**
- ❌ `dummy-vapid-key`
- ❌ 長度太短（< 80 字符）
- ❌ 包含特殊字符（除了 `-` 和 `_`）
- ❌ 不是以 `B` 開頭

---

## 🔐 安全性說明

### VAPID Key 是什麼？
- **VAPID**：Voluntary Application Server Identification
- **用途**：讓瀏覽器驗證推播通知來源的合法性
- **類型**：公鑰（Public Key），可以安全地存儲在前端代碼中

### 安全最佳實踐
- ✅ VAPID key 可以公開（是公鑰）
- ✅ 不需要額外加密
- ✅ 可以存儲在環境變數中
- ⚠️ 不要與 Firebase Admin SDK 私鑰混淆

---

## 🧪 測試推播通知

### 測試步驟

1. **重啟服務後訪問網站：**
   ```
   http://localhost:3008
   ```

2. **打開瀏覽器開發者工具：**
   - 按 F12 或右鍵 → 檢查
   - 切換到 Console 標籤

3. **檢查錯誤訊息：**
   - 如果還看到 VAPID key 錯誤 → 重新檢查設置
   - 如果沒有錯誤 → 設置成功 ✅

4. **測試推播訂閱：**
   - 查找「允許通知」或「Enable Notifications」選項
   - 點擊後應該看到瀏覽器的通知權限請求
   - 允許後，推播通知應該正常運作

### 常見測試問題

**問題 1：瀏覽器沒有提示通知權限**
- 檢查網站是否使用 HTTPS（localhost 例外）
- 檢查瀏覽器是否支援推播通知
- 清除瀏覽器快取後重試

**問題 2：仍然顯示 VAPID key 錯誤**
- 確認服務已重啟：`sudo systemctl restart hackathon-main.service`
- 確認 .env.local 已正確更新
- 檢查 VAPID key 格式是否正確

**問題 3：服務重啟失敗**
- 查看日誌：`sudo journalctl -u hackathon-main.service -n 50`
- 檢查 .env.local 語法是否正確
- 確認沒有多餘的空格或換行

---

## 📊 驗證清單

完成設置後，請確認：

- [ ] 已從 Firebase Console 獲取真實的 VAPID key
- [ ] VAPID key 格式正確（以 B 開頭，約 88 字符）
- [ ] 已更新 .env.local 文件
- [ ] 已備份原始設定
- [ ] 已重啟 hackathon-main.service
- [ ] 服務運行正常（檢查 systemctl status）
- [ ] 網站可以正常訪問
- [ ] 沒有 VAPID key 相關錯誤
- [ ] 推播通知權限請求正常顯示

---

## 🔄 回滾步驟

如果更新後出現問題，可以回滾：

```bash
cd /home/reyerchu/hack/hack

# 列出備份文件
ls -la .env.local.backup*

# 恢復最新的備份（替換時間戳）
cp .env.local.backup.20251014_220000 .env.local

# 重啟服務
sudo systemctl restart hackathon-main.service
```

---

## 📞 需要幫助？

### 有用的命令

**查看當前 VAPID key：**
```bash
grep "VAPID" /home/reyerchu/hack/hack/.env.local
```

**查看服務狀態：**
```bash
sudo systemctl status hackathon-main.service
```

**查看實時日誌：**
```bash
sudo journalctl -u hackathon-main.service -f
```

**手動測試服務：**
```bash
# 停止 systemd 服務
sudo systemctl stop hackathon-main.service

# 手動啟動查看詳細輸出
cd /home/reyerchu/hack/hack
npx next dev -p 3008
```

### Firebase Console 快速連結

- 🔥 [Cloud Messaging 設定](https://console.firebase.google.com/project/hackathon-rwa-nexus/settings/cloudmessaging)
- ⚙️ [專案設定](https://console.firebase.google.com/project/hackathon-rwa-nexus/settings/general)
- 📊 [使用情況統計](https://console.firebase.google.com/project/hackathon-rwa-nexus/usage)

---

*最後更新：2025-10-14*
*項目：RWA Hackathon Taiwan*
*環境：Main Service (localhost:3008)*

