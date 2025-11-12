# 🔄 Git 工作流程規範

> **防止功能覆蓋的最佳實踐**

## ❌ 這次事件的問題

### 問題 1：使用 Stash 而非 Commit
```bash
# ❌ 錯誤做法
git stash  # 功能完成但沒有 commit，只是暫存

# ✅ 正確做法
git add .
git commit -m "feat: add team wallet address editing feature"
git push
```

### 問題 2：沒有功能分支
```bash
# ❌ 錯誤做法
# 直接在 main 分支開發多個功能

# ✅ 正確做法
git checkout -b feature/team-wallet-address
# 開發完成
git commit -m "feat: add team wallet address editing"
git checkout main
git merge feature/team-wallet-address
```

## 🎯 新的工作流程

### 1. 開始新功能

```bash
# 1. 確保在最新的 main 分支
git checkout main
git pull origin main

# 2. 創建功能分支（明確命名）
git checkout -b feature/功能名稱

# 3. 更新 FEATURES.md
# 在 FEATURES.md 中添加正在開發的功能

# 4. 開始開發
```

### 2. 開發過程中

```bash
# 定期 commit（小步提交）
git add .
git commit -m "feat(team): add wallet address input fields"

git add .
git commit -m "feat(team): add wallet address validation"

git add .
git commit -m "feat(team): add wallet address to email notification"

# 推送到遠端（備份）
git push origin feature/功能名稱
```

### 3. 功能完成

```bash
# 1. 確保所有更改都已 commit
git status  # 應該顯示 "nothing to commit"

# 2. 更新 FEATURES.md
# 標記功能為完成，添加文件位置

# 3. Commit 文檔更新
git add FEATURES.md
git commit -m "docs: update FEATURES.md for wallet address feature"

# 4. 合併到 main
git checkout main
git pull origin main  # 確保是最新的
git merge feature/功能名稱

# 5. 推送
git push origin main

# 6. 刪除功能分支（可選）
git branch -d feature/功能名稱
git push origin --delete feature/功能名稱
```

### 4. 如果需要暫時切換功能

```bash
# ❌ 錯誤：使用匿名 stash
git stash

# ✅ 正確：先 commit 到功能分支
git add .
git commit -m "WIP: wallet address feature (未完成)"
git push origin feature/wallet-address

# 然後切換分支
git checkout feature/其他功能

# 回來繼續開發
git checkout feature/wallet-address
# 如果需要，可以修改最後一個 commit
git commit --amend
```

## 🚨 禁止的操作

### ❌ 1. 匿名 Stash
```bash
# ❌ 絕對不要這樣做
git stash  # 沒有描述，難以追蹤

# ✅ 如果真的必須用 stash
git stash save "team-wallet-address: 錢包地址編輯功能（未完成）"
```

### ❌ 2. 在 Main 分支直接開發
```bash
# ❌ 錯誤
git checkout main
# 直接修改檔案...

# ✅ 正確
git checkout -b feature/新功能
# 修改檔案...
```

### ❌ 3. 強制推送覆蓋歷史
```bash
# ❌ 絕對禁止
git push --force origin main

# ✅ 如果需要修改，使用新的 commit
git revert <commit-hash>
```

### ❌ 4. 刪除大量代碼而不確認
```bash
# ❌ 危險操作
# 刪除整個功能的檔案或代碼

# ✅ 先檢查
git diff  # 查看所有更改
# 確認沒有誤刪其他功能
# 查看 FEATURES.md 確認影響範圍
```

## 📋 Commit Message 規範

### 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 類型
- `feat`: 新功能
- `fix`: Bug 修復
- `docs`: 文檔更新
- `style`: 代碼格式（不影響功能）
- `refactor`: 重構（不改變功能）
- `test`: 測試相關
- `chore`: 建構工具、依賴更新

### 範例

```bash
# ✅ 好的 commit message
git commit -m "feat(team): add wallet address editing feature

- Add EVM wallet address input field
- Add other wallets (multi-chain) support
- Add wallet address to email notifications
- Update API to handle wallet address CRUD

Files:
- pages/team-register.tsx
- pages/api/team-register/[teamId].ts
- lib/teamRegister/email.ts

Closes #123"

# ❌ 壞的 commit message
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

## 🔍 檢查清單

### 每次 Commit 前

- [ ] 執行 `git status` 確認要提交的檔案
- [ ] 執行 `git diff` 查看所有更改
- [ ] 確認沒有誤刪其他功能的代碼
- [ ] 確認 FEATURES.md 已更新
- [ ] Linter 無錯誤
- [ ] 本地測試通過

### 每次 Push 前

- [ ] 所有更改都已 commit
- [ ] Commit message 清晰明確
- [ ] 沒有包含敏感資訊（API keys, passwords）
- [ ] 沒有包含臨時檔案或測試代碼

### 每次 Merge 前

- [ ] 目標分支（main）已是最新
- [ ] 功能分支已測試完成
- [ ] FEATURES.md 已更新
- [ ] 沒有衝突
- [ ] 團隊已 review（如果是重要功能）

## 🆘 緊急恢復流程

### 如果發現功能被覆蓋

1. **立即停止**：不要再做任何 commit
   ```bash
   git status
   ```

2. **檢查最近的更改**
   ```bash
   git log --oneline -20
   git log --all --oneline --graph -20
   ```

3. **搜尋功能相關代碼**
   ```bash
   git log -S "關鍵字" --oneline
   git log --all --oneline --grep="功能關鍵字"
   ```

4. **檢查 Stash**
   ```bash
   git stash list
   git stash show -p stash@{0}
   ```

5. **檢查所有分支**
   ```bash
   git branch -a
   git log --all -S "關鍵字"
   ```

6. **恢復功能**
   ```bash
   # 從特定 commit 恢復
   git show <commit-hash>:path/to/file.ts > file.ts
   
   # 或從 stash 恢復
   git stash pop stash@{0}
   
   # 或從其他分支恢復
   git checkout <branch-name> -- path/to/file.ts
   ```

7. **立即 Commit 恢復的功能**
   ```bash
   git add .
   git commit -m "fix: restore team wallet address feature (from stash@{0})"
   git push
   ```

8. **更新文檔**
   ```bash
   # 在 FEATURES.md 中記錄這次事件
   git add FEATURES.md
   git commit -m "docs: update FEATURES.md after feature restoration"
   ```

## 📊 分支策略

```
main (production)
  ├── dev (development)
  │   ├── feature/team-wallet-address
  │   ├── feature/nft-minting
  │   └── feature/admin-dashboard
  ├── hotfix/critical-bug
  └── release/v1.0.0
```

### 分支命名規範

- `feature/功能名稱` - 新功能開發
- `fix/bug描述` - Bug 修復
- `refactor/重構範圍` - 代碼重構
- `docs/文檔更新` - 文檔更新
- `hotfix/緊急修復` - 緊急線上問題修復

## 🎯 總結：防止覆蓋的核心原則

1. **✅ 永遠使用功能分支**
2. **✅ 功能完成立即 commit**
3. **✅ 避免使用 stash，使用 commit**
4. **✅ Commit message 清晰明確**
5. **✅ 定期推送到遠端**
6. **✅ 更新 FEATURES.md**
7. **✅ 刪除代碼前三思**
8. **✅ 使用 git diff 檢查所有更改**

---

**記住**：Code lost is time lost. Commit early, commit often!

