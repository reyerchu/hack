import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../lib/admin/init';

initializeApi();

const admin = require('firebase-admin');

/**
 * API 端點：通过文件名下载履历
 * GET /api/resume-download?fileName=xxx
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { fileName } = req.query;

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'fileName is required',
      });
    }

    // URL 解码文件名
    const decodedFileName = decodeURIComponent(fileName);
    console.log('[Resume Download] 搜索文件:', decodedFileName);

    // 获取 Firebase Storage
    const storageBucket =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'hackathon-rwa-nexus.firebasestorage.app';
    const bucket = admin.storage().bucket(storageBucket);

    try {
      // 搜索 resumes 目录下的所有文件
      const [files] = await bucket.getFiles({
        prefix: 'resumes/',
      });

      console.log('[Resume Download] 找到', files.length, '个文件');

      // 查找匹配的文件（文件名匹配）
      const matchingFile = files.find((file) => {
        const fileNameOnly = file.name.split('/').pop();
        return fileNameOnly === decodedFileName;
      });

      if (!matchingFile) {
        console.log('[Resume Download] 文件不存在:', decodedFileName);
        return res.status(404).json({
          success: false,
          message: '履歷文件不存在',
          fileName: decodedFileName,
        });
      }

      console.log('[Resume Download] 找到文件:', matchingFile.name);

      // 获取签名的下载 URL
      const [url] = await matchingFile.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 天有效
      });

      // 重定向到下载 URL
      return res.redirect(url);
    } catch (storageError: any) {
      console.error('[Resume Download] Storage 错误:', storageError.message);

      return res.status(500).json({
        success: false,
        message: 'Storage 访问失败',
        error: storageError.message,
      });
    }
  } catch (error: any) {
    console.error('[Resume Download] 错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message,
    });
  }
}
