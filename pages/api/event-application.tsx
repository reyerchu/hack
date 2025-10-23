import { NextApiRequest, NextApiResponse } from 'next';
import { firestore, auth } from 'firebase-admin';
import initializeApi from '../../lib/admin/init';
import { userIsAuthorized } from '../../lib/authorization/check-authorization';

initializeApi();

const EVENT_APPLICATIONS = 'event-applications';

/**
 * API endpoint to handle event applications
 *
 * POST: Submit an application for a specific event
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('[Event Application API] Received POST request');
    console.log('[Event Application API] Body:', JSON.stringify(req.body, null, 2));

    const { eventId, eventTitle, definitekEmail, userEmail, userName, firstName, lastName } =
      req.body;

    if (!eventId || !definitekEmail || !userEmail) {
      console.error('[Event Application API] Missing required fields:', {
        eventId: !!eventId,
        definitekEmail: !!definitekEmail,
        userEmail: !!userEmail,
      });
      return res.status(400).json({
        statusCode: 400,
        msg: 'Missing required fields',
      });
    }

    // Verify user is authenticated
    const userToken = req.headers['authorization'];
    if (!userToken) {
      return res.status(401).json({
        statusCode: 401,
        msg: 'Unauthorized: No token provided',
      });
    }

    // Verify user token is valid (any authenticated user can apply)
    try {
      console.log('[Event Application API] Verifying token...');
      const decodedToken = await auth().verifyIdToken(userToken);
      if (!decodedToken || !decodedToken.uid) {
        console.error('[Event Application API] Invalid token - no uid');
        return res.status(401).json({
          statusCode: 401,
          msg: 'Invalid authentication token',
        });
      }
      console.log('[Event Application API] Token verified for user:', decodedToken.uid);
      console.log('[Event Application API] User email:', decodedToken.email);
    } catch (error) {
      console.error('[Event Application API] Token verification error:', error);
      console.error('[Event Application API] Error details:', error.message);
      return res.status(401).json({
        statusCode: 401,
        msg: `Invalid authentication token: ${error.message}`,
      });
    }

    const db = firestore();

    // Check if user already applied for this event
    console.log('[Event Application API] Checking for existing applications...');
    const existingApplications = await db
      .collection(EVENT_APPLICATIONS)
      .where('eventId', '==', eventId)
      .where('userEmail', '==', userEmail)
      .get();

    if (!existingApplications.empty) {
      console.log('[Event Application API] User already applied');
      return res.status(400).json({
        statusCode: 400,
        msg: '您已經申請過此活動',
      });
    }

    // Save application to database
    const applicationData = {
      eventId,
      eventTitle: eventTitle || 'Unknown Event',
      definitekEmail,
      userEmail,
      userName: userName || 'Unknown User',
      firstName: firstName || '',
      lastName: lastName || '',
      appliedAt: new Date().toISOString(),
      status: 'pending',
    };

    console.log('[Event Application API] Saving application:', applicationData);
    const docRef = await db.collection(EVENT_APPLICATIONS).add(applicationData);
    console.log('[Event Application API] Application saved with ID:', docRef.id);

    // Send email notification
    try {
      console.log('[Event Application API] Sending email notification...');
      await sendEmailNotification(applicationData);
      console.log('[Event Application API] Email notification sent');
    } catch (emailError) {
      console.error('[Event Application API] Failed to send email notification:', emailError);
      // Continue even if email fails
    }

    console.log('[Event Application API] Application submitted successfully');
    return res.status(200).json({
      statusCode: 200,
      msg: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('Error handling event application:', error);
    return res.status(500).json({
      statusCode: 500,
      msg: 'Internal server error',
    });
  }
}

/**
 * Send email notification to admin
 */
