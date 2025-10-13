import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';

initializeApi();

const admin = require('firebase-admin');

/**
 * API 端點：獲取用戶履歷的正確 URL
 * GET /api/resume/[userId]
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    console.log('[Resume API] 查找用戶履歷:', userId);

    // 獲取用戶資料，找到履歷文件名
    const db = admin.firestore();
    const userDoc = await db.collection('registrations').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: '用戶不存在',
      });
    }

    const userData = userDoc.data();
    const resumeFileName = userData.resume || userData.user?.resume;

    if (!resumeFileName) {
      return res.status(404).json({
        success: false,
        message: '該用戶沒有上傳履歷',
      });
    }

    console.log('[Resume API] 履歷文件名:', resumeFileName);

    // 如果已經是完整 URL，直接返回
    if (resumeFileName.startsWith('http://') || resumeFileName.startsWith('https://')) {
      return res.status(200).json({
        success: true,
        url: resumeFileName,
        fileName: resumeFileName,
      });
    }

    // 嘗試從 Firebase Storage 查找文件
    const storageBucket =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'hackathon-rwa-nexus.firebasestorage.app';
    const bucket = admin.storage().bucket(storageBucket);

    console.log('[Resume API] 使用 Storage Bucket:', storageBucket);
    console.log('[Resume API] 搜索文件:', resumeFileName);

    try {
      // 嘗試列出 resumes/ 目錄下所有包含該文件名的文件
      const [files] = await bucket.getFiles({
        prefix: 'resumes/',
      });

      console.log('[Resume API] Storage 中找到', files.length, '個文件');

      // 查找匹配的文件（完全匹配文件名）
      const matchingFile = files.find((file) => {
        const fileName = file.name.split('/').pop(); // 獲取文件名部分
        return fileName === resumeFileName;
      });

      if (matchingFile) {
        console.log('[Resume API] ✅ 找到匹配文件:', matchingFile.name);

        // 獲取簽名的下載 URL
        const [url] = await matchingFile.getSignedUrl({
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 天有效
        });

        return res.status(200).json({
          success: true,
          url,
          fileName: matchingFile.name,
          path: matchingFile.name,
        });
      }

      // 如果找不到文件
      console.log('[Resume API] ❌ 找不到文件');

      return res.status(404).json({
        success: false,
        message: '履歷文件不存在',
        details: '文件可能尚未上傳，或上傳失敗。請在個人資料頁面重新上傳。',
        fileName: resumeFileName,
      });
    } catch (storageError: any) {
      console.error('[Resume API] Storage 錯誤:', storageError.message);

      return res.status(500).json({
        success: false,
        message: 'Storage 訪問失敗',
        error: storageError.message,
        details: 'Firebase Storage 可能尚未啟用，或權限配置有誤。',
      });
    }
  } catch (error: any) {
    console.error('[Resume API] 錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '服務器錯誤',
      error: error.message,
    });
  }
}
