#!/bin/bash

# Git Wrapper: 攔截 git stash 命令

# 如果第一個參數是 stash，攔截並顯示錯誤
if [ "$1" = "stash" ]; then
    echo ""
    echo "🚫 ============================================"
    echo "🚫  Git Stash 已被禁用！"
    echo "🚫 ============================================"
    echo ""
    echo "❌ 原因：2025-11-12 檢討報告"
    echo "   - 2025-11-10 的 stash 導致團隊錢包地址功能消失"
    echo "   - 代碼從未被 commit，導致功能完全丟失"
    echo ""
    echo "✅ 正確做法："
    echo ""
    echo "   1. 功能未完成："
    echo "      /usr/bin/git add ."
    echo "      /usr/bin/git commit -m \"WIP: 功能描述\""
    echo ""
    echo "   2. 需要切換："
    echo "      /usr/bin/git checkout -b feature/新功能"
    echo ""
    echo "   3. 自動備份："
    echo "      bash $HOME/hack/hack/scripts/auto-backup.sh"
    echo ""
    echo "💡 每小時自動備份已啟用（cron job）"
    echo ""
    echo "🔴 如果確定要使用（緊急）："
    echo "    /usr/bin/git stash \"\$@\""
    echo ""
    exit 1
else
    # 其他 git 命令正常執行
    exec /usr/bin/git "$@"
fi

