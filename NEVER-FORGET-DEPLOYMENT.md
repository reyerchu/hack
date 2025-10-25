# ⚠️ CRITICAL: DEPLOYMENT CHECKLIST - NEVER FORGET!

## 🚨 THE PROBLEM THAT KEEPS HAPPENING

**Symptom:** After deployment, the website has **NO STYLES** (blank white page with no CSS).

**Root Cause:** PM2 process caching + Next.js build cache mismatch

---

## ✅ CORRECT DEPLOYMENT PROCEDURE

### **ALWAYS USE THIS PROCEDURE FOR MAIN (PRODUCTION)**

```bash
#!/bin/bash
# Save this as: /home/reyerchu/hack/hack/deploy-safe.sh

cd /home/reyerchu/hack/hack

echo "🔄 Step 1: Pull latest code"
git pull origin main

echo "🧹 Step 2: Clean ALL caches"
rm -rf .next node_modules/.cache

echo "🛑 Step 3: Stop and DELETE PM2 process"
pm2 delete hackportal
lsof -ti:3008 | xargs -r kill -9
sleep 2

echo "🏗️  Step 4: Build"
npm run build

echo "🚀 Step 5: Start FRESH process"
pm2 start npm --name hackportal -- start -- -p 3008

echo "⏳ Step 6: Wait for startup"
sleep 8

echo "✅ Step 7: Verify"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3008

echo "💾 Step 8: Save PM2"
pm2 save

echo ""
echo "✅ Deployment complete!"
echo "⚠️  Clear browser cache: Ctrl+Shift+R"
```

---

## ❌ WRONG PROCEDURES (CAUSES NO-STYLE BUG)

### **DON'T DO THIS:**

```bash
# ❌ Wrong #1: Just restart
pm2 restart hackportal

# ❌ Wrong #2: Stop and start without deleting
pm2 stop hackportal
pm2 start hackportal

# ❌ Wrong #3: Build without cleaning cache
npm run build
pm2 restart hackportal

# ❌ Wrong #4: Don't kill port 3008 process
pm2 delete hackportal
pm2 start npm --name hackportal ...
# (old process still on port 3008!)
```

---

## 🔍 HOW TO VERIFY AFTER DEPLOYMENT

### **1. Check CSS File Match**

```bash
cd /home/reyerchu/hack/hack

# Get CSS filename from HTML
CSS_FILE=$(curl -s http://localhost:3008 | grep -o 'href="/_next/static/css/[^"]*\.css"' | head -1 | sed 's/.*css\///;s/"//')

echo "Requested CSS: $CSS_FILE"
ls -lh .next/static/css/$CSS_FILE

# Should show: ✅ File exists
```

### **2. Check CSS HTTP Status**

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3008/_next/static/css/YOUR_CSS_FILE.css

# Should return: 200
```

### **3. Check CSS Content**

```bash
curl -s http://localhost:3008/_next/static/css/YOUR_CSS_FILE.css | head -c 100

# Should show: @import url("/fonts/stylesheet.css");/*! tailwindcss ...
```

---

## 🆘 IF STYLES ARE MISSING (EMERGENCY FIX)

```bash
cd /home/reyerchu/hack/hack

# 1. Stop everything
pm2 stop hackportal
pm2 delete hackportal
lsof -ti:3008 | xargs -r kill -9

# 2. Nuclear clean
rm -rf .next node_modules/.cache

# 3. Fresh build
npm run build

# 4. Fresh start
pm2 start npm --name hackportal -- start -- -p 3008
sleep 8

# 5. Verify
curl -s http://localhost:3008 | grep -o '<link[^>]*css[^>]*>'
pm2 save

