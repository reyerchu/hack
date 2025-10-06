# RWA Hackathon Service Management

## 概述

RWA Hackathon 應用現在已經配置為在 `https://hackathon.com.tw` 上運行，通過 Apache 代理到本地 Next.js 應用（localhost:3008）。

## 快速開始

### 管理應用

使用 `manage.sh` 腳本來管理應用：

```bash
# 查看所有可用命令
./manage.sh help

# 啟動應用
./manage.sh start

# 停止應用
./manage.sh stop

# 重啟應用
./manage.sh restart

# 查看狀態
./manage.sh status

# 查看日誌
./manage.sh logs

# 構建應用
./manage.sh build

# 完整部署
./manage.sh deploy
```

### 服務管理

使用 `service-deploy.sh` 腳本來管理系統服務：

```bash
# 查看服務狀態
./service-deploy.sh status

# 重啟服務
./service-deploy.sh restart

# 停止服務
./service-deploy.sh stop

# 查看服務日誌
./service-deploy.sh logs
```

## 配置詳情

### Apache 配置
- 配置文件：`/etc/apache2/sites-available/hackathon.com.tw.conf`
- SSL 證書：`/etc/letsencrypt/live/hackathon.com.tw/`
- 代理目標：`http://localhost:3008/`

### Next.js 應用
- 運行端口：3000
- 工作目錄：`/home/reyerchu/hack/hack`
- 生產模式：`NODE_ENV=production`

### 系統服務
- 服務名稱：`rwa-hackathon.service`
- 服務文件：`/etc/systemd/system/rwa-hackathon.service`
- 自動啟動：已啟用

## 故障排除

### 端口衝突
如果遇到端口 3000 被占用的錯誤：

```bash
# 查看占用端口的進程
lsof -i :3008

# 強制停止占用端口的進程
fuser -k 3000/tcp

# 重啟應用
./manage.sh restart
```

### Apache 代理問題
如果 Apache 代理不工作：

```bash
# 檢查 Apache 配置
sudo apache2ctl configtest

# 重載 Apache 配置
sudo systemctl reload apache2

# 檢查 Apache 日誌
sudo tail -f /var/log/apache2/hackathon_error.log
```

### 應用不響應
如果應用不響應：

```bash
# 檢查應用狀態
./manage.sh status

# 重啟應用
./manage.sh restart

# 查看應用日誌
./manage.sh logs
```

## 部署流程

### 開發部署
```bash
# 停止當前應用
./manage.sh stop

# 構建新版本
./manage.sh build

# 啟動應用
./manage.sh start

# 驗證部署
./manage.sh status
```

### 生產部署
```bash
# 使用服務部署腳本
./service-deploy.sh deploy
```

## 監控

### 檢查應用健康狀態
```bash
# 本地檢查
curl http://localhost:3008

# 通過 Apache 檢查
curl -k https://hackathon.com.tw
```

### 查看日誌
```bash
# 應用日誌
./manage.sh logs

# 系統服務日誌
./service-deploy.sh logs

# Apache 日誌
sudo tail -f /var/log/apache2/hackathon_access.log
sudo tail -f /var/log/apache2/hackathon_error.log
```

## 安全注意事項

1. SSL 證書自動更新：確保 Certbot 配置正確
2. 防火牆：確保端口 443 和 80 開放
3. 定期更新：保持系統和依賴項最新
4. 備份：定期備份應用和配置

## 聯繫信息

如有問題，請檢查：
1. 應用狀態：`./manage.sh status`
2. 服務狀態：`./service-deploy.sh status`
3. Apache 狀態：`sudo systemctl status apache2`
4. 系統日誌：`sudo journalctl -u rwa-hackathon.service`
