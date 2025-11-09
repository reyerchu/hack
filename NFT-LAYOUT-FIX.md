# NFT 公開頁面 Layout 修復

## 問題

編譯錯誤：
```
Module not found: Can't resolve '../../components/Layout'
```

## 原因

此專案中沒有通用的 `Layout` 組件。不同頁面使用不同的佈局方式。

## 解決方案

### 修改前
```tsx
import Layout from '../../components/Layout';

return (
  <Layout>
    {/* content */}
  </Layout>
);
```

### 修改後
```tsx
import AppHeader from '../../components/AppHeader';
import HomeFooter from '../../components/homeComponents/HomeFooter';

return (
  <>
    <AppHeader />
    {/* content */}
    <HomeFooter />
  </>
);
```

## 佈局結構

現在 NFT 公開頁面使用與用戶頁面相同的佈局結構：

```
┌─────────────────────────────────────┐
│          AppHeader                  │  ← 網站主導航欄
├─────────────────────────────────────┤
│                                     │
│          Page Content               │  ← 頁面主要內容
│                                     │
├─────────────────────────────────────┤
│          HomeFooter                 │  ← 網站頁尾
└─────────────────────────────────────┘
```

## 修改的檔案

- `pages/nft/[campaignId].tsx`

## 測試

✅ 編譯成功  
✅ 無 linter 錯誤  
✅ 伺服器正常運行  
✅ 頁面可正常訪問

## 訪問頁面

```
http://localhost:3009/nft/[campaignId]
```

---

**修復時間**：2025-11-09  
**狀態**：✅ 已修復

