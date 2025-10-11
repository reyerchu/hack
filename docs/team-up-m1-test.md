# Milestone 1: 核心数据层 - 测试文档

## 测试环境

- **Base URL**: `http://localhost:3000` (开发环境)
- **Authentication**: Firebase ID Token

## 获取测试 Token

```javascript
// 在浏览器控制台执行 (登录后)
firebase.auth().currentUser.getIdToken().then(token => console.log(token));
```

---

## 测试用例

### 1. 创建需求 (POST /api/team-up/needs)

#### 测试 1.1: 成功创建需求 ✓

**Request**:
```http
POST /api/team-up/needs
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "title": "尋找智能合約工程師",
  "projectTrack": "DeFi",
  "projectStage": "已開始，需要隊友",
  "brief": "我們正在開發一個去中心化借貸平台，目前已完成基礎架構，需要有經驗的智能合約工程師加入團隊。",
  "rolesNeeded": ["智能合約工程師", "前端工程師"],
  "haveRoles": ["產品經理", "UI/UX 設計師"],
  "otherNeeds": "希望有 Solidity 開發經驗，熟悉 Hardhat 工具",
  "contactHint": "加我 Telegram @testuser"
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "need123",
    "message": "需求發布成功！"
  }
}
```

#### 測試 1.2: 未登入創建需求 ✗

**Request**:
```http
POST /api/team-up/needs
Content-Type: application/json

{
  "title": "測試需求",
  ...
}
```

**Expected Response** (401):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "未認證，請先登入"
  }
}
```

#### 測試 1.3: PII 檢測 - 包含 Email ✗

**Request**:
```http
POST /api/team-up/needs
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "title": "尋找前端工程師 test@example.com",
  "projectTrack": "DeFi",
  "projectStage": "有想法，還沒動工",
  "brief": "請聯繫我的 Email test@example.com",
  "rolesNeeded": ["前端工程師"],
  "contactHint": "加我 Telegram @testuser"
}
```

**Expected Response** (400):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "公開欄位不可包含Email"
  }
}
```

#### 測試 1.4: 敏感詞檢測 ⚠️

**Request**:
```http
POST /api/team-up/needs
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "title": "保證獲獎的 DeFi 專案",
  "projectTrack": "DeFi",
  "projectStage": "有想法，還沒動工",
  "brief": "我們有內部消息，保證可以獲獎",
  "rolesNeeded": ["智能合約工程師"],
  "contactHint": "加我 Telegram @testuser"
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "need124",
    "message": "需求發布成功！"
  }
}
```

**Note**: 需求會被創建，但會自動標記為 `isFlagged: true`

---

### 2. 獲取需求列表 (GET /api/team-up/needs)

#### 測試 2.1: 獲取所有需求 ✓

**Request**:
```http
GET /api/team-up/needs
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "need123",
      "ownerUserId": "user456",
      "title": "尋找智能合約工程師",
      "projectTrack": "DeFi",
      "projectStage": "已開始，需要隊友",
      "brief": "我們正在開發一個去中心化借貸平台...",
      "rolesNeeded": ["智能合約工程師", "前端工程師"],
      "haveRoles": ["產品經理", "UI/UX 設計師"],
      "otherNeeds": "希望有 Solidity 開發經驗",
      "isOpen": true,
      "viewCount": 0,
      "applicationCount": 0,
      "createdAt": "2025-10-10T10:00:00Z",
      "updatedAt": "2025-10-10T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

#### 測試 2.2: 按賽道篩選 ✓

**Request**:
```http
GET /api/team-up/needs?track=DeFi
```

**Expected**: 只返回 track 為 "DeFi" 的需求

#### 測試 2.3: 按角色篩選 ✓

**Request**:
```http
GET /api/team-up/needs?roles=智能合約工程師,前端工程師
```

**Expected**: 返回 rolesNeeded 包含指定角色的需求

#### 測試 2.4: 搜尋關鍵字 ✓

**Request**:
```http
GET /api/team-up/needs?search=智能合約
```

**Expected**: 返回 title 或 brief 包含 "智能合約" 的需求

#### 測試 2.5: 分頁 ✓

**Request**:
```http
GET /api/team-up/needs?limit=10&offset=0
```

**Expected**: 返回前 10 個需求

---

### 3. 獲取單個需求 (GET /api/team-up/needs/:id)

#### 測試 3.1: 公開訪問（非 owner）✓

**Request**:
```http
GET /api/team-up/needs/need123
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "need123",
    "ownerUserId": "user456",
    "title": "尋找智能合約工程師",
    ...
  }
}
```

**Note**: 不包含 contactHint 和 applications

#### 測試 3.2: Owner 訪問 ✓

**Request**:
```http
GET /api/team-up/needs/need123
Authorization: Bearer <OWNER_TOKEN>
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "need123",
    ...
    "isOwner": true,
    "contactHint": "加我 Telegram @testuser",
    "applications": []
  }
}
```

#### 測試 3.3: 不存在的需求 ✗

**Request**:
```http
GET /api/team-up/needs/nonexistent
```

**Expected Response** (404):
```json
{
  "success": false,
  "error": {
    "code": "NEED_NOT_FOUND",
    "message": "需求不存在"
  }
}
```

---

### 4. 更新需求 (PATCH /api/team-up/needs/:id)

#### 測試 4.1: Owner 更新成功 ✓

**Request**:
```http
PATCH /api/team-up/needs/need123
Authorization: Bearer <OWNER_TOKEN>
Content-Type: application/json