# 6. Tell user to hard refresh
echo "⚠️  Clear browser cache: Ctrl+Shift+R or Cmd+Shift+R"
```

---

## 📋 DEPLOYMENT CHECKLIST

Before deploying to main:

- [ ] Test on dev (http://localhost:3009) first
- [ ] Commit all changes to dev branch
- [ ] Merge dev to main
- [ ] Follow the **CORRECT DEPLOYMENT PROCEDURE** above
- [ ] Verify CSS loads (check steps above)
- [ ] Test in browser (hard refresh: Ctrl+Shift+R)
- [ ] Verify all pages load with styles
- [ ] Check mobile view

---

## 🎓 WHY THIS HAPPENS

1. **PM2 Process Caching:**
   - `pm2 restart` doesn't fully reload the Node process
   - Old code can remain in memory
   - CSS filenames get cached from previous build

2. **Next.js Build Cache:**
   - `.next` directory contains built files
   - If not cleaned, old CSS files remain
   - HTML might reference new filename, but old file is served

3. **Port Conflict:**
   - Sometimes old process stays on port 3008
   - New process starts but can't bind to port
   - Old cached version continues to serve

---

## ✅ BEST PRACTICES

### **For Dev Environment (3009):**
```bash
cd /home/reyerchu/hack/hack-dev
git pull origin dev
pm2 restart hackportal-dev
# Restart is OK for dev
```

### **For Main Environment (3008):**
```bash
cd /home/reyerchu/hack/hack
./deploy-safe.sh
# ALWAYS use the safe deployment script
```

---

## 🔧 CREATE THE SAFE DEPLOYMENT SCRIPT

```bash
cd /home/reyerchu/hack/hack

cat > deploy-safe.sh << 'EOF'
#!/bin/bash
set -e

cd /home/reyerchu/hack/hack

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🚀 SAFE DEPLOYMENT TO MAIN (PRODUCTION)                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "📥 Step 1/8: Pull latest code..."
git pull origin main

echo "🧹 Step 2/8: Clean build caches..."
rm -rf .next node_modules/.cache

echo "🛑 Step 3/8: Stop PM2 process..."
pm2 stop hackportal 2>/dev/null || true

echo "🗑️  Step 4/8: Delete PM2 process..."
pm2 delete hackportal 2>/dev/null || true

echo "🔫 Step 5/8: Kill any process on port 3008..."
lsof -ti:3008 | xargs -r kill -9
sleep 2

echo "🏗️  Step 6/8: Build project..."
npm run build

echo "🚀 Step 7/8: Start fresh PM2 process..."
pm2 start npm --name hackportal -- start -- -p 3008
sleep 8

echo "✅ Step 8/8: Verify and save..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3008)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ HTTP Status: 200"
else
    echo "   ❌ HTTP Status: $HTTP_STATUS"
    exit 1
fi

pm2 save
pm2 list

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT SUCCESSFUL                                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Site: https://hackathon.com.tw/"
echo "⚠️  Clear browser cache: Ctrl+Shift+R (Windows/Linux)"
echo "⚠️  Clear browser cache: Cmd+Shift+R (Mac)"
echo ""
EOF

chmod +x deploy-safe.sh

echo "✅ Safe deployment script created!"
echo "Usage: ./deploy-safe.sh"
```

---

## 📞 IF YOU SEE "NO STYLES" AGAIN

**RUN THIS IMMEDIATELY:**

```bash
cd /home/reyerchu/hack/hack
./deploy-safe.sh
```

**OR MANUALLY:**

```bash
cd /home/reyerchu/hack/hack
pm2 delete hackportal
lsof -ti:3008 | xargs -r kill -9
rm -rf .next node_modules/.cache
npm run build
pm2 start npm --name hackportal -- start -- -p 3008
pm2 save
```

---

## 🎯 REMEMBER

1. **DEV (3009)**: `pm2 restart` is OK
2. **MAIN (3008)**: ALWAYS use `deploy-safe.sh`
3. **NEVER**: Just `pm2 restart` on production
4. **ALWAYS**: Clean `.next` directory on production deploy
5. **ALWAYS**: Delete and recreate PM2 process on production deploy

---

**Last Updated:** 2025-10-26  
**This has happened:** 3+ times  
**Prevention:** USE THE SCRIPT!

