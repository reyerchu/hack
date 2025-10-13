# 🚨 CRITICAL FIX: Firebase Admin SDK Initialization

## ❌ Problem

**Symptom:** All users (Hacker, Admin, Super Admin) redirected to `/register` after login

**Root Cause:**
```
Firebase Admin SDK initialization failed
↓
/api/userinfo returns 500 error
↓
AuthContext cannot fetch user data
↓
hasProfile = false
↓
All users redirected to /register
```

**Technical Cause:**
- `SERVICE_ACCOUNT_PRIVATE_KEY` in `.env.local` is wrapped in quotes
- Next.js doesn't properly handle `\n` escape sequences from environment variables
- The private key format becomes invalid, causing initialization to fail

---

## ✅ Solution

**File:** `lib/admin/init.ts`

**Fix Applied:**
```typescript
// Process private key format: remove quotes and replace escaped newlines
let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;

// Remove quotes if present
if (
  (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
  (privateKey.startsWith("'") && privateKey.endsWith("'"))
) {
  privateKey = privateKey.slice(1, -1);
}

// Replace escaped newlines with actual newlines
privateKey = privateKey.replace(/\\n/g, '\n');
```

---

## 🔍 How to Detect This Issue

### 1. Health Check Endpoint
```bash
curl http://localhost:3008/api/health
```

**Healthy Response:**
```json
{
  "status": "ok",
  "firebase": {
    "adminSDK": "connected",
    "firestore": "connected"
  }
}
```

**Failed Response:**
```json
{
  "status": "error",
  "firebase": {
    "adminSDK": "failed"
  }
}
```

### 2. Test User Login
- Login should redirect to `/profile`, `/dashboard`, or `/admin`
- If redirected to `/register`, Firebase Admin SDK has failed

### 3. Check Browser Console
```
api/userinfo?id=xxx: Failed to load resource: 500 (Internal Server Error)
Unexpected error when fetching AuthContext permission data...
```

### 4. Check Server Logs
```
Firebase Admin SDK initialization failed: FirebaseAppError: Failed to parse private key
```

---

## 🛡️ Prevention

### Before Deployment

1. **Run Health Check:**
   ```bash
   npm run build
   npm start
   curl http://localhost:3008/api/health
   ```

2. **Test Login:**
   - Test with at least one user account
   - Verify no redirect to `/register`

3. **Check Environment Variables:**
   ```bash
   # Verify all required variables exist
   grep "SERVICE_ACCOUNT" .env.local
   ```

### After Deployment

1. **Immediate Health Check:**
   ```bash
   curl https://hackathon.com.tw/api/health
   ```

2. **Monitor for 5 minutes:**
   - Check if users report login issues
   - Monitor error logs

---

## 📋 Rollback Plan

If Firebase Admin SDK fails after deployment:

1. **Immediate Rollback:**
   ```bash
   git revert HEAD
   npm run build
   npm start
   ```

2. **Verify Previous Version:**
   ```bash
   curl http://localhost:3008/api/health
   ```

3. **Deploy Rollback:**
   ```bash
   ./deploy.sh
   ```

---

## 🔧 Environment Variables Required

```bash
# Required for Firebase Admin SDK
SERVICE_ACCOUNT_PROJECT_ID=your-project-id
SERVICE_ACCOUNT_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Note: PRIVATE_KEY must be in quotes and contain \n escape sequences
```

---

## ⚠️ CRITICAL NOTES

1. **NEVER modify `lib/admin/init.ts` without testing health check**
2. **ALWAYS test login after Firebase-related changes**
3. **ALWAYS run health check before and after deployment**
4. **Keep this document updated if Firebase initialization logic changes**

---

## 📞 Emergency Contact

If Firebase Admin SDK fails in production:

1. Check `/api/health` endpoint immediately
2. Check browser console for 500 errors on `/api/userinfo`
3. Review server logs for "Firebase Admin SDK initialization failed"
4. Apply the fix in `lib/admin/init.ts` as documented above
5. Verify with health check before deploying

---

**Last Updated:** 2025-10-13  
**Issue ID:** CRITICAL-001  
**Status:** FIXED  
**Fix Version:** v4.2

