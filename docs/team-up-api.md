# 找隊友功能 - API 規格文檔

## 總覽

Base URL: `/api/team-up`

所有 API 均需要：
- Content-Type: `application/json`
- 認證：Firebase Auth Token (部分端點)

---

## 認證

### Headers
```
Authorization: Bearer <firebase_id_token>
```

### 獲取 Token
```typescript
const token = await firebase.auth().currentUser?.getIdToken();
```

---

## API 端點列表

### 需求管理
- `GET /api/team-up/needs` - 獲取需求列表
- `GET /api/team-up/needs/:id` - 獲取單個需求詳情
- `POST /api/team-up/needs` - 創建需求 🔒
- `PATCH /api/team-up/needs/:id` - 更新需求 🔒
- `DELETE /api/team-up/needs/:id` - 刪除需求 🔒
- `PATCH /api/team-up/needs/:id/close` - 關閉需求 🔒
- `PATCH /api/team-up/needs/:id/reopen` - 重新開放需求 🔒

### 應徵管理
- `POST /api/team-up/needs/:id/apply` - 申請應徵 🔒
- `GET /api/team-up/needs/:id/applications` - 獲取需求的應徵列表 🔒
- `GET /api/team-up/applications/mine` - 獲取我的應徵 🔒
- `PATCH /api/team-up/applications/:id/status` - 更新應徵狀態 🔒
- `DELETE /api/team-up/applications/:id` - 撤回應徵 🔒

### 統計與管理
- `GET /api/team-up/stats` - 獲取統計數據
- `POST /api/team-up/needs/:id/view` - 記錄瀏覽
- `POST /api/team-up/needs/:id/flag` - 標記內容 🔒

🔒 = 需要認證

---

## 需求管理 APIs

### 1. 獲取需求列表

**端點**: `GET /api/team-up/needs`

**權限**: 公開

**Query Parameters**:
```typescript
{
  track?: string;              // 賽道篩選
  stage?: string;              // 階段篩選
  roles?: string[];            // 角色篩選 (逗號分隔)
  search?: string;             // 關鍵詞搜索
  isOpen?: 'true' | 'false';   // 是否開放
  sort?: 'latest' | 'popular' | 'applications'; // 排序方式
  limit?: number;              // 每頁數量 (默認: 20, 最大: 50)
  offset?: number;             // 偏移量
}
```

**Response** (200):
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
      "haveRoles": ["產品經理", "UI設計師"],
      "otherNeeds": "希望有 Solidity 經驗",
      "isOpen": true,
      "viewCount": 45,
      "applicationCount": 8,
      "createdAt": "2025-10-05T10:00:00Z",
      "updatedAt": "2025-10-08T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Error Codes**:
- `400`: 參數錯誤
- `500`: 服務器錯誤

---

### 2. 獲取單個需求詳情

**端點**: `GET /api/team-up/needs/:id`