async function sendEmailNotification(applicationData: any) {
  const nodemailer = require('nodemailer');

  // 配置 SMTP 传输
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    },
  });

  const emailContent = `
新的活動申請

活動：${applicationData.eventTitle}
活動 ID：${applicationData.eventId}

申請人資訊：
- 姓名：${applicationData.userName}
- 黑客松註冊信箱：${applicationData.userEmail}
- Defintek 信箱：${applicationData.definitekEmail}

申請時間：${new Date(applicationData.appliedAt).toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
  })}

請登入 Firebase Console 查看詳細資訊：
https://console.firebase.google.com/project/hackathon-rwa-nexus/firestore/databases/-default-/data/~2Fevent-applications
  `.trim();

  // Format applicant name: lastName + firstName
  const applicantName =
    applicationData.lastName && applicationData.firstName
      ? `${applicationData.lastName}${applicationData.firstName}`
      : applicationData.userName;

  const mailOptions = {
    from: `"RWA 黑客松團隊" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
    to: 'reyer.chu@rwa.nexus',
    subject: `【RWA 黑客松】新的活動申請：${applicantName} - ${applicationData.eventTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a3a6e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #1a3a6e; margin: 20px 0; }
    .button { display: inline-block; background: #1a3a6e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
    .label { font-weight: bold; color: #1a3a6e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 新的活動申請</h1>
    </div>
    <div class="content">
      <h2>活動資訊</h2>
      <div class="info-box">
        <p><span class="label">活動名稱：</span>${applicationData.eventTitle}</p>
        <p><span class="label">活動 ID：</span>${applicationData.eventId}</p>
      </div>
      
      <h2>申請人資訊</h2>
      <div class="info-box">
        <p><span class="label">姓名：</span>${applicationData.userName}</p>
        <p><span class="label">黑客松註冊信箱：</span>${applicationData.userEmail}</p>
        <p><span class="label">Defintek 信箱：</span>${applicationData.definitekEmail}</p>
        <p><span class="label">申請時間：</span>${new Date(
          applicationData.appliedAt,
        ).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="https://console.firebase.google.com/project/hackathon-rwa-nexus/firestore/databases/-default-/data/~2Fevent-applications" class="button" style="color: white;">
          前往 Firebase 查看詳情
        </a>
      </div>
      
      <div class="footer">
        <p>此郵件由系統自動發送</p>
        <p>RWA Hackathon | https://hackathon.com.tw</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    text: emailContent,
  };

  console.log('Sending email notification to:', mailOptions.to);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Get applications for a specific event (admin only)
 * Or check if current user has applied (checkOnly mode)
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { eventId, checkOnly } = req.query;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({
        statusCode: 400,
        msg: 'Event ID is required',
      });
    }

    const userToken = req.headers['authorization'];
    if (!userToken) {
      return res.status(401).json({
        statusCode: 401,
        msg: 'Unauthorized',
      });
    }

    // Check if this is a "check only" request (user checking their own application status)
    if (checkOnly === 'true') {
      try {
        const decodedToken = await auth().verifyIdToken(userToken);
        const userEmail = decodedToken.email;

        const db = firestore();
        const snapshot = await db
          .collection(EVENT_APPLICATIONS)
          .where('eventId', '==', eventId)
          .where('userEmail', '==', userEmail)
          .limit(1)
          .get();

        return res.status(200).json({
          hasApplied: !snapshot.empty,
          application: snapshot.empty
            ? null
            : {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data(),
              },
        });
      } catch (error) {
        console.error('[Event Application API] Check error:', error);
        return res.status(401).json({
          statusCode: 401,
          msg: 'Invalid authentication token',
        });
      }
    }

    // For full list, only allow admins
    const isAuthorized = await userIsAuthorized(userToken, ['super_admin', 'admin']);
    if (!isAuthorized) {
      return res.status(403).json({
        statusCode: 403,
        msg: 'Forbidden: Admin access required',
      });
    }

    const db = firestore();
    const snapshot = await db
      .collection(EVENT_APPLICATIONS)
      .where('eventId', '==', eventId)
      .orderBy('appliedAt', 'desc')
      .get();

    const applications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({
      statusCode: 500,
      msg: 'Internal server error',
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'POST':
      return handlePost(req, res);
    case 'GET':
      return handleGet(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        statusCode: 405,
        msg: `Method ${method} Not Allowed`,
      });
  }
}
