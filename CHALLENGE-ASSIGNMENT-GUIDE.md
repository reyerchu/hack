# Challenge 分配功能使用指南

## 功能概述

Super_admin 可以将 challenges 分配或重新分配给不同的 sponsors。

---

## 实现架构

### 1. API 端点

#### **PUT /api/admin/challenges/[challengeId]/assign**
分配 challenge 给 sponsor

**請求參數：**
```json
{
  "sponsorId": "sponsor-imtoken",
  "sponsorName": "imToken"
}
```

**回應：**
```json
{
  "success": true,
  "data": {
    "message": "成功將 challenge 分配給 sponsor",
    "challenge": {
      "id": "test-challenge-imtoken",
      "trackId": "imToken-1",
      "trackName": "imToken 賽道",
      "sponsorId": "sponsor-imtoken",
      "sponsorName": "imToken"
    }
  }
}
```

**權限要求：** `super_admin` 或 `admin`

**活動日誌：** 自動記錄到 `sponsor-activity-logs`

---

#### **GET /api/admin/challenges**
獲取所有 challenges 列表

**回應：**
```json
{
  "success": true,
  "data": {
    "challenges": [
      {
        "id": "test-challenge-imtoken",
        "trackId": "imToken-1",
        "track": "imToken 賽道",
        "sponsorId": "sponsor-imtoken",
        "sponsorName": "imToken",
        "status": "published",
        "assignedBy": "user123",
        "assignedAt": "2025-10-20T10:00:00Z"
      }
    ]
  }
}
```

**權限要求：** `super_admin` 或 `admin`

---

#### **GET /api/admin/sponsors**
獲取所有 sponsors 列表

**回應：**
```json
{
  "success": true,
  "data": {
    "sponsors": [
      {
        "id": "sponsor-imtoken",
        "name": "imToken",
        "tier": "title"
      }
    ]
  }
}
```

**權限要求：** `super_admin` 或 `admin`

---

### 2. UI 頁面

#### **Admin Challenge Management**
- **路徑：** `/admin/challenge-management`
- **功能：**
  - 查看所有 challenges 列表（表格形式）
  - 每個 challenge 顯示：
    - Track ID
    - 賽道名稱
    - 當前 Sponsor
    - 狀態
    - 操作按鈕（重新分配）
  - 點擊「重新分配」按鈕打開 modal
  - Modal 中選擇新的 sponsor
  - 確認分配後即時更新列表

---

## 使用流程

### 步驟 1：訪問 Challenge Management 頁面

1. 以 `super_admin` 身份登入
2. 訪問：http://localhost:3009/admin/challenge-management
3. 系統會自動驗證權限

### 步驟 2：查看 Challenges 列表

頁面顯示所有 challenges 的表格，包含：
- Track ID（例如：`imToken-1`）
- 賽道名稱（例如：`imToken 賽道`）
- 當前 Sponsor（例如：`imToken`）
- 狀態（published / draft）
- 操作按鈕

### 步驟 3：重新分配 Challenge

1. 點擊想要重新分配的 challenge 的「重新分配」按鈕
2. 在彈出的 modal 中：
   - 查看賽道名稱
   - 從下拉選單選擇新的 sponsor
3. 點擊「確認分配」按鈕
4. 等待分配完成（顯示「分配中...」）
5. 成功後顯示「✅ 分配成功！」
6. Modal 自動關閉，列表自動更新

### 步驟 4：驗證分配結果

1. 查看列表中的「當前 Sponsor」欄位是否已更新
2. 訪問該 challenge 的詳情頁面確認
3. （可選）查看 `sponsor-activity-logs` 確認活動已記錄

---

## 數據變更

### Extended Challenges Collection

分配後，challenge 文檔會更新以下字段：

```javascript
{
  sponsorId: "new-sponsor-id",      // 新的 sponsor ID
  sponsorName: "New Sponsor Name",  // 新的 sponsor 名稱
  assignedBy: "admin-user-id",      // 執行分配的 admin ID
  assignedAt: Timestamp,            // 分配時間
  updatedAt: Timestamp              // 更新時間
}
```

