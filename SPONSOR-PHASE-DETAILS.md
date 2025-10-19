# Track Sponsor Feature - Phase Implementation Details

## Phase 1: 数据模型设计

### 目标
扩展现有的 `Sponsor` 和 `Challenge` 类型，创建新的类型定义

### 文件修改
1. **`lib/types.d.ts`**
   - 保留原有的 `Sponsor` 和 `Challenge` 类型（向后兼容）
   - 添加 `ExtendedSponsor`, `ExtendedChallenge`, `TeamSubmission` 等新类型
   
2. **`lib/sponsor/types.ts`** (新建)
   - 将所有赞助商相关的类型定义独立出来
   - 便于维护和导入

### 实现步骤
```bash
# 1. 创建新的类型文件
touch lib/sponsor/types.ts

# 2. 从 SPONSOR-IMPLEMENTATION-PLAN.ts 复制类型定义到 lib/sponsor/types.ts

# 3. 更新 lib/types.d.ts，添加：
#    - type ExtendedSponsor = ... (导出)
#    - type ExtendedChallenge = ... (导出)
#    - type TeamSubmission = ... (导出)
```

### 验证
- TypeScript 编译通过
- 现有代码不受影响（向后兼容）

---

## Phase 2: 数据库 Schema

### 目标
在 Firebase Firestore 中创建新的 collections

### Collections 列表
1. `extended-sponsors` - 扩展的赞助商信息
2. `extended-challenges` - 扩展的挑战信息
3. `team-submissions` - 队伍提交
4. `judging-criteria` - 评审标准
5. `sponsor-user-mappings` - 赞助商用户关联
6. `sponsor-activity-logs` - 操作日志

### 实现步骤
```bash
# 1. 创建迁移脚本
mkdir -p scripts/migrations
touch scripts/migrations/migrate-sponsors-to-extended.js
touch scripts/migrations/seed-test-data.js

# 2. 编写迁移脚本（将现有 sponsors 迁移到 extended-sponsors）

# 3. 创建索引配置
touch firestore.indexes.json
```

### 索引配置示例
```json
{
  "indexes": [
    {
      "collectionGroup": "team-submissions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "challengeId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "team-submissions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectTrack", "order": "ASCENDING" },
        { "fieldPath": "averageScore", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Firestore Security Rules
```javascript
match /extended-sponsors/{sponsorId} {
  // Admin 可读写
  allow read, write: if hasAdminRole();
  
  // 赞助商用户可读自己的数据
  allow read: if isSponsorUser(sponsorId);
}

match /team-submissions/{submissionId} {
  // Admin 可读写
  allow read, write: if hasAdminRole();
  
  // 赞助商可读自己赛道的提交
  allow read: if canAccessTrack(resource.data.challengeId);
  
  // 队伍成员可读写自己的提交
  allow read, write: if isTeamMember(resource.data.teamMembers);
}
```

### 验证
- 所有 collections 创建成功
- 索引部署成功
- Security Rules 测试通过

---

## Phase 3: 权限系统

### 目标
实现赛道级别的权限控制和数据隔离

### 文件创建
1. **`lib/sponsor/permissions.ts`** (新建)
   - `checkSponsorPermission(userId, sponsorId)`
   - `checkTrackAccess(userId, trackId)`
   - `getUserAccessibleTracks(userId)`
   - `getUserSponsorRole(userId, sponsorId)`

2. **`lib/sponsor/middleware.ts`** (新建)
   - `requireSponsorAuth` - API middleware
   - `requireTrackAccess` - API middleware

### 实现步骤
```typescript
// lib/sponsor/permissions.ts

import { firestore } from 'firebase-admin';
import { db } from '../admin/init';

export async function checkSponsorPermission(
  userId: string,
  sponsorId: string
): Promise<boolean> {
  // 1. 检查是否是 super_admin 或 admin
  const userDoc = await db.collection('users').doc(userId).get();
  const user = userDoc.data();
  
  if (user.permissions?.includes('super_admin') || 
      user.permissions?.includes('admin')) {
    return true;
  }
  
  // 2. 检查 sponsor-user-mappings
  const mappingQuery = await db
    .collection('sponsor-user-mappings')
    .where('userId', '==', userId)
    .where('sponsorId', '==', sponsorId)
    .limit(1)
    .get();
  
  return !mappingQuery.empty;
}

