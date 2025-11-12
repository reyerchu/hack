/**
 * 清理數據庫中的 displayName、preferredName、authDisplayName 字段
 *
 * 這些字段已棄用，只使用 nickname
 */

const admin = require('firebase-admin');

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

async function cleanupFields() {
  console.log('🧹 開始清理無用字段...\n');

  const collectionsToClean = ['users', 'registrations'];
  const fieldsToRemove = ['displayName', 'preferredName', 'authDisplayName'];

  let totalUpdated = 0;

  for (const collectionName of collectionsToClean) {
    console.log(`\n📦 處理集合: ${collectionName}`);
    console.log('='.repeat(60));

    const snapshot = await db.collection(collectionName).get();
    console.log(`找到 ${snapshot.size} 個文檔\n`);

    let updatedInCollection = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const fieldsFound = [];
      const updateData = {};

      // 檢查哪些字段存在
      for (const field of fieldsToRemove) {
        if (data.hasOwnProperty(field)) {
          fieldsFound.push(field);
          updateData[field] = admin.firestore.FieldValue.delete();
        }
      }

      if (fieldsFound.length > 0) {
        console.log(`📝 文檔: ${doc.id}`);
        console.log(`   Nickname: ${data.nickname || '(無)'}`);
        console.log(`   移除字段: ${fieldsFound.join(', ')}`);

        // 顯示要刪除的字段值
        for (const field of fieldsFound) {
          console.log(`     - ${field}: "${data[field]}"`);
        }

        // 執行更新
        await doc.ref.update(updateData);
        updatedInCollection++;
        console.log(`   ✅ 已更新\n`);
      }
    }

    console.log(`✅ ${collectionName}: 已更新 ${updatedInCollection} 個文檔`);
    totalUpdated += updatedInCollection;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n🎉 清理完成！`);
  console.log(`📊 總計更新: ${totalUpdated} 個文檔`);
  console.log(`\n✅ 現在只使用 nickname 字段`);
}

cleanupFields()
  .then(() => {
    console.log('\n✨ 腳本執行成功');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ 錯誤:', err);
    process.exit(1);
  });
