# 找隊友功能 - 部署与测试指南

## 🚀 部署前检查清单

### 1. 环境变量配置

创建或更新 `.env.local` 文件，确保包含以下变量：

```bash
# Firebase Admin SDK
SERVICE_ACCOUNT_PROJECT_ID=your-project-id
SERVICE_ACCOUNT_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 应用配置
NEXT_PUBLIC_BASE_URL=http://localhost:3008
PORT=3008

# 可选（M6 实现）
REDIS_URL=redis://localhost:6379
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@hackathon.com.tw
```

### 2. Firebase 数据库准备

确保 Firestore 已创建以下 Collections：
- `registrations` - 用户注册信息（已存在）
- `teamNeeds` - 找队友需求（新建）
- `teamApplications` - 应征记录（新建）
- `notifications` - 通知（已存在）

### 3. Firestore 索引设置

在 Firebase Console 中添加以下复合索引：

```
Collection: teamNeeds
- isOpen (Ascending), isHidden (Ascending), updatedAt (Descending)
- projectTrack (Ascending), isOpen (Ascending), updatedAt (Descending)
- ownerUserId (Ascending), createdAt (Descending)
- isFlagged (Ascending), createdAt (Descending)

Collection: teamApplications
- teamNeedId (Ascending), status (Ascending), createdAt (Descending)
- applicantUserId (Ascending), createdAt (Descending)
- teamNeedId (Ascending), applicantUserId (Ascending)
```

或使用 Firebase CLI 部署索引：

```bash
# 创建 firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "teamNeeds",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isOpen", "order": "ASCENDING" },
        { "fieldPath": "isHidden", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "teamNeeds",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectTrack", "order": "ASCENDING" },
        { "fieldPath": "isOpen", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "teamNeeds",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerUserId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "teamApplications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "teamNeedId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "teamApplications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "applicantUserId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}

# 部署索引
firebase deploy --only firestore:indexes
```

## 🧪 测试步骤

### Step 1: 启动开发服务器

```bash
# 方法1: 使用 npm
npm run dev

# 方法2: 使用指定端口
npm run dev -- -p 3008

# 方法3: 使用 PM2（生产环境）
pm2 start npm --name "hackathon-dev" -- run dev
```

### Step 2: 测试 API 端点

#### 2.1 测试统计 API（公开端点）

```bash
curl http://localhost:3008/api/team-up/stats
```

**预期输出**:
```json
{
  "success": true,
  "data": {
    "totalNeeds": 0,
    "openNeeds": 0,
    "totalApplications": 0,
    "successfulMatches": 0
  }
}
```

#### 2.2 测试获取需求列表（公开端点）

```bash
curl http://localhost:3008/api/team-up/needs
```

**预期输出**:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

#### 2.3 测试创建需求（需要认证）

首先获取 Firebase ID Token：

1. 在浏览器中访问 `http://localhost:3008`
2. 登录系统
3. 打开浏览器开发者工具，在 Console 中执行：
```javascript
firebase.auth().currentUser.getIdToken().then(token => console.log(token))
```
4. 复制输出的 token

然后测试创建：

```bash
export AUTH_TOKEN="your-firebase-id-token"

curl -X POST http://localhost:3008/api/team-up/needs \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "尋找智能合約工程師",
    "projectTrack": "DeFi",
    "projectStage": "已開始，需要隊友",
    "brief": "我們正在開發一個去中心化借貸平台，目前已完成基礎架構。",
    "rolesNeeded": ["智能合約工程師", "前端工程師"],
    "haveRoles": ["產品經理"],
    "contactHint": "加我 Telegram @testuser"
  }'
```

**预期输出**:
```json
{
  "success": true,
  "data": {
    "id": "xyz123",
    "message": "需求發布成功！"
  }
}
```

### Step 3: 测试前端页面

#### 3.1 测试列表页

在浏览器中访问: `http://localhost:3008/team-up`

**检查项**:
- [ ] 页面正常加载
- [ ] 显示"找隊友"标题
- [ ] 搜索栏显示
- [ ] 筛选面板显示
- [ ] 如果没有数据，显示空状态
- [ ] "發布需求"按钮显示
- [ ] 响应式布局正常（调整浏览器窗口大小）

#### 3.2 测试筛选功能

1. 选择不同的排序方式（最新/热门/最多应徵）
2. 选择不同的状态（全部/开放中/已结束）
3. 选择赛道
4. 选择阶段
5. 选择角色（多选）
6. 点击"清除筛选"

**检查项**:
- [ ] URL 参数正确更新
- [ ] 筛选结果正确
- [ ] 移动端可以展开/收起筛选面板

#### 3.3 测试搜索功能

1. 在搜索栏输入关键词
2. 按 Enter 或等待自动搜索
3. 点击清除按钮

**检查项**:
- [ ] 搜索结果正确
- [ ] URL 参数更新
- [ ] 清除功能正常

#### 3.4 测试详情页

如果已创建需求，访问: `http://localhost:3008/team-up/{needId}`

**检查项（非 Owner）**:
- [ ] 显示完整信息
- [ ] 显示"立即应徵"按钮（占位）
- [ ] 浏览次数增加
- [ ] 返回按钮正常

**检查项（Owner）**:
- [ ] 显示"你的需求"标签
- [ ] 显示"编辑需求"按钮
- [ ] 显示"关闭需求"按钮
- [ ] 显示"查看应徵列表"按钮

#### 3.5 测试导航菜单

**检查项**:
- [ ] 主导航中显示"找隊友"选项
- [ ] 点击可以正确跳转
- [ ] 移动端导航正常

### Step 4: 测试 PII 检测

尝试创建包含个人信息的需求：

