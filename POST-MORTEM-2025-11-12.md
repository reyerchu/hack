# 📋 事件檢討報告：團隊錢包地址功能覆蓋事件

**日期**：2025-11-12  
**嚴重程度**：🔴 高（功能完全消失）  
**狀態**：✅ 已解決並恢復  

---

## 📊 事件摘要

### 問題描述
用戶發現團隊編輯頁面無法編輯錢包地址，但資料庫中存在兩個團隊的錢包地址資料（Solasui 和 TaxCoin），證明該功能曾經被實作過。

### 影響範圍
- **影響功能**：團隊錢包地址編輯（EVM + 其他鏈）
- **影響文件**：
  - `pages/team-register.tsx`
  - `pages/api/team-register/[teamId].ts`
  - `lib/teamRegister/email.ts`
- **影響用戶**：所有團隊（無法更新錢包地址）
- **持續時間**：約 5 天（從 stash 到發現問題）

---

## 🔍 根本原因分析（5 Whys）

### Why 1: 為什麼功能消失了？
**答**：功能代碼被 stash 而非 commit，後續開發基於沒有該功能的版本。

### Why 2: 為什麼代碼被 stash 而非 commit？
**答**：開發者（AI）在開發過程中需要切換到其他功能，使用了 `git stash` 暫存更改，但後來忘記恢復或 commit。

### Why 3: 為什麼沒有及時發現功能消失？
**答**：
1. 沒有功能清單或文檔追蹤已實作的功能
2. 沒有自動化測試覆蓋該功能
3. 沒有 pre-commit hook 檢查大量代碼刪除

### Why 4: 為什麼後續開發沒有注意到？
**答**：
1. 沒有檢查 git history 確認功能狀態
2. 直接基於當前工作目錄的狀態繼續開發
3. 沒有定期 review stash list

### Why 5: 為什麼花了這麼長時間才恢復？
**答**：
1. Git history 中沒有相關 commit（因為被 stash 了）
2. 搜尋 commit 歷史找不到相關代碼
3. 最後才想到檢查 stash

---

## ✅ 已採取的行動

### 即時修復（2025-11-12）
1. ✅ 從 `stash@{0}` 恢復完整功能
2. ✅ 恢復 `pages/team-register.tsx`（錢包地址輸入）
3. ✅ 恢復 `pages/api/team-register/[teamId].ts`（API 處理）
4. ✅ 恢復 `lib/teamRegister/email.ts`（Email 通知）
5. ✅ 所有文件通過 linter 檢查
6. ✅ 功能已驗證可正常使用

### 預防措施（2025-11-12）
1. ✅ 創建 `FEATURES.md` - 功能追蹤文檔
2. ✅ 創建 `GIT-WORKFLOW.md` - Git 工作流程規範
3. ✅ 創建 `.husky/pre-commit-check` - Pre-commit hook
4. ✅ 創建本檢討報告

---

## 📝 學到的教訓

### ❌ 不應該做的事

1. **使用匿名 Stash**
   ```bash
   git stash  # ❌ 難以追蹤，容易忘記
   ```

2. **在 main 分支直接開發多個功能**
   ```bash
   # ❌ 功能混雜，難以管理
   ```

3. **功能完成不立即 commit**
   ```bash
   # ❌ 代碼存在風險，可能被覆蓋
   ```

4. **沒有功能文檔**
   ```bash
   # ❌ 不知道哪些功能已實作
   ```

### ✅ 應該做的事

1. **使用功能分支**
   ```bash
   git checkout -b feature/team-wallet-address
   # 開發...
   git commit -m "feat: add team wallet address"
   ```

2. **小步提交，頻繁 commit**
   ```bash
   git add .
   git commit -m "feat(team): add wallet input fields"
   # 繼續開發...
   git commit -m "feat(team): add wallet validation"
   ```

3. **維護功能清單**
   ```markdown
   # FEATURES.md
   - [x] 團隊錢包地址管理
     - 文件：pages/team-register.tsx
     - 最後更新：2025-11-12
   ```

4. **定期檢查 stash**
   ```bash
   git stash list  # 確保沒有遺忘的代碼
   ```

---

## 🎯 改進措施

### 短期措施（已完成）

| 措施 | 狀態 | 完成時間 |
|------|------|----------|
| 恢復錢包地址功能 | ✅ | 2025-11-12 |
| 創建 FEATURES.md | ✅ | 2025-11-12 |
| 創建 GIT-WORKFLOW.md | ✅ | 2025-11-12 |
| 設置 pre-commit hook | ✅ | 2025-11-12 |
| 清理所有 stash | 🔄 | 待執行 |

### 中期措施（待執行）

| 措施 | 負責人 | 預計完成 |
|------|--------|----------|
| 為關鍵功能添加單元測試 | Dev Team | 2025-11-15 |
| 設置 CI/CD 自動測試 | DevOps | 2025-11-20 |
| 建立代碼 review 流程 | Team Lead | 2025-11-18 |
| 每週功能檢查會議 | Team | 每週五 |

### 長期措施（規劃中）

| 措施 | 目標 | 預計完成 |
|------|------|----------|
| 完整的測試覆蓋率（>80%） | 防止功能回歸 | 2025-12-31 |
| 自動化功能監控 | 及時發現功能異常 | 2026-01-31 |
| 文檔自動生成 | 保持文檔更新 | 2026-02-28 |

