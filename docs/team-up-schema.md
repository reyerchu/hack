# 找隊友功能 - 數據庫 Schema 設計

## 總覽

找隊友功能使用 Firebase Firestore，包含以下 Collections：
- `teamNeeds` - 找隊友需求
- `teamApplications` - 應徵記錄
- `notifications` - 通知（擴展現有）

---

## Collection: `teamNeeds`

### Schema

```typescript
{
  id: string;                    // 自動生成
  ownerUserId: string;           // 發布者 UID
  ownerEmail: string;            // 發布者 Email (用於發送通知)
  ownerName: string;             // 發布者名稱 (用於 Email)
  
  // 公開資訊
  title: string;                 // 專案名稱 (max: 100)
  projectTrack: string;          // 目標賽道 (enum: PROJECT_TRACKS)
  projectStage: string;          // 專案階段 (enum: PROJECT_STAGES)
  brief: string;                 // 專案簡介 (max: 400, PII protected)
  rolesNeeded: string[];         // 需要的角色
  haveRoles: string[];           // 現有成員角色
  otherNeeds?: string;           // 其他需求 (max: 200, PII protected)
  
  // 私密資訊 (僅應徵者可見)
  contactHint: string;           // 聯繫提示 (max: 60)
  
  // 狀態管理
  isOpen: boolean;               // 是否開放應徵
  viewCount: number;             // 瀏覽次數
  applicationCount: number;      // 應徵次數
  
  // 審核標記
  isFlagged: boolean;            // 是否被標記
  flagReason?: string;           // 標記原因
  isHidden: boolean;             // 管理員隱藏
  
  // 時間戳
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 索引

```javascript
// 複合索引
[
  { fields: ['isOpen', 'isHidden', 'updatedAt'], order: 'DESC' },
  { fields: ['projectTrack', 'isOpen', 'updatedAt'], order: 'DESC' },
  { fields: ['ownerUserId', 'createdAt'], order: 'DESC' },
  { fields: ['isFlagged', 'createdAt'], order: 'DESC' },
]
```

### 安全規則

```javascript
match /teamNeeds/{needId} {
  // 任何人可讀取未隱藏的需求
  allow read: if !resource.data.isHidden;
  
  // 已登入用戶可創建
  allow create: if request.auth != null
    && request.resource.data.ownerUserId == request.auth.uid
    && request.resource.data.title.size() <= 100
    && request.resource.data.brief.size() <= 400;
  
  // 僅 owner 可更新
  allow update: if request.auth != null
    && resource.data.ownerUserId == request.auth.uid;
  
  // 僅 owner 或 admin 可刪除
  allow delete: if request.auth != null
    && (resource.data.ownerUserId == request.auth.uid
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.permissions.includes('admin'));
}
```

---

## Collection: `teamApplications`

### Schema

```typescript
{
  id: string;                    // 自動生成
  teamNeedId: string;            // 關聯的需求 ID
  applicantUserId: string;       // 應徵者 UID
  applicantEmail: string;        // 應徵者 Email
  applicantName: string;         // 應徵者名稱
  
  // 應徵資訊
  roles: string[];               // 能提供的角色
  message?: string;              // 自我介紹 (max: 280, PII protected)
  contactForOwner: string;       // 留給發布者的聯繫方式 (max: 120)
  
  // 狀態管理
  status: string;                // 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  isReadByOwner: boolean;        // 發布者是否已讀
  
  // 審核標記
  isFlagged: boolean;
  
  // 時間戳
  createdAt: Timestamp;
  updatedAt: Timestamp;
  statusChangedAt?: Timestamp;   // 狀態變更時間
}
```

### 索引

```javascript
[
  { fields: ['teamNeedId', 'status', 'createdAt'], order: 'DESC' },
  { fields: ['applicantUserId', 'createdAt'], order: 'DESC' },
  { fields: ['teamNeedId', 'applicantUserId'] }, // 防止重複應徵
]
```

### 安全規則

```javascript
match /teamApplications/{applicationId} {
  // 僅 owner 和 applicant 可讀
  allow read: if request.auth != null
    && (resource.data.applicantUserId == request.auth.uid
        || get(/databases/$(database)/documents/teamNeeds/$(resource.data.teamNeedId)).data.ownerUserId == request.auth.uid);
  
  // 已登入用戶可創建應徵
  allow create: if request.auth != null
    && request.resource.data.applicantUserId == request.auth.uid
    && request.resource.data.status == 'pending';
  
  // 僅 owner 可更新狀態，applicant 可撤回
  allow update: if request.auth != null
    && ((get(/databases/$(database)/documents/teamNeeds/$(resource.data.teamNeedId)).data.ownerUserId == request.auth.uid)
        || (resource.data.applicantUserId == request.auth.uid && request.resource.data.status == 'withdrawn'));
  
  // 僅 applicant 可刪除自己的應徵
  allow delete: if request.auth != null
    && resource.data.applicantUserId == request.auth.uid;
}
```

---

## Collection: `notifications` (擴展)

### 新增通知類型

```typescript
type TeamUpNotificationType = 
  | 'apply_received'      // 收到應徵
  | 'apply_accepted'      // 應徵被接受
  | 'apply_rejected'      // 應徵被拒絕
  | 'need_closed'         // 需求已關閉
  | 'new_message';        // 新訊息 (可選)

