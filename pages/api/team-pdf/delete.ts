/**
 * API: 刪除團隊 PDF 文件
 * DELETE /api/team-pdf/delete
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth, storage } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';

initializeApi();

const db = firestore();
const bucket = storage().bucket();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization as string;
    if (!authHeader) {
      return res.status(401).json({ error: '未授權' });
    }

    // Extract token (handle both "Bearer token" and plain "token" formats)
    const token = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : authHeader;

    let decodedToken;
    try {
      decodedToken = await auth().verifyIdToken(token);
    } catch (error) {
      console.error('[PDF Delete] Token verification error:', error);
      return res.status(401).json({ error: '無效的授權令牌' });
    }

    const userEmail = decodedToken.email;

    // Parse request body
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ error: '缺少團隊 ID' });
    }

    // Verify team exists and user has edit rights
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ error: '團隊不存在' });
    }

    const teamData = teamDoc.data();
    const hasEditRight =
      teamData?.teamLeader?.email === userEmail ||
      teamData?.teamMembers?.some(
        (member: any) => member.email === userEmail && member.hasEditRight,
      );

    if (!hasEditRight) {
      return res.status(403).json({ error: '您沒有權限刪除此團隊的文件' });
    }

    // Check if PDF exists
    if (!teamData?.submittedPdf) {
      return res.status(404).json({ error: '沒有已提交的 PDF' });
    }

    // Delete file from Storage
    try {
      // Use the stored filename from database
      const fileName = teamData.submittedPdf.fileName || 'document.pdf';
      const filePath = `team-pdfs/${teamId}/${fileName}`;

      const file = bucket.file(filePath);
      await file.delete();

      console.log(`[PDF Delete] Deleted file: ${filePath}`);
    } catch (storageError) {
      console.error('[PDF Delete] Storage deletion error:', storageError);
      // Continue even if file deletion fails (file might not exist)
    }

    // Remove PDF info from team document
    await teamDoc.ref.update({
      submittedPdf: firestore.FieldValue.delete(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: 'PDF 已刪除',
    });
  } catch (error: any) {
    console.error('[PDF Delete] Error:', error);
    return res.status(500).json({ error: '刪除失敗：' + error.message });
  }
}