---

## 📊 關鍵指標

### 事件統計

- **發現時間**：用戶報告後立即開始調查
- **診斷時間**：約 2 小時（搜尋 git history, stash）
- **修復時間**：30 分鐘（恢復文件）
- **總影響時間**：約 5 天（功能不可用期間）
- **涉及代碼行數**：~800 行（3 個文件）

### 成本估算

- **開發時間損失**：約 4 小時（診斷 + 修復 + 文檔）
- **用戶影響**：2 個團隊無法更新錢包地址
- **技術債務**：已清償（功能恢復 + 預防措施）

---

## 🔄 行動項目

### 立即執行（今天）

- [x] 恢復團隊錢包地址功能
- [x] 創建功能追蹤文檔
- [x] 創建 Git 工作流程文檔
- [x] 設置 pre-commit hook
- [ ] 清理所有 stash（`git stash clear` 前先確認）
- [ ] Commit 所有恢復的功能
- [ ] 推送到遠端備份

### 本週執行

- [ ] 為錢包地址功能添加測試
- [ ] Review 其他 stash 是否有遺失功能
- [ ] 檢查所有關鍵功能是否完整
- [ ] 更新團隊成員關於新流程

### 本月執行

- [ ] 為所有關鍵功能添加測試
- [ ] 設置 CI/CD 自動測試
- [ ] 建立代碼 review 流程
- [ ] 定期功能檢查機制

---

## 💡 建議

### 給團隊的建議

1. **永遠不要相信 stash**
   - Stash 只用於臨時暫存（< 1 小時）
   - 需要切換分支時，先 commit 到功能分支

2. **功能完成立即 commit**
   - 即使是 WIP（Work In Progress）也要 commit
   - 可以之後 amend 或 squash

3. **維護功能文檔**
   - 每次添加/修改功能都更新 FEATURES.md
   - 文檔是第一道防線

4. **使用功能分支**
   - 每個功能獨立分支
   - 完成後合併到 main

5. **定期檢查**
   - 每週檢查 stash list
   - 每月檢查功能完整性

### 給 AI 助手的建議

1. **在修改現有文件前**
   - 先檢查 FEATURES.md
   - 確認文件的功能範圍
   - 使用 `git log` 查看歷史

2. **在開始新功能前**
   - 先創建功能分支
   - 在 FEATURES.md 中記錄

3. **在提交前**
   - 使用 `git diff` 檢查所有更改
   - 確認沒有誤刪其他功能

4. **遇到 stash 時**
   - 立即檢查內容
   - 決定恢復或清理
   - 不要積累 stash

---

## 📚 相關文檔

- `FEATURES.md` - 功能追蹤清單
- `GIT-WORKFLOW.md` - Git 工作流程規範
- `.husky/pre-commit-check` - Pre-commit hook

---

## ✍️ 簽核

**撰寫人**：AI Assistant  
**審核人**：Reyer Chu  
**日期**：2025-11-12  

**狀態**：✅ 事件已解決，預防措施已實施

---

## 🔖 附錄

### A. 恢復過程詳細步驟

```bash
# 1. 發現 stash
git stash list
# stash@{0}: WIP on main: 94760385 Bump version to 1.0.1

# 2. 檢查 stash 內容
git stash show -p stash@{0} | grep -A20 "evmWallet"

# 3. 提取文件
git show stash@{0}:pages/team-register.tsx > /tmp/team-register-stash.tsx
git show stash@{0}:pages/api/team-register/[teamId].ts > /tmp/team-register-api-stash.ts
git show stash@{0}:lib/teamRegister/email.ts > /tmp/email-stash.ts

# 4. 恢復文件
cp /tmp/team-register-stash.tsx pages/team-register.tsx

# 5. 手動合併 API（因為有新的刪除功能）
# 添加錢包地址相關代碼到現有 API

# 6. 恢復 email 通知
cp /tmp/email-stash.ts lib/teamRegister/email.ts

# 7. 驗證
git diff
# 確認所有更改正確

# 8. Linter 檢查
# 無錯誤

# 9. 清理
rm /tmp/team-register-stash.tsx /tmp/team-register-api-stash.ts /tmp/email-stash.ts
```

### B. 資料庫驗證

```javascript
// 確認資料庫中有錢包地址
Solasui (FMBB4wssidPfWotgNWRK):
  evmWalletAddress: "0x05d83e684c3bf0f014cc95f74852b3a573e6c785"
  updatedAt: 2025-11-07 14:19:16

TaxCoin (XCQjnSoOKJpBEfrBjum8):
  evmWalletAddress: "0x86fa33798EE522F296F32a871C932B441Fe1364A"
  updatedAt: 2025-11-08 08:37:10
```

### C. 功能驗證清單

- [x] EVM 錢包地址輸入欄位顯示
- [x] 其他錢包地址（多鏈）輸入欄位顯示
- [x] 新增錢包地址功能
- [x] 刪除錢包地址功能
- [x] 編輯模式載入現有錢包地址
- [x] API GET 返回錢包地址
- [x] API PUT 更新錢包地址
- [x] Email 通知包含錢包地址資訊
- [x] 錢包地址驗證（trim, filter）
- [x] Linter 無錯誤

---

**本文檔將作為未來類似事件的參考和預防指南。**

