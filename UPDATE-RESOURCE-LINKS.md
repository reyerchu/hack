# 更新賽道挑戰頁面的資源連結

## 📍 位置

頁面：`https://hackathon.com.tw/tracks-challenges` (Dev: `http://localhost:3009/tracks-challenges`)

已添加兩個資源連結按鈕：
1. **所有賽道說明文件** (藍色按鈕 - 文件圖標)
2. **所有賽道工作坊錄影** (橘色按鈕 - 播放圖標)

---

## 🔗 如何更新連結 URL

### 文件位置
`/home/reyerchu/hack/hack-dev/pages/tracks-challenges.tsx`

### 當前狀態
兩個按鈕的 `href` 都是 `"#"` (占位符)

### 更新步驟

#### 1. 打開文件
```bash
cd /home/reyerchu/hack/hack-dev
nano pages/tracks-challenges.tsx
# 或使用你喜歡的編輯器
```

#### 2. 找到按鈕代碼
搜索 "所有賽道說明文件" 或定位到第 159-211 行

#### 3. 更新第一個按鈕 URL（說明文件）
找到：
```tsx
<a
  href="#"  // ← 更新這裡
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
  style={{ backgroundColor: '#1a3a6e' }}
>
```

替換為實際的 URL，例如：
```tsx
<a
  href="https://drive.google.com/drive/folders/YOUR_FOLDER_ID"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
  style={{ backgroundColor: '#1a3a6e' }}
>
```

#### 4. 更新第二個按鈕 URL（工作坊錄影）
找到：
```tsx
<a
  href="#"  // ← 更新這裡
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
  style={{ backgroundColor: '#d97706' }}
>
```

替換為實際的 URL，例如：
```tsx
<a
  href="https://youtube.com/playlist?list=YOUR_PLAYLIST_ID"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
  style={{ backgroundColor: '#d97706' }}
>
```

---

## 🚀 部署更改

### Dev 環境
```bash
cd /home/reyerchu/hack/hack-dev
git add pages/tracks-challenges.tsx
git commit -m "chore: update resource links URLs"
git push origin dev
pm2 restart hackportal-dev
```

### Main 環境（生產環境）
```bash
cd /home/reyerchu/hack/hack
git pull origin main
git cherry-pick <commit-hash>
git push origin main
npm run build
pm2 restart hackportal
```

---

## 🎨 按鈕樣式

### 第一個按鈕（說明文件）
- 顏色：深藍色 (`#1a3a6e`)
- 圖標：文件圖標
- 文字：所有賽道說明文件

### 第二個按鈕（工作坊錄影）
- 顏色：橘色 (`#d97706`)
- 圖標：播放圖標
- 文字：所有賽道工作坊錄影

---

## 📱 響應式設計

按鈕會自動適應不同螢幕尺寸：
- **桌面版：** 兩個按鈕並排顯示
- **手機版：** 兩個按鈕垂直堆疊

---

## ✅ 驗證

更新後訪問：
- Dev: http://localhost:3009/tracks-challenges
- Main: https://hackathon.com.tw/tracks-challenges

檢查：
1. ✅ 兩個按鈕顯示在頁面頂部（標題下方）
2. ✅ 點擊按鈕會在新分頁打開正確的 URL
3. ✅ 按鈕在手機上正確顯示
4. ✅ Hover 效果正常（陰影和透明度變化）

---

## 🔧 快速更新指令（使用 sed）

如果你有 URL，可以用這個快速更新：

```bash
cd /home/reyerchu/hack/hack-dev

# 更新說明文件 URL
sed -i 's|href="#"|href="YOUR_DOCUMENT_URL"|' pages/tracks-challenges.tsx

# 或使用更精確的方式（推薦）
# 手動編輯以確保只更新正確的連結
```

**建議：** 手動編輯以確保準確性。

---

## 📋 常見 URL 格式

### Google Drive 資料夾
```
https://drive.google.com/drive/folders/YOUR_FOLDER_ID
```

### YouTube 播放列表
```
https://youtube.com/playlist?list=YOUR_PLAYLIST_ID
```

### Notion 頁面
```
https://www.notion.so/YOUR_PAGE_ID
```

### 其他雲端硬碟（Dropbox, OneDrive 等）
確保連結設置為「任何人都可以查看」

---

## 📝 提供 URL

請提供以下 URL：

1. **所有賽道說明文件 URL:**
   ```
   [等待提供]
   ```

2. **所有賽道工作坊錄影 URL:**
   ```
   [等待提供]
   ```

提供後，我會幫你更新！

---

**當前狀態：** ✅ 按鈕已添加（使用占位符 URL）  
**需要：** 🔗 實際的資源 URL