### Activity Logs Collection

每次分配都會記錄到 `sponsor-activity-logs`：

```javascript
{
  userId: "admin-user-id",
  action: "update_challenge",
  resourceType: "challenge",
  resourceId: "test-challenge-imtoken",
  metadata: {
    trackId: "imToken-1",
    trackName: "imToken 賽道",
    oldSponsorId: "old-sponsor-id",
    oldSponsorName: "Old Sponsor",
    newSponsorId: "new-sponsor-id",
    newSponsorName: "New Sponsor"
  },
  ipAddress: "xxx.xxx.xxx.xxx",
  createdAt: Timestamp
}
```

---

## 安全性

### 權限檢查
- API 端點在處理前驗證用戶是否為 `super_admin` 或 `admin`
- 前端頁面在載入前驗證用戶權限
- 非授權用戶會被重定向到首頁

### 數據驗證
- 檢查 challenge 是否存在
- 檢查 sponsor 是否存在
- 驗證 `sponsorId` 和 `sponsorName` 是否匹配

### 審計追踪
- 所有分配操作都記錄到 activity logs
- 包含舊值和新值，便於審計
- 記錄執行者和時間戳

---

## 錯誤處理

### 常見錯誤

**403 Forbidden - "只有 super_admin 可以分配 challenges"**
- **原因：** 用戶沒有 admin 權限
- **解決：** 確保用戶在 Firestore 中的 `permissions` 字段包含 `super_admin` 或 `admin`

**404 Not Found - "找不到該 challenge"**
- **原因：** Challenge ID 不存在或已被刪除
- **解決：** 檢查 `extended-challenges` collection 確認文檔存在

**404 Not Found - "找不到該 sponsor"**
- **原因：** Sponsor ID 不存在
- **解決：** 檢查 `extended-sponsors` collection 確認文檔存在

**400 Bad Request - "sponsorId 和 sponsorName 為必填項"**
- **原因：** 請求缺少必要參數
- **解決：** 確保在 modal 中選擇了 sponsor

---

## 測試步驟

### 1. 準備測試數據

確保 Firestore 中有：
- `extended-challenges` collection 中有至少 2 個 challenges
- `extended-sponsors` collection 中有至少 2 個 sponsors

### 2. 測試權限檢查

1. 以普通用戶登入
2. 訪問 `/admin/challenge-management`
3. 應該被重定向到首頁 ✅

4. 以 `super_admin` 登入
5. 訪問 `/admin/challenge-management`
6. 應該能看到頁面 ✅

### 3. 測試分配功能

1. 點擊任意 challenge 的「重新分配」按鈕
2. 選擇新的 sponsor
3. 點擊「確認分配」
4. 應該顯示「✅ 分配成功！」✅
5. 列表應該自動更新 ✅

### 4. 驗證數據變更

1. 在 Firestore 中查看該 challenge 文檔
2. 確認 `sponsorId` 和 `sponsorName` 已更新 ✅
3. 確認 `assignedBy` 和 `assignedAt` 字段存在 ✅

4. 在 `sponsor-activity-logs` 中查找對應記錄
5. 確認日誌包含舊值和新值 ✅

---

## 未來改進

### 短期（可選）
- [ ] 添加搜索/篩選功能（按 sponsor、status）
- [ ] 添加批量分配功能
- [ ] 顯示分配歷史記錄

### 中期
- [ ] 郵件通知功能（通知舊 sponsor 和新 sponsor）
- [ ] 確認對話框（防止誤操作）
- [ ] 分配理由輸入框

### 長期
- [ ] 分配審批流程（需要多個 admin 批准）
- [ ] 自動分配規則（基於 sponsor 等級或其他條件）
- [ ] 分配統計報表

---

**創建日期：** 2025-10-20  
**最後更新：** 2025-10-20  
**狀態：** ✅ 已實現並可測試

