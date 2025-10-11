# Bug 修复报告：未认证错误

## 🐛 问题描述

**错误信息**: "未認證，請先登入"

**用户状态**: 已经用 Google 账号登录（reyerchu@defintek.io）

**问题场景**: 前端显示已登录，但后端 API 返回未认证错误

---

## 🔍 问题分析

### 根本原因

**前端和后端的 Authorization header 格式不一致**：

1. **前端发送**: `Authorization: Bearer ${token}`
2. **后端期望**: `Authorization: ${token}` (直接的 token，无 "Bearer " 前缀)

### 技术细节

#### 现有系统的做法
```typescript
// lib/user/AuthContext.tsx (第 99 行)
headers: { 
  Authorization: token  // ← 直接传 token，不加 "Bearer "
}

// pages/api/userinfo.tsx (第 49 行)
const userToken = headers['authorization'] as string;
await auth().verifyIdToken(userToken);  // ← 直接验证，不处理前缀
```

#### 找队友 API 的做法（错误）
```typescript
// 前端（例如 pages/team-up/create.tsx）
headers: {
  'Authorization': `Bearer ${token}`,  // ← 添加了 "Bearer " 前缀
}

// 后端 lib/teamUp/auth.ts（修复前）
const token = req.headers['authorization'];
await auth().verifyIdToken(token);  // ← 尝试验证包含 "Bearer " 的字符串
// ❌ 失败！Firebase Admin SDK 只接受纯 token
```

---

## ✅ 解决方案

### 选项 A: 统一后端处理（已采用）

修改后端认证函数，兼容两种格式：

```typescript
// lib/teamUp/auth.ts
let token = req.headers['authorization'] as string;

// 移除 "Bearer " 前缀（如果有的话）
if (token.startsWith('Bearer ')) {
  token = token.substring(7);
}

await auth().verifyIdToken(token);  // ✅ 现在可以工作了
```

**优点**:
- ✅ 更健壮，兼容两种格式
- ✅ 符合 HTTP 标准（Bearer token 是标准格式）
- ✅ 不需要修改多个前端文件
- ✅ 向后兼容

### 选项 B: 统一前端格式（未采用）

移除前端所有的 "Bearer " 前缀。

**缺点**:
- ❌ 需要修改多个文件
- ❌ 不符合 HTTP Bearer token 标准
- ❌ 可能与其他系统集成有问题

---

## 📝 修改内容

### 修改的文件: `lib/teamUp/auth.ts`

#### Before (错误)
```typescript
export async function getAuthenticatedUser(req: NextApiRequest) {
  try {
    const token = req.headers['authorization'];
    
    if (!token) {
      return null;
    }

    // 直接验证 token
    const payload = await auth().verifyIdToken(token);
    // ❌ 如果 token 包含 "Bearer "，这里会失败
```

#### After (正确)
```typescript
export async function getAuthenticatedUser(req: NextApiRequest) {
  try {
    let token = req.headers['authorization'] as string;
    
    if (!token) {
      return null;
    }

    // 移除 "Bearer " 前缀（如果有的话）
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    // 验证纯 token
    const payload = await auth().verifyIdToken(token);
    // ✅ 现在可以正确验证了
```

---

## 🧪 测试验证

### 测试步骤

1. **确认登录状态**
   - 打开浏览器控制台
   - 检查 `localStorage` 或 `sessionStorage`
   - 确认有 Firebase token

2. **测试 API 调用**
   ```javascript
   // 在浏览器控制台运行
   fetch('/api/team-up/needs', {
     headers: {
       'Authorization': `Bearer ${user.token}`
     }
   })
   ```

3. **预期结果**
   - ✅ 不再返回 401 Unauthorized
   - ✅ 不再显示"未認證，請先登入"
   - ✅ API 正常返回数据

### 兼容性测试

后端现在支持两种格式：

```bash
# 格式 1: 带 "Bearer " 前缀（标准格式）
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
✅ 可以工作

# 格式 2: 不带前缀（现有系统格式）
Authorization: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
✅ 也可以工作
```

---

## 🔍 调试技巧

### 如果仍然出现认证错误

1. **检查 token 是否过期**
   ```javascript
   // 在浏览器控制台
   console.log('Token:', user.token);
   
   // 解码 JWT token（不验证签名）
   const parts = user.token.split('.');
   const payload = JSON.parse(atob(parts[1]));
   console.log('Expires:', new Date(payload.exp * 1000));
   ```

2. **检查 Firebase Admin SDK 是否正确初始化**
   ```bash
   # 在服务器日志中查找
   grep -i "firebase" logs/*.log
   ```

3. **检查用户是否在 registrations collection 中**
   - 访问 Firebase Console
   - 查看 Firestore
   - 检查 `/registrations` collection
   - 搜索您的 UID

4. **查看服务器错误日志**
   ```bash
   # 查看最近的错误
   tail -f logs/error.log
   ```

---

## 📚 相关知识

### HTTP Bearer Token 标准

根据 [RFC 6750](https://tools.ietf.org/html/rfc6750)，Bearer token 的标准格式是：

```
Authorization: Bearer <token>
```

### Firebase Admin SDK Token 验证

`auth().verifyIdToken()` 方法：
- ✅ 接受：纯 JWT token 字符串
- ❌ 不接受：包含 "Bearer " 前缀的字符串
- ✅ 返回：解码后的 token payload

---

## ✅ 验证清单

修复完成后，请验证：

- [ ] 刷新浏览器（Ctrl+Shift+R）
- [ ] 重新登录（如果需要）
- [ ] 访问 `/team-up/create`
- [ ] 填写并提交表单
- [ ] 确认不再出现"未認證"错误
- [ ] 确认需求创建成功

---

## 🚀 下一步

1. **刷新浏览器**: 清除缓存并重新加载
2. **重新尝试**: 访问创建需求页面
3. **填写表单**: 提交一个测试需求
4. **确认成功**: 应该能正常创建了

---

**状态**: ✅ 已修复

**修复时间**: 2025/10/10

**影响范围**: 所有找队友 API 的认证流程

**向后兼容**: ✅ 是（同时支持带/不带 "Bearer " 前缀）

