# Admin 页面重新设计总结

## 概述

重新设计了 Super Admin 的管理界面，使其与 Home 页面的 TSMC 风格完全一致，并添加了 Challenge 管理和 Sponsor 新增功能。

---

## 完成的工作

### 1. 重新设计 `/admin` 页面

**文件：** `pages/admin/index.tsx`

**变更：**
- ✅ 完全重写，采用与 Home 页面一致的 TSMC 风格
- ✅ Hero Section：展示标题和欢迎信息
- ✅ 管理功能卡片：4 个主要功能的卡片式导航
- ✅ 公告管理：保留原有的公告发布功能
- ✅ 问题管理：展示待处理的参赛者问题

**风格特点：**
- 主色调：`#1a3a6e`（深蓝色）
- 字体大小：`text-[32px] md:text-[48px]` (H1), `text-[28px] md:text-[36px]` (H2)
- Section 间距：`py-16 md:py-24`
- Container：`max-w-[1200px] mx-auto px-8 md:px-12`
- 背景：白色和灰色交替（`bg-white`, `bg-gray-50`）

---

### 2. 创建 Add Sponsor 功能

#### 2.1 前端页面

**文件：** `pages/admin/add-sponsor.tsx` (15K)

**功能：**
- ✅ 完整的表单，包含所有必要字段：
  - Sponsor ID（唯一标识符）
  - 名称
  - 贊助等級（Title / Track / Venue / Prize / Other）
  - 描述
  - Logo URL
  - 官网 URL
  - 联络 Email
  - 联络人
- ✅ 权限检查（只有 super_admin 和 admin 可访问）
- ✅ 表单验证
- ✅ 成功/失败消息显示
- ✅ 提交成功后自动跳转回 Admin 页面
- ✅ 与 Home 页面风格完全一致

#### 2.2 后端 API

**文件：** `pages/api/admin/sponsors/create.ts` (3.5K)

**功能：**
- ✅ POST 请求创建新 sponsor
- ✅ 权限验证（super_admin / admin）
- ✅ 检查 Sponsor ID 唯一性
- ✅ 写入 `extended-sponsors` collection
- ✅ 自动记录活动日志到 `sponsor-activity-logs`
- ✅ 详细的 console.log 调试信息

**API 端点：** `POST /api/admin/sponsors/create`

**请求格式：**
```json
{
  "id": "sponsor-company-name",
  "name": "Company Name",
  "tier": "title",
  "description": "...",
  "logoUrl": "https://...",
  "websiteUrl": "https://...",
  "contactEmail": "contact@example.com",
  "contactName": "John Doe"
}
```

**响应格式：**
```json
{
  "success": true,
  "data": {
    "message": "成功新增 sponsor",
    "sponsor": {
      "id": "sponsor-company-name",
      "name": "Company Name",
      ...
    }
  }
}
```

---

### 3. 修复 User Profile API

**文件：** `pages/api/user/profile.ts` (3.7K)

**问题：** Challenge Management 页面依赖此 API 进行权限检查，但原本不存在（404）

**功能：**
- ✅ GET 请求获取当前用户的个人资料和权限
- ✅ 支持多种数据结构（扁平 `user.permissions` 和嵌套 `user.user.permissions`）
- ✅ 从 `registrations` 或 `users` collection 查找用户
- ✅ 统一返回格式
- ✅ 详细的调试日志

**API 端点：** `GET /api/user/profile`

**响应格式：**
```json
{
  "success": true,
  "data": {
    "id": "user-doc-id",
    "email": "user@example.com",
    "firstName": "...",
    "lastName": "...",
    "permissions": ["super_admin"],
    "user": {
      ...
    }
  }
}
```

---

### 4. 更新 Challenge Management 页面

**文件：** `pages/admin/challenge-management.tsx` (17K)

**变更：**
- ✅ 与 Home 页面风格一致
- ✅ 添加 Hero Section（标题、返回按钮）
- ✅ 统一的 Section 布局（白色和灰色背景交替）
- ✅ 更新字体大小和间距
- ✅ 添加详细的调试日志
- ✅ 修复 API 响应解析逻辑（支持 `data.data` 和 `data` 两种格式）

