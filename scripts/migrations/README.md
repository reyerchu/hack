# Database Migration Scripts

赞助商功能的数据库迁移和测试数据生成脚本。

## 脚本列表

### 1. `migrate-sponsors.js`
将现有的 `sponsors` collection 迁移到 `extended-sponsors`。

**用法：**
```bash
node scripts/migrations/migrate-sponsors.js
```

**功能：**
- 读取现有的 `/sponsors` 数据
- 转换为扩展的赞助商格式
- 写入到 `/extended-sponsors`
- 保留原数据不变（可回滚）

**注意事项：**
- 迁移后需要手动补充：联系人、赞助层级、权限等信息
- 原数据不会被删除

---

### 2. `migrate-challenges.js`
将现有的 `challenges` collection 迁移到 `extended-challenges`。

**用法：**
```bash
node scripts/migrations/migrate-challenges.js
```

**功能：**
- 读取现有的 `/challenges` 数据
- 转换为扩展的挑战格式
- 自动推断赞助商和赛道关联
- 写入到 `/extended-challenges`

**注意事项：**
- 需要根据实际情况调整 `ORG_TO_SPONSOR_ID` 映射
- 迁移后需要手动补充：详细描述、技术要求、时间线等

---

### 3. `seed-test-data.js`
生成测试数据用于开发和测试。

**用法：**
```bash
# 仅在开发环境运行！
node scripts/migrations/seed-test-data.js
```

**功能：**
- 生成示例赞助商数据
- 生成示例挑战数据
- 生成示例队伍提交数据
- 生成评审标准和用户映射

**注意事项：**
- ⚠️ **仅用于开发环境，不要在生产环境运行！**
- 会创建带 `-test` 后缀的测试数据
- 测试用户 ID: `test-sponsor-user-1`, `test-sponsor-user-2`

---

## 执行顺序

建议按以下顺序执行：

### 初次设置（生产环境）
```bash
# 1. 迁移现有数据
node scripts/migrations/migrate-sponsors.js
node scripts/migrations/migrate-challenges.js

# 2. 手动补充迁移后的数据
# （通过 Firebase Console 或 Admin 页面）

# 3. 部署 Firestore 索引
firebase deploy --only firestore:indexes

# 4. 更新 Firestore Security Rules
firebase deploy --only firestore:rules
```

### 开发环境设置
```bash
# 1. 生成测试数据
node scripts/migrations/seed-test-data.js

# 2. 启动开发服务器
npm run dev
```

---

## Firestore 配置

### 索引部署
```bash
firebase deploy --only firestore:indexes
```

索引配置文件：`firestore.indexes.json`

### Security Rules 部署
```bash
# 方法 1: 部署专门的 sponsor rules
firebase deploy --only firestore:rules --config firestore.rules.sponsor

# 方法 2: 合并到现有 rules（推荐）
# 将 firestore.rules.sponsor 的内容合并到 firestore.rules
firebase deploy --only firestore:rules
```

---

## 回滚

如果迁移出现问题，可以：

1. **删除新 collections**（原数据未动）：
```javascript
// 在 Firebase Console 中删除
- /extended-sponsors
- /extended-challenges
```

2. **重新运行迁移**：
```bash
node scripts/migrations/migrate-sponsors.js
node scripts/migrations/migrate-challenges.js
```

---

## 数据验证

迁移后，验证数据：

```bash
# 检查数据数量
firebase firestore:get /extended-sponsors
firebase firestore:get /extended-challenges

# 或在代码中
const sponsorsCount = await db.collection('extended-sponsors').count().get();
const challengesCount = await db.collection('extended-challenges').count().get();
console.log(`Sponsors: ${sponsorsCount.data().count}`);
console.log(`Challenges: ${challengesCount.data().count}`);
```

---

## 常见问题

### Q: 迁移会影响现有系统吗？
A: 不会。迁移只是创建新的 collections，原数据保持不变。现有系统继续使用原 collections。

### Q: 何时切换到新系统？
A: 在所有新功能开发完成并测试通过后，逐步将前端切换到使用新 API。

### Q: 如何处理并发运行的两套系统？
A: 在过渡期间，可以：
1. 新功能使用新 collections
2. 旧功能继续使用旧 collections
3. 定期同步数据（如果需要）

### Q: 测试数据如何清理？
A: 删除所有 ID 以 `-test` 结尾的文档。

---

## 环境变量

确保 `.env.local` 文件包含必要的 Firebase 配置：

```env
SERVICE_ACCOUNT_PROJECT_ID=your-project-id
SERVICE_ACCOUNT_CLIENT_EMAIL=your-service-account-email
SERVICE_ACCOUNT_PRIVATE_KEY="your-private-key"
```

