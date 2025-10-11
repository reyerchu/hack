#!/bin/bash

echo "🧪 测试找队友 API"
echo "===================="
echo ""

# 测试 1: GET /api/team-up/needs (不需要认证)
echo "📝 测试 1: 获取需求列表（不需要认证）"
curl -s -w "\n状态码: %{http_code}\n" http://localhost:3008/api/team-up/needs | head -50
echo ""
echo "---"
echo ""

# 测试 2: GET /api/team-up/stats (不需要认证)
echo "📊 测试 2: 获取统计信息（不需要认证）"
curl -s -w "\n状态码: %{http_code}\n" http://localhost:3008/api/team-up/stats | head -50
echo ""
echo "---"
echo ""

# 测试 3: POST /api/team-up/needs (需要认证，应该返回 401)
echo "🔒 测试 3: 创建需求（需要认证，应返回 401）"
curl -s -w "\n状态码: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"title":"测试"}' \
  http://localhost:3008/api/team-up/needs | head -50
echo ""
echo "---"
echo ""

echo "✅ 测试完成"
echo ""
echo "💡 如果看到 HTML 响应而不是 JSON，说明 API 路由没有正确处理"
echo "💡 如果看到 500 错误，检查服务器日志: tail -f /tmp/nextjs.log"

