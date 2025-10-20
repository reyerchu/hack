/**
 * 脚本：迁移 Tracks 数据
 * 
 * 功能：
 * 1. 检查 /extended-challenges 中的 track-only 记录
 * 2. 迁移到 /tracks 集合
 * 3. 保留原始记录（不删除）
 */

const admin = require('firebase-admin');
require('dotenv').config();

// 初始化 Firebase Admin（使用环境变量）
if (!admin.apps.length) {
  // 检查必要的环境变量
  if (
    !process.env.SERVICE_ACCOUNT_PROJECT_ID ||
    !process.env.SERVICE_ACCOUNT_CLIENT_EMAIL ||
    !process.env.SERVICE_ACCOUNT_PRIVATE_KEY
  ) {
    console.error('❌ 缺少 Firebase 环境变量！');
    console.error('请确保 .env 文件包含以下变量：');
    console.error('- SERVICE_ACCOUNT_PROJECT_ID');
    console.error('- SERVICE_ACCOUNT_CLIENT_EMAIL');
    console.error('- SERVICE_ACCOUNT_PRIVATE_KEY');
    process.exit(1);
  }

  // 处理私钥格式
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
  
  console.log('✓ Firebase Admin SDK 初始化成功\n');
}

const db = admin.firestore();

async function analyzeAndMigrate() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 分析和迁移 Tracks 数据');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. 检查 /tracks 集合
    console.log('1️⃣  检查 /tracks 集合...');
    const tracksSnapshot = await db.collection('tracks').get();
    console.log(`   ✓ 找到 ${tracksSnapshot.size} 条记录\n`);

    if (tracksSnapshot.size > 0) {
      console.log('   现有 tracks:');
      tracksSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.trackId} - ${data.name} (sponsor: ${data.sponsorName})`);
      });
      console.log('');
    }

    // 2. 检查 /extended-challenges 中的 track-only 记录
    console.log('2️⃣  检查 /extended-challenges 中的 track-only 记录...');
    const challengesSnapshot = await db.collection('extended-challenges').get();
    console.log(`   ✓ 总共 ${challengesSnapshot.size} 条记录\n`);

    const trackOnlyRecords = [];
    const realChallenges = [];

    challengesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const hasTitle = data.title && data.title.trim() !== '';
      const hasChallengeId = data.challengeId && data.challengeId.trim() !== '';
      
      if (!hasTitle && !hasChallengeId) {
        // Track-only record
        trackOnlyRecords.push({ id: doc.id, ...data });
      } else {
        // Real challenge
        realChallenges.push({ id: doc.id, ...data });
      }
    });

    console.log(`   📊 统计:`);
    console.log(`      - Track-only 记录: ${trackOnlyRecords.length}`);
    console.log(`      - 真正的 Challenges: ${realChallenges.length}\n`);

    if (trackOnlyRecords.length > 0) {
      console.log('   Track-only 记录列表:');
      trackOnlyRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.trackId} - ${record.track || record.name || 'N/A'}`);
        console.log(`      Sponsor: ${record.sponsorName || 'N/A'}`);
        console.log(`      Status: ${record.status || 'N/A'}`);
        console.log(`      DocID: ${record.id}`);
      });
      console.log('');

      // 3. 询问是否迁移
      console.log('3️⃣  准备迁移...');
      console.log(`   将迁移 ${trackOnlyRecords.length} 条 track-only 记录到 /tracks 集合\n`);

      // 自动迁移
      let migratedCount = 0;
      let skippedCount = 0;

      for (const record of trackOnlyRecords) {
        // 检查是否已存在
        const existingTrack = await db.collection('tracks')
          .where('trackId', '==', record.trackId)
          .limit(1)
          .get();

        if (!existingTrack.empty) {
          console.log(`   ⊘ 跳过 ${record.trackId} (已存在于 /tracks)`);
          skippedCount++;
          continue;
        }

        // 创建新的 track 记录
        const trackData = {
          trackId: record.trackId,
          name: record.track || record.name || record.trackId,
          description: record.description || '',
          sponsorId: record.sponsorId || '',
          sponsorName: record.sponsorName || '',
          status: record.status === 'published' ? 'active' : (record.status || 'active'),
          
          // 保留原始元数据
          createdAt: record.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          createdBy: record.createdBy || 'migration-script',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          
          // 迁移元数据
          migratedFrom: 'extended-challenges',
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          originalDocId: record.id,
        };

        await db.collection('tracks').add(trackData);
        console.log(`   ✓ 迁移成功: ${record.trackId}`);
        migratedCount++;
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ 迁移完成！');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   • 迁移成功: ${migratedCount} 条`);
      console.log(`   • 跳过: ${skippedCount} 条`);
      console.log(`   • 总计: ${migratedCount + skippedCount} 条\n`);

      console.log('📝 注意事项:');
      console.log('   1. 原始数据仍保留在 /extended-challenges 中');
      console.log('   2. 新数据已添加到 /tracks 集合');
      console.log('   3. API 会自动过滤 /extended-challenges 中的 track-only 记录');
      console.log('   4. 现在可以访问 /admin/track-management 查看迁移的 tracks\n');

    } else {
      console.log('   ℹ️  没有找到需要迁移的 track-only 记录\n');
    }

    // 4. 最终统计
    const finalTracksSnapshot = await db.collection('tracks').get();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 最终统计');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   /tracks 集合: ${finalTracksSnapshot.size} 条记录`);
    console.log(`   /extended-challenges 集合:`);
    console.log(`      - 真正的 Challenges: ${realChallenges.length} 条`);
    console.log(`      - Track-only 记录: ${trackOnlyRecords.length} 条 (将被 API 过滤)\n`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error);
  }

  process.exit(0);
}

// 运行脚本
analyzeAndMigrate();

