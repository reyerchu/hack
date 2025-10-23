/**
 * 测试数据生成脚本：生成示例数据用于开发和测试
 *
 * 用法：
 *   node scripts/migrations/seed-test-data.js
 *
 * 警告：仅用于开发环境！不要在生产环境运行！
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// 示例数据：扩展的赞助商
const TEST_SPONSORS = [
  {
    id: 'cathay-test',
    name: '国泰金控（测试）',
    logo: '/sponsors/cathay-logo.png',
    website: 'https://www.cathay-ins.com.tw/',
    tier: 'track',
    trackId: 'cathay-track',
    trackName: 'RWA 代币化',
    contacts: [
      {
        name: '张三',
        email: 'test@cathay.com',
        role: 'primary',
      },
    ],
    permissions: {
      canEditTrackChallenge: true,
      canViewSubmissions: true,
      canJudge: true,
      canContactTeams: true,
    },
    status: 'active',
  },
  {
    id: 'sui-test',
    name: 'Sui（测试）',
    logo: '/sponsors/sui-logo.png',
    website: 'https://sui.io/',
    tier: 'track',
    trackId: 'sui-track',
    trackName: 'Sui 生态应用',
    contacts: [
      {
        name: '李四',
        email: 'test@sui.io',
        role: 'primary',
      },
    ],
    permissions: {
      canEditTrackChallenge: true,
      canViewSubmissions: true,
      canJudge: true,
      canContactTeams: false,
    },
    status: 'active',
  },
];

// 示例数据：扩展的挑战
const TEST_CHALLENGES = [
  {
    id: 'cathay-challenge-test',
    title: 'RWA 代币化挑战（测试）',
    description: '开发一个 RWA 代币化平台',
    detailedDescription: '# 挑战说明\n\n开发一个支持房地产、债券等资产代币化的平台...',
    track: 'RWA 代币化',
    trackId: 'cathay-track',
    sponsorId: 'cathay-test',
    sponsorName: '国泰金控（测试）',
    prizes: [
      {
        rank: 1,
        title: '第一名',
        amount: 60000,
        currency: 'TWD',
        description: '新台币 60,000 元',
      },
    ],
    requirements: {
      frameworks: ['React', 'Solidity'],
      apis: [],
      constraints: ['必须部署到测试网'],
    },
    submissionRequirements: {
      requireGithubRepo: true,
      requireDemo: true,
      requirePresentation: true,
      requireDocumentation: true,
    },
    timeline: {
      announcementDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-20')),
      submissionStart: admin.firestore.Timestamp.fromDate(new Date('2025-10-20')),
      submissionDeadline: admin.firestore.Timestamp.fromDate(new Date('2025-11-02')),
      judgingDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-02')),
      resultsDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-03')),
    },
    status: 'published',
    rank: 1,
  },
];

// 示例数据：队伍提交
const TEST_SUBMISSIONS = [
  {
    id: 'submission-test-1',
    teamName: 'RWA Stars',
    teamMembers: [
      {
        userId: 'test-user-1',
        name: '王小明',
        email: 'test1@example.com',
        role: 'leader',
      },
      {
        userId: 'test-user-2',
        name: '李小华',
        email: 'test2@example.com',
        role: 'developer',
      },
    ],
    projectName: 'RWA Token Platform',
    projectTrack: 'cathay-track',
    challengeId: 'cathay-challenge-test',
    oneLiner: '一个创新的 RWA 代币化平台',
    description: '我们开发了一个支持多种资产类型的代币化平台...',
    githubRepo: 'https://github.com/test/rwa-platform',
    demoUrl: 'https://demo.rwa-platform.com',
    techStack: ['React', 'Solidity', 'IPFS', 'Node.js'],
    status: 'submitted',
    submittedAt: admin.firestore.Timestamp.now(),
  },
  {
    id: 'submission-test-2',
    teamName: 'Blockchain Builders',
    teamMembers: [
      {
        userId: 'test-user-3',
        name: '陈大成',
        email: 'test3@example.com',
        role: 'leader',
      },
    ],
    projectName: 'Asset Chain',
    projectTrack: 'cathay-track',
    challengeId: 'cathay-challenge-test',
    oneLiner: '基于区块链的资产管理系统',
    description: '利用智能合约管理各类资产...',
    githubRepo: 'https://github.com/test/asset-chain',
    demoUrl: 'https://demo.asset-chain.com',
    techStack: ['Vue', 'Solidity', 'Web3.js'],
    status: 'submitted',
    submittedAt: admin.firestore.Timestamp.now(),
  },
];

// 示例数据：评审标准
const TEST_JUDGING_CRITERIA = [
  {
    id: 'criteria-cathay-test',
    challengeId: 'cathay-challenge-test',
    criteria: [
      {
        name: 'innovation',
        description: '创新性',
        maxScore: 10,
        weight: 0.3,
      },
      {
        name: 'technical',
        description: '技术实现',
        maxScore: 10,
        weight: 0.4,
      },
      {
        name: 'business',
        description: '商业可行性',
        maxScore: 10,
        weight: 0.2,
      },
      {
        name: 'presentation',
        description: '展示质量',
        maxScore: 10,
        weight: 0.1,
      },
    ],
  },
];

// 示例数据：赞助商用户映射
const TEST_SPONSOR_USER_MAPPINGS = [
  {
    id: 'mapping-test-1',
    sponsorId: 'cathay-test',
    userId: 'test-sponsor-user-1',
    role: 'admin',
  },
  {
    id: 'mapping-test-2',
    sponsorId: 'sui-test',
    userId: 'test-sponsor-user-2',
    role: 'judge',
  },
];

async function seedCollection(collectionName, data) {
  console.log(`  ✍️  写入 ${collectionName}: ${data.id}`);
  await db
    .collection(collectionName)
    .doc(data.id)
    .set({
      ...data,
      id: undefined, // 移除 id 字段（已在 doc 路径中）
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
}

async function main() {
  console.log('🌱 开始生成测试数据...\n');

  // 确认操作
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ 错误：不能在生产环境运行此脚本！');
    process.exit(1);
  }

  try {
    // 1. 生成赞助商数据
    console.log('1️⃣ 生成赞助商数据...');
    for (const sponsor of TEST_SPONSORS) {
      await seedCollection('extended-sponsors', sponsor);
    }

    // 2. 生成挑战数据
    console.log('\n2️⃣ 生成挑战数据...');
    for (const challenge of TEST_CHALLENGES) {
      await seedCollection('extended-challenges', challenge);
    }

    // 3. 生成提交数据
    console.log('\n3️⃣ 生成提交数据...');
    for (const submission of TEST_SUBMISSIONS) {
      await seedCollection('team-submissions', submission);
    }

    // 4. 生成评审标准
    console.log('\n4️⃣ 生成评审标准...');
    for (const criteria of TEST_JUDGING_CRITERIA) {
      await seedCollection('judging-criteria', criteria);
    }

    // 5. 生成用户映射
    console.log('\n5️⃣ 生成用户映射...');
    for (const mapping of TEST_SPONSOR_USER_MAPPINGS) {
      await seedCollection('sponsor-user-mappings', mapping);
    }

    console.log('\n════════════════════════════════════════');
    console.log('  ✅ 测试数据生成完成！');
    console.log('════════════════════════════════════════');
    console.log(`📦 赞助商: ${TEST_SPONSORS.length}`);
    console.log(`📦 挑战: ${TEST_CHALLENGES.length}`);
    console.log(`📦 提交: ${TEST_SUBMISSIONS.length}`);
    console.log(`📦 评审标准: ${TEST_JUDGING_CRITERIA.length}`);
    console.log(`📦 用户映射: ${TEST_SPONSOR_USER_MAPPINGS.length}`);
    console.log('');
    console.log('💡 提示：');
    console.log('   - 测试用户 ID: test-sponsor-user-1, test-sponsor-user-2');
    console.log('   - 测试赞助商 ID: cathay-test, sui-test');
    console.log('   - 测试挑战 ID: cathay-challenge-test');
    console.log('');
  } catch (error) {
    console.error('❌ 生成测试数据失败:', error);
    process.exit(1);
  }
}

// 执行生成
main()
  .then(() => {
    console.log('✅ 脚本执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
