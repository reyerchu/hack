# 🚨 CRITICAL DEPLOYMENT RULES - DO NOT VIOLATE

## ⚠️ LESSON LEARNED FROM PRODUCTION INCIDENT

### 🔴 NEVER DO THIS:
```bash
# ❌ WRONG - Causes cache mismatch issues
npm run build
pm2 restart app
npm run build  
pm2 restart app  # BREAKS THE WEBSITE!
```

### ✅ ALWAYS DO THIS:

#### For Development/Testing:
```bash
# Stop service
pm2 stop hackportal

# Clean build
rm -rf .next

# Build
npm run build

# Complete restart (clears all cache)
pm2 delete hackportal
pm2 start ecosystem.config.js --env production

# Save state
pm2 save
```

#### For Production (Zero Downtime):
```bash
# Build
npm run build

# Reload (not restart!)
pm2 reload hackportal --update-env

# Save state
pm2 save
```

## 📋 WHY THIS MATTERS

### The Problem:
- Next.js uses content-based hashing for file names
- CSS: `aa85ee8b86a19bee.css` → `ce5b10ce1280e621.css`
- `pm2 restart` keeps Node.js module cache
- Old HTML references old CSS → 404 → NO STYLES

### The Solution:
- `pm2 delete + pm2 start` = Full cache clear
- `pm2 reload` = Graceful reload with cache clear
- `pm2 restart` = ⚠️ CACHE MAY PERSIST

## 🎯 GOLDEN RULE

**After ANY build (`npm run build`), you MUST:**
1. Either `pm2 delete` + `pm2 start`
2. Or `pm2 reload`
3. NEVER just `pm2 restart`

## 📝 INCIDENT REPORT

**Date**: 2025-10-16
**Issue**: CSS 404 errors after multiple rebuilds
**Root Cause**: Used `pm2 restart` instead of `pm2 delete + start`
**Resolution**: Complete service restart with `pm2 delete`
**Impact**: Website broken for ~30 minutes
**Lesson**: ALWAYS use proper restart procedure

---
**Remember**: `pm2 restart` is for config changes, NOT for new builds!
