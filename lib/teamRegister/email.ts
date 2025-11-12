/**
 * Team Registration Email 通知服务
 * 支持兩種發送方式：
 * 1. SMTP（優先，配置 SMTP_* 環境變量）
 * 2. SendGrid API（備用，配置 SENDGRID_API_KEY）
 * 否則只記錄日志（用於開發環境）
 */

import nodemailer from 'nodemailer';

/**
 * Email 配置
 */
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@hackathon.com.tw';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackathon.com.tw';

// SMTP 配置
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

/**
 * 檢查是否配置了 SMTP
 */
function isSMTPConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

/**
 * 檢查是否配置了 SendGrid
 */
function isSendGridConfigured(): boolean {
  return !!SENDGRID_API_KEY;
}

/**
 * 創建 SMTP 傳輸器
 */
function createSMTPTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
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
      from: `"RWA Hackathon" <${SMTP_USER}>`,
      to,
      subject,
      text: text || subject,
      html,
    });

    console.log('[TeamRegister Email] SMTP email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('[TeamRegister Email] SMTP send failed:', error);
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

    console.log('[TeamRegister Email] SendGrid email sent successfully');
    return true;
  } catch (error) {
    console.error('[TeamRegister Email] SendGrid send failed:', error);
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
  // 優先使用 SMTP
  if (isSMTPConfigured()) {
    console.log('[TeamRegister Email] Using SMTP to send email');
    return sendEmailViaSMTP(to, subject, html, text);
  }

  // 次選使用 SendGrid
  if (isSendGridConfigured()) {
    console.log('[TeamRegister Email] Using SendGrid to send email');
    return sendEmailViaSendGrid(to, subject, html, text);
  }

  // 如果都沒配置，只記錄日誌
  console.log('[TeamRegister Email] No email service configured. Email would be sent:');
  console.log(`  To: ${to}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Text: ${text || '(see HTML)'}`);
  return true;
}

/**
 * 獲取用戶 Email（從 Firebase Auth）
 */
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const admin = await import('firebase-admin');
    const userRecord = await admin.auth().getUser(userId);
    return userRecord.email || null;
  } catch (error) {
    console.error('[TeamRegister Email] Failed to get user email:', error);
    return null;
  }
}

/**
 * 通知團隊成員：報名確認
 */