interface TeamUpNotificationPayload {
  type: TeamUpNotificationType;
  teamNeedId: string;
  teamNeedTitle: string;
  applicationId?: string;
  applicantName?: string;
  ownerName?: string;
}
```

---

## 資料生命週期

### 自動清理規則

1. **已關閉的需求**：6 個月後自動歸檔（移至 `teamNeeds_archived`）
2. **已拒絕/撤回的應徵**：3 個月後自動刪除
3. **已讀通知**：30 天後自動刪除

### 備份策略

- 每日全量備份到 Cloud Storage
- 保留 30 天歷史備份

---

## 資料量估算

**假設**：
- 200 位參與者
- 平均每人發布 1 個需求 = 200 needs
- 平均每個需求收到 5 個應徵 = 1,000 applications
- 平均每人收到 5 個通知 = 1,000 notifications

**總計**：
- `teamNeeds`: ~200 documents
- `teamApplications`: ~1,000 documents
- `notifications`: ~1,000 documents (+ 現有)

**Firestore 成本**：
- Document reads: ~50,000/month
- Document writes: ~10,000/month
- Storage: < 1 GB

**預估月成本**：< $5 USD

---

## 遷移計劃

### Phase 1: 創建 Collections
```bash
# 透過 Firebase Console 或 Admin SDK
firebase firestore:indexes --deploy
```

### Phase 2: 設置安全規則
```bash
firebase deploy --only firestore:rules
```

### Phase 3: 創建測試數據
```bash
npm run seed:team-up
```

---

## 監控與維護

### 關鍵指標

1. **性能指標**
   - 查詢延遲 (P50, P95, P99)
   - 寫入延遲
   - 索引命中率

2. **業務指標**
   - 日活需求數
   - 應徵成功率
   - 用戶匹配率

3. **安全指標**
   - PII 洩漏次數
   - 被標記內容數
   - 濫用行為檢測

### 告警設置

- 查詢延遲 > 1s
- 寫入失敗率 > 1%
- 被標記內容 > 10/天

---

## 附錄：數據字典

### PROJECT_TRACKS (賽道)
```typescript
[
  'DeFi',
  'NFT / 數位資產',
  'RWA 資產上鏈',
  '穩定幣應用',
  'DAO / 治理',
  '跨鏈技術',
  '其他'
]
```

### PROJECT_STAGES (階段)
```typescript
[
  '有想法，還沒動工',
  '已開始，需要隊友',
  '有 MVP，持續優化',
  '準備完整，等待Demo'
]
```

### TEAM_ROLES (角色)
```typescript
[
  '全端工程師',
  '前端工程師',
  '後端工程師',
  '智能合約工程師',
  'UI/UX 設計師',
  '產品經理',
  '商業分析',
  '市場行銷',
  '其他' // 允許自填
]
```

### APPLICATION_STATUS
```typescript
type ApplicationStatus = 
  | 'pending'    // 待審核
  | 'accepted'   // 已接受
  | 'rejected'   // 已拒絕
  | 'withdrawn'; // 已撤回
```