export async function checkTrackAccess(
  userId: string,
  trackId: string
): Promise<boolean> {
  // 1. 获取用户有权限的 sponsors
  const userDoc = await db.collection('users').doc(userId).get();
  const user = userDoc.data();
  
  // Admin 可以访问所有
  if (user.permissions?.includes('super_admin') || 
      user.permissions?.includes('admin')) {
    return true;
  }
  
  // 2. 获取用户的 sponsor mappings
  const mappingsSnapshot = await db
    .collection('sponsor-user-mappings')
    .where('userId', '==', userId)
    .get();
  
  const sponsorIds = mappingsSnapshot.docs.map(doc => doc.data().sponsorId);
  
  // 3. 检查这些 sponsors 是否赞助该 track
  const challengeSnapshot = await db
    .collection('extended-challenges')
    .where('trackId', '==', trackId)
    .where('sponsorId', 'in', sponsorIds)
    .limit(1)
    .get();
  
  return !challengeSnapshot.empty;
}

export async function getUserAccessibleTracks(
  userId: string
): Promise<string[]> {
  const userDoc = await db.collection('users').doc(userId).get();
  const user = userDoc.data();
  
  // Admin 可以访问所有赛道
  if (user.permissions?.includes('super_admin') || 
      user.permissions?.includes('admin')) {
    const allChallenges = await db.collection('extended-challenges').get();
    return [...new Set(allChallenges.docs.map(doc => doc.data().trackId))];
  }
  
  // 获取用户的 sponsor mappings
  const mappingsSnapshot = await db
    .collection('sponsor-user-mappings')
    .where('userId', '==', userId)
    .get();
  
  const sponsorIds = mappingsSnapshot.docs.map(doc => doc.data().sponsorId);
  
  // 获取这些 sponsors 赞助的所有 tracks
  const challengesSnapshot = await db
    .collection('extended-challenges')
    .where('sponsorId', 'in', sponsorIds)
    .get();
  
  const trackIds = [...new Set(
    challengesSnapshot.docs.map(doc => doc.data().trackId)
  )];
  
  return trackIds;
}
```

### API Middleware
```typescript
// lib/sponsor/middleware.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from 'firebase-admin';
import { checkSponsorPermission, checkTrackAccess } from './permissions';

export async function requireSponsorAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => Promise<void>
) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decodedToken = await auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // 检查是否有 sponsor 权限
    const user = await db.collection('users').doc(userId).get();
    const userData = user.data();
    
    if (!userData.permissions?.includes('sponsor') &&
        !userData.permissions?.includes('admin') &&
        !userData.permissions?.includes('super_admin')) {
      return res.status(403).json({ error: 'Forbidden: Not a sponsor' });
    }
    
    // 将 userId 附加到 request 对象
    (req as any).userId = userId;
    
    await next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function requireTrackAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  trackId: string,
  next: () => Promise<void>
) {
  const userId = (req as any).userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const hasAccess = await checkTrackAccess(userId, trackId);
  
  if (!hasAccess) {
    return res.status(403).json({ 
      error: 'Forbidden: No access to this track' 
    });
  }
  
  await next();
}
```

### 验证
- 单元测试通过
- 赞助商 A 无法访问赞助商 B 的数据
- Admin 可以访问所有数据

---

## Phase 4: 后端 API - 赛道管理

### 目标
创建赛道管理相关的 API endpoints

### API Endpoints

#### 1. GET /api/sponsor/tracks
获取当前用户可访问的赛道列表

**请求**
```
GET /api/sponsor/tracks
Authorization: Bearer <token>
```

**响应**
```json
{
  "tracks": [
    {
      "id": "track-1",
      "name": "RWA Tokenization",
      "sponsorId": "sponsor-1",
      "sponsorName": "国泰金控",
      "challenge": {
        "id": "challenge-1",
        "title": "RWA 代币化挑战",
        "description": "...",
        "prizes": [...],
        "timeline": {...}
      },
      "stats": {
        "submissionCount": 12,
        "teamCount": 15,
        "averageScore": 7.5
      }
    }
  ]
}
```

**实现文件**: `pages/api/sponsor/tracks/index.ts`

#### 2. POST /api/sponsor/tracks/[trackId]/challenge
更新赛道挑战题目

**请求**
```
POST /api/sponsor/tracks/track-1/challenge
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "RWA 代币化挑战 - 更新版",
  "description": "...",
  "detailedDescription": "...",
  "attachments": [
    {
      "name": "挑战说明书.pdf",
      "url": "https://..."
    }
  ]
}
```

**响应**
```json
{
  "success": true,
  "challengeId": "challenge-1",
  "message": "Challenge updated successfully"
}
```

**实现文件**: `pages/api/sponsor/tracks/[trackId]/challenge.ts`

### 实现步骤
```bash
# 1. 创建 API 目录结构
mkdir -p pages/api/sponsor/tracks
touch pages/api/sponsor/tracks/index.ts
touch pages/api/sponsor/tracks/[trackId]/challenge.ts

