/**
 * API: 上傳團隊 PDF 文件
 * POST /api/team-pdf/upload
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { firestore, auth, storage } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';

initializeApi();

const db = firestore();
const bucket = storage().bucket();

// Disable body parser for file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
      console.error('[PDF Upload] Token verification error:', error);
      return res.status(401).json({ error: '無效的授權令牌' });
    }

    const userEmail = decodedToken.email;

    // Parse form data
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB max

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      },
    );

    const teamId = Array.isArray(fields.teamId) ? fields.teamId[0] : fields.teamId;
    const teamName = Array.isArray(fields.teamName) ? fields.teamName[0] : fields.teamName;
    const pdfFile = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;

    if (!teamId || !teamName || !pdfFile) {
      return res.status(400).json({ error: '缺少必要參數' });
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
      return res.status(403).json({ error: '您沒有權限上傳此團隊的文件' });
    }

    // Validate file type
    if (pdfFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: '只接受 PDF 文件' });
    }

    // Generate filename: "隊名.pdf"
    const safeTeamName = teamName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const fileName = `${safeTeamName}.pdf`;
    const filePath = `team-pdfs/${teamId}/${fileName}`;

    // Upload to Firebase Storage
    const file = bucket.file(filePath);
    const fileBuffer = fs.readFileSync(pdfFile.filepath);

    await file.save(fileBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          uploadedBy: userEmail,
          teamId,
          teamName,
        },
      },
    });

    // Make file publicly accessible
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Update team document
    await teamDoc.ref.update({
      submittedPdf: {
        fileUrl: publicUrl,
        fileName,
        uploadedAt: firestore.FieldValue.serverTimestamp(),
        uploadedBy: userEmail,
      },
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Send email to all super_admins
    await sendEmailToSuperAdmins(teamName, fileName, publicUrl, userEmail);

    return res.status(200).json({
      success: true,
      fileUrl: publicUrl,
      fileName,
    });
  } catch (error: any) {
    console.error('[PDF Upload] Error:', error);
    return res.status(500).json({ error: '上傳失敗：' + error.message });
  }
}

async function sendEmailToSuperAdmins(
  teamName: string,
  fileName: string,
  fileUrl: string,
  uploadedBy: string,
) {
  try {
    // Get all super_admins
    const usersSnapshot = await db.collection('users').get();
    const superAdmins = usersSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return data.permissions?.includes('super_admin');
      })
      .map((doc) => doc.data().email)
      .filter((email) => email);

    if (superAdmins.length === 0) {
      console.log('[PDF Upload] No super_admins found');
      return;
    }

    console.log('[PDF Upload] Sending email to super_admins:', superAdmins);

    // Here you would integrate with your email service
    // For now, we'll just log it
    // You can use SendGrid, AWS SES, or your preferred email service

    const emailContent = {
      to: superAdmins,
      subject: `團隊 PDF 提交：${teamName}`,
      text: `
團隊「${teamName}」已提交 PDF 文件。

文件名：${fileName}
上傳者：${uploadedBy}
上傳時間：${new Date().toLocaleString('zh-TW')}

請點擊以下連結查看文件：
${fileUrl}

---
此郵件由系統自動發送
      `.trim(),
      html: `
<h2>團隊 PDF 提交通知</h2>
<p>團隊「<strong>${teamName}</strong>」已提交 PDF 文件。</p>

<table style="border-collapse: collapse; margin: 20px 0;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>文件名：</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">${fileName}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>上傳者：</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">${uploadedBy}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>上傳時間：</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleString('zh-TW')}</td>
  </tr>
</table>

<p>
  <a href="${fileUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1a3a6e; color: white; text-decoration: none; border-radius: 5px;">
    查看 PDF 文件
  </a>
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
<p style="color: #666; font-size: 12px;">此郵件由系統自動發送</p>
      `.trim(),
    };

    // TODO: Integrate with your email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send(emailContent);

    console.log('[PDF Upload] Email content prepared:', emailContent);

    // For now, just log it
    console.log(`[PDF Upload] Would send email to: ${superAdmins.join(', ')}`);
    console.log(`[PDF Upload] Subject: ${emailContent.subject}`);
    console.log(`[PDF Upload] File URL: ${fileUrl}`);
  } catch (error) {
    console.error('[PDF Upload] Error sending email:', error);
    // Don't throw error - file upload should still succeed even if email fails
  }
}
