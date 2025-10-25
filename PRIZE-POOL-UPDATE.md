# 首頁獎項池更新說明

## ✅ 已完成的更新

### 📍 頁面位置
- Dev: http://localhost:3009/
- 文件: `/components/homeComponents/TSMCPrizePool.tsx`

---

## 📊 獎項更新內容

### 原有獎項 (1-6) - 已更新描述

| # | 賽道 | 原描述 | 新描述 |
|---|------|--------|--------|
| 01 | imToken 錢包 | 總獎金至少 2000 美元 | **總獎項價值 4000 美元** |
| 02 | 國泰金控 | 總獎金高達 60000 台幣 | **總獎項價值 2000 美元** |
| 03 | Oasis ROFL | 總獎金高達 2000 美元 | **總獎項價值 2000 美元** |
| 04 | Self 協議 | 總獎金高達 2000 美元 | **總獎項價值 2000 美元** |
| 05 | Zircuit 主鏈 | 總獎金高達 1000 美元 | **總獎項價值 1000 美元** |
| 06 | Sui 主鏈 | 總獎金高達 1000 美元 | **總獎項價值 1000 美元** |

### 新增獎項 (7-8)

| # | 賽道 | 描述 | 獎項 |
|---|------|------|------|
| **07** | **RWA 黑客松大會** | 最佳 RWA 應用獎項 | **總獎項價值 2200 美元** |
| **08** | **AWS** | 雲端技術與創新應用 | **總獎項價值 4500 美元的 Credits** |

---

## 📝 其他更新

### 主題數量
- **原描述:** "RWA 相關**六大**主題全面佈局"
- **新描述:** "RWA 相關**八大**主題全面佈局"

### 總獎項價值
- 維持顯示: "總獎項價值超過新台幣 **40 萬**"

---

## ⚠️ 需要準備的資源

### Logo 文件

兩個新增賽道需要 logo 圖片：

#### 1. RWA 黑客松大會 Logo
- **期望路徑:** `/public/sponsor-media/RWA-logo.svg`
- **格式:** SVG (推薦) 或 PNG
- **建議尺寸:** 寬度 120-220px，高度 40-50px
- **背景:** 透明背景

