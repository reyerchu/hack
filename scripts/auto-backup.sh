#!/bin/bash

# 自動備份腳本：每小時檢查未 commit 的更改並自動 commit 到備份分支

BACKUP_BRANCH="auto-backup/$(date +%Y%m%d)"
MAIN_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# 檢查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  檢測到未提交的更改"
    
    # 獲取更改統計
    CHANGED_FILES=$(git diff --name-only | wc -l)
    ADDED_LINES=$(git diff --numstat | awk '{sum += $1} END {print sum}')
    DELETED_LINES=$(git diff --numstat | awk '{sum += $2} END {print sum}')
    
    echo "   變更檔案數: $CHANGED_FILES"
    echo "   新增行數: $ADDED_LINES"
    echo "   刪除行數: $DELETED_LINES"
    
    if [ "$CHANGED_FILES" -gt 0 ]; then
        echo ""
        echo "🔄 自動創建備份 commit..."
        
        # 創建或切換到備份分支
        git checkout -b "$BACKUP_BRANCH" 2>/dev/null || git checkout "$BACKUP_BRANCH"
        
        # Commit 所有更改
        TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
        git add -A
        git commit -m "AUTO-BACKUP: $TIMESTAMP

未 commit 的更改自動備份

統計:
- 變更檔案: $CHANGED_FILES
- 新增行數: $ADDED_LINES
- 刪除行數: $DELETED_LINES

原分支: $MAIN_BRANCH
備份時間: $TIMESTAMP

⚠️ 此為自動備份，請盡快 review 並 commit 到正確分支"
        
        # 推送到遠端
        git push origin "$BACKUP_BRANCH" --force
        
        # 切回原分支
        git checkout "$MAIN_BRANCH"
        
        echo "✅ 備份已創建到分支: $BACKUP_BRANCH"
        echo "   遠端: origin/$BACKUP_BRANCH"
        echo ""
        echo "💡 建議："
        echo "   1. Review 更改：git diff origin/$BACKUP_BRANCH"
        echo "   2. 立即 commit：git commit -m \"feat: 功能描述\""
        echo "   3. 或創建功能分支：git checkout -b feature/功能名稱"
        echo ""
    fi
else
    echo "✅ 工作目錄乾淨，無需備份"
fi

