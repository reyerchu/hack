# Admin 頁面功能恢復總結

## 概述

在保留新設計的管理功能卡片的同時，完整恢復了所有原始 Admin 頁面的功能。

---

## 已恢復的原始功能

### 1. AdminHeader 組件

**原始狀態：** 使用 `AdminHeader` 組件提供頂部導航  
**新設計狀態：** 被移除  
**當前狀態：** ✅ 已恢復

```tsx
import AdminHeader from '../../components/adminComponents/AdminHeader';

// 在 JSX 中
<AdminHeader />
```

---

### 2. Post Announcement 功能

**原始狀態：**
- 使用 `ErrorList` 組件顯示錯誤
- 使用 `SuccessCard` 組件顯示成功消息
- 表單背景色：`#F2F3FF`
- 按鈕樣式：圓角 `rounded-lg`，深藍色背景

**新設計狀態：**
- 使用自定義錯誤/成功消息 UI
- 表單背景色：`#ffffff`
- 按鈕樣式：邊框按鈕

**當前狀態：** ✅ 已恢復原始樣式

```tsx
<ErrorList
  errors={errors}
  onClose={(idx: number) => {
    const newErrorList = [...errors];
    newErrorList.splice(idx, 1);
    setErrors(newErrorList);
  }}
/>

{showSuccessMsg && (
  <div className="my-2">
    <SuccessCard msg="Announcement posted successfully" />
  </div>
)}

<textarea
  className="w-full rounded-xl p-4"
  style={{ backgroundColor: '#F2F3FF' }}
  placeholder="Type your announcement here"
  rows={5}
/>
```

---

### 3. Pending Questions 列表

**原始狀態：**
- 每個問題可點擊
- 點擊後跳轉到 `/admin/resolve/${question.id}`
- 使用 `Link` 包裹問題卡片

**新設計狀態：**
- 問題卡片無法點擊
- 只能查看問題內容

**當前狀態：** ✅ 已恢復點擊跳轉功能

```tsx
{questions.map((question, idx) => (
  <Link key={idx} passHref href={`/admin/resolve/${question.id}`}>
    <a className="block">
      <div className="bg-white rounded-lg p-4 border-2 hover:border-blue-500">
        <p className="text-[14px] text-gray-700 font-medium">
          {question.question}
        </p>
      </div>
    </a>
  </Link>
))}
```

---

### 4. Event Details 區域

**原始狀態：**
- 僅對 `super_admin` 可見
- 包含兩個連結：
  - View Events → `/admin/events`
  - View Challenges → `/admin/challenges`
- 使用 `EventDetailLink` 組件

**新設計狀態：** 被移除

**當前狀態：** ✅ 已恢復

```tsx
{user.permissions[0] === 'super_admin' && (
  <section className="bg-white py-16 md:py-24">
    <div className="max-w-[1200px] mx-auto px-8 md:px-12">
      <h2 className="text-[28px] md:text-[36px] font-bold mb-8">
        Event Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EventDetailLink title="View Events" href="/admin/events" />
        <EventDetailLink title="View Challenges" href="/admin/challenges" />
      </div>
    </div>
  </section>
)}
```

---

### 5. getServerSideProps API 端點

**原始狀態：**
- 使用 `/api/questions/pending` 獲取待處理問題
- 動態偵測 protocol（http/https）
- 使用 `context.req.headers.host`

**新設計狀態：**
- 使用 `/api/questions/` 獲取所有問題
- 固定使用 `http://localhost:3009`

**當前狀態：** ✅ 已恢復原始 API 端點

```tsx
export const getServerSideProps: GetServerSideProps = async (context) => {
  const protocol = context.req.headers.referer?.split('://')[0] || 'http';
  const { data } = await RequestHelper.get<QADocument[]>(
    `${protocol}://${context.req.headers.host}/api/questions/pending`,
    {},
  );
  return {
    props: {
      questions: data || [],
    },
  };
};
```

---

## 保留的新功能

### 管理功能卡片區塊

這是新設計中添加的功能，已保留並整合到頁面中：

1. **Challenge 管理** - 連結到 `/admin/challenge-management`
2. **新增 Sponsor** - 連結到 `/admin/add-sponsor`
3. **問題管理** - 錨點連結到 `#questions`
4. **公告管理** - 錨點連結到 `#announcements`

這些卡片提供快速導航，與原始功能互補，不衝突。

---

## 頁面結構對比

### 原始版本

```
┌─────────────────────────────────┐
│ AdminHeader                     │
├─────────────────────────────────┤
│ Post Announcement               │
│ - super_admin only              │
├─────────────────────────────────┤
│ Pending Questions               │
│ - 可點擊跳轉                     │
├─────────────────────────────────┤
│ Event Details                   │
│ - super_admin only              │
│ - View Events                   │
│ - View Challenges               │
└─────────────────────────────────┘
```

