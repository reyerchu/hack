#!/bin/bash
# Setup hackathon-main as a systemd service

echo "=== 設置 Hackathon Main 開機自動啟動服務 ==="
echo ""

# 停止當前手動運行的服務
echo "1. 停止當前手動運行的 localhost:3008..."
lsof -ti :3008 | xargs -r kill -9
echo "   ✓ 已停止"
echo ""

# 複製服務文件
echo "2. 安裝 systemd 服務..."
sudo cp /tmp/hackathon-main.service /etc/systemd/system/
echo "   ✓ 服務文件已複製"
echo ""

# 重新載入 systemd
echo "3. 重新載入 systemd..."
sudo systemctl daemon-reload
echo "   ✓ 已重新載入"
echo ""

# 啟用服務
echo "4. 啟用開機自動啟動..."
sudo systemctl enable hackathon-main.service
echo "   ✓ 已啟用"
echo ""

# 啟動服務
echo "5. 啟動服務..."
sudo systemctl start hackathon-main.service
echo "   ✓ 已啟動"
echo ""

# 顯示狀態
echo "6. 服務狀態："
sudo systemctl status hackathon-main.service --no-pager
echo ""

echo "=== 設置完成！ ==="
echo ""
echo "常用命令："
echo "  查看狀態：sudo systemctl status hackathon-main.service"
echo "  停止服務：sudo systemctl stop hackathon-main.service"
echo "  啟動服務：sudo systemctl start hackathon-main.service"
echo "  重啟服務：sudo systemctl restart hackathon-main.service"
echo "  查看日誌：sudo journalctl -u hackathon-main.service -f"
echo "  取消開機啟動：sudo systemctl disable hackathon-main.service"