---

## 风格规范

### 颜色

| 用途 | 颜色 | Hex Code |
|------|------|----------|
| 主色调 | 深蓝色 | `#1a3a6e` |
| 背景（主要） | 白色 | `#ffffff` |
| 背景（次要） | 浅灰色 | `#f9fafb` / `bg-gray-50` |
| 边框 | 灰色 | `#e5e7eb` |
| 文本（主要） | 深灰色 | `#374151` |
| 文本（次要） | 灰色 | `#6b7280` |
| 成功 | 绿色 | `#166534` / `#dcfce7` (bg) |
| 错误 | 红色 | `#991b1b` / `#fee2e2` (bg) |

### 字体大小

| 元素 | 类名 | 备注 |
|------|------|------|
| H1 | `text-[32px] md:text-[48px]` | 页面主标题 |
| H2 | `text-[28px] md:text-[36px]` | Section 标题 |
| H3 | `text-[20px] md:text-[24px]` | 卡片标题 |
| Body (大) | `text-[18px] md:text-[24px]` | 副标题 |
| Body (中) | `text-[16px]` | 表单输入 |
| Body (小) | `text-[14px]` | 正文、按钮 |
| Caption | `text-[12px]` | 提示文字 |

### 间距

| 用途 | 类名 | 像素 |
|------|------|------|
| Section (纵向) | `py-16 md:py-24` | 64px / 96px |
| Container (横向) | `px-8 md:px-12` | 32px / 48px |
| Container (宽度) | `max-w-[1200px] mx-auto` | 1200px |
| 卡片间距 | `gap-6` | 24px |
| 元素间距 | `mb-6` / `mb-8` | 24px / 32px |

### 按钮样式

```tsx
<button
  className="border-2 px-8 py-3 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300"
  style={{
    borderColor: '#1a3a6e',
    color: '#1a3a6e',
    backgroundColor: 'transparent',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = '#1a3a6e';
    e.currentTarget.style.color = 'white';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = '#1a3a6e';
  }}
>
  按钮文字
</button>
```

---

## 页面结构

### Admin Dashboard (`/admin`)

```
┌─────────────────────────────────────────┐
│ Hero Section (bg-white)                 │
│ - 标题：管理儀表板                        │
│ - 副标题：Super Admin Dashboard         │
│ - 欢迎信息                               │
├─────────────────────────────────────────┤
│ Admin Cards Section (bg-gray-50)        │
│ - Challenge 管理                         │
│ - 新增 Sponsor                           │
│ - 问题管理                               │
│ - 公告管理                               │
├─────────────────────────────────────────┤
│ Announcements Section (bg-white)        │
│ - 公告发布表单                           │
│ - 成功/错误消息                          │
├─────────────────────────────────────────┤
│ Questions Section (bg-gray-50)          │
│ - 待处理问题列表                         │
├─────────────────────────────────────────┤
│ Footer (bg-white)                       │
│ - 版权信息                               │
└─────────────────────────────────────────┘
```

### Challenge Management (`/admin/challenge-management`)

```
┌─────────────────────────────────────────┐
│ Header Section (bg-white)               │
│ - 返回按钮                               │
│ - 标题：Challenge 管理                   │
│ - 副标题                                 │
├─────────────────────────────────────────┤
│ Table Section (bg-gray-50)              │
│ - Challenges 列表表格                    │
│ - 重新分配按钮                           │
├─────────────────────────────────────────┤
│ Modal (当点击重新分配)                    │
│ - 选择 Sponsor 下拉选单                  │
│ - 确认/取消按钮                          │
└─────────────────────────────────────────┘
```

### Add Sponsor (`/admin/add-sponsor`)

```
┌─────────────────────────────────────────┐
│ Header Section (bg-white)               │
│ - 返回按钮                               │
│ - 标题：新增 Sponsor                     │
│ - 副标题                                 │
├─────────────────────────────────────────┤
│ Form Section (bg-gray-50)               │
│ - Sponsor ID 输入框                      │
│ - 名称输入框                             │
│ - 等级下拉选单                           │
│ - 描述文本框                             │
│ - Logo URL 输入框                        │
│ - 官网 URL 输入框                        │
│ - 联络 Email 输入框                      │
│ - 联络人输入框                           │
│ - 取消/提交按钮                          │
└─────────────────────────────────────────┘
```

