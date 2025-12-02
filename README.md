# RWA Hackathon Taiwan Portal

### _A professional and elegant platform for Web3 hackathon event management._

[![Live Site](https://img.shields.io/badge/Live-hackathon.com.tw-blue)](https://hackathon.com.tw)
[![Version](https://img.shields.io/badge/version-1.0.6-green.svg)](https://github.com/reyerchu/hack)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

🌐 **Live Site**: [hackathon.com.tw](https://hackathon.com.tw)

Forked from [HackPortal by ACM UTD](https://github.com/acmutd/hackportal)

---

## 🎯 About

The **RWA Hackathon Taiwan Portal** is a comprehensive platform designed for Taiwan's first RWA (Real World Assets) Hackathon. Built with Next.js and Firebase, it provides a professional, elegant, and user-friendly experience for participants, sponsors, mentors, and organizers.

---

## ✨ Key Features

### 🏠 Public Pages

- **首頁 (Home)** - Professional landing page with dynamic carousel, real-time statistics, and elegant animations
- **賽道挑戰 (Tracks & Challenges)** - Comprehensive sponsor tracks with detailed challenge descriptions and prize information
- **時程表 (Schedule)** - Interactive event schedule with calendar integration
- **導師評審 (Mentors & Judges)** - Showcase of expert mentors and judges with profiles
- **得獎名單 (Winners)** - Elegant winners page displaying awards across all tracks with team links and logos

### 🔐 User Features

#### 📝 Registration & Profile
- Email and Google OAuth authentication
- Comprehensive user profile management
- Resume upload and management
- Privacy settings control
- Public profile pages with awards display

#### 👥 Team Management
- **Team Registration** - Easy team formation with member invitation system
- **Team Edit Page** - Separate editing interface with intuitive member management
- **Public Team Pages** - Professional team showcase with project links and awards
- **Member Permissions** - Granular edit rights for team members
- **Wallet Integration** - EVM and multi-chain wallet address management
- **Demo Day Submissions** - PDF upload for Demo Day track participants

#### 🤝 Find Teammate (Team-Up System)
- Post team needs with role descriptions
- Browse available opportunities
- Application management system
- Real-time notifications for applications
- Automated email notifications

#### 🪙 NFT System
- **Multi-Chain Support** - Ethereum, Sepolia, Arbitrum, and more
- **Merkle Tree Whitelist** - Efficient on-chain verification with automatic Merkle root generation
- **Email-Based Eligibility** - Automated whitelist management tied to user registration
- **Auto-Deployment** - Streamlined contract deployment workflow with progress tracking
- **Mint Tracking** - Complete minting history and analytics dashboard
- **IPFS Integration** - Decentralized metadata storage via Pinata
- **Smart Whitelist Management** - Add/remove emails with automatic database rollback on contract failure
- **MetaMask Integration** - Seamless wallet connection for minting and admin operations
- **Contract Verification** - Automatic Etherscan verification after deployment

### 🛠️ Admin Panel

#### 👥 User Management
- View and manage all registered users
- Role assignment (Admin, Super Admin, Sponsor)
- User statistics and analytics
- Resume download and review

#### 👨‍👩‍👧‍👦 Team Management
- View all participating teams
- Export team data to CSV
- Monitor team registrations
- Admin-only team deletion rights

#### 🏢 Sponsor Management
- Create and manage sponsor profiles
- Assign track permissions
- Upload sponsor logos and materials
- Track-specific sponsor dashboards

#### 🎯 Track & Challenge Management
- Create custom sponsor tracks
- Define challenges with prize pools
- Manage submissions and judging
- Real-time submission tracking

#### 🎨 NFT Campaign Management
- Create NFT campaigns with custom artwork and metadata
- Generate and deploy smart contracts with one-click setup
- Manage whitelist with Merkle trees and automatic root updates
- Auto-setup workflows with real-time progress tracking
- Contract verification on Etherscan/block explorers
- Mint monitoring and analytics with user tracking
- **Add Whitelist with Rollback** - Automatically reverts database changes if MetaMask/contract update fails
- **Remove Whitelist** - Safe removal with mint status checking (prevents removing minted emails)
- **Multi-language Support** - Error messages in Traditional Chinese (繁體中文)

#### 📢 Communication Tools
- Push notification system
- Announcement broadcasting
- Email notification automation
- Question & Answer system

#### 📊 Analytics & Reporting
- Real-time attendance tracking
- Check-in statistics
- Team registration metrics
- NFT minting analytics

---

## 🎨 Design Philosophy

- **Professional & Elegant** - Dark blue theme (#1a3a6e) with clean, modern UI
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Smooth Animations** - Subtle transitions and hover effects
- **Accessibility** - WCAG compliant with semantic HTML
- **Performance** - Optimized images, lazy loading, and efficient data fetching

---

## 🚀 Technical Stack

- **Frontend**: Next.js 12, React 18, TypeScript
- **Styling**: Tailwind CSS, Custom CSS
- **Backend**: Next.js API Routes, Firebase Functions
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Email/Google)
- **Storage**: Firebase Storage, IPFS (NFT metadata)
- **Blockchain**: Ethers.js, Hardhat
- **Email**: Nodemailer with SMTP
- **Process Manager**: PM2
- **Version Control**: Git with automated backups

---

## 🏗️ Project Structure

```
├── pages/                  # Next.js pages
│   ├── api/               # API routes
│   ├── admin/             # Admin panel pages
│   ├── sponsor/           # Sponsor dashboard
│   ├── teams/             # Team public pages
│   ├── nft/               # NFT campaign pages
│   └── ...
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── firebase/         # Firebase configuration
│   ├── teamRegister/     # Team management
│   └── nft/              # NFT utilities
├── public/               # Static assets
├── styles/               # Global styles
└── scripts/              # Deployment & maintenance scripts
```

---

## 🔧 Setup & Deployment

### Prerequisites
- Node.js 16+
- npm or yarn
- Firebase project
- SMTP credentials (for emails)

### Environment Variables
Create `.env.local` with the following configuration:

```bash
# ============================================
# Firebase Web App Configuration (Frontend)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_MEASUREMENT_ID=your_measurement_id

# ============================================
# Firebase Admin SDK (Backend - Service Account)
# ============================================
SERVICE_ACCOUNT_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
SERVICE_ACCOUNT_PROJECT_ID=your_project_id

# ============================================
# Email Configuration (SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_app_password
EMAIL_FROM=your_email@domain.com

# ============================================
# Google OAuth & Calendar API
# ============================================
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://your_domain.com/api/calendar/callback

# ============================================
# Site Configuration
# ============================================
NEXT_PUBLIC_SITE_URL=https://your_domain.com
NEXT_PUBLIC_API_URL=http://localhost:3008

# ============================================
# NFT & IPFS Configuration
# ============================================
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=gateway.pinata.cloud

# ============================================
# Blockchain Configuration
# ============================================
ETHERSCAN_API_KEY=your_etherscan_api_key
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# ============================================
# Admin Configuration
# ============================================
ADMIN_EMAIL=your_admin_email@domain.com
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@domain.com

# ============================================
# Optional Configuration
# ============================================
NEXT_PUBLIC_RESUME_UPLOAD_PASSWORD=your_password
NEXT_PUBLIC_RESUME_UPLOAD_SERVICE_ACCOUNT=your_service_account
NEXT_PUBLIC_VAPID_KEY=your_vapid_key
```

#### Configuration Notes:

1. **Firebase Setup**:
   - Get credentials from [Firebase Console](https://console.firebase.google.com/)
   - Web App config: Project Settings → General → Your apps
   - Service Account: Project Settings → Service Accounts → Generate new private key

2. **Email (SMTP)**:
   - For Gmail: Enable 2FA and generate an [App Password](https://myaccount.google.com/apppasswords)
   - Port 587 for TLS, Port 465 for SSL

3. **Google OAuth**:
   - Set up in [Google Cloud Console](https://console.cloud.google.com/)
   - Add authorized redirect URIs: `https://your_domain.com/api/calendar/callback`

4. **NFT & IPFS**:
   - Get Pinata JWT from [Pinata](https://www.pinata.cloud/)
   - Required for NFT metadata storage

5. **Blockchain**:
   - Etherscan API key from [Etherscan](https://etherscan.io/myapikey)
   - Required for contract verification

6. **Admin Configuration**:
   - Set `ADMIN_EMAIL` to your admin email address
   - Used for permission checks and admin notifications

### Installation
```bash
npm install
npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
```

### Safe Deployment
```bash
./safe-deploy.sh    # Automated deployment with health checks
```

---

## 🌟 Unique Features

### Simple & Elegant Schedule with Share Feature
- Clean, professional event schedule interface
- Real-time event filtering and search
- One-click share to Google Calendar
- Responsive design for mobile and desktop
- Time zone support for international participants

### NFT Auto-Setup & Whitelist Management
- One-click contract deployment with IPFS metadata upload
- Automated Merkle tree generation and on-chain root updates
- Contract verification on Etherscan with retry mechanism
- Email-based whitelist management with add/remove capabilities
- Multi-step progress tracking with real-time status updates
- **Atomic Operations** - Database changes automatically rollback if smart contract update fails
- **Error Handling** - Comprehensive error messages for MetaMask, wallet permissions, and contract errors
- **Admin Whitelist Panel** - View all whitelisted emails with mint status and one-click removal

### Find Teammate
- Skill-based matching system
- Application workflow
- Automated notifications
- Integrated with user profiles

### Email Automation
- New team registration notifications
- Team edit notifications with change tracking
- Demo Day PDF submission alerts
- Team-up application notifications

---

## 📈 Event Statistics

- **30+ Teams** participated in RWA Hackathon Taiwan 2025
- **Multiple Tracks**: Demo Day, Self Protocol, Sui, and more
- **$10,000+ in prizes** distributed across tracks
- **NFT Participation Badges** minted to all participants

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is based on [HackPortal](https://github.com/acmutd/hackportal) by ACM UTD.

---

## 🙏 Acknowledgments

- **Original Project**: [HackPortal by ACM UTD](https://github.com/acmutd/hackportal)
- **RWA Hackathon Taiwan Team** for feature requirements and testing
- **All Sponsors** for their support and track contributions
- **Participants** for their valuable feedback

---

## 📧 Contact

**Email**: [reyerchu@defintek.io](mailto:reyerchu@defintek.io)

**Websites**:
- [reyerchu.com](https://reyerchu.com) - Personal Portfolio
- [rwa.nexus](https://rwa.nexus) - RWA-focused Startup
- [defintek.io](https://defintek.io) - Online Web3 Courses

---

Built with ❤️ and Cursor AI w/ Claude Opus 4.5, for the Web3 community in Taiwan

---

## 📋 Recent Updates (v1.0.6)

### NFT Whitelist Management Improvements
- **Atomic Whitelist Operations**: When adding emails to whitelist, if the smart contract update fails (no MetaMask, wrong wallet, user rejection), the database changes are automatically rolled back
- **Improved Error Messages**: All NFT-related error messages now display in Traditional Chinese (繁體中文)
- **Safe Remove Whitelist**: API prevents removal of emails that have already minted NFTs
- **Better State Tracking**: Uses local variables instead of React state for reliable rollback detection

### Bug Fixes
- Fixed issue where emails were added to database even when MetaMask wallet was not installed
- Fixed React useState async issue in AddWhitelistModal rollback logic
- Fixed production build using development JSX runtime (eval-source-map)
- Fixed PM2 environment variable loading for Firebase private key with newlines
