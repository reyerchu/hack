# 🔥 URGENT: Permission Issue Debugging Guide

## ✅ What We've Confirmed

1. **Database permissions are 100% CORRECT**
   - User: `alphareyer@gmail.com` (YzxQ10RY2SNZhmKM4yO08So4EHS2)
   - Sponsor: `imToken` (sponsor-imtoken)
   - Role: `admin`
   - CanEdit: `true`

2. **Simulation test PASSED**
   - All permission checks pass
   - User SHOULD be able to edit

3. **Code has been updated with extensive logging**
   - Main service restarted (port 3008)
   - Every step of permission check is now logged

## 🧪 Testing Steps

### CRITICAL: You MUST do ALL of these steps:

### Step 1: Clear ALL Browser Data

**Option A: Use Incognito/Private Window (EASIEST)**
- Chrome: `Ctrl + Shift + N` (Windows/Linux) or `Cmd + Shift + N` (Mac)
- Firefox: `Ctrl + Shift + P` (Windows/Linux) or `Cmd + Shift + P` (Mac)
- Visit https://hackathon.com.tw/ in the private window

**Option B: Clear Browser Cache**
- Chrome: `Ctrl + Shift + Delete` → Select "Cookies and other site data" → Clear data
- Firefox: `Ctrl + Shift + Delete` → Select "Cookies" → Clear Now

### Step 2: Logout and Login Again

1. Go to https://hackathon.com.tw/
2. **Logout** if logged in
3. **Login** with `alphareyer@gmail.com`

### Step 3: Open Two Windows Side-by-Side

**Window 1: SSH Terminal**
```bash
cd /home/reyerchu/hack/hack
pm2 logs hackportal --lines 0
```
(This will show real-time logs)

**Window 2: Browser**
- Visit the challenge edit page:
```
https://hackathon.com.tw/sponsor/tracks/imtoken-賽道-135870/challenge?challengeId=2I3wWp7VG9YRmYY2yeOH&mode=edit
```

### Step 4: Make a Small Change

1. Change something in the description (add one word)
2. Click "保存修改" (Save)
3. **WATCH THE TERMINAL LOGS**

## 📋 What the Logs Will Show

You should see lines like:
```
═══════════════════════════════════════════════════════
[PUT challenge] START - New Request
[PUT challenge] Query params: { trackId: '...', challengeId: '...' }
[PUT challenge] Checking track access...
[PUT challenge] ✅ requireTrackAccess PASSED
[PUT challenge] Getting user sponsor role...
[PUT challenge] userId: YzxQ10RY2SNZhmKM4yO08So4EHS2
[PUT challenge] challengeSponsorId: sponsor-imtoken
[PUT challenge] userRole result: admin
[PUT challenge] Evaluating canEdit...
[PUT challenge] - Has admin permission? false
[PUT challenge] - Has super_admin permission? false
[PUT challenge] - User role is admin? true
[PUT challenge] Final canEdit result: true
[PUT challenge] ✅✅✅ PERMISSION GRANTED ✅✅✅
```

## 🚨 If It STILL Fails

If you see `❌ PERMISSION DENIED` in the logs, copy ALL the logs from:
```
═══════════════════════════════════════════════════════
```
to
```
═══════════════════════════════════════════════════════
```

And send them to me. The logs will show EXACTLY where it's failing.

## 🔍 Alternative: Check Your Token

Open browser console (`F12`), run:
```javascript
firebase.auth().currentUser.getIdToken().then(token => {
  fetch('/api/userinfo', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(d => console.log('User info:', d))
});
```

This will show what permissions the server sees for your current session.

## 📊 Quick Verification

Run this to verify database state hasn't changed:
```bash
cd /home/reyerchu/hack/hack
node scripts/test-full-permission-check.js
```

Should output:
```
✅✅✅ USER SHOULD BE ABLE TO EDIT! ✅✅✅
```

---

**Remember: The problem is likely a cached token. The only way to be 100% sure is to use an incognito window.**