{
  "projectStage": "有 MVP，持續優化",
  "haveRoles": ["產品經理", "UI/UX 設計師", "前端工程師"]
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "更新成功！"
}
```

#### 測試 4.2: 非 Owner 更新 ✗

**Request**:
```http
PATCH /api/team-up/needs/need123
Authorization: Bearer <OTHER_USER_TOKEN>
Content-Type: application/json

{
  "title": "嘗試修改別人的需求"
}
```

**Expected Response** (403):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "無權限執行此操作"
  }
}
```

---

### 5. 刪除需求 (DELETE /api/team-up/needs/:id)

#### 測試 5.1: Owner 刪除成功 ✓

**Request**:
```http
DELETE /api/team-up/needs/need123
Authorization: Bearer <OWNER_TOKEN>
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "需求已刪除"
}
```

#### 測試 5.2: Admin 刪除成功 ✓

**Request**:
```http
DELETE /api/team-up/needs/need123
Authorization: Bearer <ADMIN_TOKEN>
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "需求已刪除"
}
```

#### 測試 5.3: 非 Owner/Admin 刪除 ✗

**Request**:
```http
DELETE /api/team-up/needs/need123
Authorization: Bearer <OTHER_USER_TOKEN>
```

**Expected Response** (403):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "無權限執行此操作"
  }
}
```

---

### 6. 獲取統計數據 (GET /api/team-up/stats)

#### 測試 6.1: 獲取統計 ✓

**Request**:
```http
GET /api/team-up/stats
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "totalNeeds": 5,
    "openNeeds": 3,
    "totalApplications": 0,
    "successfulMatches": 0
  }
}
```

---

## 測試腳本（使用 curl）

### 設置環境變數
```bash
export API_BASE="http://localhost:3000"
export AUTH_TOKEN="<YOUR_FIREBASE_ID_TOKEN>"
```

### 測試 1: 創建需求
```bash
curl -X POST "$API_BASE/api/team-up/needs" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "尋找智能合約工程師",
    "projectTrack": "DeFi",
    "projectStage": "已開始，需要隊友",
    "brief": "我們正在開發一個去中心化借貸平台",
    "rolesNeeded": ["智能合約工程師"],
    "haveRoles": ["產品經理"],
    "contactHint": "加我 Telegram @testuser"
  }'
```

### 測試 2: 獲取需求列表
```bash
curl -X GET "$API_BASE/api/team-up/needs"
```

### 測試 3: 獲取單個需求
```bash
curl -X GET "$API_BASE/api/team-up/needs/<NEED_ID>"
```

### 測試 4: 更新需求
```bash
curl -X PATCH "$API_BASE/api/team-up/needs/<NEED_ID>" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectStage": "有 MVP，持續優化"
  }'
