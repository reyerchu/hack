/**
 * API to list all resume files for a user
 * GET /api/resume/list?userId=xxx
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import admin from 'firebase-admin';

initializeApi();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '只允許 GET 請求' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, message: '缺少用戶ID' });
    }

    console.log('[Resume List API] 查詢用戶履歷:', userId);

    // 從 Firestore 獲取用戶資料
    const db = admin.firestore();
    const userDoc = await db.collection('registrations').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: '找不到用戶資料' });
    }

    const userData = userDoc.data();

    // 獲取 resumes 數組，如果不存在則從舊的 resume 字段遷移
    let resumes = userData?.resumes || [];

    if (!resumes || resumes.length === 0) {
      // 向後兼容：如果沒有 resumes 數組但有 resume 字段
      if (userData?.resume) {
        resumes = [userData.resume];
      }
    }

    console.log('[Resume List API] 找到', resumes.length, '個文件');

    // 檢查每個文件在 Storage 中的狀態
    const bucket = admin.storage().bucket();
    const filesWithStatus = await Promise.all(
      resumes.map(async (fileName: string) => {
        try {
          const [files] = await bucket.getFiles({ prefix: 'resumes/' });
          const foundFile = files.find((f) => f.name.includes(fileName));

          if (foundFile) {
            const [metadata] = await foundFile.getMetadata();
            return {
              fileName,
              exists: true,
              size: metadata.size,
              contentType: metadata.contentType,
              uploadedAt: metadata.timeCreated,
              path: foundFile.name,
            };
          } else {
            return {
              fileName,
              exists: false,
            };
          }
        } catch (error) {
          console.error('[Resume List API] 檢查文件失敗:', fileName, error);
          return {
            fileName,
            exists: false,
            error: 'Storage access failed',
          };
        }
      }),
    );

    return res.status(200).json({
      success: true,
      files: filesWithStatus,
      total: filesWithStatus.length,
    });
  } catch (error: any) {
    console.error('[Resume List API] 錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '獲取履歷列表時發生錯誤',
      error: error.message,
    });
  }
}
