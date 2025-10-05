# RWA Hackathon Deployment Guide

This guide explains how to deploy the RWA Hackathon application to the server.

## 🚀 Quick Start

### For Development (Fast)
```bash
./quick-deploy.sh
```
- Stops existing processes
- Cleans build cache
- Starts development server on port 3000
- Perfect for rapid development iterations

### For Production (Full)
```bash
./deploy.sh
```
- Complete deployment process
- Builds production version
- Starts production server
- Reloads Apache configuration
- Verifies deployment

### For Production (Service)
```bash
./production-deploy.sh
```
- Production deployment with service management
- Builds and starts production server
- Handles Apache configuration
- Includes verification steps

## 📋 Manual Deployment Steps

If you prefer to deploy manually:

1. **Stop existing processes:**
   ```bash
   pkill -f "npm run dev"
   pkill -f "npm start"
   lsof -ti :3000 | xargs kill -9
   ```

2. **Clean build artifacts:**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```

3. **Build the application:**
   ```bash
   npm run build
   ```

4. **Start the server:**
   ```bash
   npm start &
   ```

5. **Reload Apache:**
   ```bash
   sudo systemctl reload apache2
   ```

## 🔧 Troubleshooting

### Port 3000 is in use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or kill all Node processes
pkill -f node
```

### Apache not serving content
```bash
# Check Apache status
sudo systemctl status apache2

# Check Apache logs
sudo tail -f /var/log/apache2/hackathon_error.log

# Reload Apache
sudo systemctl reload apache2
```

### Application not starting
```bash
# Check if port 3000 is free
lsof -i :3000

# Check application logs
npm run dev

# Or start in background
npm start &
```

## 🌐 URLs

- **Local Development:** http://localhost:3000
- **Production HTTPS:** https://hackathon.com.tw
- **Apache Config:** /etc/apache2/sites-available/hackathon.com.tw.conf

## 📁 Important Files

- `deploy.sh` - Complete deployment script
- `quick-deploy.sh` - Fast development deployment
- `production-deploy.sh` - Production deployment
- `/etc/apache2/sites-available/hackathon.com.tw.conf` - Apache configuration

## 🔄 Workflow

1. **Make code changes**
2. **Run deployment script:**
   ```bash
   ./quick-deploy.sh  # For development
   ./deploy.sh       # For production
   ```
3. **Verify deployment:**
   - Check https://hackathon.com.tw
   - Check localhost:3000

## 🚨 Emergency Commands

### Stop everything
```bash
pkill -f npm
pkill -f next
lsof -ti :3000 | xargs kill -9
```

### Restart Apache
```bash
sudo systemctl restart apache2
```

### Check application status
```bash
curl -s http://localhost:3000
curl -s -k https://hackathon.com.tw
```

## 📝 Notes

- Always use port 3000 for consistency
- Apache proxies requests from https://hackathon.com.tw to http://localhost:3000
- Development server auto-reloads on code changes
- Production server requires manual restart after code changes
