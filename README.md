# RWA Hackathon Taiwan Portal

### _A professional and elegant platform for Web3 hackathon event management._

[![Live Site](https://img.shields.io/badge/Live-hackathon.com.tw-blue)](https://hackathon.com.tw)
[![Version](https://img.shields.io/badge/version-1.0.3-green.svg)](https://github.com/reyerchu/hack)
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
- **Merkle Tree Whitelist** - Efficient on-chain verification
- **Email-Based Eligibility** - Automated whitelist management
- **Auto-Deployment** - Streamlined contract deployment workflow
- **Mint Tracking** - Complete minting history and analytics
- **IPFS Integration** - Decentralized metadata storage

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
- Create NFT campaigns with custom artwork
- Generate and deploy smart contracts
- Manage whitelist with Merkle trees
- Auto-setup workflows with progress tracking
- Contract verification on block explorers
- Mint monitoring and analytics

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
Create `.env.local` with:
```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Blockchain (for NFT features)
PRIVATE_KEY=
ALCHEMY_API_KEY=
ETHERSCAN_API_KEY=
```

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

### Team Edit System
- Separated team registration and edit pages
- Visual member management with role badges
- Team registrant highlighting
- Trash can icons for intuitive deletion
- Redirect to team public page after save/cancel

### NFT Auto-Setup
- One-click contract deployment
- Automated Merkle tree generation
- Contract verification on Etherscan
- Email-based whitelist management
- Multi-step progress tracking

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

For questions or support, please contact: [reyerchu@defintek.io](mailto:reyerchu@defintek.io)

---

Built with ❤️ for the Web3 community in Taiwan
