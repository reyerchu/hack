# 📱 RWA 黑客松 2025 - 报到系统使用说明

## 系统概述

这是一个简化的 QR code 报到系统，专为 RWA 黑客松 2025 设计。

### 功能特点
- ✅ 扫描参赛者 QR code 快速报到
- ✅ 自动记录报到时间
- ✅ 防止重复报到
- ✅ 实时报到统计
- ✅ 报到记录查询

## 系统架构

### 前端页面
1. **扫描页面**: `/admin/checkin`
   - 使用 html5-qrcode 库进行扫描
   - 支持手机和电脑摄像头
   - 实时反馈扫描结果

2. **统计页面**: `/admin/checkin-stats`
   - 显示报到率和统计数据
   - 查看所有报到记录
   - 支持搜索功能

### 后端数据
- **Collection**: `checkins`
- **数据结构**:
  ```typescript
  {
    userId: string          // 用户 ID
    userName: string        // 姓名
    userEmail: string       // 郵箱
    teamName?: string       // 團隊名稱（可選）
    checkedInAt: Timestamp  // 報到時間
    checkedInBy: string     // 處理人員
  }
  ```

### QR Code 格式
- 格式：`hack:{userId}`
- 示例：`hack:abc123def456`
- 来源：用户个人资料页面（`/profile`）

## 使用流程

### 管理员操作

#### 1. 访问扫描页面
```
开发环境: https://dev.hackathon.com.tw/admin/checkin
生产环境: https://hackathon.com.tw/admin/checkin
```

#### 2. 权限要求
系统会自动检查用户权限，需要以下任一权限：
- `admin`
- `super_admin`
- `organizer`

#### 3. 扫描流程
1. 打开扫描页面
2. 允许浏览器使用摄像头
3. 将参赛者的 QR code 对准扫描框
4. 系统自动识别并记录报到
5. 显示报到成功或错误信息

#### 4. 查看统计
访问统计页面：`/admin/checkin-stats`
- 查看总报到人数
- 查看报到率
- 搜索特定参赛者
- 导出报到记录

### 参赛者操作

参赛者无需任何操作，只需：
1. 登录账号
2. 进入个人资料页面 (`/profile`)
3. 在页面顶部显示个人 QR code
4. 报到时出示 QR code 给工作人员扫描

## 错误处理

### 常见错误及解决方案

#### 1. "無效的 QR code"
- **原因**: QR code 格式不正确
- **解决**: 确保扫描的是参赛者个人资料页面的 QR code

#### 2. "找不到用戶資料"
- **原因**: 用户 ID 在数据库中不存在
- **解决**: 检查用户是否已完成注册

#### 3. "此用戶已報到"
- **原因**: 用户已经报到过
- **解决**: 显示首次报到时间，无需重复操作

#### 4. 摄像头无法启动
- **原因**: 浏览器权限未授予
- **解决**: 在浏览器设置中允许网站使用摄像头

## 技术细节

### 依赖库
```json
{
  "html5-qrcode": "^2.x.x",
  "react-qr-reader": "^3.x.x",
  "qrcode": "^1.5.1"
}
```

### Firebase 集合
- `users`: 用户信息
- `team-registrations`: 团队信息
- `checkins`: 报到记录

### API 端点
报到系统直接使用 Firestore SDK，不需要额外的 API 端点。

## 部署说明

### 开发环境测试
```bash
cd /home/reyerchu/hack/hack-dev
npm run build
pm2 restart hackportal-dev
```

### 生产环境部署
```bash
cd /home/reyerchu/hack/hack
pm2 stop hackportal
pm2 delete hackportal
rm -rf .next
npm run build
pm2 start npm --name hackportal -- start -- -p 3008
```

## 安全考虑

1. **权限验证**: 只有管理员可以访问扫描和统计页面
2. **数据验证**: 所有 QR code 都会验证格式和用户存在性
3. **重复检查**: 自动防止重复报到
4. **日志记录**: 记录每次报到的操作人员

## 未来改进

可能的功能扩展：
- [ ] 离线模式支持
- [ ] 批量导出报到记录
- [ ] 报到提醒推送
- [ ] 多设备同步
- [ ] 报到数据分析
- [ ] 二维码打印功能

## 联系支持

如有问题，请联系技术团队。

---

**创建日期**: 2025-10-31  
**版本**: 1.0.0  
**作者**: RWA Hackathon Tech Team

