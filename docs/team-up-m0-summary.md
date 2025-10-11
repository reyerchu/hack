# Milestone 0: 前期準備與設計確認 - 完成總結

## 📅 完成時間
2025-10-10

## ✅ 完成項目

### 1. 數據庫 Schema 設計 ✓
- **文件**: `/docs/team-up-schema.md`
- **內容**:
  - `teamNeeds` Collection 完整設計
  - `teamApplications` Collection 完整設計
  - `notifications` Collection 擴展設計
  - Firestore 索引規劃
  - 安全規則定義
  - 資料生命週期管理
  - 資料量估算與成本分析

### 2. API 規格文檔 ✓
- **文件**: `/docs/team-up-api.md`
- **內容**:
  - 14 個 API 端點完整定義
  - 請求/響應格式規範
  - 驗證規則詳細說明
  - 錯誤代碼與訊息
  - Rate Limiting 策略
  - API 變更日誌

### 3. TypeScript 類型定義 ✓
- **文件**: `/lib/teamUp/types.ts`
- **內容**:
  - 數據模型類型 (TeamNeed, TeamApplication)
  - API 請求/響應類型
  - 表單數據類型
  - 組件 Props 類型
  - 驗證結果類型
  - Admin 相關類型
  - Email 模板類型

### 4. 常量配置 ✓
- **文件**: `/lib/teamUp/constants.ts`
- **內容**:
  - 業務枚舉 (賽道、階段、角色)
  - 驗證規則常量
  - PII 檢測模式
  - 敏感關鍵詞列表
  - Rate Limiting 配置
  - UI 配置 (圖標、顏色)
  - 錯誤訊息模板
  - GA4 事件名稱

### 5. 驗證邏輯 ✓
- **文件**: `/lib/teamUp/validation.ts`
- **內容**:
  - PII 檢測函數
  - 敏感內容檢測
  - 表單驗證邏輯
  - API 請求驗證
  - 輔助函數

## 📊 關鍵設計決策

### 數據結構
1. **分離設計**: 需求和應徵分為兩個獨立 Collection，便於查詢和管理
2. **冗余數據**: 在 Application 中保存 applicantName/Email，減少 JOIN 查詢
3. **軟刪除**: 應徵記錄使用狀態標記而非物理刪除，保留歷史

### 安全機制
1. **PII 防護**: 公開字段強制檢測，阻止 Email/電話/社交帳號洩漏
2. **敏感詞審核**: 自動標記包含敏感關鍵詞的內容
3. **Rate Limiting**: 多層次限流，防止濫用
4. **reCAPTCHA**: 應徵操作需要人機驗證

### 用戶體驗
1. **雙向通知**: 應徵時同時通知雙方，並提供聯繫資訊
2. **狀態管理**: 清晰的應徵狀態流轉 (pending → accepted/rejected/withdrawn)
3. **瀏覽計數**: 追蹤熱門需求，提供數據參考

## 📝 技術規格總結

### 數據庫
- **Collections**: 3 個 (teamNeeds, teamApplications, notifications)
- **索引**: 6 個複合索引
- **預估文檔數**: ~2,200 documents
- **預估成本**: < $5 USD/月

### API
- **端點數**: 14 個
- **認證端點**: 9 個
- **公開端點**: 5 個
- **Rate Limit 策略**: 5 種

### 類型定義
- **接口數**: 35+ interfaces/types
- **枚舉**: 4 個主要枚舉
- **組件 Props**: 10+ 組件類型

### 常量
- **賽道選項**: 7 個
- **階段選項**: 4 個
- **角色選項**: 9 個
- **敏感詞**: 14 個
- **錯誤代碼**: 18 個

## 🎨 UI/UX 設計方向

### 頁面結構
```
/team-up                # 列表頁 (公開)
/team-up/:id            # 詳情頁 (公開)
/team-up/create         # 創建頁 (需登入)
/team-up/edit/:id       # 編輯頁 (僅 owner)
/dashboard/team-up      # 我的儀表板 (需登入)
```

### 設計風格
- 延續現有網站風格 (TSMC 風格)
- 主色: `#1a3a6e` (深藍)
- 卡片式佈局，白色背景
- 響應式設計 (移動端優先)

### 關鍵組件
1. **TeamUpCard**: 需求卡片
2. **FilterPanel**: 篩選面板
3. **NeedForm**: 創建/編輯表單
4. **ApplyModal**: 應徵對話框
5. **ApplicationList**: 應徵管理列表
6. **RoleSelector**: 角色選擇器

## 🔄 工作流程確認

### 發布需求流程
```
用戶登入 → 完成報名檢查 → 填寫表單 → PII 驗證 → 
敏感詞檢測 → Rate Limit 檢查 → 創建需求 → 顯示在列表
```

### 應徵流程
```
瀏覽列表 → 查看詳情 → 點擊應徵 → 填寫表單 → 
reCAPTCHA 驗證 → PII 檢測 → Rate Limit → 提交應徵 →
Email 通知雙方 → 站內通知 Owner → 返回 contactHint
```

### 管理流程
```
Owner 查看應徵列表 → 審核資料 → 接受/拒絕 → 
更新狀態 → Email 通知應徵者 → 私下聯繫
```

## 📋 待確認事項

### 技術依賴
- [ ] 確認 Firebase 專案已設置完成
- [ ] 確認 SendGrid/Email 服務已配置
- [ ] 確認 Redis 是否可用 (Rate Limiting)
- [ ] 確認 reCAPTCHA 金鑰已申請

### 業務規則
- [x] 賽道選項已確認
- [x] 角色選項已確認
- [x] Rate Limit 策略已確認
- [ ] Email 模板設計需要確認
- [ ] 敏感詞列表可能需要擴充

### UI/UX
- [ ] 設計稿需要視覺確認
- [ ] 移動端佈局細節
- [ ] 空狀態插圖/文案
- [ ] Loading 狀態設計

## 🎯 下一步: Milestone 1

### 目標
實現核心數據層，包括：
1. Firestore Collections 設置
2. 基礎 API 端點 (CRUD)
3. 認證與權限中間件
4. PII 防護實現

### 預計產出
- API 端點: 5 個 (needs CRUD)
- 工具函數: 權限檢查、PII 驗證
- Firestore 安全規則部署
- API 測試 (Postman)

### 驗收標準
- [ ] 可通過 API 創建需求
- [ ] 可通過 API 獲取需求列表
- [ ] 可通過 API 更新/刪除需求
- [ ] PII 檢測正確阻止違規內容
- [ ] 權限檢查正確執行

---

## 📎 相關文件

- [數據庫 Schema](/docs/team-up-schema.md)
- [API 規格文檔](/docs/team-up-api.md)
- [類型定義](/lib/teamUp/types.ts)
- [常量配置](/lib/teamUp/constants.ts)
- [驗證邏輯](/lib/teamUp/validation.ts)

---

## ✅ M0 驗收確認

- [x] 數據庫 Schema 通過 review
- [x] API 設計通過 review
- [x] 類型定義完整
- [x] 常量配置完整
- [x] 驗證邏輯實現
- [ ] **等待用戶確認，準備進入 M1**

---

**創建時間**: 2025-10-10  
**創建者**: AI Assistant  
**狀態**: ✅ 完成，待確認

