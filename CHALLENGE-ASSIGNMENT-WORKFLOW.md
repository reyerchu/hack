# Challenge 分配工作流程图

## 完整流程

```
┌─────────────────────────────────────────────────────────────┐
│  Super_admin 登入系統                                        │
│  ↓                                                           │
│  访问 /admin/challenge-management                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  前端：Challenge Management 页面                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  1. 获取用户权限（Firebase Auth）                            │
│  2. 发送 GET /api/admin/challenges                          │
│  3. 发送 GET /api/admin/sponsors                            │
│  4. 显示 Challenges 列表（表格）                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  显示 Challenge 列表表格                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  | Track ID  | 賽道名稱    | 當前 Sponsor | 狀態 | 操作   |  │
│  |-----------|------------|-------------|------|--------|  │
│  | imToken-1 | imToken    | imToken     | pub  | [分配] |  │
│  | Sui-2     | Sui        | Sui         | pub  | [分配] |  │
│  | Zircuit-3 | Zircuit    | Zircuit     | pub  | [分配] |  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  用户点击 [重新分配] 按钮
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  弹出 Modal - 分配 Challenge                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  賽道：imToken 賽道                                           │
│                                                              │
│  選擇 Sponsor:                                               │
│  ┌──────────────────────────────────────────────┐          │
│  │ [▼] -- 選擇 Sponsor --                      │          │
│  │     imToken (title)                          │          │
│  │     國泰金控 (title)                          │          │
│  │     Oasis Protocol (track)                   │          │
│  │     Self Protocol (track)                    │          │
│  │     Zircuit (track)                          │          │
│  │     Sui (track)                              │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  [取消]  [確認分配]                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  用户选择新 Sponsor 并点击 [確認分配]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  前端发送 API 请求                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  PUT /api/admin/challenges/imToken-1/assign                 │
│  Headers:                                                    │
│    Authorization: Bearer <firebase-token>                   │
│  Body:                                                       │
│    {                                                         │
│      "sponsorId": "sponsor-cathay",                         │
│      "sponsorName": "國泰金控"                               │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  后端 API：/api/admin/challenges/[challengeId]/assign.ts     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  1. 验证 Firebase Token                                      │
│  2. 检查权限（super_admin / admin）                          │
│     ❌ 否 → 返回 403 Forbidden                               │
│     ✅ 是 → 继续                                             │
│  3. 验证 challengeId 存在                                    │
│     ❌ 否 → 返回 404 Not Found                               │
│     ✅ 是 → 继续                                             │
│  4. 验证 sponsorId 存在                                      │
│     ❌ 否 → 返回 404 Not Found                               │
│     ✅ 是 → 继续                                             │
│  5. 更新 Firestore extended-challenges:                     │
│     {                                                        │
│       sponsorId: "sponsor-cathay",                          │
│       sponsorName: "國泰金控",                               │
│       assignedBy: "admin-user-id",                          │
│       assignedAt: Timestamp.now(),                          │
│       updatedAt: Timestamp.now()                            │
│     }                                                        │
│  6. 记录活动日志到 sponsor-activity-logs:                    │
│     {                                                        │
│       userId: "admin-user-id",                              │
│       action: "update_challenge",                           │
│       resourceType: "challenge",                            │
│       resourceId: "test-challenge-imtoken",                 │
│       metadata: {                                            │
│         trackId: "imToken-1",                               │
│         oldSponsorId: "sponsor-imtoken",                    │
│         newSponsorId: "sponsor-cathay",                     │
│         ...                                                  │
│       },                                                     │
│       createdAt: Timestamp.now()                            │
│     }                                                        │
│  7. 返回成功响应                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  前端显示成功消息                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  ┌──────────────────────────────────────────────┐          │
│  │  ✅ 分配成功！                               │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  1. 更新本地列表状态                                          │
│  2. 2 秒后自动关闭 Modal                                     │
│  3. 列表中的 "當前 Sponsor" 列已更新为 "國泰金控"            │
└─────────────────────────────────────────────────────────────┘
```

---

## 关键代码片段

### 1. 前端 - 分配按钮点击

```typescript
const handleAssignClick = (challenge: ExtendedChallenge) => {
  setSelectedChallenge(challenge);
  setSelectedSponsorId(challenge.sponsorId || '');
  setShowAssignModal(true);
};
```

