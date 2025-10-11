# Firestore 索引配置

## 🔥 必需的索引

"找队友"功能需要以下 Firestore 复合索引才能正常运行。

---

## 📋 索引列表

### 1. teamNeeds 集合 - 基础查询索引

**用途**: 支持按更新时间排序的需求列表查询

**字段**:
- `isHidden` (升序)
- `updatedAt` (降序)

**创建链接**:
```
https://console.firebase.google.com/v1/r/project/hackathon-rwa-nexus/firestore/indexes?create_composite=ClVwcm9qZWN0cy9oYWNrYXRob24tcndhLW5leHVzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90ZWFtTmVlZHMvaW5kZXhlcy9fEAEaDAoIaXNIaWRkZW4QARoNCgl1cGRhdGVkQXQQAhoMCghfX25hbWVfXxAC
```

---

## 🚀 快速创建索引

### 方法 1: 使用错误消息中的链接（推荐）

1. 当你在浏览器中看到错误时，打开浏览器控制台（F12）
2. 找到错误消息中的 `https://console.firebase.google.com/...` 链接
3. 点击链接，会自动打开 Firebase Console 并预填索引配置
4. 点击"创建索引"按钮
5. 等待索引构建完成（通常需要几分钟）

### 方法 2: 手动创建

1. 打开 Firebase Console: https://console.firebase.google.com/
2. 选择项目: `hackathon-rwa-nexus`
3. 进入 Firestore Database
4. 点击"索引"标签
5. 点击"创建复合索引"
6. 配置如下：
   - **集合**: `teamNeeds`
   - **字段 1**: `isHidden`, 升序
   - **字段 2**: `updatedAt`, 降序
7. 点击"创建"

### 方法 3: 使用 Firebase CLI（高级）

创建 `firestore.indexes.json` 文件：

```json
{
  "indexes": [
    {
      "collectionGroup": "teamNeeds",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "isHidden",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "updatedAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

然后运行：
```bash
firebase deploy --only firestore:indexes
```

---

## ⏱️ 索引构建时间

- **小型数据库** (< 1000 文档): 几秒钟
- **中型数据库** (1000-10000 文档): 1-5 分钟
- **大型数据库** (> 10000 文档): 5-30 分钟

在索引构建期间，相关查询会失败。构建完成后，查询会自动开始工作。

---

## 🧪 验证索引已创建

### 检查 Firebase Console

1. 进入 Firebase Console > Firestore > 索引
2. 查看索引列表
3. 确认状态为"已启用"（绿色勾）

### 测试 API

```bash
# 运行测试脚本
./test-api.sh

# 或手动测试
curl http://localhost:3008/api/team-up/needs
```

**预期结果**: 
- ✅ 返回 `{"success":true,"data":[],...}`
- ✅ 不再看到 "The query requires an index" 错误

---

## 🔍 为什么需要索引？

### Firestore 查询限制

Firestore 对复杂查询有以下限制：

1. **不等式过滤器 + 排序**: 需要索引
2. **多字段排序**: 需要索引
3. **范围查询 + 排序**: 需要索引

### 我们的查询

```typescript
// lib/teamUp/db.ts
query = query
  .where('isHidden', '==', false)  // 1. 过滤条件
  .orderBy('updatedAt', 'desc');   // 2. 排序
```

这个查询涉及：
- 1 个过滤字段 (`isHidden`)
- 1 个排序字段 (`updatedAt`)

Firestore 无法自动优化这种查询，所以需要手动创建复合索引。

---

## 📝 未来可能需要的索引

随着功能扩展，可能需要添加更多索引：

### 按赛道筛选 + 排序
```
isHidden (升序) + projectTrack (升序) + updatedAt (降序)
```

### 按阶段筛选 + 排序
```
isHidden (升序) + projectStage (升序) + updatedAt (降序)
```

### 按开放状态筛选 + 排序
```
isHidden (升序) + isOpen (升序) + updatedAt (降序)
```

### 按浏览次数排序
```
isHidden (升序) + viewCount (降序)
```

### 按申请数排序
```
isHidden (升序) + applicationCount (降序)
```

**注意**: 这些索引现在还不需要创建，只有当对应的查询被使用时才需要。

---

## 🐛 故障排查

### 问题: 点击链接后显示"权限被拒绝"

**解决方案**: 
- 确保你的 Google 账号有项目访问权限
- 需要"所有者"或"编辑者"角色才能创建索引

### 问题: 索引创建失败

**可能原因**:
1. 项目配额不足
2. 网络连接问题
3. Firebase 服务暂时不可用

**解决方案**: 
- 等待几分钟后重试
- 检查 Firebase 状态: https://status.firebase.google.com/

### 问题: 索引已创建但查询仍失败

**解决方案**:
1. 等待索引构建完成（检查状态是否为"已启用"）
2. 清除浏览器缓存
3. 重启开发服务器

---

## ✅ 检查清单

完成索引配置后：

- [ ] 在 Firebase Console 中确认索引状态为"已启用"
- [ ] 运行 `./test-api.sh` 确认 API 正常
- [ ] 访问 `http://localhost:3008/team-up` 确认页面正常加载
- [ ] 尝试创建一个测试需求
- [ ] 确认需求出现在列表中

---

## 📚 相关文档

- [Firestore 索引文档](https://firebase.google.com/docs/firestore/query-data/indexing)
- [复合索引限制](https://firebase.google.com/docs/firestore/query-data/index-overview#composite_indexes)
- [Firebase CLI 索引管理](https://firebase.google.com/docs/firestore/query-data/indexing#use_the_firebase_cli)

---

**最后更新**: 2025/10/10