```bash
curl -X POST http://localhost:3008/api/team-up/needs \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "測試需求",
    "projectTrack": "DeFi",
    "projectStage": "有想法，還沒動工",
    "brief": "請聯繫我 test@example.com 或打電話 0912-345-678",
    "rolesNeeded": ["前端工程師"],
    "contactHint": "加我 Telegram @testuser"
  }'
```

**预期输出**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "公開欄位不可包含Email"
  }
}
```

### Step 5: 性能测试

#### 5.1 页面加载速度

使用 Chrome DevTools Lighthouse 测试：
1. 打开 Chrome DevTools (F12)
2. 切换到 Lighthouse 标签
3. 选择 "Performance" 和 "Desktop"
4. 点击 "Generate report"

**目标指标**:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Total Blocking Time: < 300ms
- Cumulative Layout Shift: < 0.1

#### 5.2 API 响应时间

```bash
# 测试多次请求
for i in {1..10}; do
  time curl -s http://localhost:3008/api/team-up/needs > /dev/null
done
```

**目标**: 平均响应时间 < 500ms

## 🐛 常见问题排查

### 问题 1: Firebase Admin SDK 初始化失败

**错误信息**:
```
The default Firebase app does not exist. Make sure you call initializeApp()
```

**解决方案**:
1. 检查 `.env.local` 文件是否存在
2. 检查环境变量是否正确设置
3. 重启开发服务器

```bash
# 检查环境变量
echo $SERVICE_ACCOUNT_PROJECT_ID

# 重启服务器
pm2 restart hackathon-dev
# 或
npm run dev
```

### 问题 2: Firestore 权限错误

**错误信息**:
```
Missing or insufficient permissions
```

**解决方案**:
1. 检查 Firebase 项目的 Service Account 权限
2. 确保 Service Account 有 "Firebase Admin" 角色
3. 检查 Firestore 规则是否正确

### 问题 3: 索引未创建

**错误信息**:
```
The query requires an index
```

**解决方案**:
1. 点击错误信息中的链接，自动创建索引
2. 或手动在 Firebase Console 创建索引
3. 等待索引创建完成（可能需要几分钟）

### 问题 4: 页面 404 错误

**解决方案**:
1. 检查文件路径是否正确
2. 重启开发服务器
3. 清除 `.next` 缓存：
```bash
rm -rf .next
npm run dev
```

### 问题 5: 样式未加载

**解决方案**:
1. 检查 Tailwind CSS 配置
2. 确保 `styles/globals.css` 正确导入
3. 重新编译：
```bash
npm run build
npm run dev
```

## 📊 监控与日志

### 开发环境日志

```bash
# 查看实时日志
pm2 logs hackathon-dev

# 或使用 npm
npm run dev
```

### 查看 API 请求

在浏览器开发者工具的 Network 标签中查看所有 API 请求：
1. 打开 DevTools (F12)
2. 切换到 Network 标签
3. 筛选 "Fetch/XHR"
4. 查看请求和响应

### Firebase Console 监控

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目
3. 查看 Firestore 数据
4. 查看使用量统计

## ✅ 验收标准

### 功能验收
- [ ] 所有 API 端点正常工作
- [ ] 列表页正常显示
- [ ] 详情页正常显示
- [ ] 搜索功能正常
- [ ] 筛选功能正常
- [ ] PII 检测正常工作
- [ ] 权限控制正确
- [ ] 响应式布局正常

### 性能验收
- [ ] 页面加载时间 < 2s
- [ ] API 响应时间 < 500ms
- [ ] Lighthouse 性能分数 > 80
- [ ] 无内存泄漏

### 安全验收
- [ ] PII 检测阻止违规内容
- [ ] 未登录无法创建需求
- [ ] 非 Owner 无法编辑他人需求
- [ ] SQL 注入测试通过
- [ ] XSS 测试通过

## 🚀 生产部署

### 使用 deploy.sh（现有脚本）

```bash
./deploy.sh
```

### 使用 Vercel（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

### 环境变量配置（生产环境）

在 Vercel Dashboard 或服务器上设置：
1. SERVICE_ACCOUNT_PROJECT_ID
2. SERVICE_ACCOUNT_CLIENT_EMAIL
3. SERVICE_ACCOUNT_PRIVATE_KEY
4. NEXT_PUBLIC_BASE_URL=https://hackathon.com.tw
5. REDIS_URL (M6 时添加)
6. RECAPTCHA_SECRET_KEY (M6 时添加)
7. SENDGRID_API_KEY (M4 时添加)

## 📝 测试报告模板

```markdown
# 找隊友功能测试报告

## 测试环境
- 测试日期: 2025-10-10
- 测试人员: [姓名]
- 环境: [Development/Staging/Production]
- 浏览器: Chrome 120.0

## API 测试结果
- [ ] GET /api/team-up/stats - ✅ 通过
- [ ] GET /api/team-up/needs - ✅ 通过
- [ ] POST /api/team-up/needs - ✅ 通过
- [ ] GET /api/team-up/needs/:id - ✅ 通过
- [ ] PATCH /api/team-up/needs/:id - ✅ 通过
- [ ] DELETE /api/team-up/needs/:id - ✅ 通过

## 前端测试结果
- [ ] 列表页加载 - ✅ 通过
- [ ] 搜索功能 - ✅ 通过
- [ ] 筛选功能 - ✅ 通过
- [ ] 详情页显示 - ✅ 通过
- [ ] 响应式布局 - ✅ 通过

## 性能测试结果
- 页面加载时间: [数值]
- API 响应时间: [数值]
- Lighthouse 分数: [数值]

## 发现的问题
1. [问题描述]
2. [问题描述]

## 建议
[改进建议]
```

---

**文档版本**: v1.0  
**最后更新**: 2025-10-10  
**维护者**: AI Assistant

