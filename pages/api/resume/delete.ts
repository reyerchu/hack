/**
 * API to delete a resume file from Firebase Storage
 * DELETE /api/resume/delete
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import admin from 'firebase-admin';

initializeApi();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: '只允許 DELETE 請求' });
  }

  try {
    // 1. 驗證用戶身份
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未提供身份驗證令牌' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('[Resume Delete API] Token verification failed:', error);
      return res.status(401).json({ success: false, message: '身份驗證失敗' });
    }

    const currentUserId = decodedToken.uid;
    const { fileName, targetUserId } = req.body;

    if (!fileName) {
      return res.status(400).json({ success: false, message: '缺少文件名' });
    }

    // 確定要操作的用戶ID（如果是 super-admin 刪除他人文件）
    let targetUid = currentUserId;

    if (targetUserId && targetUserId !== currentUserId) {
      // 如果要刪除其他用戶的文件，需要驗證權限
      const db = admin.firestore();
      const adminUserDoc = await db.collection('registrations').doc(currentUserId).get();
      const adminUserData = adminUserDoc.data();
      const permissions = adminUserData?.user?.permissions || [];

      if (!permissions.includes('super_admin')) {
        return res.status(403).json({
          success: false,
          message: '只有 Super Admin 可以刪除其他用戶的文件',
        });
      }

      targetUid = targetUserId;
      console.log(
        '[Resume Delete API] Super-admin',
        currentUserId,
        '刪除用戶',
        targetUid,
        '的文件:',
        fileName,
      );
    } else {
      console.log('[Resume Delete API] 用戶:', currentUserId, '刪除自己的文件:', fileName);
    }

    // 2. 驗證文件所有權（從 Firestore 檢查）
    const db = admin.firestore();
    const userDoc = await db.collection('registrations').doc(targetUid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: '找不到用戶資料' });
    }

    const userData = userDoc.data();
    const resumes = userData?.resumes || (userData?.resume ? [userData.resume] : []);

    // 檢查文件是否屬於該用戶
    if (!resumes.includes(fileName)) {
      return res.status(404).json({ success: false, message: '該用戶沒有此文件' });
    }

    // 3. 從 Firebase Storage 刪除文件
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'resumes/' });

    let fileDeleted = false;
    for (const file of files) {
      if (file.name.includes(fileName)) {
        await file.delete();
        console.log('[Resume Delete API] Storage 文件已刪除:', file.name);
        fileDeleted = true;
        break;
      }
    }

    // 4. 從 Firestore 更新用戶資料（移除文件名）
    const updatedResumes = resumes.filter((f: string) => f !== fileName);

    await db
      .collection('registrations')
      .doc(targetUid)
      .update({
        resumes: updatedResumes,
        resume: updatedResumes.length > 0 ? updatedResumes[0] : null, // 保持向後兼容
      });

    console.log('[Resume Delete API] Firestore 已更新，剩餘文件:', updatedResumes.length);

    return res.status(200).json({
      success: true,
      message: '文件已刪除',
      fileDeleted,
      remainingFiles: updatedResumes.length,
    });
  } catch (error: any) {
    console.error('[Resume Delete API] 錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '刪除文件時發生錯誤',
      error: error.message,
    });
  }
}
