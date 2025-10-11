# Gmail SMTP 郵件通知配置指南

## 📧 概述

您可以使用 Gmail 賬號通過 SMTP 發送郵件通知，無需註冊第三方服務（如 SendGrid）。

## ✅ 優勢

- ✅ **免費**：使用您現有的 Gmail 賬號
- ✅ **簡單**：無需註冊額外服務
- ✅ **可靠**：Gmail SMTP 穩定可靠
- ✅ **快速**：5 分鐘內完成配置

## 🚀 快速配置步驟

### Step 1: 啟用 Gmail 兩步驟驗證（必須）

Gmail App Password 需要先啟用兩步驟驗證。

1. 訪問：https://myaccount.google.com/security
2. 找到「登入 Google」區塊
3. 點擊「兩步驟驗證」
4. 按照指示完成設定（通常需要您的手機號碼）

### Step 2: 生成 App Password

1. 訪問：https://myaccount.google.com/apppasswords
   
   或手動導航：
   - Google Account > Security
   - 搜索 "App passwords" 或找到「應用程式密碼」
   - 點擊進入

2. 選擇應用程式和裝置：
   - 應用程式：選擇「郵件」或「其他（自訂名稱）」
   - 自訂名稱：輸入 `RWA Hackathon`
   - 裝置：選擇「其他（自訂名稱）」
   - 自訂名稱：輸入 `Hackathon Server`

3. 點擊「產生」

4. **重要**：複製產生的 16 位密碼
   - 格式類似：`abcd efgh ijkl mnop`
   - 只顯示一次，請立即複製並保存！

### Step 3: 配置環境變量

在服務器上編輯 `.env.local` 文件：

```bash
cd /home/reyerchu/hack/hack
nano .env.local
```

添加以下內容（替換成您的實際信息）：

```bash
# Gmail SMTP 配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop

# 可選：自訂發件人顯示名稱
EMAIL_FROM=your-gmail@gmail.com
```

**配置說明**：
- `SMTP_HOST`: 固定為 `smtp.gmail.com`
- `SMTP_PORT`: 使用 `587`（TLS）或 `465`（SSL）
- `SMTP_USER`: 您的完整 Gmail 郵箱地址
- `SMTP_PASS`: 剛才生成的 App Password（保留空格或移除都可以）
- `EMAIL_FROM`: 發件人郵箱（通常與 SMTP_USER 相同）

保存並退出（Ctrl+X, Y, Enter）

### Step 4: 重啟應用

```bash
pm2 restart hackportal
```

### Step 5: 測試郵件發送

1. 訪問：https://hackathon.com.tw/team-up/create
2. 創建一個測試「找隊友」需求
3. 檢查您的郵箱（註冊時使用的郵箱）
4. 應該收到「找隊友需求已發布成功」的郵件

### Step 6: 查看發送日誌

```bash
# 查看實時日誌
pm2 logs hackportal --lines 50

# 查找郵件相關日誌
pm2 logs hackportal --lines 200 | grep -i email
```

您應該看到類似的日誌：
```
[Email] Using SMTP to send email
[Email] SMTP email sent successfully: <message-id@gmail.com>
```

## 📧 完整配置示例

### .env.local 文件範例

```bash
# Firebase 配置（原有配置）
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Gmail SMTP 配置（新增）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=reyerchu@gmail.com
SMTP_PASS=abcd efgh ijkl mnop

# 其他配置
NEXT_PUBLIC_BASE_URL=https://hackathon.com.tw
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## 🔧 常見問題排查

### 問題 1：535 Authentication Failed

**原因**：App Password 錯誤或未啟用兩步驟驗證

**解決方案**：
1. 確認已啟用兩步驟驗證
2. 重新生成 App Password
3. 確認沒有多餘的空格
4. 確認 SMTP_USER 是完整的郵箱地址

### 問題 2：郵件發送失敗，無錯誤信息

**檢查步驟**：
```bash
# 1. 確認環境變量已加載
pm2 env 0 | grep SMTP

# 2. 查看詳細錯誤日誌
pm2 logs hackportal --err --lines 100

