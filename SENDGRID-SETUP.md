# SendGrid 郵件通知配置指南

## 📧 概述

RWA Hackathon 網站已實現完整的郵件通知功能，但需要配置 SendGrid 才能實際發送郵件。

## ✅ 已實現的郵件通知

1. **創建需求時** → 發送確認郵件給需求發布者
2. **收到申請時** → 發送通知郵件給需求發布者  
3. **提交申請時** → 發送確認郵件給申請者
4. **申請狀態變更** → 發送更新郵件給申請者

## 🚀 快速配置步驟

### Step 1: 註冊 SendGrid 賬號

1. 訪問：https://sendgrid.com/
2. 點擊 "Start for Free"
3. 填寫註冊信息
4. 免費計劃：每天 100 封郵件（足夠黑客松使用）

### Step 2: 創建 API Key

1. 登入 SendGrid Dashboard
2. 左側菜單：**Settings** > **API Keys**
3. 點擊 **Create API Key** 按鈕
4. API Key 名稱：`RWA-Hackathon-Email`
5. 權限選擇：**Full Access** 或至少 **Mail Send** > **Full Access**
6. 點擊 **Create & View**
7. **重要**：立即複製 API Key（只顯示一次！）
   - 格式：`SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: 驗證發件人（必須！）

SendGrid 要求驗證發件人身份，否則郵件會被拒絕。

#### 選項 A - 單個郵箱驗證（快速，5分鐘）

1. 導航到：**Settings** > **Sender Authentication**
2. 點擊 **Get Started** (Single Sender Verification 區域)
3. 填寫信息：
   - From Name: `RWA Hackathon Taiwan`
   - From Email Address: `noreply@hackathon.com.tw`
   - Reply To: `support@hackathon.com.tw` 或相同郵箱
   - Company Address, City, State, Zip, Country（隨意填寫）
4. 點擊 **Create**
5. SendGrid 會發送驗證郵件到 `noreply@hackathon.com.tw`
6. 打開該郵箱，點擊驗證連結
7. 驗證完成！

#### 選項 B - 域名驗證（推薦，更專業）

1. 導航到：**Settings** > **Sender Authentication**
2. 點擊 **Get Started** (Domain Authentication 區域)
3. 選擇 DNS provider（例如：Cloudflare, GoDaddy 等）
4. 輸入域名：`hackathon.com.tw`
5. SendGrid 會生成 DNS 記錄（CNAME）
6. 前往您的 DNS 管理平台添加這些記錄
7. 返回 SendGrid 點擊 **Verify**
8. 驗證完成後，可使用該域名下任何郵箱作為發件人

### Step 4: 配置環境變量

在服務器上執行：

```bash
# 進入專案目錄
cd /home/reyerchu/hack/hack

# 編輯環境變量文件
nano .env.local

# 添加以下配置（替換成您的 API Key）：
SENDGRID_API_KEY=SG.your-actual-api-key-here
EMAIL_FROM=noreply@hackathon.com.tw
NEXT_PUBLIC_BASE_URL=https://hackathon.com.tw
```

按 `Ctrl+X`，然後 `Y`，再按 `Enter` 保存。

### Step 5: 重啟應用

```bash
pm2 restart hackportal
```

或如果使用 systemd：

```bash
sudo systemctl restart hackportal
```

### Step 6: 測試郵件發送

1. 訪問：https://hackathon.com.tw/team-up/create
2. 使用您的賬號登入
3. 創建一個測試「找隊友」需求
4. 檢查您的郵箱（註冊時使用的郵箱）
5. 應該收到「找隊友需求已發布成功」的郵件

### Step 7: 查看日誌（排查問題）

```bash
# 查看實時日誌
pm2 logs hackportal --lines 100

# 查找郵件相關日誌
pm2 logs hackportal --lines 1000 | grep -i email

