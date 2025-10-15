#!/bin/bash

# Google OAuth 配置檢查腳本

echo "=========================================="
echo "Google OAuth 配置檢查"
echo "=========================================="
echo ""

# 檢查環境變數
echo "📋 1. 檢查環境變數..."
if [ -f .env.local ]; then
    echo "✅ .env.local 文件存在"
    
    if grep -q "GOOGLE_CLIENT_ID=" .env.local; then
        CLIENT_ID=$(grep "GOOGLE_CLIENT_ID=" .env.local | cut -d '=' -f2)
        echo "✅ GOOGLE_CLIENT_ID: ${CLIENT_ID:0:20}..."
    else
        echo "❌ 缺少 GOOGLE_CLIENT_ID"
    fi
    
    if grep -q "GOOGLE_CLIENT_SECRET=" .env.local; then
        echo "✅ GOOGLE_CLIENT_SECRET: 已設置"
    else
        echo "❌ 缺少 GOOGLE_CLIENT_SECRET"
    fi
    
    if grep -q "GOOGLE_REDIRECT_URI=" .env.local; then
        REDIRECT_URI=$(grep "GOOGLE_REDIRECT_URI=" .env.local | cut -d '=' -f2)
        echo "✅ GOOGLE_REDIRECT_URI: $REDIRECT_URI"
    else
        echo "❌ 缺少 GOOGLE_REDIRECT_URI"
    fi
else
    echo "❌ .env.local 文件不存在"
fi

echo ""
echo "=========================================="
echo "📝 2. 需要在 Google Cloud Console 檢查的項目"
echo "=========================================="
echo ""
echo "請前往: https://console.cloud.google.com/apis/credentials/consent"
echo ""
echo "檢查以下設置："
echo ""
echo "🔍 OAuth 同意畫面："
echo "   [ ] 用戶類型 = 外部 (External)"
echo "   [ ] 發布狀態 = 測試中 (Testing) 或 已發布 (In production)"
echo ""
echo "🔍 測試使用者（如果處於測試狀態）："
echo "   [ ] 已添加需要使用的 Gmail 帳號"
echo "   [ ] 每個 Gmail 一行，最多 100 個"
echo ""
echo "🔍 範圍 (Scopes)："
echo "   [ ] https://www.googleapis.com/auth/calendar.readonly"
echo "   [ ] https://www.googleapis.com/auth/calendar.events"
echo ""
echo "🔍 已授權網域："
echo "   [ ] hackathon.com.tw"
echo ""
echo "=========================================="
echo "📝 3. OAuth 2.0 客戶端 ID 設置"
echo "=========================================="
echo ""
echo "請前往: https://console.cloud.google.com/apis/credentials"
echo ""
echo "檢查「已授權的 JavaScript 來源」："
echo "   [ ] https://hackathon.com.tw"
echo "   [ ] http://localhost:3008 (開發用)"
echo ""
echo "檢查「已授權的重新導向 URI」："
echo "   [ ] https://hackathon.com.tw/api/calendar/callback"
echo "   [ ] http://localhost:3008/api/calendar/callback (開發用)"
echo ""
echo "=========================================="
echo "🔧 4. 快速修正步驟"
echo "=========================================="
echo ""
echo "如果只有 defintek.io 用戶可以使用："
echo ""
echo "1️⃣  前往 Google Cloud Console OAuth 同意畫面"
echo "    https://console.cloud.google.com/apis/credentials/consent"
echo ""
echo "2️⃣  點擊「編輯應用程式」"
echo ""
echo "3️⃣  將「用戶類型」改為「外部 (External)」"
echo ""
echo "4️⃣  儲存後，進入「測試使用者」區塊"
echo ""
echo "5️⃣  點擊「+ ADD USERS」"
echo ""
echo "6️⃣  輸入需要測試的 Gmail 地址（每行一個）"
echo ""
echo "7️⃣  點擊「儲存」"
echo ""
echo "8️⃣  請測試用戶清除舊授權："
echo "    https://myaccount.google.com/permissions"
echo "    找到應用程式並移除存取權"
echo ""
echo "9️⃣  重新測試授權流程"
echo ""
echo "=========================================="
echo "📖 詳細文檔"
echo "=========================================="
echo ""
echo "請查看: GOOGLE-OAUTH-PUBLIC-ACCESS.md"
echo ""