export async function notifyTeamMemberConfirmation(
  memberEmail: string,
  memberName: string,
  teamName: string,
  teamId: string,
  teamLeaderName: string,
  memberRole: string,
  trackCount: number,
  hasEditRight: boolean,
): Promise<boolean> {
  const subject = `[RWA Hackathon] 團隊報名確認 - ${teamName}`;
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
    .button { display: inline-block; padding: 12px 24px; background: #1a3a6e; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .highlight { background: #fff; padding: 15px; border-left: 4px solid #1a3a6e; margin: 15px 0; }
    .tip { background: #eff6ff; padding: 12px; border-radius: 6px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 團隊報名確認</h1>
    </div>
    <div class="content">
      <p>您好 ${memberName}，</p>
      <p>您已被加入以下黑客松團隊：</p>
      
      <div class="highlight">
        <strong>團隊名稱：</strong>${teamName}<br>
        <strong>您的角色：</strong>${memberRole}<br>
        <strong>團隊報名者：</strong>${teamLeaderName}<br>
        <strong>參賽賽道：</strong>${trackCount} 個賽道
      </div>
      
      ${
        hasEditRight
          ? `
      <div class="tip">
        <strong>✏️ 編輯權限：</strong><br>
        您擁有編輯團隊報名資料的權限，可以在報名截止前修改團隊資訊。
      </div>
      `
          : ''
      }
      
      <div class="tip">
        <strong>📋 重要提醒：</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>報名截止：</strong>2025年10月27日 23:59</li>
          <li>截止前可隨時編輯團隊資料</li>
          <li>請確認所有團隊成員資訊正確</li>
          <li>請遵守參賽者承諾書的所有條款</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="${profileUrl}" class="button" style="color: white !important;">前往個人中心查看</a>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        祝您黑客松順利，期待您的精彩作品！🚀
      </p>
    </div>
    <div class="footer">
      <p>RWA Hackathon Taiwan</p>
      <p><a href="${BASE_URL}">https://hackathon.com.tw</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
您好 ${memberName}，

您已被加入以下黑客松團隊：

團隊名稱：${teamName}
您的角色：${memberRole}
團隊報名者：${teamLeaderName}
參賽賽道：${trackCount} 個賽道

${hasEditRight ? '✏️ 編輯權限：您擁有編輯團隊報名資料的權限，可以在報名截止前修改團隊資訊。\n' : ''}

📋 重要提醒：
• 報名截止：2025年10月27日 23:59
• 截止前可隨時編輯團隊資料
• 請確認所有團隊成員資訊正確
• 請遵守參賽者承諾書的所有條款

前往個人中心查看：${profileUrl}

祝您黑客松順利，期待您的精彩作品！

RWA Hackathon Taiwan
${BASE_URL}
  `;

  return sendEmail(memberEmail, subject, html, text);
}

/**
 * 通知管理員：新團隊報名
 */
export async function notifyAdminNewTeamRegistration(
  teamId: string,
  teamName: string,
  teamLeaderEmail: string,
  teamLeaderName: string,
  teamLeaderRole: string,
  memberCount: number,
  teamMembers: Array<{ name: string; email: string; role: string }>,
  tracks: Array<{ name: string; sponsorName?: string }>,
  evmWalletAddress?: string,
  otherWallets?: Array<{ chain: string; address: string }>,
): Promise<boolean> {
  const adminEmail = 'reyer.chu@rwa.nexus';
  const subject = `[RWA Hackathon Admin] 新團隊報名 - ${teamName}`;
  const teamUrl = `${BASE_URL}/profile`; // 管理員可以在後台查看

  // 准备钱包地址显示
  const walletSection =
    evmWalletAddress || (otherWallets && otherWallets.length > 0)
      ? `
      <div class="highlight">
        <strong>錢包地址：</strong><br>
        ${
          evmWalletAddress
            ? `<strong>EVM 錢包地址：</strong><br>
        <span style="font-family: 'Courier New', monospace; font-size: 13px; color: #1a3a6e;">${evmWalletAddress}</span><br><br>`
            : ''
        }
        ${
          otherWallets && otherWallets.length > 0
            ? `<strong>其他錢包地址：</strong><br>
        ${otherWallets
          .map(
            (w) =>
              `<span style="color: #1a3a6e; font-weight: 600;">${w.chain}：</span><br>
        <span style="font-family: 'Courier New', monospace; font-size: 13px;">${w.address}</span>`,
          )
          .join('<br><br>')}`
            : ''
        }
      </div>
      `
      : '';

  const walletTextSection =
    evmWalletAddress || (otherWallets && otherWallets.length > 0)
      ? `
錢包地址：
${evmWalletAddress ? `EVM 錢包地址：${evmWalletAddress}` : ''}
${
  otherWallets && otherWallets.length > 0
    ? otherWallets.map((w) => `${w.chain}：${w.address}`).join('\n')
    : ''
}
`
      : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .highlight { background: #fff; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0; }
    .member-list { background: #fff; padding: 12px; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 新團隊報名通知</h1>
    </div>
    <div class="content">
      <p><strong>管理員您好，</strong></p>
      <p>收到一筆新的黑客松團隊報名：</p>
      
      <div class="highlight">
        <strong>團隊名稱：</strong>${teamName}<br>
        <strong>團隊 ID：</strong>${teamId}<br>
        <strong>報名時間：</strong>${new Date().toLocaleString('zh-TW', {
          timeZone: 'Asia/Taipei',
        })}
      </div>
      
      <div class="highlight">
        <strong>團隊報名者：</strong><br>
        姓名：${teamLeaderName}<br>
        Email：${teamLeaderEmail}<br>
        角色：${teamLeaderRole}
      </div>
      
      <div class="highlight">
        <strong>團隊成員：</strong>共 ${memberCount} 人（含報名者）<br>
        <div class="member-list">
          ${teamMembers.map((m) => `• ${m.name} (${m.email}) - ${m.role}`).join('<br>')}
        </div>
      </div>
      
      <div class="highlight">
        <strong>參賽賽道：</strong>共 ${tracks.length} 個<br>
        <div class="member-list">
          ${tracks
            .map((t) => `• ${t.name}${t.sponsorName ? ` (${t.sponsorName})` : ''}`)
            .join('<br>')}
        </div>
      </div>
      
      ${walletSection}
      
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        此為系統自動通知，無需回覆。
      </p>
    </div>
    <div class="footer">
      <p>RWA Hackathon Taiwan - Admin Panel</p>
      <p><a href="${BASE_URL}">https://hackathon.com.tw</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
管理員您好，

收到一筆新的黑客松團隊報名：

團隊名稱：${teamName}
團隊 ID：${teamId}
報名時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}

團隊報名者：
姓名：${teamLeaderName}
Email：${teamLeaderEmail}
角色：${teamLeaderRole}

團隊成員：共 ${memberCount} 人（含報名者）
${teamMembers.map((m) => `• ${m.name} (${m.email}) - ${m.role}`).join('\n')}

參賽賽道：共 ${tracks.length} 個
${tracks.map((t) => `• ${t.name}${t.sponsorName ? ` (${t.sponsorName})` : ''}`).join('\n')}

${walletTextSection}
此為系統自動通知，無需回覆。

RWA Hackathon Taiwan - Admin Panel
${BASE_URL}
  `;

  return sendEmail(adminEmail, subject, html, text);
}

/**
 * 通知管理員：團隊資料編輯
 */
export async function notifyAdminTeamEdit(
  teamId: string,
  teamName: string,
  editorEmail: string,
  editorName: string,
  changedFields: string[],
  evmWalletAddress?: string,
  otherWallets?: Array<{ chain: string; address: string }>,
): Promise<boolean> {
  const adminEmail = 'reyer.chu@rwa.nexus';
  const subject = `[RWA Hackathon Admin] 團隊資料修改 - ${teamName}`;

  // 准备钱包地址显示
  const walletSection =
    evmWalletAddress || (otherWallets && otherWallets.length > 0)
      ? `
      <div class="highlight">
        <strong>錢包地址：</strong><br>
        ${
          evmWalletAddress
            ? `<strong>EVM 錢包地址：</strong><br>
        <span style="font-family: 'Courier New', monospace; font-size: 13px; color: #1a3a6e;">${evmWalletAddress}</span><br><br>`
            : ''
        }
        ${
          otherWallets && otherWallets.length > 0
            ? `<strong>其他錢包地址：</strong><br>
        ${otherWallets
          .map(
            (w) =>
              `<span style="color: #1a3a6e; font-weight: 600;">${w.chain}：</span><br>
        <span style="font-family: 'Courier New', monospace; font-size: 13px;">${w.address}</span>`,
          )
          .join('<br><br>')}`
            : ''
        }
      </div>
      `
      : '';

  const walletTextSection =
    evmWalletAddress || (otherWallets && otherWallets.length > 0)
      ? `
錢包地址：
${evmWalletAddress ? `EVM 錢包地址：${evmWalletAddress}` : ''}
${
  otherWallets && otherWallets.length > 0
    ? otherWallets.map((w) => `${w.chain}：${w.address}`).join('\n')
    : ''
}
`
      : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .highlight { background: #fff; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📝 團隊資料修改通知</h1>
    </div>
    <div class="content">
      <p><strong>管理員您好，</strong></p>
      <p>團隊資料已被修改：</p>
      
      <div class="highlight">
        <strong>團隊名稱：</strong>${teamName}<br>
        <strong>團隊 ID：</strong>${teamId}<br>
        <strong>修改時間：</strong>${new Date().toLocaleString('zh-TW', {
          timeZone: 'Asia/Taipei',
        })}
      </div>
      
      <div class="highlight">
        <strong>修改者：</strong><br>
        姓名：${editorName}<br>
        Email：${editorEmail}
      </div>
      
      <div class="highlight">
        <strong>修改內容：</strong><br>
        ${changedFields.map((f) => `• ${f}`).join('<br>')}
      </div>
      
      ${walletSection}
      
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        此為系統自動通知，無需回覆。
      </p>
    </div>
    <div class="footer">
      <p>RWA Hackathon Taiwan - Admin Panel</p>
      <p><a href="${BASE_URL}">https://hackathon.com.tw</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
管理員您好，

團隊資料已被修改：

團隊名稱：${teamName}
團隊 ID：${teamId}
修改時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}

修改者：
姓名：${editorName}
Email：${editorEmail}

修改內容：
${changedFields.map((f) => `• ${f}`).join('\n')}

${walletTextSection}
此為系統自動通知，無需回覆。

RWA Hackathon Taiwan - Admin Panel
${BASE_URL}
  `;

  return sendEmail(adminEmail, subject, html, text);
}