# 2. 实现每个 endpoint

# 3. 添加错误处理和日志记录

# 4. 测试 API（使用 Postman 或 curl）
```

### 验证
- API 返回正确的数据
- 权限检查生效
- 错误处理正确

---

## Phase 5: 后端 API - 队伍提交查看

### 目标
创建队伍提交查看相关的 API endpoints

### API Endpoints

#### 1. GET /api/sponsor/tracks/[trackId]/submissions
获取赛道的所有队伍提交

**请求**
```
GET /api/sponsor/tracks/track-1/submissions?status=submitted&sortBy=score&limit=20&offset=0
Authorization: Bearer <token>
```

**响应**
```json
{
  "submissions": [
    {
      "id": "sub-1",
      "teamName": "Awesome Team",
      "projectName": "RWA Platform",
      "oneLiner": "A decentralized platform for...",
      "status": "submitted",
      "submittedAt": "2025-10-28T10:00:00Z",
      "averageScore": 8.5,
      "rank": 1
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 20
}
```

**实现文件**: `pages/api/sponsor/tracks/[trackId]/submissions.ts`

#### 2. GET /api/sponsor/submissions/[submissionId]
获取单个提交的详细信息

**请求**
```
GET /api/sponsor/submissions/sub-1
Authorization: Bearer <token>
```

**响应**
```json
{
  "id": "sub-1",
  "teamName": "Awesome Team",
  "teamMembers": [
    {
      "name": "Alice",
      "role": "leader"
    }
  ],
  "projectName": "RWA Platform",
  "description": "...",
  "githubRepo": "https://github.com/...",
  "demoUrl": "https://...",
  "techStack": ["React", "Solidity", "Node.js"],
  "scores": [
    {
      "judgeName": "Judge 1",
      "scores": {
        "innovation": 9,
        "technical": 8,
        "business": 7
      },
      "totalScore": 8.0,
      "comments": "Great project!"
    }
  ],
  "averageScore": 8.5
}
```

**实现文件**: `pages/api/sponsor/submissions/[submissionId].ts`

### 实现步骤
```bash
# 1. 创建 API 文件
mkdir -p pages/api/sponsor/submissions
touch pages/api/sponsor/submissions/[submissionId].ts

# 2. 实现查询逻辑（支持分页、排序、筛选）

# 3. 添加活动日志记录（每次查看提交都记录）

# 4. 测试 API
```

### 活动日志
```typescript
// 在每个 GET 请求中记录
await logSponsorActivity({
  sponsorId: userSponsorId,
  userId: userId,
  userName: userName,
  action: 'view_submission',
  targetType: 'submission',
  targetId: submissionId,
  details: {
    trackId: submission.projectTrack
  }
});
```

### 验证
- 分页和排序正确
- 只能查看自己赛道的提交
- 活动日志正确记录

---

## Phase 6: 后端 API - 评审决选

### 目标
创建评审和决选相关的 API endpoints

### API Endpoints

#### 1. GET /api/sponsor/judging/[trackId]
获取评审信息（标准 + 队伍列表）

**请求**
```
GET /api/sponsor/judging/track-1
Authorization: Bearer <token>
```

**响应**
```json
{
  "criteria": [
    {
      "name": "innovation",
      "description": "创新性",
      "maxScore": 10,
      "weight": 0.3
    },
    {
      "name": "technical",
      "description": "技术实现",
      "maxScore": 10,
      "weight": 0.4
    }
  ],
  "submissions": [
    {
      "id": "sub-1",
      "teamName": "Awesome Team",
      "projectName": "RWA Platform",
      "myScore": null,
      "averageScore": 8.5
    }
  ]
}
```

**实现文件**: `pages/api/sponsor/judging/[trackId]/index.ts`

#### 2. POST /api/sponsor/judging/[trackId]/score
提交评分

**请求**
```
POST /api/sponsor/judging/track-1/score
Authorization: Bearer <token>
Content-Type: application/json

{
  "submissionId": "sub-1",
  "scores": {
    "innovation": 9,
    "technical": 8,
    "business": 7
  },
  "comments": "Excellent work!"
}
```

**响应**
```json
{
  "success": true,
  "totalScore": 8.0,
  "submissionId": "sub-1"
}
```

**实现文件**: `pages/api/sponsor/judging/[trackId]/score.ts`

### 实现步骤
```bash
# 1. 创建 API 文件
mkdir -p pages/api/sponsor/judging/[trackId]
touch pages/api/sponsor/judging/[trackId]/index.ts
touch pages/api/sponsor/judging/[trackId]/score.ts

# 2. 实现评分逻辑（计算加权分数）

# 3. 更新提交的 averageScore 和 rank

# 4. 记录评审日志

# 5. 测试 API
```

### 评分计算逻辑
```typescript
function calculateTotalScore(
  scores: {[criteriaName: string]: number},
  criteria: JudgingCriteria['criteria']
): number {
  let total = 0;
  let totalWeight = 0;
  
  for (const criterion of criteria) {
    if (scores[criterion.name] !== undefined) {
      total += scores[criterion.name] * criterion.weight;
      totalWeight += criterion.weight;
    }
  }
  
  return totalWeight > 0 ? total / totalWeight : 0;
}
```

### 验证
- 评分正确保存
- 平均分正确计算
- 排名自动更新

---

## Phase 7-11: 前端页面实现

详见 `SPONSOR-FRONTEND-PLAN.md`

---

## Phase 12: 通知系统

### 目标
实现赞助商相关的自动通知

### 通知触发点
1. **新队伍提交** - 当队伍提交项目到赞助商的赛道
2. **提交更新** - 当队伍更新他们的提交
3. **评审开始** - 当评审阶段开始
4. **评审截止提醒** - 评审截止前 24 小时
5. **结果公布** - 当获奖名单公布

### 实现方式
```typescript
// lib/sponsor/notifications.ts

export async function sendSponsorNotification(
  notification: Omit<SponsorNotification, 'id' | 'createdAt'>
) {
  const notificationData = {
    ...notification,
    isRead: false,
    createdAt: new Date(),
  };
  
  // 1. 保存到数据库
  await db.collection('sponsor-notifications').add(notificationData);
  
  // 2. 发送邮件（如果启用）
  if (notification.recipientEmail) {
    await sendEmail({
      to: notification.recipientEmail,
      subject: notification.title,
      html: generateEmailTemplate(notification),
    });
  }
  
  // 3. 推送通知（如果启用）
  // TODO: 实现推送通知
}
```

### 触发器（Firebase Functions）
```typescript
// functions/src/sponsor-notifications.ts

export const onTeamSubmissionCreated = functions.firestore
  .document('team-submissions/{submissionId}')
  .onCreate(async (snapshot, context) => {
    const submission = snapshot.data();
    
    // 获取赛道的赞助商
    const challenge = await db.collection('extended-challenges')
      .doc(submission.challengeId)
      .get();
    
    const sponsorId = challenge.data().sponsorId;
    
    // 获取赞助商的所有用户
    const mappings = await db.collection('sponsor-user-mappings')
      .where('sponsorId', '==', sponsorId)
      .get();
    
    // 发送通知给每个用户
    for (const mapping of mappings.docs) {
      const userId = mapping.data().userId;
      
      await sendSponsorNotification({
        recipientUserId: userId,
        sponsorId: sponsorId,
        trackId: challenge.data().trackId,
        type: 'new_submission',
        title: '新队伍提交',
        message: `${submission.teamName} 提交了项目 "${submission.projectName}"`,
        relatedSubmissionId: snapshot.id,
        actionUrl: `/sponsor/submissions/${snapshot.id}`,
      });
    }
  });
```

### 验证
- 通知正确触发
- 邮件正确发送
- 通知在前端显示

---

## 总结

这12个Phase构成了完整的赞助商功能：

**数据层** (Phase 1-3)
- 扩展的数据模型
- 新的 Firestore collections
- 权限控制系统

**后端** (Phase 4-6)
- 赛道管理 API
- 提交查看 API
- 评审评分 API

**前端** (Phase 7-11)
- 仪表板
- 赛道管理页面
- 提交查看页面
- 评审页面
- 报告页面

**通知** (Phase 12)
- 自动通知系统
- 邮件集成

每个 Phase 都是独立可测试的，可以逐步实现和部署。