# 查看錯誤日誌
pm2 logs hackportal --err --lines 50
```

## 📧 郵件模板說明

### 1. 創建需求確認郵件
- **主旨**：`[RWA Hackathon] 找隊友需求已發布成功`
- **收件人**：需求發布者
- **內容**：需求摘要、管理連結

### 2. 收到申請通知
- **主旨**：`[RWA Hackathon] 收到新的隊友應徵`
- **收件人**：需求發布者
- **內容**：申請者信息、留言、聯繫方式

### 3. 申請提交確認
- **主旨**：`[RWA Hackathon] 已投遞：「需求標題」`
- **收件人**：申請者
- **內容**：申請摘要、後續流程

### 4. 申請狀態更新
- **主旨（接受）**：`[RWA Hackathon] 好消息！您的應徵已被接受`
- **主旨（拒絕）**：`[RWA Hackathon] 關於您的應徵`
- **收件人**：申請者
- **內容**：狀態、聯繫信息

## 🔧 常見問題排查

### 問題 1：配置後仍無法發送郵件

**檢查清單**：
```bash
# 1. 確認環境變量已加載
pm2 env 0 | grep SENDGRID

# 2. 查看應用日誌
pm2 logs hackportal --lines 200 | grep -i email

# 3. 重新加載環境變量
pm2 restart hackportal --update-env
```

### 問題 2：API Key 無效錯誤

**解決方案**：
- 確認 API Key 以 `SG.` 開頭
- 確認沒有額外的空格或換行
- 嘗試重新創建 API Key
- 確認 API Key 權限包含 Mail Send

### 問題 3：發件人未驗證錯誤

**解決方案**：
- 前往 SendGrid Dashboard > Settings > Sender Authentication
- 確認郵箱或域名顯示為 "Verified"
- 確認 `.env.local` 中的 `EMAIL_FROM` 與驗證的郵箱匹配

### 問題 4：郵件進入垃圾郵件箱

**改善方法**：
- 使用域名驗證（而非單個郵箱驗證）
- 設置 SPF、DKIM 記錄（域名驗證時自動配置）
- 在 SendGrid 中設置 Sender Identity
- 避免郵件內容包含過多連結

### 問題 5：查看 SendGrid 發送狀態

1. 登入 SendGrid Dashboard
2. 左側菜單：**Activity** > **Email Activity**
3. 可以看到所有郵件的發送狀態
4. 點擊具體郵件查看詳情（送達、打開、點擊等）

## 📊 監控與分析

### SendGrid Dashboard

訪問 SendGrid Dashboard 可以查看：
- 郵件發送統計
- 送達率、打開率、點擊率
- 錯誤和反彈郵件
- 實時郵件活動

### 推薦監控指標

- **送達率**：應該 > 95%
- **反彈率**：應該 < 5%
- **垃圾郵件投訴率**：應該 < 0.1%

## 🔐 安全建議

1. **API Key 保護**
   - 不要提交到 Git
   - 使用 `.env.local`（已在 .gitignore 中）
   - 定期更換 API Key

2. **訪問控制**
   - 只給需要的人 SendGrid 賬號訪問權限
   - 使用最小權限原則

3. **郵件內容**
   - 不要包含敏感信息
   - 使用 HTTPS 連結
   - 包含取消訂閱選項（如適用）

## 🆘 需要幫助？

如果配置後仍有問題，請檢查：

1. **服務器日誌**：
   ```bash
   pm2 logs hackportal --err --lines 100
   ```

2. **SendGrid Dashboard > Email Activity**
   - 查看郵件發送歷史和錯誤

3. **環境變量**：
   ```bash
   cat .env.local | grep SENDGRID
   ```

## 📚 相關資源

- [SendGrid 官方文檔](https://docs.sendgrid.com/)
- [SendGrid API 參考](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
- [郵件最佳實踐](https://docs.sendgrid.com/ui/sending-email/deliverability)

---

**注意**：如果不配置 SendGrid，郵件功能不會報錯，只是不會實際發送郵件。所有其他功能（找隊友、申請等）仍然正常工作。

