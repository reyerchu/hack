# Super Admin 功能路線圖

## ✅ 已完成的功能

### 1. 完整的訪問權限
- ✅ Super_admin 可以訪問所有 challenges
- ✅ Super_admin 可以查看所有 tracks
- ✅ Super_admin 可以編輯所有 submissions
- ✅ Super_admin 在所有 sponsors 中自動擁有 admin 角色

**實現細節：**
- 修復了所有權限檢查函數以支持嵌套和扁平的 permissions 數據結構
- 修復的函數：
  - `checkSponsorPermission()`
  - `checkTrackAccess()`
  - `getUserSponsorRole()`
  - `canEditSubmission()`
  - `getUserAccessibleTracks()`

## ✅ 已完成的功能（續）

### 2. Challenge 分配管理

**需求：** Super_admin 可以將 challenges 分配/轉移給不同的 sponsors

**實現狀態：** ✅ 已完成並可測試

#### 2.1 數據模型
- ✅ 使用 `extended-challenges` collection 的 `sponsorId` 和 `sponsorName` 字段
- ✅ 添加 `assignedBy` (分配者) 和 `assignedAt` (分配時間) 字段用於審計

#### 2.2 API 端點
- ✅ `PUT /api/admin/challenges/[challengeId]/assign` - 分配 challenge
- ✅ `GET /api/admin/challenges` - 獲取所有 challenges
- ✅ `GET /api/admin/sponsors` - 獲取所有 sponsors

#### 2.3 UI 組件
- ✅ `/admin/challenge-management` 頁面
- ✅ Challenge 列表表格（Track ID、賽道名稱、當前 Sponsor、狀態）
- ✅ "重新分配" 按鈕
- ✅ 分配 Modal（選擇 sponsor、確認分配）
- ✅ 即時反饋（成功/失敗通知）

#### 2.4 權限控制
- ✅ 只有 `super_admin` 和 `admin` 可以分配 challenges
- ✅ 所有分配活動自動記錄到 `sponsor-activity-logs`
- ✅ 包含舊值和新值，便於審計

#### 2.5 使用文檔
- ✅ `CHALLENGE-ASSIGNMENT-GUIDE.md` - 完整使用指南和測試步驟

---

## ⚠️ 待實現的功能

---

### 3. Judge 分配管理

**需求：** Super_admin 可以為每個 challenge 分配 judges

**實現方案：**

#### 3.1 數據模型

**新增 Collection: `challenge-judges`**
```typescript
{
  challengeId: string;          // Challenge ID
  judgeUserId: string;          // Judge 的 user ID
  judgeEmail: string;           // Judge 的 email
  judgeName: string;            // Judge 的姓名
  assignedBy: string;           // 分配者 ID
  assignedAt: Timestamp;        // 分配時間
  permissions: {
    canScore: boolean;          // 可以評分
    canComment: boolean;        // 可以評論
    canRecommend: boolean;      // 可以推薦
  };
  status: 'active' | 'inactive';
}
```

#### 3.2 API 端點

**分配 Judge:**
```typescript
// POST /api/admin/challenges/[challengeId]/judges
{
  judgeUserId: string;
  permissions: {
    canScore: boolean;
    canComment: boolean;
    canRecommend: boolean;
  }
}
```

**取消 Judge:**
```typescript
// DELETE /api/admin/challenges/[challengeId]/judges/[judgeId]
```

**列出 Challenge 的所有 Judges:**
```typescript
// GET /api/admin/challenges/[challengeId]/judges
// 返回: Judge[] 列表
```

#### 3.3 UI 組件

**Admin Dashboard - Judge Management 頁面:**
1. Challenge 列表，每個顯示已分配的 judges 數量
2. 點擊進入 Challenge 詳情，顯示：
   - 已分配的 judges 列表（email, name, 權限）
   - "添加 Judge" 按鈕
3. 添加 Judge Modal:
   - 輸入 judge 的 email
   - 勾選權限（評分、評論、推薦）
   - 提交後自動發送通知郵件給 judge
4. 每個 judge 有 "編輯權限" 和 "移除" 按鈕

**Judge 端 - 我的評審任務頁面:**
- Judge 登入後看到自己被分配的 challenges
- 列出待評審的 submissions
- 評分和評論界面

#### 3.4 權限控制
- 只有 `super_admin` 和 `admin` 可以分配/移除 judges
- Judges 只能查看和評分自己被分配的 challenges
- 需要在 `sponsor-user-mappings` 中添加 `judge` 角色

#### 3.5 通知系統
- Judge 被分配時，發送郵件通知
- 有新 submission 時，通知相關 judges
- Judge 評分後，通知 sponsor

---

## 實現優先級

1. **高優先級（立即修復）:**
   - ✅ 修復 super_admin 權限檢查（已完成）
   - ✅ Challenge 分配管理（已完成）

2. **中優先級（本週完成）:**
   - ⚠️ Judge 分配管理
     - 預計工時：8-12 小時
     - 依賴：無（Challenge 分配管理已完成）
   
3. **低優先級（下週完成）:**
   - ⚠️ 批量操作和高級功能
     - 批量分配 challenges
     - 分配歷史記錄
     - 郵件通知
     - 統計報表

---

## 技術考量

### 數據一致性
- Challenge 轉移時，需要更新所有相關的 submissions 和 stats
- Judge 移除時，需要保留歷史評分記錄

### 安全性
- 所有 admin 操作都需要記錄到 `sponsor-activity-logs`
- Judge 只能訪問被分配的 challenges，不能訪問其他數據

### 用戶體驗
- 使用 modal 進行快速操作
- 提供即時反饋（成功/失敗通知）
- 搜索和篩選功能（challenges, judges）

---

## 相關文件

- `lib/sponsor/types.ts` - 數據類型定義
- `lib/sponsor/permissions.ts` - 權限檢查函數
- `pages/api/admin/challenges/` - Admin API 端點
- `pages/admin/challenge-management.tsx` - Challenge 管理頁面
- `pages/admin/judge-management.tsx` - Judge 管理頁面

---

**最後更新：** 2025-10-20  
**狀態：** ✅ 權限系統和 Challenge 分配功能已完成，可進行測試

