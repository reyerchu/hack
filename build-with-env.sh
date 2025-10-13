#!/bin/bash
# 确保使用 .env.local 中的环境变量进行构建

set -e

echo "🔧 加载 .env.local 环境变量..."

# 加载所有 NEXT_PUBLIC_ 开头的环境变量
while IFS='=' read -r key value; do
  if [[ $key == NEXT_PUBLIC_* ]]; then
    # 移除值两端的引号
    value="${value%\"}"
    value="${value#\"}"
    export "$key=$value"
    echo "   ✓ $key"
  fi
done < .env.local

echo ""
echo "🏗️  开始构建..."
npm run build

echo ""
echo "✅ 构建完成！"
echo ""
echo "📋 使用的 Storage Bucket:"
echo "   $NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"

