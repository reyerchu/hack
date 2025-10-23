# 系统跳转到注册/登录页面的完整分析

本文档列出所有会导致系统跳转到注册或登录页面 (`/register` 或 `/auth`) 的情况。

## 📋 目录
1. [跳转到 /register (注册页面)](#跳转到-register-注册页面)
2. [跳转到 /auth (登录页面)](#跳转到-auth-登录页面)
3. [API 401/403 响应](#api-401403-响应)
4. [总结](#总结)

---

## 🔴 跳转到 /register (注册页面)

### 1. `/pages/profile.tsx` (个人中心页面)
**文件位置:** `pages/profile.tsx:390`

**触发条件:**
```typescript
if (!isSignedIn) {
  return <div>請登入以查看您的個人中心！</div>;
}

if (!hasProfile) {
  router.push('/register');  // ← 这里
  return <div></div>;
}
```

**原因:** 用户已登录但没有完成注册（没有 profile 数据）

**是否合理:** ✅ **合理** - 用户需要完成注册才能访问个人中心

---

## 🔵 跳转到 /auth (登录页面)

### 2. `/pages/register.tsx` (注册页面本身)
**文件位置:** `pages/register.tsx:85`

**触发条件:**
```typescript
useEffect(() => {
  if (typeof window === 'undefined') return;
  
  if (!user) {
    router.push('/auth');  // ← 这里
    return;
  }
  
  checkRedirect();
}, [user]);
```

**原因:** 访问注册页面时没有登录

**是否合理:** ✅ **合理** - 必须先登录才能注册

---

### 3. Sponsor Dashboard 及相关页面

#### 3.1 `/pages/sponsor/dashboard.tsx`
**文件位置:** `pages/sponsor/dashboard.tsx:61`

**触发条件:**
```typescript
useEffect(() => {
  if (!authLoading && !isSignedIn) {
    router.push('/auth?redirect=/sponsor/dashboard');  // ← 这里
  } else if (!authLoading && isSignedIn && !isSponsor) {
    router.push('/');  // 非赞助商跳转到首页
  }
}, [authLoading, isSignedIn, isSponsor, router]);
```

**原因:** 
- 未登录 → 跳转到登录页面，带 redirect 参数
- 已登录但不是 sponsor → 跳转到首页

**是否合理:** ✅ **合理** - Sponsor dashboard 需要 sponsor 权限

---

#### 3.2 `/pages/sponsor/tracks/[trackId]/index.tsx`
**文件位置:** `pages/sponsor/tracks/[trackId]/index.tsx:48`

**触发条件:**
```typescript
useEffect(() => {
  if (!authLoading && !isSignedIn) {
    router.push('/auth?redirect=/sponsor/dashboard');  // ← 这里
  } else if (!authLoading && isSignedIn && !isSponsor) {
    router.push('/');
  }
}, [authLoading, isSignedIn, isSponsor, router]);
```

**原因:** 同上

**是否合理:** ✅ **合理** - Track 详情页需要 sponsor 权限

---

#### 3.3 `/pages/sponsor/tracks/[trackId]/challenge.tsx`
**文件位置:** `pages/sponsor/tracks/[trackId]/challenge.tsx:36`

**触发条件:**
```typescript
useEffect(() => {
  if (!authLoading && !isSignedIn) {
    router.push('/auth?redirect=/sponsor/dashboard');  // ← 这里
  } else if (!authLoading && isSignedIn && !isSponsor) {
    router.push('/');
  }
}, [authLoading, isSignedIn, isSponsor, router]);
```

**原因:** 同上

**是否合理:** ✅ **合理** - Challenge 编辑页需要 sponsor 权限

---

#### 3.4 `/pages/sponsor/tracks/[trackId]/submissions.tsx`
**文件位置:** `pages/sponsor/tracks/[trackId]/submissions.tsx:30`

**触发条件:** 同上模式

**原因:** 未登录或不是 sponsor

**是否合理:** ✅ **合理**

---

#### 3.5 `/pages/sponsor/tracks/[trackId]/judging.tsx`
**文件位置:** `pages/sponsor/tracks/[trackId]/judging.tsx:29`

**触发条件:** 同上模式

**原因:** 未登录或不是 sponsor

**是否合理:** ✅ **合理**

---

#### 3.6 `/pages/sponsor/submissions/[submissionId].tsx`
**文件位置:** `pages/sponsor/submissions/[submissionId].tsx:26`

**触发条件:** 同上模式

**原因:** 未登录或不是 sponsor

**是否合理:** ✅ **合理**

---

#### 3.7 `/pages/sponsor/challenges.tsx`
**文件位置:** `pages/sponsor/challenges.tsx:27`

**触发条件:** 同上模式

**原因:** 未登录或不是 sponsor

**是否合理:** ✅ **合理**

---

#### 3.8 `/pages/sponsor/tracks.tsx`
**文件位置:** `pages/sponsor/tracks.tsx:45`

**触发条件:** 同上模式

**原因:** 未登录或不是 sponsor

**是否合理:** ✅ **合理**

---

#### 3.9 `/pages/sponsor/reports.tsx`
**文件位置:** `pages/sponsor/reports.tsx:23`

**触发条件:** 同上模式

**原因:** 未登录或不是 sponsor

**是否合理:** ✅ **合理**

---

#### 3.10 `/pages/sponsor/notifications.tsx`
**文件位置:** `pages/sponsor/notifications.tsx:26`

**触发条件:** 同上模式

**原因:** 未登录或不是 sponsor

**是否合理:** ✅ **合理**

---

### 4. Admin 相关页面

#### 4.1 `/pages/admin/sponsors.tsx`
**文件位置:** `pages/admin/sponsors.tsx:107`

**触发条件:**
```typescript
useEffect(() => {
  if (!authLoading && !isSignedIn) {
    router.push('/auth?redirect=/admin/sponsors');  // ← 这里
  } else if (!authLoading && isSignedIn) {
    const checkAdmin = async () => {
      // 检查是否是 admin
      const permissions = userData?.permissions || [];
      if (!permissions.includes('super_admin') && !permissions.includes('admin')) {
        router.push('/');  // 非 admin 跳转首页
      }
    };
    checkAdmin();
  }
}, [authLoading, isSignedIn]);
```

**原因:** 
- 未登录 → 跳转到登录页面
- 已登录但不是 admin → 跳转到首页

**是否合理:** ✅ **合理** - Admin 页面需要管理员权限

---

#### 4.2 `/pages/admin/teams.tsx`
**文件位置:** `pages/admin/teams.tsx:72`

**触发条件:**
```typescript
useEffect(() => {
  if (!authLoading && (!isSignedIn || !isAuthorized(user))) {
    router.push('/');  // ← 跳转首页，不是登录页
  }
}, [authLoading, isSignedIn, user, router]);
```

**原因:** 未登录或没有授权

**是否合理:** ⚠️ **可能需要改进** - 跳转到首页而不是登录页，可能不够明确

---

#### 4.3 `/pages/admin/track-management.tsx`
**文件位置:** `pages/admin/track-management.tsx:55`

**触发条件:**
```typescript
useEffect(() => {
  if (!authLoading && !isSignedIn) {
    router.push('/auth?redirect=/admin/track-management');  // ← 这里
  }
}, [authLoading, isSignedIn, router]);
```

**原因:** 未登录

**是否合理:** ✅ **合理**

---

#### 4.4 `/pages/admin/add-sponsor.tsx`
**文件位置:** `pages/admin/add-sponsor.tsx:48`

**触发条件:** 同上模式

**原因:** 未登录

**是否合理:** ✅ **合理**

---

### 5. Team Up 相关页面

#### 5.1 `/pages/team-up/create.tsx`
**文件位置:** `pages/team-up/create.tsx:22` 和 `:76`

**触发条件:**
```typescript
useEffect(() => {
  if (!authLoading && !isSignedIn) {
    router.push('/auth?redirect=/team-up/create');  // ← 这里
  }
}, [authLoading, isSignedIn, router]);

// 在 JSX 中的按钮
<button onClick={() => router.push('/auth?redirect=/team-up/create')}>
```

**原因:** 创建找队友需求需要登录

**是否合理:** ✅ **合理**

---

#### 5.2 `/pages/team-up/[id].tsx`
**文件位置:** `pages/team-up/[id].tsx:111` 和 `:415`

**触发条件:**
```typescript
useEffect(() => {
  if (!authLoading && !isSignedIn && needsAuth) {
    router.push(`/auth?redirect=/team-up/${currentNeed!.id}`);  // ← 这里
  }
}, [authLoading, isSignedIn, needsAuth]);
```

**原因:** 查看特定找队友需求的详情需要登录

**是否合理:** ⚠️ **可能过于严格** - 一般情况下，查看应该是公开的，只有操作（申请、编辑）才需要登录

---

#### 5.3 `/pages/team-up/edit/[id].tsx`
**文件位置:** `pages/team-up/edit/[id].tsx:68` 和 `:118`

**触发条件:**
```typescript
useEffect(() => {
  if (!authLoading && !isSignedIn) {
    router.push('/auth?redirect=/team-up/edit/' + needId);  // ← 这里
  }
}, [authLoading, isSignedIn, needId, router]);
```

**原因:** 编辑找队友需求需要登录

**是否合理:** ✅ **合理**

---

#### 5.4 `/pages/dashboard/team-up/applications/[needId].tsx`
**文件位置:** `pages/dashboard/team-up/applications/[needId].tsx:127`

**触发条件:**
```typescript
useEffect(() => {
  if (!authLoading && !isSignedIn) {
    router.push('/auth?redirect=/dashboard/team-up/applications/' + needId);  // ← 这里
  }
}, [authLoading, isSignedIn, needId, router]);
```

**原因:** 查看申请需要登录

**是否合理:** ✅ **合理**

---

### 6. `/pages/schedule/[id].tsx` (活动日程详情页)
**文件位置:** `pages/schedule/[id].tsx:274`

**触发条件:**
```typescript
// 当用户点击 RSVP 但未登录时
if (!isSignedIn) {
  router.push('/auth');  // ← 这里
  return;
}
```

**原因:** RSVP 需要登录

**是否合理:** ✅ **合理**

---

### 7. `/pages/auth/index.tsx` (登录页面内部的重定向)
**文件位置:** `pages/auth/index.tsx:106` 和 `:174`

**触发条件:**
```typescript
// 当登录失败后重试
router.push('/auth');
```

**原因:** 登录错误后刷新登录页面

**是否合理:** ✅ **合理**

---

### 8. `/pages/auth/signup.tsx`
**文件位置:** `pages/auth/signup.tsx:31`

**触发条件:**
```typescript
// 注册失败或取消时返回登录页
router.push('/auth');
```

**原因:** 返回登录页面

**是否合理:** ✅ **合理**

---

## ⚠️ 特殊情况

### 9. `/pages/team-register.tsx` (团队报名页面)
**文件位置:** `pages/team-register.tsx:93`

**触发条件:**
```typescript
useEffect(() => {
  if (!loading && (!isSignedIn || !hasProfile)) {
    router.push('/team-register-info');  // ← 跳转到信息页，不是登录页
  }
}, [loading, isSignedIn, hasProfile, router]);
```

**原因:** 未登录或没有 profile 的用户跳转到团队报名信息页

**是否合理:** ✅ **合理** - 这是新功能，让未登录用户看到团队报名的说明

---

## 🔒 API 401/403 响应

### 10. API 认证中间件 (`/lib/sponsor/middleware.ts`)

**所有使用 `requireAuth()` 的 API 端点都会在认证失败时返回 401:**

```typescript
export async function requireAuth(req, res): Promise<boolean> {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      ApiResponse.unauthorized(res, 'Missing authorization token');  // 401
      return false;
    }
    
    const decodedToken = await auth().verifyIdToken(token);
    // ...
    
    if (!userInfo || !userInfo.exists) {
      ApiResponse.unauthorized(res, 'User not found');  // 401
      return false;
    }
    
    return true;
  } catch (error) {
    ApiResponse.unauthorized(res, 'Invalid or expired token');  // 401
    return false;
  }
}
```

**受影响的 API 端点:**
- `/api/applications` - 注册数据提交
- `/api/user/profile` - 用户资料
- `/api/admin/sponsors/*` - 所有 sponsor 管理 API
- `/api/admin/challenges/*` - 所有 challenge 管理 API
- `/api/sponsor/tracks/*` - 所有 sponsor track API
- 更多...

**原因:** Token 无效、过期或缺失

**是否合理:** ✅ **合理** - 标准的 API 认证流程

---

## 📊 总结

### 跳转统计

| 目标页面 | 触发情况数量 | 主要原因 |
|---------|------------|---------|
| `/register` | 1 | 已登录但未注册 |
| `/auth` | 25+ | 未登录访问受保护页面 |
| `/auth?redirect=*` | 20+ | 未登录访问受保护页面（带返回地址） |
| `/team-register-info` | 1 | 未登录访问团队报名（信息页） |
| `/` (首页) | 多个 | 已登录但权限不足 |

### 需要注意的问题

1. **✅ 大部分跳转都是合理的** - 保护受限资源

2. **⚠️ 可能需要改进的地方:**
   - `/pages/admin/teams.tsx:72` - 未授权时跳转到首页而不是登录页，可能造成混淆
   - `/pages/team-up/[id].tsx` - 查看找队友详情需要登录，可能过于严格

3. **✅ 正确使用 redirect 参数** - 大多数登录跳转都带有 `?redirect=` 参数，登录后可以返回原页面

4. **✅ API 401/403 处理正确** - 使用标准的 HTTP 状态码和统一的认证中间件

### 建议

1. **统一未授权跳转逻辑:**
   ```typescript
   // 当前有两种模式:
   router.push('/');              // 跳转首页
   router.push('/auth?redirect=*'); // 跳转登录页带返回
   
   // 建议: 统一为跳转登录页 + redirect
   ```

2. **考虑公开内容的可访问性:**
   - 找队友详情页 (`/team-up/[id]`) 是否应该公开？
   - 活动日程是否应该公开查看？

3. **改进用户体验:**
   - 在跳转前显示提示信息："请先登录以访问此功能"
   - 保存用户正在填写的表单数据

---

**生成时间:** $(date)
**分析范围:** `/home/reyerchu/hack/hack-dev`

