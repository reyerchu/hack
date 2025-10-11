/**
 * 遷移 API: 為沒有 nickname 和 teamStatus 的舊用戶設置預設值
 * - nickname: 使用 firstName（名字）
 * - teamStatus: 設置為 'individual'（個人）
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持 POST 方法' });
  }

  try {
    // 1. 初始化 Firebase Admin
    const admin = await import('firebase-admin');
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }

    const db = admin.firestore();

    // 2. 獲取所有 registrations
    const registrationsSnapshot = await db.collection('registrations').get();

    let total = 0;
    let nicknameUpdated = 0;
    let teamStatusUpdated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // 3. 遍歷所有註冊資料
    for (const doc of registrationsSnapshot.docs) {
      total++;
      const data = doc.data();
      const updates: any = {};
      let needsUpdate = false;

      // 檢查是否需要更新 nickname
      if (!data.nickname) {
        // 使用 firstName 作為預設 nickname
        const firstName = data.user?.firstName || data.firstName;
        if (firstName) {
          updates.nickname = firstName;
          nicknameUpdated++;
          needsUpdate = true;
        } else {
          errors.push(`用戶 ${doc.id}: 沒有 firstName，無法設置 nickname`);
        }
      }

      // 檢查是否需要更新 teamStatus
      if (!data.teamStatus) {
        updates.teamStatus = 'individual';
        teamStatusUpdated++;
        needsUpdate = true;
      }

      // 如果有需要更新的欄位，執行更新
      if (needsUpdate) {
        try {
          await doc.ref.update(updates);
        } catch (error) {
          errors.push(`用戶 ${doc.id}: 更新失敗 - ${error}`);
        }
      } else {
        skipped++;
      }
    }

    // 4. 返回統計結果
    return res.status(200).json({
      success: true,
      message: '遷移完成',
      stats: {
        total,
        nicknameUpdated,
        teamStatusUpdated,
        skipped,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('遷移錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '遷移失敗',
      error: error.message,
    });
  }
}
