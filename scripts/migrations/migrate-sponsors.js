/**
 * 迁移脚本：将现有 sponsors 迁移到 extended-sponsors
 *
 * 用法：
 *   node scripts/migrations/migrate-sponsors.js
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

async function migrateSponsorToExtended(sponsorDoc) {
  const sponsorData = sponsorDoc.data();
  const sponsorId = sponsorDoc.id;

  console.log(`  迁移 sponsor: ${sponsorId}`);

  // 构建扩展的赞助商数据
  const extendedSponsor = {
    // 基本信息（从原数据推断）
    name: extractNameFromReference(sponsorData.reference),
    logo: sponsorData.reference, // 原来的 reference 字段现在作为 logo
    website: sponsorData.link || '',

    // 默认为一般赞助商
    tier: 'general',

    // 联系人（需要手动填充）
    contacts: [],

    // 默认权限
    permissions: {
      canEditTrackChallenge: false,
      canViewSubmissions: false,
      canJudge: false,
      canContactTeams: false,
    },

    // 状态
    status: 'active',

    // 时间戳
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  // 写入到 extended-sponsors
  await db.collection('extended-sponsors').doc(sponsorId).set(extendedSponsor);

  return extendedSponsor;
}

function extractNameFromReference(reference) {
  // 从文件名提取赞助商名称
  // 例如: "cathay-logo.png" -> "Cathay"
  if (!reference) return 'Unknown Sponsor';

  const filename = reference.split('/').pop();
  const nameWithoutExt = filename.split('.')[0];
  const name = nameWithoutExt
    .split('-')[0]
    .split('_')[0]
    .replace(/logo|icon|img/gi, '')
    .trim();

  return name.charAt(0).toUpperCase() + name.slice(1);
}

async function main() {
  console.log('🚀 开始迁移 sponsors 到 extended-sponsors...\n');

  try {
    // 获取所有现有的 sponsors
    const sponsorsSnapshot = await db.collection('sponsors').get();

    if (sponsorsSnapshot.empty) {
      console.log('⚠️  没有找到任何 sponsors 数据');
      return;
    }

    console.log(`找到 ${sponsorsSnapshot.size} 个 sponsors\n`);

    // 迁移每个 sponsor
    let successCount = 0;
    let errorCount = 0;

    for (const doc of sponsorsSnapshot.docs) {
      try {
        await migrateSponsorToExtended(doc);
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
    console.log(`📊 总计: ${sponsorsSnapshot.size}`);
    console.log('');
    console.log('⚠️  注意：迁移后的数据需要手动补充：');
    console.log('   - 联系人信息');
    console.log('   - 赞助层级和金额');
    console.log('   - 赛道关联');
    console.log('   - 权限设置');
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
