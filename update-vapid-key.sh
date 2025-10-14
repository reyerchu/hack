#!/bin/bash
# 更新 Firebase VAPID Key 腳本

echo "=== Firebase VAPID Key 更新工具 ==="
echo ""

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 檢查當前的 VAPID key
echo "📋 當前的 VAPID key 設置："
CURRENT_KEY=$(grep "NEXT_PUBLIC_VAPID_KEY" .env.local | cut -d'=' -f2)
echo "   $CURRENT_KEY"
echo ""

if [ "$CURRENT_KEY" = "dummy-vapid-key" ]; then
    echo -e "${YELLOW}⚠️  警告：當前使用的是 dummy key，需要更新為真實的 VAPID key${NC}"
    echo ""
fi

# 提示用戶如何獲取 VAPID key
echo "📍 如何獲取 Firebase VAPID Key："
echo "   1. 前往 Firebase Console："
echo "      https://console.firebase.google.com/project/hackathon-rwa-nexus/settings/cloudmessaging"
echo ""
echo "   2. 在 'Web configuration' 區域找到 'Web Push certificates'"
echo ""
echo "   3. 如果沒有 key，點擊 'Generate key pair' 按鈕"
echo ""
echo "   4. 複製生成的 Key pair（格式：BHxxx...xxxxxx）"
echo ""

# 詢問用戶是否要更新
read -p "📝 是否現在更新 VAPID key? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消更新"
    exit 0
fi

# 輸入新的 VAPID key
echo ""
echo "請輸入新的 VAPID key："
echo "（格式應該是：BHxxx...xxxxxx，約 88 個字符）"
read -p "VAPID Key: " NEW_KEY

# 驗證輸入
if [ -z "$NEW_KEY" ]; then
    echo -e "${RED}❌ 錯誤：VAPID key 不能為空${NC}"
    exit 1
fi

if [ ${#NEW_KEY} -lt 80 ]; then
    echo -e "${YELLOW}⚠️  警告：VAPID key 長度似乎不正確（應該約 88 個字符）${NC}"
    read -p "是否仍要繼續？(y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "取消更新"
        exit 0
    fi
fi

if [[ ! $NEW_KEY =~ ^B[A-Za-z0-9_-]+$ ]]; then
    echo -e "${YELLOW}⚠️  警告：VAPID key 格式似乎不正確（應該以 'B' 開頭）${NC}"
    read -p "是否仍要繼續？(y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "取消更新"
        exit 0
    fi
fi

# 備份原始文件
echo ""
echo "📦 備份原始 .env.local..."
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}   ✓ 備份完成${NC}"

# 更新 VAPID key
echo ""
echo "🔄 更新 VAPID key..."
sed -i "s|NEXT_PUBLIC_VAPID_KEY=.*|NEXT_PUBLIC_VAPID_KEY=$NEW_KEY|" .env.local
echo -e "${GREEN}   ✓ 更新完成${NC}"

# 驗證更新
NEW_VALUE=$(grep "NEXT_PUBLIC_VAPID_KEY" .env.local | cut -d'=' -f2)
echo ""
echo "📋 新的 VAPID key："
echo "   ${NEW_VALUE:0:20}...${NEW_VALUE: -20}"
echo ""

# 詢問是否重啟服務
echo "⚙️  需要重啟服務以應用更改"
read -p "是否立即重啟 hackathon-main.service? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔄 重啟服務..."
    sudo systemctl restart hackathon-main.service
    sleep 2
    
    # 檢查服務狀態
    if sudo systemctl is-active --quiet hackathon-main.service; then
        echo -e "${GREEN}   ✓ 服務重啟成功${NC}"
        echo ""
        echo "📊 服務狀態："
        sudo systemctl status hackathon-main.service --no-pager -l | head -15
    else
        echo -e "${RED}   ❌ 服務重啟失敗${NC}"
        echo "   請檢查日誌：sudo journalctl -u hackathon-main.service -n 50"
    fi
else
    echo ""
    echo "⚠️  記得稍後手動重啟服務："
    echo "   sudo systemctl restart hackathon-main.service"
fi

echo ""
echo -e "${GREEN}=== 更新完成！===${NC}"
echo ""
echo "💡 提示："
echo "   - 備份文件保存在：.env.local.backup.*"
echo "   - 查看服務狀態：sudo systemctl status hackathon-main.service"
echo "   - 查看實時日誌：sudo journalctl -u hackathon-main.service -f"
echo ""
echo "🧪 測試推播通知："
echo "   訪問 http://localhost:3008 並檢查是否還有 VAPID key 錯誤"
echo ""

