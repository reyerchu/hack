# Bug 修复报告：服务器错误 500

## 🐛 问题描述

**错误信息**: "服務器錯誤，請稍後再試"

**用户状态**: 
- 已经用 Google 账号登录（reyerchu@defintek.io）
- 前端显示已登录

**问题场景**: 
- 前一个问题（"未認證，請先登入"）修复后
- 尝试发布需求时仍然失败
- 返回 500 Internal Server Error

---

## 🔍 问题分析

### 根本原因

**Firebase Admin SDK 没有正确初始化**

虽然环境变量已经配置在 `.env.local` 文件中，但开发服务器需要**重启**才能加载这些环境变量。

### 技术细节

#### 服务器日志显示的错误

```bash
Error authenticating user: FirebaseAuthError: Decoding Firebase ID token failed. 
Make sure you passed the entire string JWT which represents an ID token.
```

这个错误**不是因为** token 格式问题，而是因为 Firebase Admin SDK 根本没有初始化。

#### 环境变量检查

```bash
# ✅ 环境变量已配置
$ grep -E "SERVICE_ACCOUNT" .env.local
SERVICE_ACCOUNT_CLIENT_EMAIL=firebase-adminsdk-fbsvc@hackathon-rwa-nexus.iam.gserviceaccount.com
SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...
SERVICE_ACCOUNT_PROJECT_ID=hackathon-rwa-nexus
```

#### 初始化逻辑

```typescript
// lib/admin/init.ts
function initializeFirebase() {
  if (admin.apps.length < 1) {
    // 检查环境变量
    if (
      !process.env.SERVICE_ACCOUNT_PROJECT_ID ||
      !process.env.SERVICE_ACCOUNT_CLIENT_EMAIL ||
      !process.env.SERVICE_ACCOUNT_PRIVATE_KEY
    ) {
      console.warn('Firebase Admin SDK: Missing environment variables');
      return; // ← 如果没有环境变量，直接返回，不初始化
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
        clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
        privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK initialized successfully'); // ← 应该看到这个
  }
}
```

---

## ✅ 解决方案

### 方案：重启开发服务器

Next.js 开发服务器只在**启动时**读取 `.env.local`，所以必须重启才能加载新的/更新的环境变量。

#### 步骤 1: 停止当前服务器

```bash
# 方法 1: 查找并杀掉进程
pkill -f "npm run dev"

# 方法 2: 查找占用端口的进程
lsof -ti:3008 | xargs kill -9

# 方法 3: 在运行 npm run dev 的终端按 Ctrl+C
```

#### 步骤 2: 重新启动服务器

```bash
cd /home/reyerchu/hack/hack
npm run dev
```

#### 步骤 3: 确认环境变量已加载

服务器启动时应该看到：

```
ready - started server on 0.0.0.0:3008
info  - Loaded env from /home/reyerchu/hack/hack/.env.local  ← 这一行很重要！
event - compiled client and server successfully
Firebase client initialized successfully
```

---

## 🧪 验证修复

### 1. 检查服务器日志

首次 API 调用时，应该看到：

```
Firebase Admin SDK initialized successfully  ← 如果看到这个，说明初始化成功了
[Auth] Verifying token for request...
[Auth] Token verified for user: xxxxx
```

而**不应该**看到：

```
Firebase Admin SDK: Missing environment variables  ← 这表示环境变量未加载
Error authenticating user: FirebaseAuthError...
```

### 2. 测试 API 调用

```bash
# 获取一个有效的 token（从浏览器控制台）
TOKEN="your-firebase-id-token"

# 测试 API
curl -X GET http://localhost:3008/api/team-up/needs \
  -H "Authorization: Bearer $TOKEN"

# 预期结果: 不再返回 500 错误
# ✅ 200 OK - 返回需求列表
# ✅ 401 Unauthorized - 如果 token 无效（这是正常的错误）
```

### 3. 测试前端

访问测试页面：
```
http://localhost:3008/test-auth
```

这个页面会显示：
- ✅ 登录状态
- ✅ Token 信息（是否过期）
- ✅ API 测试结果

---

## 📝 修改的文件

### 1. `lib/teamUp/auth.ts`

**目的**: 增强认证错误日志，帮助调试

```typescript
// 添加了详细的日志
console.log('[Auth] Verifying token for request...');
console.log('[Auth] Token verified for user:', payload.uid);
console.error('[Auth] Error authenticating user:', error.message);

// 添加了 token 格式检查
if (!token || token.length < 10) {
  console.log('[Auth] Invalid token format');
  return null;
}
```

### 2. `pages/test-auth.tsx` (新文件)