**權限**: 公開

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "need123",
    "ownerUserId": "user456",
    "title": "尋找智能合約工程師",
    "projectTrack": "DeFi",
    "projectStage": "已開始，需要隊友",
    "brief": "我們正在開發一個去中心化借貸平台...",
    "rolesNeeded": ["智能合約工程師", "前端工程師"],
    "haveRoles": ["產品經理", "UI設計師"],
    "otherNeeds": "希望有 Solidity 經驗",
    "isOpen": true,
    "viewCount": 46,
    "applicationCount": 8,
    "createdAt": "2025-10-05T10:00:00Z",
    "updatedAt": "2025-10-08T15:30:00Z",
    
    // 如果是 owner，額外返回
    "isOwner": true,
    "contactHint": "加我 Telegram @myusername",
    "applications": [ /* 應徵列表 */ ]
  }
}
```

**Error Codes**:
- `404`: 需求不存在
- `500`: 服務器錯誤

---

### 3. 創建需求

**端點**: `POST /api/team-up/needs`

**權限**: 需要認證 🔒

**Rate Limit**: 3 次/天

**Request Body**:
```json
{
  "title": "尋找智能合約工程師",
  "projectTrack": "DeFi",
  "projectStage": "已開始，需要隊友",
  "brief": "我們正在開發一個去中心化借貸平台...",
  "rolesNeeded": ["智能合約工程師", "前端工程師"],
  "haveRoles": ["產品經理", "UI設計師"],
  "otherNeeds": "希望有 Solidity 經驗",
  "contactHint": "加我 Telegram @myusername"
}
```

**Validation Rules**:
```typescript
{
  title: { required: true, maxLength: 100, noPII: true },
  projectTrack: { required: true, enum: PROJECT_TRACKS },
  projectStage: { required: true, enum: PROJECT_STAGES },
  brief: { required: true, maxLength: 400, noPII: true },
  rolesNeeded: { required: true, minItems: 1, maxItems: 10 },
  haveRoles: { required: false, maxItems: 10 },
  otherNeeds: { required: false, maxLength: 200, noPII: true },
  contactHint: { required: true, maxLength: 60 }
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "need123",
    "message": "需求發布成功！"
  }
}
```

**Error Codes**:
- `400`: 參數錯誤或包含 PII
- `401`: 未認證
- `403`: 未完成報名或達到發布上限
- `429`: 超過 Rate Limit
- `500`: 服務器錯誤

---

### 4. 更新需求

**端點**: `PATCH /api/team-up/needs/:id`

**權限**: 需要認證 🔒 (僅 owner)

**Rate Limit**: 10 次/小時

**Request Body** (所有字段皆可選):
```json
{
  "title": "更新後的標題",
  "projectStage": "有 MVP，持續優化",
  "brief": "更新後的簡介...",
  "rolesNeeded": ["智能合約工程師"],
  "haveRoles": ["產品經理", "UI設計師", "前端工程師"],
  "otherNeeds": "更新後的其他需求",
  "contactHint": "新的聯繫方式"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "更新成功！"
}
```

**Error Codes**:
- `400`: 參數錯誤
- `401`: 未認證
- `403`: 無權限 (非 owner)
- `404`: 需求不存在
- `429`: 超過 Rate Limit
- `500`: 服務器錯誤

---

### 5. 刪除需求

**端點**: `DELETE /api/team-up/needs/:id`

**權限**: 需要認證 🔒 (owner 或 admin)

**Response** (200):
```json
{
  "success": true,
  "message": "需求已刪除"
}
```

**副作用**:
- 刪除所有相關的應徵記錄
- 發送通知給所有應徵者

**Error Codes**:
- `401`: 未認證
- `403`: 無權限
- `404`: 需求不存在
- `500`: 服務器錯誤

---

### 6. 關閉需求

**端點**: `PATCH /api/team-up/needs/:id/close`

**權限**: 需要認證 🔒 (僅 owner)

**Response** (200):
```json
{
  "success": true,
  "message": "需求已關閉"
}
```

**副作用**:
- 設置 `isOpen = false`
- 發送通知給所有 pending 狀態的應徵者

---

## 應徵管理 APIs

### 7. 申請應徵

**端點**: `POST /api/team-up/needs/:id/apply`

**權限**: 需要認證 🔒

**Rate Limit**: 3 次/10分鐘

**Request Body**:
```json
{
  "roles": ["智能合約工程師"],
  "message": "我有 3 年 Solidity 開發經驗...",
  "contactForOwner": "Telegram: @myusername",
  "recaptchaToken": "03AGdBq26..."
}
```

**Validation Rules**:
```typescript
{
  roles: { required: true, minItems: 1 },
  message: { required: false, maxLength: 280, noPII: true },
  contactForOwner: { required: true, maxLength: 120 },
  recaptchaToken: { required: true }
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "applicationId": "app789",
    "contactHint": "加我 Telegram @ownerusername",
    "message": "應徵成功！請主動聯繫對方。"
  }
}
```

**副作用**:
- 創建 `teamApplications` 記錄
- 發送 Email 給 owner (含應徵者聯繫方式)
- 發送 Email 給 applicant (含 owner 聯繫提示)
- 創建站內通知給 owner
- 增加需求的 `applicationCount`

**Error Codes**:
- `400`: 參數錯誤或 reCAPTCHA 失敗
- `401`: 未認證
- `403`: 需求已關閉或不能應徵自己的需求
- `404`: 需求不存在
- `409`: 已經應徵過此需求
- `429`: 超過 Rate Limit
- `500`: 服務器錯誤

---

### 8. 獲取需求的應徵列表

**端點**: `GET /api/team-up/needs/:id/applications`

**權限**: 需要認證 🔒 (僅 owner)

**Query Parameters**:
```typescript
{
  status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
}
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "app789",
      "applicantUserId": "user999",
      "applicantName": "王小明",
      "roles": ["智能合約工程師"],
      "message": "我有 3 年 Solidity 開發經驗...",
      "contactForOwner": "Telegram: @myusername",
      "status": "pending",
      "isReadByOwner": false,
      "createdAt": "2025-10-08T14:20:00Z"
    }
  ]
}
```

**Error Codes**:
- `401`: 未認證
- `403`: 無權限 (非 owner)
- `404`: 需求不存在
- `500`: 服務器錯誤

---

### 9. 獲取我的應徵

**端點**: `GET /api/team-up/applications/mine`

**權限**: 需要認證 🔒

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "app789",
      "teamNeedId": "need123",
      "teamNeedTitle": "尋找智能合約工程師",
      "ownerName": "李大華",
      "roles": ["智能合約工程師"],
      "message": "我有 3 年 Solidity 開發經驗...",
      "contactForOwner": "Telegram: @myusername",
      "contactHint": "加我 Telegram @ownerusername",
      "status": "pending",
      "createdAt": "2025-10-08T14:20:00Z",
      "statusChangedAt": null
    }
  ]
}
```

