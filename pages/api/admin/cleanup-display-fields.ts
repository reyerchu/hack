import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';

/**
 * 清理數據庫中的 displayName、preferredName、authDisplayName 字段
 * GET /api/admin/cleanup-display-fields
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initializeApi();
    const db = firestore();

    console.log('🧹 開始清理無用字段...');

    const collectionsToClean = ['users', 'registrations'];
    const fieldsToRemove = ['displayName', 'preferredName', 'authDisplayName'];

    let totalUpdated = 0;
    const details: any[] = [];

    for (const collectionName of collectionsToClean) {
      console.log(`\n📦 處理集合: ${collectionName}`);

      const snapshot = await db.collection(collectionName).get();
      console.log(`找到 ${snapshot.size} 個文檔`);

      let updatedInCollection = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const fieldsFound: string[] = [];
        const updateData: any = {};
        const removedValues: any = {};

        // 檢查哪些字段存在
        for (const field of fieldsToRemove) {
          if (data.hasOwnProperty(field)) {
            fieldsFound.push(field);
            removedValues[field] = data[field];
            updateData[field] = firestore.FieldValue.delete();
          }
        }

        if (fieldsFound.length > 0) {
          console.log(`📝 文檔: ${doc.id}`);
          console.log(`   Nickname: ${data.nickname || '(無)'}`);
          console.log(`   移除字段: ${fieldsFound.join(', ')}`);

          // 執行更新
          await doc.ref.update(updateData);
          updatedInCollection++;

          details.push({
            collection: collectionName,
            docId: doc.id,
            nickname: data.nickname || null,
            removedFields: fieldsFound,
            removedValues,
          });

          console.log(`   ✅ 已更新`);
        }
      }

      console.log(`✅ ${collectionName}: 已更新 ${updatedInCollection} 個文檔`);
      totalUpdated += updatedInCollection;
    }

    console.log(`\n🎉 清理完成！總計更新: ${totalUpdated} 個文檔`);

    return res.status(200).json({
      success: true,
      message: '清理完成',
      totalUpdated,
      collections: collectionsToClean,
      fieldsRemoved: fieldsToRemove,
      details,
    });
  } catch (error: any) {
    console.error('[Cleanup Display Fields] Error:', error);
    return res.status(500).json({
      error: 'Failed to cleanup fields',
      details: error.message,
    });
  }
}
