# 團隊刪除權限說明

## 📋 功能概述

團隊刪除功能根據用戶身份有不同的處理方式：

### 1. **Admin (reyerchu@defintek.io)**
- ✅ **直接刪除權限**：可以立即刪除任何團隊
- ✅ 刪除後無法復原
- ✅ 系統記錄刪除日誌

### 2. **團隊成員（團隊領導者或有編輯權限的成員）**
- ⚠️ **僅能發送刪除請求**：點擊刪除按鈕後，不會直接刪除團隊
- 📧 **自動通知 Admin**：系統會自動發送 email 給 `reyerchu@defintek.io`
- ⏳ **等待審核**：需要 admin 批准後才會真正刪除

---

## 🔄 刪除流程

### 團隊成員刪除流程

```
團隊成員點擊「刪除」
         ↓
  發送刪除請求到資料庫
         ↓
  Email 通知 Admin
  (reyerchu@defintek.io)
         ↓
  團隊成員收到確認訊息：
  「刪除請求已發送給管理員，請等待審核」
         ↓
     [團隊保持存在]
         ↓
  Admin 登入後台查看請求
         ↓
   Admin 批准 / 拒絕
         ↓
  [批准] → 團隊被刪除
  [拒絕] → 團隊保持存在
```

### Admin 刪除流程

```
Admin 點擊「刪除」
         ↓
    確認對話框
         ↓
   團隊立即被刪除
         ↓
    記錄刪除日誌
```

---

## 📧 Email 通知

當團隊成員發起刪除請求時，Admin 會收到 email 通知，包含以下資訊：

- **團隊名稱**
- **團隊 ID**
- **請求者 Email**
- **請求者身份**（團隊領導者 / 團隊成員）
- **請求時間**
- **管理後台連結**

---

## 🎛️ Admin 管理後台

### 訪問路徑
```
https://hackathon.com.tw/admin/teams
```

### 功能
- 查看所有待處理的刪除請求
- 查看請求詳情（團隊名稱、請求者、時間）
- **批准刪除**：立即刪除該團隊
- **拒絕請求**：保留團隊，標記請求為已拒絕

---

## 🗄️ 資料庫結構

### Collection: `team-delete-requests`

每個刪除請求都會儲存在 Firestore 的 `team-delete-requests` collection 中：

```typescript
{
  teamId: string;              // 團隊 ID
  teamName: string;            // 團隊名稱
  requestedBy: {
    userId: string;
    email: string;
    name: string;
    role: string;              // "團隊領導者" / "團隊成員"
  };
  teamData: object;            // 完整團隊資料（備份）
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp;      // 請求時間
  approvedBy?: string;         // 批准者 UID（如果批准）
  approvedAt?: Timestamp;      // 批准時間
  rejectedBy?: string;         // 拒絕者 UID（如果拒絕）
  rejectedAt?: Timestamp;      // 拒絕時間
}
```

---

## 🔐 權限檢查邏輯

### API: `DELETE /api/team-register/[teamId]`

```typescript
// 1. 驗證用戶身份
const userEmail = decodedToken.email;
const ADMIN_EMAIL = 'reyerchu@defintek.io';
const isAdmin = userEmail === ADMIN_EMAIL;

// 2. 檢查團隊權限
const isLeader = teamData.teamLeader?.userId === userId;
const hasMemberEditRight = teamData.teamMembers?.some(
  (member) => member.userId === userId && member.hasEditRight
);

// 3. 決定執行方式
if (isAdmin) {
  // 直接刪除團隊
  await db.collection('team-registrations').doc(teamId).delete();
  return { success: true, message: '團隊已刪除' };
} else if (isLeader || hasMemberEditRight) {
  // 發送刪除請求
  await db.collection('team-delete-requests').add({ ... });
  await sendDeleteRequestEmail(...);
  return { success: true, message: '刪除請求已發送給管理員，請等待審核', isRequest: true };
} else {
  // 無權限
  return { error: '您沒有權限刪除此團隊' };
}
```

---

## 📁 相關文件

### Backend API
- `/pages/api/team-register/[teamId].ts` - 處理刪除請求
- `/pages/api/admin/team-delete-requests.ts` - 獲取所有刪除請求
- `/pages/api/admin/team-delete-requests/[requestId]/approve.ts` - 批准刪除
- `/pages/api/admin/team-delete-requests/[requestId]/reject.ts` - 拒絕刪除

### Frontend Components
- `/components/TeamManagement.tsx` - 團隊管理組件（處理刪除按鈕）
- `/components/admin/TeamDeleteRequests.tsx` - Admin 刪除請求列表組件
- `/pages/admin/teams.tsx` - Admin 團隊管理頁面

---

## ✅ 測試步驟

### 測試 1: 團隊成員請求刪除

1. 以團隊成員身份登入
2. 前往團隊管理頁面
3. 點擊「刪除」按鈕
4. 確認刪除
5. **預期結果**：
   - 顯示「刪除請求已發送給管理員，請等待審核」
   - 團隊仍然存在（未被刪除）
   - Admin 收到 email 通知

### 測試 2: Admin 查看並批准刪除請求

1. 以 `reyerchu@defintek.io` 登入
2. 前往 `/admin/teams`
3. 查看「團隊刪除請求」區塊
4. 點擊「✓ 批准刪除」按鈕
5. 確認刪除
6. **預期結果**：
   - 團隊被刪除
   - 刪除請求狀態變為 `approved`
   - 團隊列表更新

### 測試 3: Admin 直接刪除團隊

1. 以 `reyerchu@defintek.io` 登入
2. 在任何團隊管理頁面點擊「刪除」
3. 確認刪除
4. **預期結果**：
   - 團隊立即被刪除
   - 顯示「團隊已刪除」
   - 不會創建刪除請求

---

## 📝 注意事項

1. **Email 設定**：需要設置 SMTP 或 SendGrid 環境變數才能發送 email 通知
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
   - 或 `SENDGRID_API_KEY`
   
2. **Admin Email 硬編碼**：目前 admin email 是硬編碼為 `reyerchu@defintek.io`，如需修改請更新以下文件：
   - `/pages/api/team-register/[teamId].ts`
   - `/pages/api/admin/team-delete-requests.ts`
   - `/pages/api/admin/team-delete-requests/[requestId]/approve.ts`
   - `/pages/api/admin/team-delete-requests/[requestId]/reject.ts`

3. **資料備份**：刪除請求中包含完整的 `teamData`，即使團隊被刪除，仍可從 `team-delete-requests` collection 中查看原始資料

4. **日誌記錄**：所有刪除操作都會記錄在 `activity-logs` collection 中，包括：
   - `team_registration_delete_admin` - Admin 直接刪除
   - `team_delete_request` - 團隊成員發起請求
   - `team_delete_request_approved` - Admin 批准請求
   - `team_delete_request_rejected` - Admin 拒絕請求

---

## 🎯 總結

| 用戶類型 | 刪除按鈕行為 | 實際結果 | Email 通知 |
|---------|------------|---------|-----------|
| **Admin (reyerchu@defintek.io)** | 直接刪除 | ✅ 團隊立即被刪除 | ❌ 無 |
| **團隊領導者** | 發送請求 | ⏳ 等待 Admin 審核 | ✅ 通知 Admin |
| **有編輯權限的團隊成員** | 發送請求 | ⏳ 等待 Admin 審核 | ✅ 通知 Admin |
| **一般團隊成員（無編輯權限）** | ❌ 無權限 | ❌ 錯誤訊息 | ❌ 無 |
| **非團隊成員** | ❌ 無權限 | ❌ 錯誤訊息 | ❌ 無 |

