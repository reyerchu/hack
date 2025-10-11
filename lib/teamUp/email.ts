/**
 * Email 通知服务
 * 支持兩種發送方式：
 * 1. SendGrid API（配置 SENDGRID_API_KEY）
 * 2. Gmail SMTP（配置 SMTP_* 環境變量）
 * 否則只記錄日志（用於開發環境）
 */

import { TeamNeed, TeamApplication } from './types';
import { EMAIL_SUBJECT_TEMPLATES } from './constants';
import nodemailer from 'nodemailer';

/**
 * Email 配置
 */
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@hackathon.com.tw';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackathon.com.tw';

// SMTP 配置（用於 Gmail 或其他 SMTP 服務）
const SMTP_HOST = process.env.SMTP_HOST; // 例如：smtp.gmail.com
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER; // Gmail 郵箱
const SMTP_PASS = process.env.SMTP_PASS; // Gmail App Password

/**
 * 检查是否配置了 SendGrid
 */
function isSendGridConfigured(): boolean {
  return !!SENDGRID_API_KEY;
}

/**
 * 檢查是否配置了 SMTP
 */
function isSMTPConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

/**
 * 創建 SMTP 傳輸器（用於 nodemailer）
 */
function createSMTPTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * 使用 SMTP 發送郵件
 */
async function sendEmailViaSMTP(
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<boolean> {
  try {
    const transporter = createSMTPTransporter();

    const info = await transporter.sendMail({
      from: `"RWA Hackathon" <${SMTP_USER}>`, // 使用 SMTP_USER 作為發件人
      to,
      subject,
      text: text || subject,
      html,
    });

    console.log('[Email] SMTP email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] SMTP send failed:', error);
    return false;
  }
}

/**
 * 使用 SendGrid API 發送郵件
 */
async function sendEmailViaSendGrid(
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<boolean> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: EMAIL_FROM },
        subject,
        content: [
          { type: 'text/plain', value: text || subject },
          { type: 'text/html', value: html },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }

    console.log('[Email] SendGrid email sent successfully');
    return true;
  } catch (error) {
    console.error('[Email] SendGrid send failed:', error);
    return false;
  }
}

/**
 * 发送邮件的通用函数（自動選擇發送方式）
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<boolean> {
  // 優先使用 SMTP（如果配置了）
  if (isSMTPConfigured()) {
    console.log('[Email] Using SMTP to send email');
    return sendEmailViaSMTP(to, subject, html, text);
  }

  // 次選使用 SendGrid
  if (isSendGridConfigured()) {
    console.log('[Email] Using SendGrid to send email');
    return sendEmailViaSendGrid(to, subject, html, text);
  }

  // 如果都沒配置，只記錄日誌
  console.log('[Email] No email service configured. Email would be sent:');
  console.log(`  To: ${to}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Text: ${text || '(see HTML)'}`);
  return true; // 假裝發送成功
}

/**
 * 获取用户邮箱（从 Firebase Auth）
 */
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const admin = await import('firebase-admin');
    const userRecord = await admin.auth().getUser(userId);
    return userRecord.email || null;
  } catch (error) {
    console.error('[Email] Failed to get user email:', error);
    return null;
  }
}

/**
 * 通知需求作者收到新的申请
 */
