# 修復 OAuth 測試用戶問題

## 當前狀態
✅ 用戶類型已設置為：**外部 (External)**
❌ 但只有 defintek.io 用戶可以使用

---

## 問題原因

應用程式目前處於「**測試中 (Testing)**」狀態，需要：
- **選項 A：** 添加測試用戶
- **選項 B：** 發布應用程式

---

## 🚀 快速解決方案

### 檢查發布狀態

1. 前往：https://console.cloud.google.com/apis/credentials/consent
2. 查看「**發布狀態**」

---

## 選項 A：添加測試用戶（推薦 - 立即生效）

### 適用情況：
- 發布狀態：**測試中 (Testing)**
- 參與者人數：**≤ 100 人**
- 需要：**立即使用**

### 步驟：

#### 1. 前往測試使用者設置
```
https://console.cloud.google.com/apis/credentials/consent
```

#### 2. 向下滾動到「測試使用者」區塊

#### 3. 點擊「+ ADD USERS」按鈕

#### 4. 輸入所有需要使用的 Gmail 地址

**格式：每行一個 Gmail**
```
participant1@gmail.com
participant2@gmail.com
participant3@gmail.com
organizer@gmail.com
judge1@gmail.com
...
```

#### 5. 點擊「儲存」

#### 6. ✅ 完成！立即生效

---

## 選項 B：發布應用程式（無限用戶）

### 適用情況：
- 參與者人數：**> 100 人**
- 或希望：**任何人都可以使用**

### 步驟：

#### 1. 前往 OAuth 同意畫面
```
https://console.cloud.google.com/apis/credentials/consent
```

#### 2. 點擊「PUBLISH APP」（發布應用程式）按鈕

#### 3. 確認發布

#### 4. 狀態會變更為：「In production」（正式版）

#### 5. ✅ 完成！所有 Gmail 用戶都可以使用

### ⚠️ 注意：
- 用戶仍會看到「此應用程式尚未經過 Google 驗證」警告
- 這是正常的，除非您提交安全性審核
- 用戶可以點擊「進階」→「前往 hackathon.com.tw (不安全)」繼續

---

## 📋 收集參與者 Gmail 的方法

### 方法 1：從 Firestore 導出

如果您的註冊系統有 email 資料：

```javascript
// 在 Firebase Console 或使用腳本
// 導出所有 registrations 的 preferredEmail
```

### 方法 2：建立 Google Form

1. 建立表單：https://forms.google.com
2. 問題：「請提供您的 Gmail 地址（用於 Google Calendar 整合）」
3. 分享給所有參與者
4. 導出回應為 CSV
5. 複製所有 Gmail 地址
6. 貼到 Google Cloud Console 的測試用戶欄位

### 方法 3：在黑客松網站上收集

建立一個簡單的表單頁面：

```typescript
// pages/calendar-signup.tsx
export default function CalendarSignup() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 儲存到 Firestore
    await addDoc(collection(db, 'calendar-signups'), {
      email,
      timestamp: serverTimestamp()
    });
    setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">
        Google Calendar 整合申請
      </h1>
      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            請提供您的 Gmail 地址：
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
              placeholder="your-email@gmail.com"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded mt-4"
          >
            提交
          </button>
        </form>
      ) : (
        <div className="bg-green-100 p-4 rounded">
          ✅ 已提交！我們會盡快將您添加為測試用戶。
        </div>
      )}
    </div>
  );
}
```

### 方法 4：使用現有註冊資料

如果註冊時已經收集 email：

```javascript
// scripts/export-emails-for-oauth.js
const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp();
const db = admin.firestore();

async function exportEmails() {
  const snapshot = await db.collection('registrations').get();
  const emails = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.user?.preferredEmail) {
      emails.push(data.user.preferredEmail);
    }
  });
  
  // 去重
  const uniqueEmails = [...new Set(emails)];
  
  // 輸出為一行一個的格式
  fs.writeFileSync('oauth-test-users.txt', uniqueEmails.join('\n'));
  
  console.log(`✅ 導出 ${uniqueEmails.length} 個 email`);
  console.log('檔案位置: oauth-test-users.txt');
  console.log('\n複製內容並貼到 Google Cloud Console 的測試用戶欄位');
}

exportEmails().catch(console.error);
```