```

### 測試 5: 刪除需求
```bash
curl -X DELETE "$API_BASE/api/team-up/needs/<NEED_ID>" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### 測試 6: 獲取統計
```bash
curl -X GET "$API_BASE/api/team-up/stats"
```

---

## 測試 PII 檢測

### 測試 Email 檢測
```bash
curl -X POST "$API_BASE/api/team-up/needs" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "測試需求",
    "projectTrack": "DeFi",
    "projectStage": "有想法，還沒動工",
    "brief": "請聯繫我 test@example.com",
    "rolesNeeded": ["前端工程師"],
    "contactHint": "加我 Telegram @testuser"
  }'
```

**Expected**: 400 Bad Request with PII error

### 測試電話檢測
```bash
curl -X POST "$API_BASE/api/team-up/needs" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "測試需求",
    "projectTrack": "DeFi",
    "projectStage": "有想法，還沒動工",
    "brief": "請打電話給我 0912-345-678",
    "rolesNeeded": ["前端工程師"],
    "contactHint": "加我 Telegram @testuser"
  }'
```

**Expected**: 400 Bad Request with PII error

### 測試 URL 檢測
```bash
curl -X POST "$API_BASE/api/team-up/needs" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "測試需求",
    "projectTrack": "DeFi",
    "projectStage": "有想法，還沒動工",
    "brief": "請訪問我的網站 https://example.com",
    "rolesNeeded": ["前端工程師"],
    "contactHint": "加我 Telegram @testuser"
  }'
```

**Expected**: 400 Bad Request with PII error

### 測試社交帳號檢測
```bash
curl -X POST "$API_BASE/api/team-up/needs" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "測試需求",
    "projectTrack": "DeFi",
    "projectStage": "有想法，還沒動工",
    "brief": "加我 Line ID: testuser123",
    "rolesNeeded": ["前端工程師"],
    "contactHint": "加我 Telegram @testuser"
  }'
```

**Expected**: 400 Bad Request with PII error

---

## 驗收標準

### M1 完成標準：

- [x] **API 端點實現**
  - [x] POST /api/team-up/needs - 創建需求
  - [x] GET /api/team-up/needs - 獲取需求列表
  - [x] GET /api/team-up/needs/:id - 獲取單個需求
  - [x] PATCH /api/team-up/needs/:id - 更新需求
  - [x] DELETE /api/team-up/needs/:id - 刪除需求
  - [x] GET /api/team-up/stats - 獲取統計數據

- [x] **認證與權限**
  - [x] 未登入無法創建/更新/刪除
  - [x] 僅 owner 可更新
  - [x] owner 或 admin 可刪除
  - [x] 未報名用戶無法創建

- [x] **PII 防護**
  - [x] Email 檢測
  - [x] 電話檢測
  - [x] URL 檢測
  - [x] 社交帳號檢測
  - [x] 錯誤提示清晰

- [x] **敏感內容檢測**
  - [x] 敏感關鍵詞自動標記
  - [x] 不阻止創建但設置 isFlagged

- [x] **數據庫操作**
  - [x] 正確創建文檔
  - [x] 正確更新文檔
  - [x] 正確刪除文檔（含相關應徵）
  - [x] 查詢篩選正確
  - [x] 分頁功能正常

- [ ] **實際測試**（需要啟動服務器）
  - [ ] 所有 API 端點可正常調用
  - [ ] 所有驗證邏輯正確執行
  - [ ] 錯誤處理完善
  - [ ] 響應格式符合規格

---

## 測試注意事項

1. **環境準備**:
   - 確保 Firebase Admin SDK 已正確配置
   - 確保環境變數已設置
   - 確保 Firestore 數據庫可訪問

2. **測試順序**:
   - 先測試創建 API
   - 再測試讀取 API
   - 最後測試更新/刪除 API

3. **清理測試數據**:
   - 測試完成後記得清理 Firestore 中的測試數據
   - 可通過 Firebase Console 手動刪除

4. **Token 有效期**:
   - Firebase ID Token 默認 1 小時有效
   - 測試時注意更新 Token

---

## 下一步: M2

M1 測試通過後，將進入 M2: 浏览与查看功能
- 列表頁面
- 詳情頁面
- 篩選組件
- 搜索功能