export async function notifyAuthorNewApplication(
  need: TeamNeed,
  application: TeamApplication,
  applicantEmail?: string,
): Promise<boolean> {
  const authorEmail = await getUserEmail(need.ownerUserId);
  if (!authorEmail) {
    console.error('[Email] Cannot send notification: author email not found');
    return false;
  }

  const subject = EMAIL_SUBJECT_TEMPLATES.apply_received;
  const detailUrl = `${BASE_URL}/team-up/${need.id}/applications`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a3a6e; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .button { display: inline-block; padding: 12px 24px; background: #1a3a6e; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .highlight { background: #fff; padding: 15px; border-left: 4px solid #1a3a6e; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 收到新的隊友應徵</h1>
    </div>
    <div class="content">
      <p>您好，</p>
      <p>您發布的找隊友需求收到了新的應徵：</p>
      
      <div class="highlight">
        <strong>需求：</strong>${need.title}<br>
        <strong>專案方向：</strong>${need.projectTrack} - ${need.projectStage}
      </div>
      
      <div class="highlight">
        <strong>應徵者留言：</strong><br>
        ${application.message || '（無留言）'}
      </div>
      
      <div class="highlight">
        <strong>聯繫方式：</strong><br>
        ${application.contactForOwner}
      </div>
      
      <p>請點擊下方按鈕查看完整資訊並管理應徵：</p>
      
      <a href="${detailUrl}" class="button" style="color: white !important;">查看應徵詳情</a>
      
      <p style="color: #666; font-size: 14px;">
        💡 提示：您也可以登入網站後，在「我的儀表板」中管理所有應徵。
      </p>
    </div>
    <div class="footer">
      <p>RWA Hackathon Taiwan 找隊友平台</p>
      <p><a href="${BASE_URL}">https://hackathon.com.tw</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
您好，

您發布的找隊友需求收到了新的應徵：

需求：${need.title}
專案方向：${need.projectTrack} - ${need.projectStage}

應徵者留言：
${application.message || '（無留言）'}

聯繫方式：
${application.contactForOwner}

查看詳情：${detailUrl}

RWA Hackathon Taiwan 找隊友平台
${BASE_URL}
  `;

  return sendEmail(authorEmail, subject, html, text);
}

/**
 * 通知申请者申请已提交
 */
export async function notifyApplicantSubmitted(
  need: TeamNeed,
  application: TeamApplication,
): Promise<boolean> {
  const applicantEmail = await getUserEmail(application.applicantUserId);
  if (!applicantEmail) {
    console.error('[Email] Cannot send notification: applicant email not found');
    return false;
  }

  const subject = EMAIL_SUBJECT_TEMPLATES.apply_submitted.replace('{{needTitle}}', need.title);
  const detailUrl = `${BASE_URL}/team-up/${need.id}`;
  const dashboardUrl = `${BASE_URL}/dashboard/team-up`;
  const authorContactHint = need.contactHint || '（作者未提供額外聯繫提示）';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a3a6e; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .button { display: inline-block; padding: 12px 24px; background: #1a3a6e; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .highlight { background: #fff; padding: 15px; border-left: 4px solid #1a3a6e; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ 應徵已成功提交</h1>
    </div>
    <div class="content">
      <p>您好，</p>
      <p>您已成功應徵以下找隊友需求：</p>
      
      <div class="highlight">
        <strong>需求：</strong>${need.title}<br>
        <strong>專案方向：</strong>${need.projectTrack} - ${need.projectStage}
      </div>
      
      <div class="highlight">
        <strong>您的留言：</strong><br>
        ${application.message || '（無留言）'}
      </div>
      
      <div class="highlight">
        <strong>您留下的聯繫方式：</strong><br>
        ${application.contactForOwner}
      </div>
      
      <div class="highlight">
        <strong>對方的聯繫提示：</strong><br>
        ${authorContactHint}
      </div>
      
      <p>需求作者會收到您的應徵通知。如果他們感興趣，會透過您提供的聯繫方式與您聯繫。</p>
      
      <a href="${detailUrl}" class="button" style="color: white !important;">查看需求詳情</a>
      
      <p style="color: #666; font-size: 14px;">
        💡 提示：您可以在「我的儀表板」中查看所有應徵記錄和狀態。
      </p>
    </div>
    <div class="footer">
      <p>RWA Hackathon Taiwan 找隊友平台</p>
      <p><a href="${BASE_URL}">https://hackathon.com.tw</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
您好，

您已成功應徵以下找隊友需求：

需求：${need.title}
專案方向：${need.projectTrack} - ${need.projectStage}

您的留言：
${application.message || '（無留言）'}

您留下的聯繫方式：
${application.contactForOwner}

對方的聯繫提示：
${authorContactHint}

需求作者會收到您的應徵通知。如果他們感興趣，會透過您提供的聯繫方式與您聯繫。

查看詳情：${detailUrl}

RWA Hackathon Taiwan 找隊友平台
${BASE_URL}
  `;

  return sendEmail(applicantEmail, subject, html, text);
}

/**
 * 通知需求發布者需求已成功創建
 */
export async function notifyNeedCreated(need: TeamNeed): Promise<boolean> {
  const authorEmail = await getUserEmail(need.ownerUserId);
  if (!authorEmail) {
    console.error('[Email] Cannot send notification: author email not found');
    return false;
  }

  const subject = '[RWA Hackathon] 找隊友需求已發布成功';
  const detailUrl = `${BASE_URL}/team-up/${need.id}`;
  const editUrl = `${BASE_URL}/team-up/edit/${need.id}`;
  const profileUrl = `${BASE_URL}/profile`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a3a6e; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .button { display: inline-block; padding: 12px 24px; background: #1a3a6e; color: white !important; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .highlight { background: #fff; padding: 15px; border-left: 4px solid #1a3a6e; margin: 15px 0; }
    .tip { background: #eff6ff; padding: 12px; border-radius: 6px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 找隊友需求發布成功</h1>
    </div>
    <div class="content">
      <p>您好，</p>
      <p>您的找隊友需求已成功發布！</p>
      
      <div class="highlight">
        <strong>需求標題：</strong>${need.title}<br>
        <strong>專案方向：</strong>${need.projectTrack} - ${need.projectStage}<br>
        <strong>需要角色：</strong>${need.rolesNeeded.join('、')}
      </div>
      
      <div class="tip">
        <strong>💡 接下來會發生什麼？</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>您的需求已在找隊友列表中公開顯示</li>
          <li>其他黑客可以瀏覽並應徵您的需求</li>
          <li>收到應徵時，您會收到 Email 通知</li>
          <li>您可以在個人中心管理所有應徵</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${detailUrl}" class="button" style="color: white !important;">查看需求</a>
        <a href="${editUrl}" class="button" style="background: #6b7280; color: white !important;">編輯需求</a>
      </div>
      
      <div class="highlight">
        <strong>📋 管理您的需求：</strong><br>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>在<a href="${profileUrl}">個人中心</a>查看所有應徵記錄</li>
          <li>隨時編輯需求內容</li>
          <li>找到隊友後可以關閉需求</li>
        </ul>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        祝您找到理想的隊友，黑客松順利！🚀
      </p>
    </div>
    <div class="footer">
      <p>RWA Hackathon Taiwan 找隊友平台</p>
      <p><a href="${BASE_URL}">https://hackathon.com.tw</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
您好，

您的找隊友需求已成功發布！

需求標題：${need.title}
專案方向：${need.projectTrack} - ${need.projectStage}
需要角色：${need.rolesNeeded.join('、')}

接下來會發生什麼？
• 您的需求已在找隊友列表中公開顯示
• 其他黑客可以瀏覽並應徵您的需求
• 收到應徵時，您會收到 Email 通知
• 您可以在個人中心管理所有應徵

查看需求：${detailUrl}
編輯需求：${editUrl}
個人中心：${profileUrl}

祝您找到理想的隊友，黑客松順利！

RWA Hackathon Taiwan 找隊友平台
${BASE_URL}
  `;

  return sendEmail(authorEmail, subject, html, text);
}

/**
 * 通知申请者申请状态已更新（接受/拒绝）
 */
export async function notifyApplicantStatusUpdate(
  need: TeamNeed,
  application: TeamApplication,
  newStatus: 'accepted' | 'rejected',
): Promise<boolean> {
  const applicantEmail = await getUserEmail(application.applicantUserId);
  if (!applicantEmail) {
    console.error('[Email] Cannot send notification: applicant email not found');
    return false;
  }

  const subject =
    newStatus === 'accepted'
      ? EMAIL_SUBJECT_TEMPLATES.apply_accepted
      : EMAIL_SUBJECT_TEMPLATES.apply_rejected;

  const statusText = newStatus === 'accepted' ? '已接受' : '未通過';
  const statusEmoji = newStatus === 'accepted' ? '🎉' : '😔';
  const detailUrl = `${BASE_URL}/team-up/${need.id}`;
  const authorContactHint = need.contactHint || '（作者未提供額外聯繫提示）';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${
      newStatus === 'accepted' ? '#10b981' : '#ef4444'
    }; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .button { display: inline-block; padding: 12px 24px; background: #1a3a6e; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .highlight { background: #fff; padding: 15px; border-left: 4px solid #1a3a6e; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${statusEmoji} 應徵狀態更新：${statusText}</h1>
    </div>
    <div class="content">
      <p>您好，</p>
      <p>您的找隊友應徵狀態已更新：</p>
      
      <div class="highlight">
        <strong>需求：</strong>${need.title}<br>
        <strong>專案方向：</strong>${need.projectTrack} - ${need.projectStage}<br>
        <strong>狀態：</strong>${statusText}
      </div>
      
      ${
        newStatus === 'accepted'
          ? `
      <div class="highlight">
        <strong>對方的聯繫提示：</strong><br>
        ${authorContactHint}
      </div>
      
      <p>恭喜！您的應徵已被接受。請透過以下方式與需求發布者聯繫：</p>
      <ul>
        <li>您留下的聯繫方式：${application.contactForOwner}</li>
        <li>對方的聯繫提示：${authorContactHint}</li>
      </ul>
      
      <p>祝您組隊順利，黑客松大獲成功！🚀</p>
      `
          : `
      <p>很遺憾，您的應徵未能通過。</p>
      <p>不要氣餒！還有更多機會等著您：</p>
      <ul>
        <li>繼續瀏覽其他找隊友需求</li>
        <li>發布您自己的找隊友需求</li>
        <li>參加黑客松的工作坊和媒合活動</li>
      </ul>
      `
      }
      
      <a href="${BASE_URL}/team-up" class="button" style="color: white !important;">查看更多機會</a>
    </div>
    <div class="footer">
      <p>RWA Hackathon Taiwan 找隊友平台</p>
      <p><a href="${BASE_URL}">https://hackathon.com.tw</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
您好，

您的找隊友應徵狀態已更新：

需求：${need.title}
專案方向：${need.projectTrack} - ${need.projectStage}
狀態：${statusText}

${
  newStatus === 'accepted'
    ? `
恭喜！您的應徵已被接受。請透過以下方式與需求發布者聯繫：

您留下的聯繫方式：${application.contactForOwner}
對方的聯繫提示：${authorContactHint}

祝您組隊順利，黑客松大獲成功！
`
    : `
很遺憾，您的應徵未能通過。

不要氣餒！還有更多機會等著您：
- 繼續瀏覽其他找隊友需求
- 發布您自己的找隊友需求
- 參加黑客松的工作坊和媒合活動
`
}

查看更多機會：${BASE_URL}/team-up

RWA Hackathon Taiwan 找隊友平台
${BASE_URL}
  `;

  return sendEmail(applicantEmail, subject, html, text);
}
