# 找隊友功能 - 快速测试指南

## ⚠️ 当前问题

服务器启动时遇到 **Firebase Admin SDK 未初始化** 错误。

这是正常的，因为需要正确的 Firebase 环境变量配置。

## 🔧 快速修复

### 选项 1: 使用现有 Firebase 配置（推荐）

如果项目已有 Firebase 配置，确保 `.env.local` 包含：

```bash
SERVICE_ACCOUNT_PROJECT_ID=your-existing-project-id
SERVICE_ACCOUNT_CLIENT_EMAIL=your-existing-service-account@...
SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n"
```

### 选项 2: 跳过 Firebase，直接测试前端

修改 `/lib/teamUp/db.ts` 临时返回模拟数据（仅用于UI测试）：

```typescript
// 在文件顶部添加
const MOCK_MODE = true;

// 在每个函数中添加模拟返回
export async function getTeamNeeds(params: GetNeedsQueryParams) {
  if (MOCK_MODE) {
    return {
      needs: [
        {
          id: 'mock1',
          ownerUserId: 'user1',
          ownerEmail: 'test@example.com',
          ownerName: '測試用戶',
          title: '尋找智能合約工程師',
          projectTrack: 'DeFi',
          projectStage: '已開始，需要隊友',
          brief: '我們正在開發一個去中心化借貸平台...',
          rolesNeeded: ['智能合約工程師', '前端工程師'],
          haveRoles: ['產品經理'],
          otherNeeds: '希望有 Solidity 經驗',
          contactHint: '加我 Telegram @testuser',
          isOpen: true,
          viewCount: 45,
          applicationCount: 8,
          isFlagged: false,
          isHidden: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
      hasMore: false,
    };
  }
  // ... 原有代码
}
```

## 🎯 快速测试清单（无需 Firebase）

### 1. 测试页面访问

```bash
# 启动服务器（如果还没启动）
npm run dev

# 在浏览器中访问：
http://localhost:3008/team-up
```

**预期结果**: 
- ✅ 页面正常加载
- ✅ 显示"找隊友"标题
- ✅ 显示搜索栏和筛选面板
- ⚠️ 可能显示"目前沒有找隊友需求"（如果数据库为空）

### 2. 测试导航菜单

在浏览器中访问首页：
```
http://localhost:3008/
```

**检查项**:
- ✅ 顶部导航栏中显示"找隊友"选项
- ✅ 点击可以跳转到 `/team-up`

### 3. 测试组件渲染

在浏览器开发者工具 Console 中执行：

```javascript
// 检查组件是否正确加载
document.querySelectorAll('[class*="teamUp"]').length > 0
```

**预期结果**: 返回 `true`

### 4. 测试响应式布局

1. 打开 `/team-up` 页面
2. 按 F12 打开开发者工具
3. 点击设备工具栏图标（Ctrl+Shift+M）
4. 切换不同设备视图

**检查项**:
- ✅ 移动端: 筛选面板可折叠
- ✅ 平板: 2列布局
- ✅ 桌面: 3列布局

## 📊 已完成功能概览

### ✅ M0: 前期准备（100%）
- 数据库 Schema 设计
- API 规格文档
- TypeScript 类型定义
- 常量配置
- 验证逻辑

### ✅ M1: 核心数据层（100%）
- 认证与权限模块
- 数据库操作（24个函数）
- 6个 API 端点
- PII 检测
- 敏感词检测

### ✅ M2: 浏览与查看功能（100%）
- TeamUpCard 组件
- TeamUpList 组件  
- FilterPanel 组件
- SearchBar 组件
- EmptyState 组件
- 列表页 `/team-up`
- 详情页 `/team-up/:id`
- SSR 支持

### 🚧 M3: 创建与编辑功能（50%）
- ✅ RoleSelector 组件
- ✅ NeedForm 组件
- ⏳ 创建页面
- ⏳ 编辑页面

