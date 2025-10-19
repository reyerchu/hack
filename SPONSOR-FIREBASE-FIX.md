# Sponsor Dashboard Firebase 認證錯誤修復

## 🐛 問題描述

當用戶（如 alphareyer@gmail.com）嘗試訪問 Sponsor Dashboard 時，出現錯誤：

```
加載失敗
Cannot read properties of undefined (reading 'auth')
```

## 🔍 根本原因

代碼中使用了不可靠的方式獲取 Firebase 認證 token：

```typescript
// ❌ 錯誤的方式 - 可能未初始化
const token = await (window as any).firebase.auth().currentUser?.getIdToken();
```

這種方式存在問題：
1. `(window as any).firebase` 可能為 `undefined`
2. Firebase 可能尚未初始化
3. 沒有適當的錯誤處理

## ✅ 解決方案

### 1. 正確導入 Firebase

```typescript
import firebase from 'firebase/app';
import 'firebase/auth';
```

### 2. 創建安全的 Token 獲取函數

```typescript
async function getAuthToken(): Promise<string | null> {
  try {
    // 檢查 Firebase 是否已初始化
    if (!firebase.apps.length) {
      console.error('Firebase not initialized');
      return null;
    }

    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.error('No current user');
      return null;
    }

    const token = await currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}
```

### 3. 統一使用新函數

```typescript
// ✅ 正確的方式 - 帶錯誤處理
const token = await getAuthToken();
if (!token) {
  throw new Error('無法獲取認證令牌');
}
```

## 📝 修改的文件

### `lib/sponsor/hooks.ts`

修改了以下 5 個地方的 token 獲取邏輯：

1. **useSponsorTracks** - 獲取賽道列表
2. **useSubmission** - 獲取單個提交
3. **useSponsorNotifications** (fetchNotifications) - 獲取通知列表
4. **useSponsorNotifications** (markAsRead) - 標記通知為已讀
5. **useSponsorNotifications** (deleteNotification) - 刪除通知

## 🧪 測試步驟

### 1. 確保用戶有 Sponsor 權限

```bash
# 方法 1: 使用腳本
node scripts/set-sponsor-permission.js alphareyer@gmail.com

# 方法 2: 手動在 Firebase Console 中添加
# users collection → 找到用戶 → 編輯 permissions 欄位
```

### 2. 清除瀏覽器緩存

- 按 `Ctrl+Shift+Delete` (Windows/Linux) 或 `Cmd+Shift+Delete` (Mac)
- 清除緩存和 Cookies
- 或使用無痕模式測試

### 3. 重新登入

1. 登出當前帳號
2. 重新登入 alphareyer@gmail.com
3. 查看頂部導航是否出現「賛助商」鏈接

### 4. 訪問 Dashboard

**方法 A**: 點擊導航欄的「賛助商」鏈接

**方法 B**: 直接訪問 URL
- 開發環境: http://localhost:3009/sponsor/dashboard
- 生產環境: https://hackathon.com.tw/sponsor/dashboard

### 5. 驗證功能

應該看到：
- ✅ Dashboard 正常加載（無錯誤）
- ✅ 顯示統計卡片（我的賽道、項目提交等）
- ✅ 快速操作按鈕可點擊
- ✅ 如果有賽道，顯示賽道列表
- ✅ 如果沒有賽道，顯示友好提示

## 🔧 如果仍然出現錯誤

### 錯誤 1: "Firebase not initialized"

**原因**: Firebase 配置問題

**解決**:
1. 檢查 `.env.local` 文件是否存在
2. 確認 Firebase 配置正確
3. 檢查瀏覽器 Console 是否有 Firebase 初始化錯誤

### 錯誤 2: "No current user"

**原因**: 用戶未登入或 Session 過期

**解決**:
1. 登出並重新登入
2. 檢查 Firebase Authentication 設置
3. 確認用戶 email 已驗證

### 錯誤 3: "無法獲取認證令牌"

**原因**: Token 獲取失敗

**解決**:
1. 查看瀏覽器 Console 的詳細錯誤
2. 確認 Firebase Auth 服務正常運行
3. 檢查網絡連接
4. 嘗試刷新頁面

### 錯誤 4: "Failed to fetch tracks"

**原因**: API 請求失敗

**解決**:
1. 檢查後端服務是否運行
2. 確認 API 路由正確配置
3. 查看後端日誌
4. 檢查 Firestore 權限設置

## 📊 修復狀態

- [x] 修復 Firebase 初始化檢查
- [x] 添加錯誤處理
- [x] 統一 token 獲取邏輯
- [x] 添加中文錯誤訊息
- [x] 提交到 dev 分支
- [ ] 測試驗證（等待用戶確認）
- [ ] 合併到 main 分支

## 🎯 後續優化建議

1. **添加重試機制**: 如果 token 獲取失敗，自動重試
2. **添加 Loading 提示**: 在獲取 token 時顯示加載狀態
3. **統一錯誤處理**: 創建全局錯誤處理機制
4. **添加 Sentry 監控**: 追蹤生產環境錯誤

## 📚 相關文檔

- [SPONSOR-USER-SETUP.md](./SPONSOR-USER-SETUP.md) - 用戶設置指南
- [SPONSOR-IMPLEMENTATION-COMPLETE.md](./SPONSOR-IMPLEMENTATION-COMPLETE.md) - 完整實施報告
- [Firebase Auth 文檔](https://firebase.google.com/docs/auth)

## ✅ 驗收標準

測試通過條件：
- [ ] alphareyer@gmail.com 可以成功訪問 /sponsor/dashboard
- [ ] Dashboard 顯示正確的 UI（無錯誤）
- [ ] 可以導航到其他 sponsor 頁面
- [ ] 瀏覽器 Console 無錯誤
- [ ] 所有 API 請求成功

---

**修復日期**: 2025-10-19  
**修復者**: AI Assistant  
**提交**: dev 分支 (commit: a647cb0)

