/**
 * 遷移腳本：為舊的找隊友需求添加 ownerNickname
 *
 * 使用方法：
 * curl -X POST https://hackathon.com.tw/api/team-up/migrate-nicknames \
 *   -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 簡單的認證檢查（您可以加強這個）
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '未授權' });
    }

    const admin = await import('firebase-admin');
    const db = admin.firestore();

    // 獲取所有沒有 ownerNickname 或 ownerNickname 為空的需求
    const needsSnapshot = await db.collection('teamNeeds').get();

    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const needDoc of needsSnapshot.docs) {
      const needData = needDoc.data();

      // 如果已經有 ownerNickname 且不為空，跳過
      if (needData.ownerNickname) {
        skippedCount++;
        continue;
      }

      try {
        // 嘗試從註冊資料獲取 nickname
        const ownerUserId = needData.ownerUserId;
        if (!ownerUserId) {
          errors.push(`需求 ${needDoc.id}: 沒有 ownerUserId`);
          continue;
        }

        const registrationDoc = await db.collection('registrations').doc(ownerUserId).get();

        let nickname: string;
        if (registrationDoc.exists) {
          const registrationData = registrationDoc.data();
          // 優先使用 nickname，若無則使用 firstName（名字），最後才用完整名字
          nickname =
            registrationData?.nickname ||
            registrationData?.user?.firstName ||
            needData.ownerName ||
            '匿名用戶';
        } else {
          // 如果沒有註冊資料，使用 ownerName
          nickname = needData.ownerName || '匿名用戶';
        }

        // 更新需求
        await needDoc.ref.update({
          ownerNickname: nickname,
        });

        updatedCount++;
      } catch (error: any) {
        errors.push(`需求 ${needDoc.id}: ${error.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: '遷移完成',
      stats: {
        total: needsSnapshot.size,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: '遷移失敗',
      message: error.message,
    });
  }
}
