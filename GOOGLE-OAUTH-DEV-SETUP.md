# Google OAuth 開發環境設定

## 🔧 需要在 Google Cloud Console 配置

### OAuth 2.0 客戶端 ID
```
321605417911-n7irojuojeukee9c9bksrecgmrjv8m8l.apps.googleusercontent.com
```

### 1. 授權的 JavaScript 來源 (Authorized JavaScript origins)
需要包含以下所有 URI：

```
http://localhost:3008
http://localhost:3009
https://hackathon.com.tw
```

### 2. 授權的重新導向 URI (Authorized redirect URIs)
需要包含以下所有 URI：

```
http://localhost:3008/api/calendar/callback
http://localhost:3009/api/calendar/callback
https://hackathon.com.tw/api/calendar/callback
https://hackathon-rwa-nexus.firebaseapp.com/__/auth/handler
```

### 3. Firebase Authentication 授權網域
前往 Firebase Console > Authentication > Settings > Authorized domains

需要包含：
```
hackathon.com.tw
localhost
```

---

## 📋 當前環境配置

### Dev 環境 (localhost:3009)
- `GOOGLE_REDIRECT_URI=http://localhost:3009/api/calendar/callback`
- `NEXT_PUBLIC_SITE_URL=http://localhost:3009`

### Main 環境 (localhost:3008)
- `GOOGLE_REDIRECT_URI=http://localhost:3008/api/calendar/callback`
- `NEXT_PUBLIC_SITE_URL=http://localhost:3008`

### Production (hackathon.com.tw)
- `GOOGLE_REDIRECT_URI=https://hackathon.com.tw/api/calendar/callback`
- `NEXT_PUBLIC_SITE_URL=https://hackathon.com.tw`

---

## ⚠️ 重要提醒

1. **每次更改 Google Cloud Console 配置後**，可能需要等待幾分鐘才會生效
2. **清除瀏覽器快取**並重新測試
3. **確認使用正確的 Google 帳號**進行授權

---

## 🔗 快速連結

- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
- [Firebase Console - Authentication](https://console.firebase.google.com/project/hackathon-rwa-nexus/authentication/settings)

