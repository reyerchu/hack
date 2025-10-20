# 🚀 Deployment Guide

This document describes the automated deployment process and best practices for deploying the RWA Hackathon Portal.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Deployment Scripts](#deployment-scripts)
- [Common Issues](#common-issues)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

---

## 🎯 Quick Start

### Deploy Main (Production - Port 3008)

```bash
cd /home/reyerchu/hack/hack
./scripts/deploy-main.sh
```

### Deploy Dev (Development - Port 3009)

```bash
cd /home/reyerchu/hack/hack
./scripts/deploy-dev.sh
```

### Merge Dev to Main and Deploy

```bash
cd /home/reyerchu/hack/hack
./scripts/merge-and-deploy.sh
```

---

## 📜 Deployment Scripts

### 1. `deploy-main.sh` - Main Branch Deployment

**Purpose**: Deploy the main branch to production (port 3008) with a full build.

**What it does**:
1. ✅ Kills all processes on port 3008
2. ✅ Stops PM2 app if running
3. ✅ Cleans `.next` directory
4. ✅ Builds the project (`npm run build`)
5. ✅ Starts PM2 with new build
6. ✅ Performs health checks (CSS loading, port availability)
7. ✅ Displays deployment status

**Usage**:
```bash
./scripts/deploy-main.sh
```

**Output Example**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Starting Main Branch Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INFO] Checking for processes on port 3008...
[SUCCESS] No processes found on port 3008
[INFO] Stopping PM2 app: hackportal...
[INFO] Cleaning old build artifacts...
[SUCCESS] Cleaned .next directory
[INFO] Building project...
[SUCCESS] Build completed successfully
[SUCCESS] Found 2 CSS files in build
[INFO] Starting PM2 app: hackportal...
[SUCCESS] PM2 app started
[INFO] Waiting 10 seconds for app to start...
[INFO] Performing health check...
[SUCCESS] CSS file is accessible (HTTP 200)
[SUCCESS] Health check passed!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Deployment Successful!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Application URL: http://localhost:3008
```

---

### 2. `deploy-dev.sh` - Dev Branch Deployment

**Purpose**: Restart the dev branch (port 3009) in development mode.

**What it does**:
1. ✅ Kills all processes on port 3009
2. ✅ Stops PM2 app if running
3. ✅ Starts PM2 in dev mode (no build needed)
4. ✅ Performs health checks

**Usage**:
```bash
./scripts/deploy-dev.sh
```

**Note**: Dev mode uses `next dev`, so changes are reflected immediately without rebuilding.

---

### 3. `merge-and-deploy.sh` - Complete Merge & Deploy Pipeline

**Purpose**: Automate the entire process of merging dev to main and deploying to production.

**What it does**:
1. ✅ **Pre-flight checks**:
   - Verifies you're on the main branch
   - Checks for uncommitted changes
   - Verifies dev branch exists
2. ✅ **Creates backup**: Creates a backup branch before merging
3. ✅ **Merges branches**: Merges dev into main
4. ✅ **Deploys**: Runs `deploy-main.sh`
5. ✅ **Rollback on failure**: Automatically rolls back if deployment fails

**Usage**:
```bash
./scripts/merge-and-deploy.sh
```

**Safety Features**:
- Automatic backup before merge
- Rollback on failure
- Conflict detection
- Health checks

---

## 🛠️ Common Issues

### Issue 1: CSS File 404 (No Styles)

**Symptoms**:
- Page loads but has no colors or styling
- Browser console shows `404` errors for CSS files

**Root Cause**:
- Old process serving HTML with old CSS references
- New build generated new CSS file names
- Build ID mismatch

**Solution**:
```bash
# Use the deployment script (it handles this automatically)
./scripts/deploy-main.sh
```

**Manual Fix**:
```bash
# 1. Kill all processes on port 3008
lsof -ti:3008 | xargs kill -9

# 2. Stop PM2
pm2 delete hackportal

# 3. Clean and rebuild
rm -rf .next
npm run build

# 4. Start PM2
pm2 start ecosystem.config.js --only hackportal
```

---

### Issue 2: Port Already in Use (EADDRINUSE)

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3008
```

**Root Cause**:
- Another process is using the port
- PM2 app crashed but port is still held

**Solution**:
```bash
# Use deployment script (it handles this automatically)
./scripts/deploy-main.sh

# Or manually:
lsof -ti:3008 | xargs kill -9
pm2 restart hackportal
```

---

### Issue 3: PM2 App Not Starting

**Symptoms**:
- PM2 shows app as `errored` or constantly restarting
- `pm2 list` shows high restart count

**Diagnosis**:
```bash
# Check logs
pm2 logs hackportal --lines 50

# Check PM2 status
pm2 describe hackportal
```

**Common Causes**:
1. **Build errors**: Check `npm run build` output
2. **Port conflict**: Use `lsof -ti:3008`
3. **Missing dependencies**: Run `npm install`
4. **Environment variables**: Check `.env` files

**Solution**:
```bash
# Full clean deployment
./scripts/deploy-main.sh
```

---

## 🔍 Troubleshooting

### Check Service Status

```bash
# PM2 status
pm2 list

# Detailed info
pm2 describe hackportal

# Real-time logs
pm2 logs hackportal

# Monitor resources
pm2 monit
```

### Verify Build

```bash
# Check CSS files exist
ls -lh .next/static/css/

# Test CSS accessibility
curl -I http://localhost:3008/_next/static/css/[filename].css
```

### Manual Health Check

```bash
# Check if port is listening
lsof -i:3008

# Test HTTP response
curl -I http://localhost:3008

# Check CSS loading
curl -s http://localhost:3008 | grep "stylesheet"
```

---

## 🔄 Rollback Procedures

### Automatic Rollback

If you used `merge-and-deploy.sh`, rollback is automatic on failure.

### Manual Rollback

#### Option 1: Git Reset
```bash
cd /home/reyerchu/hack/hack

# Find backup branch (if created)
git branch | grep backup-main

# Reset to backup
git reset --hard backup-main-[timestamp]

# Deploy old version
./scripts/deploy-main.sh
```

#### Option 2: Git Revert
```bash
# Revert last commit
git revert HEAD

# Deploy
./scripts/deploy-main.sh
```

#### Option 3: Copy from Dev
```bash
# If dev is known-good state
cd /home/reyerchu/hack/hack
git reset --hard dev
./scripts/deploy-main.sh
```

---

## 📊 Best Practices

### 1. Always Use Deployment Scripts

❌ **Don't**:
```bash
npm run build
pm2 restart hackportal
```

✅ **Do**:
```bash
./scripts/deploy-main.sh
```

### 2. Test in Dev First

```bash
# Test changes in dev (port 3009)
cd /home/reyerchu/hack/hack-dev
git pull
./scripts/deploy-dev.sh

# Verify at http://localhost:3009
# Then merge to main
cd /home/reyerchu/hack/hack
./scripts/merge-and-deploy.sh
```

### 3. Monitor After Deployment

```bash
# Watch logs for 2 minutes after deployment
pm2 logs hackportal

# Check for errors
pm2 logs hackportal --err

# Monitor memory/CPU
pm2 monit
```

### 4. Keep PM2 Updated

```bash
# Update PM2
pm2 update

# Save PM2 config
pm2 save
```

---

## 🎓 What We Learned

### Root Cause of CSS Issue

The CSS loading issue occurred because:

1. **Build generates new hash**: Each build creates CSS files with new hash IDs
   ```
   Old: 4a97e50ed0706ff8.css
   New: 205f75af57920aa9.css
   ```

2. **Old process still running**: Manual `npm start` processes don't get killed by PM2

3. **Mismatch**: Old HTML references old CSS file, but only new CSS file exists

### Solution

The deployment script now:
1. ✅ Kills **all** processes on the port (not just PM2)
2. ✅ Verifies port is free before starting
3. ✅ Health checks CSS loading
4. ✅ Provides clear feedback

---

## 📞 Support

If deployment issues persist:

1. Check logs: `pm2 logs hackportal --lines 100`
2. Verify port: `lsof -i:3008`
3. Test build: `npm run build`
4. Clean start: `rm -rf .next && npm run build`

For urgent issues, use the rollback procedures above.

---

**Last Updated**: 2025-10-20
**Version**: 1.0
