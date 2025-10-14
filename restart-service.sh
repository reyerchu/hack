#!/bin/bash
# 重啟 hackathon-main 服務

echo "🔄 正在重啟 hackathon-main 服務..."
sudo systemctl restart hackathon-main.service

echo "⏳ 等待服務啟動..."
sleep 3

echo ""
echo "📊 服務狀態："
sudo systemctl status hackathon-main.service --no-pager | head -15

echo ""
echo "🔍 檢查端口："
lsof -i :3008 | grep LISTEN

echo ""
echo "✅ 完成！請訪問 http://localhost:3008 測試"

