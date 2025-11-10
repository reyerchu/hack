# 🔒 Security Guidelines

## Sensitive Files Protection

This repository contains sensitive information that should NOT be pushed to GitHub.

### 📁 Protected Directories and Files

#### `/scripts/` Directory
Contains utility scripts with confidential information:
- Database access scripts
- User data exports
- Admin permission management
- Firebase configuration scripts
- Deployment scripts with credentials

**⚠️ IMPORTANT**: The `scripts/` directory is tracked in local git but should NEVER be pushed to GitHub.

### 🛡️ How to Safely Commit Changes

#### Method 1: Selective Add (Recommended)
Always add files explicitly instead of using `git add .`:

```bash
# ✅ Good - Add specific files
git add components/MyComponent.tsx
git add pages/api/my-endpoint.ts

# ✅ Good - Interactive add
git add -p

# ❌ Bad - Adds everything including sensitive files
git add .
git add -A
```

#### Method 2: Check Before Committing
Always review what you're about to commit:

```bash
# Check what will be committed
git status
git diff --cached

# If you accidentally added scripts/
git restore --staged scripts/
```

### 📋 Pre-Commit Checklist

Before every `git push`, verify:

1. ✅ No files from `scripts/` directory
2. ✅ No `.csv` files with user data
3. ✅ No `.env` or credential files
4. ✅ No private keys or API tokens

```bash
# Quick check command
git diff --cached --name-only | grep -E "(scripts/|\.csv$|\.env|private|secret)"
```

If this command returns anything, DO NOT push!

### 🚨 What to Do If You Accidentally Committed Sensitive Data

If you've committed (but not pushed):
```bash
# Undo the last commit
git reset HEAD~1

# Or if you've made multiple commits
git reset HEAD~N  # N = number of commits to undo
```

If you've already pushed to GitHub:
1. **DO NOT** try to fix it yourself
2. Contact the repository administrator immediately
3. We may need to:
   - Remove the sensitive data from git history
   - Rotate any exposed credentials
   - Force push a clean history

### 📝 Files Currently in Git

These files are already in git history and are safe:
- Application code (`pages/`, `components/`, `lib/`)
- Configuration files (without secrets)
- Documentation
- Public assets

### 🔐 Best Practices

1. **Never use** `git add .` or `git add -A`
2. **Always review** staged changes before committing
3. **Use** `.git/info/exclude` for local-only ignores
4. **Keep** sensitive scripts in `scripts/` directory only
5. **Test** in development before committing

### 📞 Questions?

If you're unsure whether a file is safe to commit, ask first!

---

**Remember**: It's easier to prevent exposure than to clean it up after the fact. 🛡️

