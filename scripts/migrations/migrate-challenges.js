/**
 * 迁移脚本：将现有 challenges 迁移到 extended-challenges
 *
 * 用法：
 *   node scripts/migrations/migrate-challenges.js
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

// 组织名称到赞助商 ID 的映射（需要根据实际情况调整）
const ORG_TO_SPONSOR_ID = {
  imToken: 'imtoken',
  国泰金控: 'cathay',
  Cathay: 'cathay',
  'Oasis Protocol': 'oasis',
  Oasis: 'oasis',
  'Self Protocol': 'self',
  Self: 'self',
  Zircuit: 'zircuit',
  Sui: 'sui',
};

// 组织名称到赛道 ID 的映射
const ORG_TO_TRACK_ID = {
  imToken: 'imtoken-track',
  国泰金控: 'cathay-track',
  Cathay: 'cathay-track',
  'Oasis Protocol': 'oasis-track',
  Oasis: 'oasis-track',
  'Self Protocol': 'self-track',
  Self: 'self-track',
  Zircuit: 'zircuit-track',
  Sui: 'sui-track',
};

async function migrateChallengeToExtended(challengeDoc) {
  const challengeData = challengeDoc.data();
  const challengeId = challengeDoc.id;

  console.log(`  迁移 challenge: ${challengeData.title}`);

  // 获取赞助商 ID
  const sponsorId = ORG_TO_SPONSOR_ID[challengeData.organization] || 'unknown';
  const trackId = ORG_TO_TRACK_ID[challengeData.organization] || `${sponsorId}-track`;

  // 解析奖金
  const prizes = (challengeData.prizes || []).map((prize, index) => ({
    rank: index + 1,
    title: `第${index + 1}名`,
    amount: extractAmountFromString(prize),
    currency: detectCurrency(prize),
    description: prize,
  }));

  // 构建扩展的挑战数据
  const extendedChallenge = {
    // 基本信息
    title: challengeData.title,
    description: challengeData.description,

    // 赛道信息
    track: challengeData.organization,
    trackId: trackId,

    // 赞助商关联
    sponsorId: sponsorId,
    sponsorName: challengeData.organization,

    // 奖金
    prizes: prizes,

    // 默认要求
    requirements: {
      frameworks: [],
      apis: [],
      constraints: [],
    },

    submissionRequirements: {
      requireGithubRepo: true,
      requireDemo: true,
      requirePresentation: false,
      requireDocumentation: false,
    },

    // 默认时间线（需要手动调整）
    timeline: {
      announcementDate: admin.firestore.Timestamp.fromDate(new Date('2025-10-20')),
      submissionStart: admin.firestore.Timestamp.fromDate(new Date('2025-10-20')),
      submissionDeadline: admin.firestore.Timestamp.fromDate(new Date('2025-11-02')),
      judgingDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-02')),
      resultsDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-03')),
    },

    // 状态
    status: 'published',
    rank: challengeData.rank || 99,

    // 元数据
    createdBy: 'migration-script',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  // 写入到 extended-challenges
  await db.collection('extended-challenges').doc(challengeId).set(extendedChallenge);

  return extendedChallenge;
}

function extractAmountFromString(prizeStr) {
  // 尝试从字符串中提取金额
  // 例如: "1000 USD" -> 1000, "$500" -> 500
  if (!prizeStr) return 0;

  const match = prizeStr.match(/[\d,]+/);
  if (match) {
    return parseInt(match[0].replace(/,/g, ''));
  }

  return 0;
}

function detectCurrency(prizeStr) {
  // 检测货币类型
  if (!prizeStr) return 'USD';

  const lowerStr = prizeStr.toLowerCase();

  if (lowerStr.includes('twd') || lowerStr.includes('台幣') || lowerStr.includes('台币')) {
    return 'TWD';
  }

  if (lowerStr.includes('usd') || lowerStr.includes('美元') || lowerStr.includes('$')) {
    return 'USD';
  }

  return 'USD'; // 默认
}

async function main() {
  console.log('🚀 开始迁移 challenges 到 extended-challenges...\n');

  try {
    // 获取所有现有的 challenges
    const challengesSnapshot = await db.collection('challenges').get();

    if (challengesSnapshot.empty) {
      console.log('⚠️  没有找到任何 challenges 数据');
      return;
    }

    console.log(`找到 ${challengesSnapshot.size} 个 challenges\n`);

    // 迁移每个 challenge
    let successCount = 0;
    let errorCount = 0;

    for (const doc of challengesSnapshot.docs) {
      try {
        await migrateChallengeToExtended(doc);
        successCount++;
      } catch (error) {
        console.error(`  ❌ 迁移失败: ${doc.id}`, error.message);
        errorCount++;
      }
    }

    console.log('\n════════════════════════════════════════');
    console.log('  迁移完成！');
    console.log('════════════════════════════════════════');
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${errorCount}`);
    console.log(`📊 总计: ${challengesSnapshot.size}`);
    console.log('');
    console.log('⚠️  注意：迁移后的数据需要手动补充：');
    console.log('   - 详细描述 (detailedDescription)');
    console.log('   - 技术要求 (requirements)');
    console.log('   - 提交要求 (submissionRequirements)');
    console.log('   - 准确的时间线 (timeline)');
    console.log('   - 附件文档 (attachments)');
    console.log('');
  } catch (error) {
    console.error('❌ 迁移过程出错:', error);
    process.exit(1);
  }
}

// 执行迁移
main()
  .then(() => {
    console.log('✅ 迁移脚本执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
