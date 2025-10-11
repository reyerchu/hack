#!/bin/bash

# 快速检查脚本 - 验证所有找隊友页面是否可访问

BASE_URL="http://localhost:3008"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "  找隊友功能 - 快速检查"
echo "========================================="
echo ""

# 检查服务器是否运行
echo "检查服务器状态..."
if curl -s --head $BASE_URL | head -n 1 | grep "200\|301\|302" > /dev/null; then
    echo -e "${GREEN}✓${NC} 服务器正在运行: $BASE_URL"
else
    echo -e "${RED}✗${NC} 服务器未运行，请先启动: npm run dev"
    exit 1
fi

echo ""
echo "检查页面可访问性..."
echo "-----------------------------------"

# 定义要检查的页面
declare -a pages=(
    "/team-up:找隊友列表页"
    "/team-up/create:创建需求页"
    "/dashboard/team-up:仪表板页"
)

# 检查每个页面
for page_info in "${pages[@]}"; do
    IFS=':' read -ra PAGE <<< "$page_info"
    url="${BASE_URL}${PAGE[0]}"
    name="${PAGE[1]}"
    
    # 发送请求
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" == "200" ] || [ "$response" == "304" ]; then
        echo -e "${GREEN}✓${NC} $name ($url) - HTTP $response"
    elif [ "$response" == "302" ] || [ "$response" == "301" ]; then
        echo -e "${YELLOW}⟳${NC} $name ($url) - 重定向 HTTP $response"
    else
        echo -e "${RED}✗${NC} $name ($url) - HTTP $response"
    fi
done

echo ""
echo "检查 API 端点..."
echo "-----------------------------------"

# 检查 API
declare -a apis=(
    "/api/team-up/needs:需求列表API"
    "/api/team-up/stats:统计API"
)

for api_info in "${apis[@]}"; do
    IFS=':' read -ra API <<< "$api_info"
    url="${BASE_URL}${API[0]}"
    name="${API[1]}"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓${NC} $name - HTTP $response"
    elif [ "$response" == "401" ] || [ "$response" == "403" ]; then
        echo -e "${YELLOW}⟳${NC} $name - 需要认证 HTTP $response"
    else
        echo -e "${RED}✗${NC} $name - HTTP $response"
    fi
done

echo ""
echo "========================================="
echo "检查完成！"
echo ""
echo "下一步:"
echo "1. 在浏览器中访问: $BASE_URL/team-up"
echo "2. 参考完整测试指南: docs/TESTING-GUIDE.md"
echo "========================================="