---

### 10. 更新應徵狀態

**端點**: `PATCH /api/team-up/applications/:id/status`

**權限**: 需要認證 🔒 (僅需求 owner)

**Request Body**:
```json
{
  "status": "accepted" // or "rejected"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "已接受此應徵"
}
```

**副作用**:
- 更新 `status` 和 `statusChangedAt`
- 發送 Email 給應徵者
- 創建站內通知給應徵者

**Error Codes**:
- `400`: 參數錯誤
- `401`: 未認證
- `403`: 無權限
- `404`: 應徵不存在
- `500`: 服務器錯誤

---

### 11. 撤回應徵

**端點**: `DELETE /api/team-up/applications/:id`

**權限**: 需要認證 🔒 (僅應徵者本人)

**Response** (200):
```json
{
  "success": true,
  "message": "已撤回應徵"
}
```

**副作用**:
- 設置 `status = 'withdrawn'` (不刪除記錄)
- 減少需求的 `applicationCount`

---

## 統計與管理 APIs

### 12. 獲取統計數據

**端點**: `GET /api/team-up/stats`

**權限**: 公開

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalNeeds": 156,
    "openNeeds": 89,
    "totalApplications": 678,
    "successfulMatches": 45,
    "popularTracks": [
      { "track": "DeFi", "count": 45 },
      { "track": "NFT / 數位資產", "count": 32 }
    ],
    "popularRoles": [
      { "role": "全端工程師", "count": 78 },
      { "role": "智能合約工程師", "count": 56 }
    ]
  }
}
```

---

### 13. 記錄瀏覽

**端點**: `POST /api/team-up/needs/:id/view`

**權限**: 公開

**Response** (200):
```json
{
  "success": true,
  "viewCount": 47
}
```

**副作用**:
- 增加 `viewCount`
- Rate limit: 1 次/分鐘/IP (防止刷數據)

---

### 14. 標記內容

**端點**: `POST /api/team-up/needs/:id/flag`

**權限**: 需要認證 🔒

**Request Body**:
```json
{
  "reason": "包含不當內容"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "已提交標記，管理員會盡快審核"
}
```

**副作用**:
- 設置 `isFlagged = true` 和 `flagReason`
- 發送通知給管理員

---

## 錯誤格式

所有 API 錯誤都遵循以下格式：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "標題不可包含 Email",
    "field": "title"
  }
}
```

### 錯誤代碼列表

```typescript
const ERROR_CODES = {
  // 認證相關
  UNAUTHORIZED: '未認證，請先登入',
  FORBIDDEN: '無權限執行此操作',
  NOT_REGISTERED: '請先完成報名',
  
  // 驗證相關
  VALIDATION_ERROR: '資料驗證失敗',
  PII_DETECTED: '不可包含個人聯繫資訊',
  INVALID_ENUM: '選項不在允許範圍內',
  
  // 業務邏輯
  NEED_NOT_FOUND: '需求不存在',
  ALREADY_APPLIED: '您已經應徵過此需求',
  CANNOT_APPLY_OWN: '不能應徵自己的需求',
  NEED_CLOSED: '此需求已關閉',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: '操作過於頻繁，請稍後再試',
  DAILY_LIMIT_REACHED: '已達到每日發布上限',
  
  // reCAPTCHA
  RECAPTCHA_FAILED: 'reCAPTCHA 驗證失敗',
  
  // 服務器錯誤
  INTERNAL_ERROR: '服務器錯誤，請稍後再試',
  DATABASE_ERROR: '數據庫錯誤',
  EMAIL_SEND_FAILED: 'Email 發送失敗',
};
```

---

## Rate Limiting

### 限制策略

| 操作 | 限制 | 窗口 |
|------|------|------|
| 創建需求 | 3 次 | 每天 |
| 更新需求 | 10 次 | 每小時 |
| 申請應徵 | 3 次 | 10 分鐘 |
| 標記內容 | 5 次 | 每小時 |
| 瀏覽記錄 | 30 次 | 每小時 |

### Rate Limit Headers

```
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 2
X-RateLimit-Reset: 1696848000
```

---

## Webhook Events (可選)

為未來擴展預留的 Webhook 事件：

```typescript
type WebhookEvent = 
  | 'need.created'
  | 'need.updated'
  | 'need.closed'
  | 'application.created'
  | 'application.accepted'
  | 'application.rejected';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}
```

---

## 測試端點

### Development Only

**端點**: `POST /api/team-up/test/seed`

**權限**: 僅開發環境

用於生成測試數據。

---

## API 變更日誌

### v1.0.0 (2025-10-10)
- 初始版本發布
- 包含基礎需求管理和應徵功能

### v1.1.0 (計劃中)
- 新增即時聊天功能
- 新增需求推薦算法
- 新增團隊成功案例展示