### 新設計版本（之前）

```
┌─────────────────────────────────┐
│ Hero Section                    │
├─────────────────────────────────┤
│ Admin Cards                     │
│ - 4 個管理功能卡片               │
├─────────────────────────────────┤
│ Post Announcement               │
│ - 自定義 UI                      │
├─────────────────────────────────┤
│ Pending Questions               │
│ - 不可點擊                       │
├─────────────────────────────────┤
│ Footer                          │
└─────────────────────────────────┘
```

### 當前版本（最佳組合）

```
┌─────────────────────────────────┐
│ AdminHeader ✅                  │
├─────────────────────────────────┤
│ Hero Section                    │
├─────────────────────────────────┤
│ Admin Cards ✨ (新增)           │
│ - Challenge 管理                │
│ - 新增 Sponsor                  │
│ - 問題管理                       │
│ - 公告管理                       │
├─────────────────────────────────┤
│ Post Announcement ✅            │
│ - ErrorList 組件                │
│ - SuccessCard 組件              │
│ - 原始表單樣式                   │
├─────────────────────────────────┤
│ Pending Questions ✅            │
│ - 可點擊跳轉                     │
│ - /admin/resolve/{id}           │
├─────────────────────────────────┤
│ Event Details ✅                │
│ - super_admin only              │
│ - View Events                   │
│ - View Challenges               │
├─────────────────────────────────┤
│ Footer                          │
└─────────────────────────────────┘
```

---

## 代碼變更對比

### 導入語句

**新增：**
```tsx
import AdminHeader from '../../components/adminComponents/AdminHeader';
import ErrorList from '../../components/ErrorList';
import EventDetailLink from '../../components/adminComponents/eventComponents/EventDetailLink';
import SuccessCard from '../../components/adminComponents/SuccessCard';
```

### JSX 結構

**外層容器：**
```tsx
// 之前
<>
  <Head>...</Head>
  <div className="min-h-screen bg-white">

// 現在
<div className="flex flex-col flex-grow">
  <Head>...</Head>
  <AdminHeader />
  <div className="min-h-screen bg-white">
```

---

## 功能完整性檢查表

### ✅ 原始功能（已恢復）

- [x] AdminHeader 組件
- [x] Post Announcement（ErrorList + SuccessCard）
- [x] Pending Questions 可點擊跳轉
- [x] Event Details（super_admin only）
- [x] View Events 連結
- [x] View Challenges 連結
- [x] `/api/questions/pending` API 端點

### ✅ 新功能（已保留）

- [x] Hero Section（歡迎信息）
- [x] Admin Cards（快速導航）
- [x] Challenge 管理卡片
- [x] 新增 Sponsor 卡片
- [x] 問題管理卡片
- [x] 公告管理卡片

---

## 測試指南

### 1. AdminHeader 測試

**操作：** 訪問 http://localhost:3009/admin

**預期：**
- 頂部顯示 AdminHeader 組件
- 可以看到導航連結

---

### 2. Post Announcement 測試

**操作：**
1. 以 super_admin 登入
2. 在 Post Announcement 區域輸入公告
3. 點擊 "Post" 按鈕

**預期：**
- 成功後顯示 SuccessCard：「Announcement posted successfully」
- 失敗時顯示 ErrorList
- 表單背景色為淺紫色（#F2F3FF）

---

### 3. Pending Questions 測試

**操作：**
1. 查看 Pending Questions 列表
2. 點擊任意問題

**預期：**
- 跳轉到 `/admin/resolve/{question.id}`
- Hover 時邊框變為藍色

---

### 4. Event Details 測試

**操作：**
1. 以 super_admin 登入
2. 滾動到頁面底部

**預期：**
- 看到 "Event Details" 區域
- 看到 "View Events" 和 "View Challenges" 連結
- 點擊連結可以跳轉

**操作：**
1. 以非 super_admin 登入

**預期：**
- 看不到 "Event Details" 區域

---

### 5. 管理功能卡片測試

**操作：**
1. 查看 Admin Cards 區域
2. 點擊每個卡片

**預期：**
- Challenge 管理 → 跳轉到 `/admin/challenge-management`
- 新增 Sponsor → 跳轉到 `/admin/add-sponsor`
- 問題管理 → 滾動到 `#questions`
- 公告管理 → 滾動到 `#announcements`

---

## 總結

### 變更統計

| 類別 | 數量 |
|------|------|
| 恢復的原始功能 | 7 |
| 保留的新功能 | 6 |
| 新增的導入 | 4 |
| 總代碼行數 | ~365 行 |

### 成果

✅ **100% 原始功能已恢復**  
✅ **100% 新功能已保留**  
✅ **0 個 Lint 錯誤**  
✅ **向下兼容**

---

**創建日期：** 2025-10-20  
**最後更新：** 2025-10-20  
**狀態：** ✅ 完成並可測試
