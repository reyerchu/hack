# 開發工作流程 (Development Workflow)

## 📋 分支結構

### Main Branch (主分支)
- **分支名稱**: `main`
- **運行端口**: `3008`
- **啟動腳本**: `./start-main.sh`
- **用途**: 生產環境穩定版本
- **訪問**: http://localhost:3008 或 https://hackathon.com.tw

### Dev Branch (開發分支)
- **分支名稱**: `dev`
- **運行端口**: `3009`
- **啟動腳本**: `./start-dev.sh`
- **用途**: 開發和測試新功能
- **訪問**: http://localhost:3009

---

## 🚀 快速開始

### 啟動 Main Branch (端口 3008)
```bash
# 切換到 main 分支
git checkout main

# 啟動服務
./start-main.sh
```

### 啟動 Dev Branch (端口 3009)
```bash
# 切換到 dev 分支
git checkout dev

# 啟動服務
./start-dev.sh
```

---

## 🔄 開發流程

### 1. 在 Dev 分支開發新功能
```bash
# 確保在 dev 分支
git checkout dev

# 拉取最新代碼
git pull origin dev

# 開始開發...
# 修改代碼、測試功能

# 提交更改
git add .
git commit -m "feat: 添加新功能"

# 推送到遠端
git push origin dev
```

### 2. 測試 Dev 分支
```bash
# 構建
npm run build

# 啟動 dev 服務器（端口 3009）
./start-dev.sh

# 訪問 http://localhost:3009 進行測試
```

### 3. 確認無誤後，請求合併到 Main
⚠️ **重要**: 只有在 Dev 分支測試完全通過後，才請求合併到 Main！

```bash
# 告訴 AI：
"dev 分支測試完成，請合併到 main"
```

---

## ⚠️ 重要注意事項

### 🚫 絕對不要合併到 Main 的內容
- ❌ `start-dev.sh` - Dev 啟動腳本
- ❌ 端口 3009 的任何配置
- ❌ Dev 專用的測試代碼（除非確定要上線）

### ✅ 可以合併到 Main 的內容
- ✅ 新功能代碼
- ✅ Bug 修復
- ✅ UI/UX 改進
- ✅ 文檔更新
- ✅ 通過測試的所有更改

---

## 📝 合併流程

### AI 執行的合併步驟（僅在用戶確認後執行）

```bash
# 1. 切換到 main 分支
git checkout main

# 2. 拉取最新代碼
git pull origin main

# 3. 合併 dev 分支（排除端口配置）
git merge dev --no-commit

# 4. 檢查並排除 start-dev.sh
git reset HEAD start-dev.sh
git checkout -- start-dev.sh

# 5. 確認更改無誤
git status

# 6. 提交合併
git commit -m "merge: 合併 dev 分支到 main"

# 7. 推送到遠端
git push origin main

# 8. 切回 dev 分支繼續開發
git checkout dev
```

---

## 🔍 健康檢查

### Main Branch (3008)
```bash
curl http://localhost:3008/api/health
```

### Dev Branch (3009)
```bash
curl http://localhost:3009/api/health
```

---

## 🛠️ 故障排除

### 端口被占用
```bash
# 查看占用端口的進程
lsof -i :3008
lsof -i :3009

# 殺死進程
kill -9 <PID>
```

### 無法切換分支
```bash
# 保存當前更改
git stash

# 切換分支
git checkout <branch-name>

# 恢復更改
git stash pop
```

### 構建失敗
```bash
# 清除緩存
rm -rf .next

# 重新構建
npm run build
```

---

## 📊 分支狀態監控

### 查看當前分支
```bash
git branch --show-current
```

### 查看所有分支
```bash
git branch -a
```

### 查看分支差異
```bash
# 查看 dev 與 main 的差異
git diff main..dev
```

---

## 🎯 最佳實踐

1. **始終在 Dev 分支開發**
   - 所有新功能、修改都在 dev 分支進行
   - 測試通過後才合併到 main

2. **定期同步**
   - Dev 分支定期從 Main 拉取最新代碼
   - 避免分支差異過大

3. **小步快跑**
   - 每個功能開發完成後立即測試
   - 測試通過後儘快合併到 main

4. **保持 Main 穩定**
   - Main 分支始終保持可部署狀態
   - 絕不直接在 main 分支開發

5. **使用版本標籤**
   - 重要更新合併到 main 後打標籤
   - 例如: v4.3, v4.4

---

## 📞 需要幫助？

如果遇到任何問題，請告訴 AI：
- "dev 分支有問題"
- "無法啟動 dev 服務器"
- "需要回滾 dev 分支"
- "準備合併 dev 到 main"

---

**最後更新**: 2025-10-13  
**當前版本**: v4.2

