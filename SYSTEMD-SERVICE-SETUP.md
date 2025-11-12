# RWA Hackathon Taiwan - Systemd 服務設置指南

## 📋 概述

將 RWA Hackathon Taiwan 應用設置為 systemd 服務，實現：
- ✅ 伺服器開機自動啟動
- ✅ 應用崩潰自動重啟
- ✅ 統一的服務管理
- ✅ 系統日誌集成

## 🚀 快速安裝

### 方法 1：使用自動安裝腳本（推薦）

```bash
bash /tmp/install-service.sh
```

腳本會自動：
1. 停止開發服務器
2. 構建生產版本
3. 安裝 systemd 服務
4. 啟用並啟動服務

### 方法 2：手動安裝

#### 步驟 1：停止開發服務器

```bash
pkill -f "next dev"
```

#### 步驟 2：構建生產版本

```bash
cd /home/reyerchu/hack/hack
npm run build
```

#### 步驟 3：安裝服務文件

```bash
sudo cp /tmp/hackathon-rwa.service /etc/systemd/system/
```

#### 步驟 4：重新載入 systemd

```bash
sudo systemctl daemon-reload
```

#### 步驟 5：啟用服務（開機自啟動）

```bash
sudo systemctl enable hackathon-rwa.service
```

#### 步驟 6：啟動服務

```bash
sudo systemctl start hackathon-rwa.service
```

#### 步驟 7：檢查狀態

```bash
sudo systemctl status hackathon-rwa.service
```

## 📝 服務配置詳情

### 服務文件位置

```
/etc/systemd/system/hackathon-rwa.service
```

### 服務配置內容

```ini
[Unit]
Description=RWA Hackathon Taiwan - Next.js Application
After=network.target

[Service]
Type=simple
User=reyerchu
WorkingDirectory=/home/reyerchu/hack/hack
Environment="NODE_ENV=production"
Environment="PORT=3008"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=hackathon-rwa

[Install]
WantedBy=multi-user.target
```

### 配置說明

- **User**: `reyerchu` - 執行應用的用戶
- **WorkingDirectory**: `/home/reyerchu/hack/hack` - 應用根目錄
- **Environment**: 環境變數
  - `NODE_ENV=production` - 生產模式
  - `PORT=3008` - 監聽端口
- **ExecStart**: `/usr/bin/npm start` - 啟動命令
- **Restart**: `always` - 崩潰時自動重啟
- **RestartSec**: `10` - 重啟前等待 10 秒

## 🔧 常用命令

### 服務管理

```bash
# 啟動服務
sudo systemctl start hackathon-rwa

# 停止服務
sudo systemctl stop hackathon-rwa

# 重啟服務
sudo systemctl restart hackathon-rwa

# 重新載入配置（修改服務文件後）
sudo systemctl daemon-reload
sudo systemctl restart hackathon-rwa

# 查看服務狀態
sudo systemctl status hackathon-rwa

# 啟用開機自啟動
sudo systemctl enable hackathon-rwa

# 禁用開機自啟動
sudo systemctl disable hackathon-rwa
```

### 日誌查看

```bash
# 查看實時日誌
sudo journalctl -u hackathon-rwa -f

# 查看最近 100 行日誌
sudo journalctl -u hackathon-rwa -n 100

# 查看今天的日誌
sudo journalctl -u hackathon-rwa --since today

# 查看最近 1 小時的日誌
sudo journalctl -u hackathon-rwa --since "1 hour ago"
```

## 🔄 更新應用

當您更新代碼後：

```bash
cd /home/reyerchu/hack/hack

# 拉取最新代碼
git pull

# 安裝依賴（如果有新的）
npm install

# 重新構建
npm run build

# 重啟服務
sudo systemctl restart hackathon-rwa
```

## 🐛 故障排查

### 服務無法啟動

1. **檢查服務狀態**：
   ```bash
   sudo systemctl status hackathon-rwa
   ```

2. **查看詳細日誌**：
   ```bash
   sudo journalctl -u hackathon-rwa -n 50 --no-pager
   ```

3. **檢查端口是否被佔用**：
   ```bash
   sudo lsof -i :3008
   ```

4. **檢查構建是否成功**：
   ```bash
   cd /home/reyerchu/hack/hack
   ls -la .next/
   ```

### 常見錯誤

#### 錯誤：Port 3008 已被使用

```bash
# 找到佔用端口的進程
sudo lsof -ti:3008

# 殺死該進程
sudo kill -9 $(sudo lsof -ti:3008)

# 重啟服務
sudo systemctl restart hackathon-rwa
```

#### 錯誤：npm 找不到

確認 npm 路徑：
```bash
which npm
```

如果不是 `/usr/bin/npm`，修改服務文件中的 `ExecStart`：
```bash
sudo nano /etc/systemd/system/hackathon-rwa.service
```

改為實際的 npm 路徑，例如：
```ini
ExecStart=/usr/local/bin/npm start
```

然後重新載入：
```bash
sudo systemctl daemon-reload
sudo systemctl restart hackathon-rwa
```

#### 錯誤：權限問題

確保文件權限正確：
```bash
sudo chown -R reyerchu:reyerchu /home/reyerchu/hack/hack
```

## 📊 監控

### 檢查服務是否運行

```bash
# 方法 1：systemctl
sudo systemctl is-active hackathon-rwa

# 方法 2：curl
curl -s http://localhost:3008 | head -20

# 方法 3：檢查進程
ps aux | grep "npm start" | grep -v grep
```

### 自動監控腳本

創建監控腳本 `/home/reyerchu/monitor-hackathon.sh`：

```bash
#!/bin/bash
if ! systemctl is-active --quiet hackathon-rwa; then
    echo "$(date): Service is down, restarting..." >> /var/log/hackathon-monitor.log
    sudo systemctl restart hackathon-rwa
fi
```

添加到 crontab（每 5 分鐘檢查一次）：
```bash
crontab -e
```

添加：
```
*/5 * * * * /home/reyerchu/monitor-hackathon.sh
```

## 🔐 安全建議

1. **使用專用用戶**（已設置為 `reyerchu`）
2. **限制服務權限**
3. **定期更新依賴**：
   ```bash
   npm audit
   npm audit fix
   ```

## 🌐 Nginx 反向代理

如果使用 Nginx 作為反向代理：

```nginx
server {
    listen 80;
    server_name hackathon.com.tw;

    location / {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📞 支援

如有問題，請檢查：
1. 服務狀態：`sudo systemctl status hackathon-rwa`
2. 日誌：`sudo journalctl -u hackathon-rwa -n 100`
3. 端口：`sudo lsof -i :3008`
4. 構建：`ls -la /home/reyerchu/hack/hack/.next/`

---

**最後更新**：2025-11-11