運行：
```bash
cd scripts
node export-emails-for-oauth.js
cat oauth-test-users.txt
# 複製所有內容並貼到 Google Cloud Console
```

---

## 🔧 用戶端：清除舊授權

**重要！** 已經嘗試過授權但失敗的用戶需要：

### 步驟：

1. 前往：https://myaccount.google.com/permissions

2. 找到您的應用程式（可能名為「RWA Hackathon」或「hackathon-com-tw」）

3. 點擊應用程式

4. 點擊「移除存取權」

5. 重新訪問 https://hackathon.com.tw/schedule

6. 點擊「連接 Google Calendar」

---

## ✅ 驗證設置

### 確認清單：

測試用戶添加完成後，請確認：

- [ ] OAuth 同意畫面 → 用戶類型 = **外部 (External)** ✅
- [ ] 發布狀態 = **測試中 (Testing)** 或 **In production**
- [ ] 測試使用者 → 已添加所有需要的 Gmail（如果是測試狀態）
- [ ] 範圍包含：
  - [ ] `https://www.googleapis.com/auth/calendar.readonly`
  - [ ] `https://www.googleapis.com/auth/calendar.events`
- [ ] 已授權網域包含：`hackathon.com.tw`

---

## 🎯 推薦方案

### 對於黑客松活動（參與者 ≤ 100 人）：

```
✅ 選項 A：添加測試用戶
   - 立即生效
   - 無需審核
   - 完全控制誰可以使用
```

### 對於大型活動（參與者 > 100 人）：

```
✅ 選項 B：發布應用程式
   - 任何人都可以使用
   - 用戶會看到「未經驗證」警告（可接受）
   - 仍可正常使用
```

---

## 🐛 常見問題

### Q: 我已經添加了測試用戶，但用戶還是無法登入？

**A:** 請確保：
1. ✅ 用戶的 Gmail 地址拼寫正確
2. ✅ 用戶已清除舊的授權（https://myaccount.google.com/permissions）
3. ✅ 用戶使用的是正確的 Google 帳號
4. ✅ 等待 1-2 分鐘讓設置生效

### Q: 測試用戶數量有限制嗎？

**A:** 是的，最多 **100 個測試用戶**。如果超過，需要發布應用程式。

### Q: 發布後還能改回測試狀態嗎？

**A:** 可以！在 OAuth 同意畫面可以點擊「BACK TO TESTING」回到測試狀態。

### Q: defintek.io 的用戶為什麼可以使用？

**A:** 可能是：
- 他們已經被添加為測試用戶
- 或者您的 Google Workspace 設置允許組織內用戶訪問

### Q: 用戶看到「此應用程式尚未經過 Google 驗證」，安全嗎？

**A:** 是安全的！這只是因為您的應用程式沒有通過 Google 的驗證流程。對於黑客松活動，這是正常且可接受的。用戶可以點擊「進階」繼續使用。

---

## 📞 需要立即解決？

### 最快速的方法：

1. **收集所有參與者的 Gmail**
   - 從註冊系統導出
   - 或建立 Google Form 收集

2. **批量添加為測試用戶**
   - 前往：https://console.cloud.google.com/apis/credentials/consent
   - 點擊「+ ADD USERS」
   - 貼上所有 Gmail（每行一個）
   - 點擊「儲存」

3. **通知所有用戶**
   - 清除舊授權：https://myaccount.google.com/permissions
   - 重新連接 Google Calendar

4. **✅ 完成！**

---

## 📧 通知用戶的範本

```
📅 Google Calendar 整合已就緒！

親愛的參與者：

我們的 Google Calendar 整合功能已經設置完成！

如何使用：
1. 訪問 https://hackathon.com.tw/schedule
2. 點擊「連接 Google Calendar」
3. 使用您的 Gmail 帳號授權
4. 一鍵添加所有活動到您的日曆！

⚠️ 首次使用注意事項：
- 您會看到「此應用程式尚未經過 Google 驗證」
- 這是正常的，請點擊「進階」→「前往 hackathon.com.tw」
- 然後點擊「允許」即可

如果之前嘗試過但失敗：
1. 前往 https://myaccount.google.com/permissions
2. 移除舊的授權
3. 重新連接

有問題請聯繫我們！

祝黑客松順利！
```

---

**下一步：** 
立即前往 Google Cloud Console 添加測試用戶或發布應用程式！

