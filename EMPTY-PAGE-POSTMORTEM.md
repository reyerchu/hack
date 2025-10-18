# Empty Page Problem - Root Cause Analysis & Lessons Learned

## 🔴 Problem Summary

**Symptom**: Website showing empty page after deployment, PM2 showing 895+ restarts

**Date**: 2025-10-18

**Impact**: Production service completely unusable

---

## 🔍 Root Cause Investigation

### Step 1: Initial Symptoms
```bash
pm2 status hackportal
# ↺ = 895 (restart count)
# status = online (but constantly restarting)
```

**Key Observation**: Service appeared "online" but was restarting every second

### Step 2: Log Analysis
```bash
pm2 logs hackportal --lines 100
```

**Finding**: Only saw Firebase initialization messages, no actual server startup
```
Firebase client initialized successfully
info - Loaded env from...
Firebase client initialized successfully
info - Loaded env from...
```

This pattern indicated: **Server starting → Immediate crash → PM2 restart → Loop**

### Step 3: Manual Testing
```bash
npm start
```

**Critical Error Found**:
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3008
    at Server.setupListenHandle [as _listen2] (node:net:1463:16)
    ...
  code: 'EADDRINUSE',
  errno: -98,
  syscall: 'listen',
  address: '0.0.0.0',
  port: 3008
```

### Step 4: Port Investigation
```bash
lsof -i :3008
```

**Root Cause Identified**:
```
COMMAND     PID     USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME
node    2296873 reyerchu   20u  IPv4 58044262      0t0  TCP *:3008 (LISTEN)
```

**Zombie process from previous deployment was still holding port 3008**

---

## 💡 Root Cause

### Primary Issue: PORT CONFLICT
- A previous Node.js process (PID 2296873) was still running
- It was holding port 3008
- New PM2 deployments tried to start but couldn't bind to the port
- PM2 auto-restart kept trying → 895+ restart loops

### Why It Happened
1. During our multiple deployment attempts, we used different methods:
   - `pm2 restart` (doesn't kill the process cleanly)
   - Changing `ecosystem.config.js` between `npm start` and `node server.js`
   - Manual stops/starts without proper cleanup

2. The zombie process was created when:
   - We switched between `fork` and `cluster` modes
   - PM2 couldn't properly track the process after config changes
   - Old process remained running in the background

---

## 🎯 The Real Problem (Not What We Thought)

### ❌ What We Thought Was Wrong:
- Our code changes to remove imToken section
- React hydration issues
- SSR/CSR mismatches
- Firebase initialization problems
- Build cache issues

### ✅ What Was Actually Wrong:
- **Port conflict from zombie process**
- Nothing to do with our code at all!

---

## 🛠️ Solution

### Immediate Fix:
```bash
# 1. Find the zombie process
lsof -i :3008

# 2. Kill it
kill -9 2296873

# 3. Clean restart
pm2 delete hackportal
pm2 start ecosystem.config.js
```

### Verification:
```bash
pm2 status hackportal
# ↺ = 0 (no restarts)
# status = online (stable)

curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3008/
# 200 (working!)
```

---

## 📚 Lessons Learned

### 1. **Always Check Port Availability First**
```bash
# Before deploying, always check:
lsof -i :PORT_NUMBER
netstat -tlnp | grep PORT_NUMBER
```

### 2. **Use Proper Deployment Scripts**
The `safe-deploy.sh` script we created is good, but we should enhance it:

```bash
#!/bin/bash
echo "1️⃣ Checking for port conflicts..."
if lsof -i :3008 >/dev/null 2>&1; then
    echo "⚠️  Port 3008 is in use. Cleaning up..."
    lsof -ti :3008 | xargs kill -9 2>/dev/null || true
fi

echo "2️⃣ Stopping PM2 service..."
pm2 stop hackportal 2>/dev/null || true

echo "3️⃣ Cleaning build cache..."
rm -rf .next

# ... rest of deployment
```

### 3. **PM2 Best Practices**

#### ❌ DON'T:
- Use `pm2 restart` (can leave zombie processes)
- Change `ecosystem.config.js` while service is running
- Mix different start methods (`npm` vs `node`)

#### ✅ DO:
- Use `pm2 delete` then `pm2 start` for clean restarts
- Always use `pm2 save` after successful start
- Stick to one start method consistently
- Check logs immediately after deployment:
  ```bash
  pm2 logs --lines 50
  ```

### 4. **Diagnostic Commands Checklist**

When encountering "empty page" or deployment issues:

```bash
# 1. Check PM2 status
pm2 status
pm2 logs --lines 100 --nostream

# 2. Check port availability
lsof -i :PORT
netstat -tlnp | grep PORT

# 3. Manual test
npm start  # See actual error without PM2 wrapper

# 4. Check process tree
ps aux | grep node
pstree -p | grep node

# 5. Test HTTP response
curl -v http://localhost:PORT/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:PORT/
```

### 5. **Don't Assume Code is the Problem**

In this case, we spent time:
- Rolling back code changes
- Investigating React hydration
- Checking SSR issues  
- Testing in development mode

**But the actual problem was infrastructure/deployment, not code.**

**Better approach**: Start with infrastructure checks before blaming code.

---

## 🔄 Why Dev Mode Worked But Production Failed

### Development Mode (`npm run dev`):
- Runs on different port (3009)
- No port conflict
- Hot module replacement
- Different error handling

### Production Mode (`npm start`):
- Tries to use port 3008
- **Port was already taken** ← The issue
- Process fails immediately
- PM2 keeps restarting

**This is why the code change worked in dev but "failed" in production!**

---

## ✅ Prevention Checklist

Before any deployment:

- [ ] Check for zombie processes: `lsof -i :3008`
- [ ] Properly stop existing service: `pm2 delete app-name`
- [ ] Clear build cache: `rm -rf .next`
- [ ] Build fresh: `npm run build`
- [ ] Start clean: `pm2 start ecosystem.config.js`
- [ ] Verify status: `pm2 status` (check ↺ restart count)
- [ ] Test endpoint: `curl http://localhost:PORT/`
- [ ] Check logs: `pm2 logs --lines 50`
- [ ] Save PM2 state: `pm2 save`

---

## 🎓 Key Takeaways

1. **Infrastructure > Code**: Always check infrastructure (ports, processes, resources) before debugging code

2. **Logs Are Your Friend**: The `EADDRINUSE` error was there all along, we just needed to look in the right place

3. **Process Management Matters**: Understanding how PM2 works prevents these issues

4. **Dev ≠ Production**: Just because it works in dev doesn't mean deployment will work - different environments, different issues

5. **Systematic Debugging**: Follow a checklist rather than jumping to conclusions

---

## 📝 Updated Safe Deployment Script

See `safe-deploy-v2.sh` for enhanced version with port conflict detection.

---

## 🏁 Final Status

- ✅ Website working: http://localhost:3008/
- ✅ PM2 stable: 0 restarts
- ✅ All pages accessible
- ✅ No more zombie processes
- ✅ Ready for code changes (like removing imToken info)

---

**Remember**: When you see an empty page, think "deployment/infrastructure" before "code bug"!

