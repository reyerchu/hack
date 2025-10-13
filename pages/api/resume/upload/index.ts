import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import multer from 'multer';
import initializeApi from '../../../../lib/admin/init';

initializeApi();
const admin = require('firebase-admin');

interface NCNextApiRequest extends NextApiRequest {
  file: Express.Multer.File;
}

const handler = nc<NCNextApiRequest, NextApiResponse>({
  onError: (err, req, res, next) => {
    console.error('[Resume Upload] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  },
  onNoMatch: (req, res, next) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  },
});

handler.use(multer().single('resume'));
handler.post(async (req, res) => {
  try {
    console.log('[Resume Upload] 收到上傳請求');

    if (!req.file) {
      console.log('[Resume Upload] 沒有文件');
      return res.status(400).json({
        success: false,
        message: '沒有上傳文件',
      });
    }

    const fileName = req.body.fileName;
    const studyLevel = req.body.studyLevel || 'Unknown';
    const major = req.body.major || 'Unknown';
    const userId = req.body.userId; // 用戶ID，用於更新 Firestore

    console.log('[Resume Upload] 文件信息:');
    console.log('  - 用戶ID:', userId);
    console.log('  - 文件名:', fileName);
    console.log('  - Study Level:', studyLevel);
    console.log('  - Major:', major);
    console.log('  - 文件大小:', req.file.size, 'bytes');
    console.log('  - MIME 類型:', req.file.mimetype);

    // 使用 Firebase Admin SDK 上传
    const storageBucket =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'hackathon-rwa-nexus.firebasestorage.app';
    const bucket = admin.storage().bucket(storageBucket);

    // 构建文件路径
    const filePath = `resumes/${studyLevel}/${major}/${fileName}`;
    const file = bucket.file(filePath);

    console.log('[Resume Upload] 上傳路徑:', filePath);
    console.log('[Resume Upload] Bucket:', storageBucket);

    // 上传文件
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalName: req.file.originalname,
        },
      },
    });

    console.log('[Resume Upload] ✅ Storage 上傳成功');

    // 生成下载 URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 年有效期
    });

    console.log('[Resume Upload] 生成的 URL:', url.substring(0, 100) + '...');

    // 更新 Firestore：添加文件到 resumes 數組
    if (userId) {
      try {
        const db = admin.firestore();
        const userDoc = await db.collection('registrations').doc(userId).get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const existingResumes = userData?.resumes || (userData?.resume ? [userData.resume] : []);

          // 避免重複添加
          if (!existingResumes.includes(fileName)) {
            const updatedResumes = [...existingResumes, fileName];

            await db.collection('registrations').doc(userId).update({
              resumes: updatedResumes,
              resume: updatedResumes[0], // 保持向後兼容，第一個文件作為主履歷
            });

            console.log('[Resume Upload] ✅ Firestore 已更新，總文件數:', updatedResumes.length);
          } else {
            console.log('[Resume Upload] ℹ️  文件已存在於列表中');
          }
        }
      } catch (dbError: any) {
        console.error('[Resume Upload] ⚠️  Firestore 更新失敗:', dbError.message);
        // 繼續返回成功，因為文件已上傳
      }
    }

    res.status(200).json({
      success: true,
      message: '上傳成功',
      fileName: fileName,
      filePath: filePath,
      url: url,
    });
  } catch (error: any) {
    console.error('[Resume Upload] ❌ 上傳失敗:', error);
    res.status(500).json({
      success: false,
      message: '上傳失敗',
      error: error.message,
    });
  }
});

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};

export default handler;
