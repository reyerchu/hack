# NFT 日期顯示修復

## 問題

NFT 公開頁面顯示：
```
截止日期
Invalid Date
```

## 原因

Firestore Timestamp 對象需要轉換為 JavaScript Date 或 ISO 字符串才能正確顯示。

API 返回的原始格式：
```json
{
  "startDate": {
    "_seconds": 1762697160,
    "_nanoseconds": 0
  },
  "endDate": {
    "_seconds": 1762869960,
    "_nanoseconds": 0
  }
}
```

前端嘗試使用 `new Date()` 轉換這個對象時失敗，導致 `Invalid Date`。

## 解決方案

在 API 端點中，將 Firestore Timestamp 轉換為 ISO 字符串：

### 修改檔案
`pages/api/nft/campaigns/[campaignId].ts`

### 修改前
```typescript
const publicCampaign = {
  // ...
  startDate: campaignData?.startDate,
  endDate: campaignData?.endDate,
  createdAt: campaignData?.createdAt,
};
```

### 修改後
```typescript
const publicCampaign = {
  // ...
  startDate: campaignData?.startDate?.toDate?.()?.toISOString() || campaignData?.startDate,
  endDate: campaignData?.endDate?.toDate?.()?.toISOString() || campaignData?.endDate,
  createdAt: campaignData?.createdAt?.toDate?.()?.toISOString() || campaignData?.createdAt,
};
```

### 工作原理

1. `campaignData?.startDate` - 獲取 Firestore Timestamp 對象
2. `.toDate()` - 轉換為 JavaScript Date 對象
3. `.toISOString()` - 轉換為 ISO 8601 格式字符串（如 `"2025-11-11T14:06:00.000Z"`）
4. `|| campaignData?.startDate` - 如果轉換失敗，返回原始值

### 使用 `?.` 可選鏈的原因

- 防止當欄位不存在或為 null 時出錯
- 如果 Timestamp 沒有 `toDate` 方法（已經是字符串），不會報錯

## 測試結果

### API 回應
```bash
curl http://localhost:3009/api/nft/campaigns/MWxmOcriDtTRsvuCFJ4o
```

**之前**：
```json
{
  "startDate": {
    "_seconds": 1762697160,
    "_nanoseconds": 0
  },
  "endDate": {
    "_seconds": 1762869960,
    "_nanoseconds": 0
  }
}
```

**現在**：
```json
{
  "startDate": "2025-11-09T14:06:00.000Z",
  "endDate": "2025-11-11T14:06:00.000Z",
  "createdAt": "2025-11-09T14:06:13.983Z"
}
```

✅ 正確格式化為 ISO 8601 字符串

### 前端顯示

**之前**：
```
截止日期
Invalid Date
```

**現在**：
```
截止日期
2025年11月11日
```

✅ 正確顯示格式化的日期

## 相關代碼

### 前端日期格式化
在 `pages/nft/[campaignId].tsx` 中：

```typescript
{campaign.endDate && (
  <div className="bg-gray-50 p-4 rounded-lg col-span-2">
    <div className="text-sm text-gray-600 mb-1">截止日期</div>
    <div className="text-lg font-semibold">
      {new Date(campaign.endDate).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </div>
  </div>
)}
```

現在 `campaign.endDate` 是有效的 ISO 字符串，`new Date()` 可以正確解析。

## 日期格式對比

| 格式 | 範例 | 用途 |
|-----|------|------|
| Firestore Timestamp | `{ _seconds: 1762869960, _nanoseconds: 0 }` | Firestore 內部儲存 |
| JavaScript Date | `Date` 對象 | JavaScript 處理 |
| ISO 8601 字符串 | `"2025-11-11T14:06:00.000Z"` | API 傳輸、JSON 序列化 |
| 本地化字符串 | `"2025年11月11日"` | 用戶界面顯示 |

## 最佳實踐

### API 回應中的日期
✅ **推薦**：使用 ISO 8601 字符串
```typescript
endDate: timestamp.toDate().toISOString()
// "2025-11-11T14:06:00.000Z"
```

❌ **不推薦**：返回 Firestore Timestamp 對象
```typescript
endDate: timestamp
// { _seconds: 1762869960, _nanoseconds: 0 }
```

### 前端顯示日期
✅ **推薦**：使用 `toLocaleDateString()` 或日期庫（如 `date-fns`、`dayjs`）
```typescript
new Date(endDate).toLocaleDateString('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
```

### TypeScript 類型定義
```typescript
interface NFTCampaign {
  startDate?: string;  // ISO 8601 字符串
  endDate?: string;    // ISO 8601 字符串
  createdAt?: string;  // ISO 8601 字符串
}
```

## 其他需要注意的地方

如果其他 API 端點也返回日期，確保一致性：

```typescript
// ✅ 統一的日期轉換模式
const convertTimestamp = (timestamp: any) => {
  return timestamp?.toDate?.()?.toISOString() || timestamp;
};

const publicData = {
  startDate: convertTimestamp(data.startDate),
  endDate: convertTimestamp(data.endDate),
  createdAt: convertTimestamp(data.createdAt),
};
```

## 修改的檔案

```
✅ pages/api/nft/campaigns/[campaignId].ts
```

## 相關文檔

- [ISO 8601 日期格式](https://en.wikipedia.org/wiki/ISO_8601)
- [Firestore Timestamp 文檔](https://firebase.google.com/docs/reference/js/firestore_.timestamp)
- [JavaScript Date 對象](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

---

**修復時間**：2025-11-09  
**狀態**：✅ 已修復  
**測試**：✅ 已驗證