# 3. 重新加載環境變量
pm2 restart hackportal --update-env
```

### 問題 3：Connection timeout

**可能原因**：
- 防火牆阻擋
- ISP 限制 SMTP 端口

**解決方案**：
1. 嘗試使用端口 465（SSL）：
   ```bash
   SMTP_PORT=465
   ```

2. 測試連接：
   ```bash
   telnet smtp.gmail.com 587
   # 或
   telnet smtp.gmail.com 465
   ```

### 問題 4：郵件進入垃圾郵件箱

**改善方法**：
1. 使用您組織的 G Suite/Workspace 郵箱（更專業）
2. 郵件內容避免使用過多連結
3. 保持郵件內容簡潔專業
4. 請收件人將您的郵箱加入聯繫人

### 問題 5：Gmail 每日發送限制

Gmail 有以下發送限制：
- **個人 Gmail**：每天 500 封
- **G Suite/Workspace**：每天 2000 封

對於黑客松活動，個人 Gmail 的 500 封/天通常足夠。

## 🔐 安全建議

### 1. 保護 App Password

- ✅ 不要提交到 Git（.env.local 已在 .gitignore 中）
- ✅ 定期更換 App Password
- ✅ 如果洩露，立即撤銷並重新生成
- ✅ 只給必要的人員訪問權限

### 2. 撤銷 App Password

如果需要撤銷：
1. 訪問：https://myaccount.google.com/apppasswords
2. 找到「RWA Hackathon」
3. 點擊刪除/撤銷
4. 重新生成新的 App Password

### 3. 監控使用情況

定期檢查：
1. Gmail 的「已發送」資料夾
2. Google Account > Security > Your devices
3. 伺服器日誌中的郵件發送記錄

## 📊 與 SendGrid 的比較

| 特性 | Gmail SMTP | SendGrid |
|------|------------|----------|
| **費用** | 免費 | 免費（每天 100 封） |
| **設定難度** | 簡單 | 中等 |
| **每日限制** | 500 封 | 100 封（免費版） |
| **送達率** | 良好 | 優秀 |
| **功能** | 基本發送 | 進階分析 |
| **驗證** | App Password | API Key + 域名驗證 |
| **適合對象** | 小型活動 | 大型活動 |

**建議**：
- 黑客松活動（< 100 人）→ Gmail SMTP 完全足夠
- 大型活動（> 500 人）→ 考慮 SendGrid

## 🧪 測試郵件發送

### 方法 1：創建找隊友需求

1. 登入網站
2. 訪問：https://hackathon.com.tw/team-up/create
3. 填寫並提交需求
4. 檢查註冊郵箱是否收到確認郵件

### 方法 2：申請找隊友需求

1. 訪問：https://hackathon.com.tw/team-up
2. 點擊任一需求
3. 點擊「立即應徵」
4. 提交申請
5. 檢查兩個郵箱：
   - 申請者郵箱：確認郵件
   - 需求發布者郵箱：新申請通知

### 方法 3：查看伺服器日誌

```bash
pm2 logs hackportal --lines 100 | grep -i email
```

成功的日誌應顯示：
```
[Email] Using SMTP to send email
[Email] SMTP email sent successfully: <xxxxx@gmail.com>
```

## 🎯 完整測試清單

配置完成後，請測試以下場景：

- [ ] 創建「找隊友」需求 → 收到確認郵件
- [ ] 其他人申請您的需求 → 收到申請通知郵件
- [ ] 您申請其他人的需求 → 收到申請確認郵件
- [ ] 接受/拒絕申請 → 申請者收到狀態更新郵件
- [ ] 查看 Gmail 已發送資料夾 → 確認郵件已發送
- [ ] 查看伺服器日誌 → 無錯誤信息

## 🔗 相關資源

- [Gmail App Passwords 設定](https://support.google.com/accounts/answer/185833)
- [Gmail SMTP 設定](https://support.google.com/a/answer/176600)
- [Nodemailer 文檔](https://nodemailer.com/)
- [Gmail 發送限制](https://support.google.com/a/answer/166852)

## 🆘 需要幫助？

如果配置後仍有問題，請提供：

1. **伺服器日誌**：
   ```bash
   pm2 logs hackportal --err --lines 100
   ```

2. **環境變量配置**（隱藏密碼）：
   ```bash
   pm2 env 0 | grep SMTP
   ```

3. **錯誤信息**：
   - 具體的錯誤提示
   - 發生錯誤的時間
   - 正在執行的操作

## ⚡ 快速參考卡

```bash
# 編輯配置
nano /home/reyerchu/hack/hack/.env.local

# 必要配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password

# 重啟應用
pm2 restart hackportal

# 查看日誌
pm2 logs hackportal | grep -i email

# 測試連接
telnet smtp.gmail.com 587
```

---

**配置時間**：約 5-10 分鐘  
**難度**：⭐⭐☆☆☆（簡單）  
**推薦度**：⭐⭐⭐⭐⭐（強烈推薦用於小型活動）

