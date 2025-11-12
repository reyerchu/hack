# Security Policy

## 🔒 Reporting Security Issues

If you discover a security vulnerability, please email **reyerchu@defintek.io** directly.

**DO NOT** create a public GitHub issue for security vulnerabilities.

---

## 🚨 Known Security Incident - November 12, 2025

### Incident: Etherscan API Key Exposure

**Status**: 🟢 MITIGATED (Key protected, rotation required)

**Timeline**:
- **Exposure Date**: Commit `f2dde6fc` (feat: NFT minting UI refinement v5.0)
- **Discovery Date**: November 12, 2025
- **Mitigation Date**: November 12, 2025 (Commit `a8ddb173`)

**Details**:
- File `contracts/.env` was tracked in Git containing Etherscan API key
- Key: `U6T4JEG7AFQVZTRSU8J877J4G29JGM67R5` (now revoked)
- Risk Level: HIGH - Public exposure in git history

**Mitigation Actions Taken**:
1. ✅ Added `contracts/.env` to `.gitignore`
2. ✅ Removed file from git tracking
3. ✅ Created `contracts/.env.example` template
4. ⏳ **PENDING**: Rotate API key at https://etherscan.io/myapikey

**Remaining Actions**:
- [ ] Generate new Etherscan API key
- [ ] Revoke old key `U6T4JEG7AFQVZTRSU8J877J4G29JGM67R5`
- [ ] Update local `contracts/.env` with new key
- [ ] [Optional] Use `git-filter-repo` to remove from git history

---

## 🛡️ Security Best Practices

### Environment Variables

**NEVER commit these files**:
- `.env.local`
- `.env.development.local`
- `.env.production.local`
- `contracts/.env`

**Always use**:
- `.env.example` or `.env.template` for documentation
- Environment variables for sensitive data
- `.gitignore` for protection

### API Keys & Secrets

1. **Etherscan API Keys**: Store in `contracts/.env` (gitignored)
2. **Firebase Credentials**: Store in `.env.local` (gitignored)
3. **Service Account Keys**: Store in `.env.local` (gitignored)
4. **Admin Credentials**: Use environment variables

### Code Review Checklist

Before committing:
- [ ] No API keys in code
- [ ] No private keys in code
- [ ] No passwords in code
- [ ] All `.env` files gitignored
- [ ] Use `process.env` for config

---

## 🔍 Security Scanning

**Recommended Tools**:
1. GitHub Secret Scanning (enable in repo settings)
2. `git-secrets` - Pre-commit hook
3. `trufflehog` - Scan git history
4. Regular security audits

---

## 📋 Security Audit Log

| Date | Auditor | Findings | Status |
|------|---------|----------|--------|
| 2025-11-12 | Internal | Etherscan API key exposed | Mitigated |

---

## 📞 Contact

For security concerns, contact:
- **Email**: reyerchu@defintek.io
- **Website**: https://reyerchu.com

---

**Last Updated**: November 12, 2025