---

## 数据流

### Add Sponsor 流程

```
┌──────────────┐       POST /create        ┌──────────────┐
│              │ ──────────────────────→   │              │
│   Frontend   │                            │   Backend    │
│   (Form)     │ ←──────────────────────   │   (API)      │
│              │       {success: true}      │              │
└──────────────┘                            └──────────────┘
       │                                           │
       │ 1. 填写表单                                │
       │ 2. 点击提交                                │
       │ 3. 发送 POST 请求                          │
       │                                           │
       │                                           │ 1. 验证 Token
       │                                           │ 2. 检查权限
       │                                           │ 3. 验证 ID 唯一性
       │                                           │ 4. 写入 Firestore
       │                                           │ 5. 记录活动日志
       │                                           │ 6. 返回成功
       │ 4. 显示成功消息                            │
       │ 5. 2 秒后跳转到 /admin                     │
       │                                           │
```

### User Profile 流程

```
┌──────────────┐       GET /profile       ┌──────────────┐
│              │ ──────────────────────→  │              │
│   Frontend   │                           │   Backend    │
│   (Page)     │ ←──────────────────────  │   (API)      │
│              │       {permissions: []}   │              │
└──────────────┘                           └──────────────┘
       │                                          │
       │ 1. 页面加载                               │
       │ 2. 获取 Firebase Token                   │
       │ 3. 发送 GET 请求                          │
       │                                          │
       │                                          │ 1. 验证 Token
       │                                          │ 2. 从 registrations 查找
       │                                          │ 3. 或从 users 查找
       │                                          │ 4. 解析 permissions
       │                                          │ 5. 返回统一格式
       │ 4. 检查权限                               │
       │ 5. 显示页面或跳转                         │
       │                                          │
```

---

## 测试清单

### Admin Dashboard

- [ ] 访问 http://localhost:3009/admin
- [ ] 验证页面样式与 Home 页面一致
- [ ] 点击「Challenge 管理」卡片，跳转到 `/admin/challenge-management`
- [ ] 点击「新增 Sponsor」卡片，跳转到 `/admin/add-sponsor`
- [ ] 发布公告功能正常工作
- [ ] 查看待处理问题列表

### Challenge Management

- [ ] 访问 http://localhost:3009/admin/challenge-management
- [ ] 页面样式与 Home 页面一致
- [ ] 点击「返回管理儀表板」按钮，跳转到 `/admin`
- [ ] 查看 challenges 列表
- [ ] 点击「重新分配」按钮，打开 Modal
- [ ] 选择新的 sponsor
- [ ] 点击「確認分配」，成功分配
- [ ] 列表自动更新

### Add Sponsor

- [ ] 访问 http://localhost:3009/admin/add-sponsor
- [ ] 页面样式与 Home 页面一致
- [ ] 点击「返回管理儀表板」按钮，跳转到 `/admin`
- [ ] 填写表单（所有字段）
- [ ] 点击「新增 Sponsor」，成功创建
- [ ] 显示「✅ Sponsor 新增成功！」消息
- [ ] 2 秒后自动跳转回 `/admin`
- [ ] 在 Firestore 中验证 sponsor 已创建
- [ ] 在 `sponsor-activity-logs` 中验证日志已记录

### 权限测试

- [ ] 以普通用户登入，访问 `/admin`，应该显示「未授權」
- [ ] 以 super_admin 登入，访问 `/admin`，应该正常显示
- [ ] 以 admin 登入，访问 `/admin`，应该正常显示

---

## 已知问题

无

---

## 下一步

1. ⚠️ Judge 分配管理（参见 `SUPER-ADMIN-FEATURES-ROADMAP.md`）
2. ⚠️ 批量操作功能
3. ⚠️ 数据导出功能
4. ⚠️ 统计报表

---

**创建日期：** 2025-10-20  
**最后更新：** 2025-10-20  
**状态：** ✅ 已完成并可测试