### 2. 前端 - 执行分配

```typescript
const handleAssignSubmit = async () => {
  const token = await firebase.auth().currentUser?.getIdToken();
  
  const response = await fetch(
    `/api/admin/challenges/${selectedChallenge.trackId}/assign`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sponsorId: selectedSponsorId,
        sponsorName: selectedSponsor.name,
      }),
    }
  );
  
  // 更新本地状态
  setChallenges((prev) =>
    prev.map((c) =>
      c.trackId === selectedChallenge.trackId
        ? { ...c, sponsorId: selectedSponsorId, sponsorName: selectedSponsor.name }
        : c
    )
  );
};
```

### 3. 后端 - 权限检查

```typescript
const userPermissions = authReq.userPermissions || [];

if (!userPermissions.includes('super_admin') && 
    !userPermissions.includes('admin') &&
    userPermissions[0] !== 'super_admin' && 
    userPermissions[0] !== 'admin') {
  return ApiResponse.forbidden(res, '只有 super_admin 可以分配 challenges');
}
```

### 4. 后端 - 更新 Firestore

```typescript
await challengeDoc.ref.update({
  sponsorId: sponsorId,
  sponsorName: sponsorName,
  assignedBy: userId,
  assignedAt: firestore.FieldValue.serverTimestamp(),
  updatedAt: firestore.FieldValue.serverTimestamp(),
});
```

### 5. 后端 - 记录活动日志

```typescript
await logActivity({
  userId: userId,
  action: 'update_challenge',
  resourceType: 'challenge',
  resourceId: challengeDoc.id,
  metadata: {
    trackId: challengeId,
    oldSponsorId: oldData.sponsorId,
    newSponsorId: sponsorId,
    ...
  },
});
```

---

## 数据流向

```
┌──────────────┐       GET /challenges        ┌──────────────┐
│              │ ──────────────────────────→  │              │
│   Frontend   │                               │   Backend    │
│   (React)    │ ←──────────────────────────  │   (API)      │
│              │       Challenge[] + Sponsor[] │              │
└──────────────┘                               └──────────────┘
       │                                              │
       │ PUT /assign                                 │
       │ {sponsorId, sponsorName}                    │
       │ ────────────────────────────→               │
       │                                              │
       │                                              │ 1. Verify Token
       │                                              │ 2. Check Permission
       │                                              │ 3. Validate Data
       │                                              │ 4. Update Firestore
       │                                              │ 5. Log Activity
       │                                              │
       │ ←────────────────────────────               │
       │       {success: true}                        │
       │                                              │
       │ Update Local State                           │
       │ Show Success Message                         │
       │                                              │
```

---

## Firestore 数据结构

### Before Assignment (旧数据)

```javascript
// extended-challenges/test-challenge-imtoken
{
  trackId: "imToken-1",
  track: "imToken 賽道",
  sponsorId: "sponsor-imtoken",
  sponsorName: "imToken",
  status: "published",
  ...
}
```

### After Assignment (新数据)

```javascript
// extended-challenges/test-challenge-imtoken
{
  trackId: "imToken-1",
  track: "imToken 賽道",
  sponsorId: "sponsor-cathay",        // ✅ 已更新
  sponsorName: "國泰金控",             // ✅ 已更新
  assignedBy: "admin-user-id",        // ✅ 新增
  assignedAt: Timestamp(...),         // ✅ 新增
  updatedAt: Timestamp(...),          // ✅ 已更新
  status: "published",
  ...
}
```

### Activity Log (活动日志)

```javascript
// sponsor-activity-logs/xxxxx
{
  userId: "admin-user-id",
  action: "update_challenge",
  resourceType: "challenge",
  resourceId: "test-challenge-imtoken",
  metadata: {
    trackId: "imToken-1",
    trackName: "imToken 賽道",
    oldSponsorId: "sponsor-imtoken",
    oldSponsorName: "imToken",
    newSponsorId: "sponsor-cathay",
    newSponsorName: "國泰金控"
  },
  ipAddress: "xxx.xxx.xxx.xxx",
  createdAt: Timestamp(...)
}
```

---

**創建日期：** 2025-10-20  
**用途：** 幫助開發者和用戶理解 Challenge 分配功能的完整工作流程