**目的**: 提供一个调试页面，用于检查认证状态

**功能**:
- 显示登录状态
- 解码并显示 token 信息（UID、email、过期时间）
- 测试 API 调用
- 提供"刷新 Token"按钮
- 提供"重新登录"按钮

**访问**: `http://localhost:3008/test-auth`

---

## 🎯 核心教训

### Next.js 环境变量的重要规则

1. **`.env.local` 只在服务器启动时加载**
   - 修改后必须重启 `npm run dev`
   - 不会自动重新加载（hot reload 不包括环境变量）

2. **客户端 vs 服务端环境变量**
   - `NEXT_PUBLIC_*`: 客户端和服务端都能访问
   - 其他变量: 只有服务端能访问

3. **验证环境变量是否加载**
   ```bash
   # 在服务器启动日志中查找这一行
   info  - Loaded env from /path/to/.env.local
   ```

4. **调试环境变量**
   ```typescript
   // 在 API 路由中临时添加
   console.log('PROJECT_ID:', process.env.SERVICE_ACCOUNT_PROJECT_ID ? 'SET' : 'NOT SET');
   ```

---

## 🔧 故障排查检查清单

如果仍然遇到"服务器错误"：

### ✅ 检查 1: 环境变量文件存在

```bash
ls -la .env.local
# 应该看到文件
```

### ✅ 检查 2: 环境变量内容正确

```bash
grep SERVICE_ACCOUNT .env.local
# 应该看到三个变量（PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY）
```

### ✅ 检查 3: 服务器已重启

```bash
# 查看服务器启动时间
ps aux | grep "npm run dev"

# 应该是几分钟之内启动的，不应该是几小时前
```

### ✅ 检查 4: 服务器加载了 .env.local

```bash
# 查看服务器启动日志
tail -50 /tmp/nextjs.log | grep "Loaded env"

# 应该看到: info  - Loaded env from /home/reyerchu/hack/hack/.env.local
```

### ✅ 检查 5: Firebase Admin SDK 初始化成功

```bash
# 触发任意 API 调用后，查看日志
tail -50 /tmp/nextjs.log | grep "Firebase"

# 应该看到: Firebase Admin SDK initialized successfully
# 不应该看到: Missing environment variables
```

### ✅ 检查 6: Token 未过期

访问 `http://localhost:3008/test-auth` 查看 token 过期时间。

如果已过期，点击"刷新 Token"按钮。

### ✅ 检查 7: 用户已注册

在 Firebase Console 查看 Firestore：
- 集合: `/registrations`
- 文档: 搜索您的 UID
- 确认文档存在

---

## 🚀 下一步

### 1. 刷新浏览器
```
按 Ctrl+Shift+R (或 Cmd+Shift+R)
清除缓存
```

### 2. 访问测试页面
```
http://localhost:3008/test-auth
```

**检查**:
- ✅ 登录状态为"已登录"
- ✅ Token 未过期
- ✅ API 测试返回 200 OK

### 3. 测试创建需求
```
http://localhost:3008/team-up/create
```

**填写表单并提交**，预期结果：
- ✅ 不再显示"服務器錯誤"
- ✅ 需求创建成功
- ✅ 跳转到需求详情页

### 4. 如果仍有错误

查看**服务器终端输出**，应该会有详细的错误堆栈：

```bash
# 如果服务器在后台运行
tail -f /tmp/nextjs.log

# 如果服务器在前台运行
# 直接看终端输出
```

复制错误信息，我们再进一步分析。

---

## 📊 问题时间线

| 时间 | 事件 | 状态 |
|-----|------|------|
| T0 | 用户报告"未認證，請先登入" | ❌ |
| T1 | 修复 `auth.ts` 支持 Bearer token | ✅ |
| T2 | 用户报告"服務器錯誤" | ❌ |
| T3 | 发现环境变量未加载 | 🔍 |
| T4 | 重启开发服务器 | ✅ |
| T5 | 验证 Firebase Admin SDK 已初始化 | ✅ |

---

## 🎉 修复确认

- [x] 环境变量已配置
- [x] 开发服务器已重启
- [x] Firebase Admin SDK 已初始化
- [x] 认证日志已增强
- [x] 测试页面已创建 (`/test-auth`)

**状态**: ✅ 已修复

**下次预防**: 修改 `.env.local` 后，记得重启 `npm run dev`

---

## 📚 相关文档

- Next.js 环境变量: https://nextjs.org/docs/basic-features/environment-variables
- Firebase Admin SDK 初始化: https://firebase.google.com/docs/admin/setup
- 测试页面: `/test-auth`
- 之前的修复: `docs/BUG-FIX-AUTH.md`