### ⏳ M4-M7: 待实现
- M4: 申请与通知系统
- M5: 仪表板与管理功能
- M6: 安全加固与优化
- M7: 测试与上线

## 🎨 UI 预览

### 列表页预览
```
┌─────────────────────────────────────────────────────────┐
│ 找隊友                                      [+ 發布需求]  │
│ 瀏覽 0 個找隊友需求，找到最適合的團隊                      │
│                                                           │
│ [搜尋專案名稱或描述...]                      [🔍]          │
│                                                           │
│ ┌────────── 篩選條件 ──────────┐                         │
│ │ 排序: [最新發布 ▼]            │                         │
│ │ 狀態: [全部] [開放中] [已結束] │                         │
│ │ 賽道: [全部賽道 ▼]            │                         │
│ │ 階段: [全部階段 ▼]            │                         │
│ │ 角色: [智能合約] [前端] ...   │                         │
│ └───────────────────────────────┘                         │
│                                                           │
│ ┌────────┐  ┌────────┐  ┌────────┐                      │
│ │ 卡片 1 │  │ 卡片 2 │  │ 卡片 3 │                      │
│ └────────┘  └────────┘  └────────┘                      │
│                                                           │
│ ┌────────┐  ┌────────┐  ┌────────┐                      │
│ │ 卡片 4 │  │ 卡片 5 │  │ 卡片 6 │                      │
│ └────────┘  └────────┘  └────────┘                      │
│                                                           │
│               [載入更多]                                   │
└─────────────────────────────────────────────────────────┘
```

### 卡片预览
```
┌─────────────────────────────────────────┐
│ 尋找智能合約工程師                        │
│ [DeFi] [已開始，需要隊友 💡]               │
│                                          │
│ 需要角色：                                │
│ [智能合約工程師] [前端工程師] [+1]         │
│                                          │
│ 我們正在開發一個去中心化借貸平台...       │
│                                          │
│ 👥 1 位成員  👀 45 瀏覽  ✉️ 8 應徵        │
│ 2 小時前                                  │
│                                          │
│            [查看詳情]                      │
└─────────────────────────────────────────┘
```

## 📱 移动端测试

使用浏览器的设备模拟器测试：

1. **iPhone SE (375px)**
   - 1列布局
   - 筛选面板可折叠
   - 导航菜单汉堡图标

2. **iPad (768px)**
   - 2列布局
   - 筛选面板展开
   - 完整导航栏

3. **Desktop (1440px)**
   - 3列布局
   - 所有功能可见
   - 最佳体验

## 🔍 代码检查

运行以下命令确认代码无误：

```bash
# TypeScript 编译检查
npx tsc --noEmit

# Linter 检查
npm run lint

# 格式检查（如果配置了 Prettier）
npm run format:check
```

## 📋 下一步建议

### 立即可做（无需 Firebase）
1. ✅ 检查页面布局和样式
2. ✅ 测试响应式设计
3. ✅ 检查组件交互（筛选、搜索）
4. ✅ 验证导航菜单集成

### 需要 Firebase 配置后
1. ⏳ 测试 API 端点
2. ⏳ 创建测试数据
3. ⏳ 完整功能测试
4. ⏳ 性能测试

### 完成 M3-M7
1. ⏳ 完成创建和编辑页面
2. ⏳ 实现应徵功能
3. ⏳ 实现管理功能
4. ⏳ 安全加固
5. ⏳ 全面测试和上线

## 💬 反馈

如果遇到问题，请检查：

1. **页面无法访问**
   - 确认服务器正在运行
   - 检查端口是否正确（3008）
   - 查看控制台错误信息

2. **样式异常**
   - 清除浏览器缓存
   - 重启开发服务器
   - 检查 Tailwind CSS 是否正确加载

3. **Firebase 错误**
   - 参考 `team-up-deployment-guide.md`
   - 配置环境变量
   - 或使用模拟数据模式

---

**测试版本**: M0-M2 完成，M3 进行中  
**最后更新**: 2025-10-10