#### 2. AWS Logo
- **期望路徑:** `/public/sponsor-media/AWS-logo.svg`
- **格式:** SVG (推薦) 或 PNG
- **建議尺寸:** 寬度 120-220px，高度 40-50px
- **背景:** 透明背景
- **備註:** AWS 官方 logo 可從 [AWS 品牌資源](https://aws.amazon.com/brands/) 下載

---

## 📂 如何添加 Logo

### 方法 1: 直接上傳文件

```bash
cd /home/reyerchu/hack/hack-dev

# 將 logo 文件複製到正確位置
cp /path/to/your/RWA-logo.svg public/sponsor-media/
cp /path/to/your/AWS-logo.svg public/sponsor-media/
```

### 方法 2: 使用現有 Logo (臨時)

如果暫時沒有 logo，可以使用現有的作為占位符：

```bash
cd /home/reyerchu/hack/hack-dev/public/sponsor-media

# 使用 imToken logo 作為臨時占位符
cp imToken-logo.svg RWA-logo.svg
cp Oasis-logo.svg AWS-logo.svg
```

---

## 🔗 更新 URL

如果需要更新連結 URL，編輯 `TSMCPrizePool.tsx`：

```typescript
// 第 48-61 行
{
  name: 'RWA 黑客松大會',
  track: '最佳 RWA 應用獎項',
  prize: '總獎項價值 2200 美元',
  logo: '/sponsor-media/RWA-logo.svg',
  url: '#',  // ← 更新這裡為實際 URL
},
{
  name: 'AWS',
  track: '雲端技術與創新應用',
  prize: '總獎項價值 4500 美元的 Credits',
  logo: '/sponsor-media/AWS-logo.svg',
  url: 'https://aws.amazon.com/',  // ← 已設置
},
```

---

## 🎨 Logo 顯示邏輯

代碼會根據 logo 文件名自動調整大小：

```typescript
// 國泰金控 logo 使用較大尺寸
sponsor.logo.includes('Cathay') 
  ? 'h-10 w-auto object-contain max-w-[220px]'  // 較大
  : 'h-8 w-auto object-contain max-w-[120px]'   // 標準

// 如果需要為 AWS 或 RWA 使用較大尺寸，可以調整代碼
```

---

## 🚀 部署更改

### Dev 環境 (已完成)
```bash
cd /home/reyerchu/hack/hack-dev
git add components/homeComponents/TSMCPrizePool.tsx
git commit -m "feat: update prize pool information and add new tracks"
git push origin dev
pm2 restart hackportal-dev
```

### 添加 Logo 後
```bash
cd /home/reyerchu/hack/hack-dev
git add public/sponsor-media/RWA-logo.svg
git add public/sponsor-media/AWS-logo.svg
git commit -m "assets: add RWA and AWS logos"
git push origin dev
pm2 restart hackportal-dev
```

### Main 環境 (待 Logo 準備好後)
```bash
cd /home/reyerchu/hack/hack
git pull origin main
git cherry-pick <commit-hash>
git push origin main
npm run build
pm2 restart hackportal
```

---

## ✅ 驗證清單

訪問 http://localhost:3009/ 並檢查：

- [ ] 獎項池顯示 8 個賽道（原 6 個 + 新 2 個）
- [ ] 編號從 01 到 08
- [ ] 所有獎項描述都是 "總獎項價值 X 美元"
- [ ] RWA 黑客松大會顯示正確
- [ ] AWS 顯示 "總獎項價值 4500 美元的 Credits"
- [ ] 所有 logo 正確顯示（如果已添加）
- [ ] 點擊 logo 可以跳轉到正確的 URL
- [ ] 描述文字為 "八大主題"

---

## 📝 相關文件

| 文件 | 路徑 |
|------|------|
| 獎項池組件 | `/components/homeComponents/TSMCPrizePool.tsx` |
| Logo 目錄 | `/public/sponsor-media/` |
| 更新記錄 | 本文件 |

---

## 🔍 故障排除

### Logo 不顯示

**問題:** 新增的 RWA 或 AWS logo 沒有顯示

**解決方案:**
1. 確認文件存在:
   ```bash
   ls -la public/sponsor-media/RWA-logo.svg
   ls -la public/sponsor-media/AWS-logo.svg
   ```

2. 確認文件格式正確 (SVG/PNG)

3. 重啟服務:
   ```bash
   pm2 restart hackportal-dev
   ```

4. 清除瀏覽器緩存或使用無痕模式

### URL 點擊無效

**問題:** 點擊 RWA 黑客松大會 logo 沒有跳轉

**原因:** URL 設置為 `#` (占位符)

**解決方案:** 更新 `url` 字段為實際 URL

---

## 📊 完整獎項列表

訪問 http://localhost:3009/ 應該看到：

```
PRIZE POOL
活動獎項

RWA 相關八大主題全面佈局，總獎項價值超過新台幣 40 萬

01 [imToken Logo]    錢包
   平等 × 自由 × 有意義的數位生活
   總獎項價值 4000 美元

02 [國泰 Logo]       
   RWA 與金融實務的落地應用
   總獎項價值 2000 美元

03 [Oasis Logo]      ROFL（Run-time Offchain Logic）框架
   鏈下隱私保護，鏈上結果驗證
   總獎項價值 2000 美元

04 [Self Logo]       協議
   隱私保護下的自我主權金融
   總獎項價值 2000 美元

05 [Zircuit Logo]    主鏈
   安全即信任，保護一切 DeFi 流動
   總獎項價值 1000 美元

06 [Sui Logo]        主鏈
   高速體驗，重新定義資產上鏈
   總獎項價值 1000 美元

07 [RWA Logo]        RWA 黑客松大會
   最佳 RWA 應用獎項
   總獎項價值 2200 美元

08 [AWS Logo]        AWS
   雲端技術與創新應用
   總獎項價值 4500 美元的 Credits
```

---

**當前狀態:** ✅ 代碼已更新，等待 Logo 文件  
**下一步:** 添加 RWA-logo.svg 和 AWS-logo.svg（或使用現有 logo 作為臨時占位符）

