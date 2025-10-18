import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
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
    const { eventId, eventTitle, definitekEmail, userEmail, userName } = req.body;

    if (!eventId || !definitekEmail || !userEmail) {
      return res.status(400).json({ 
        statusCode: 400, 
        msg: 'Missing required fields' 
      });
    }

    // Verify user is authenticated
    const userToken = req.headers['authorization'];
    if (!userToken) {
      return res.status(401).json({ 
        statusCode: 401, 
        msg: 'Unauthorized: No token provided' 
      });
    }

    // Verify user has registered for the hackathon
    const isAuthorized = await userIsAuthorized(userToken, ['hacker']);
    if (!isAuthorized) {
      return res.status(403).json({ 
        statusCode: 403, 
        msg: 'Forbidden: User must register for the hackathon first' 
      });
    }

    const db = firestore();
    
    // Check if user already applied for this event
    const existingApplications = await db
      .collection(EVENT_APPLICATIONS)
      .where('eventId', '==', eventId)
      .where('userEmail', '==', userEmail)
      .get();

    if (!existingApplications.empty) {
      return res.status(400).json({ 
        statusCode: 400, 
        msg: 'You have already applied for this event' 
      });
    }

    // Save application to database
    const applicationData = {
      eventId,
      eventTitle: eventTitle || 'Unknown Event',
      definitekEmail,
      userEmail,
      userName: userName || 'Unknown User',
      appliedAt: new Date().toISOString(),
      status: 'pending',
    };

    await db.collection(EVENT_APPLICATIONS).add(applicationData);

    // Send email notification
    try {
      await sendEmailNotification(applicationData);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Continue even if email fails
    }

    return res.status(200).json({ 
      statusCode: 200, 
      msg: 'Application submitted successfully' 
    });

  } catch (error) {
    console.error('Error handling event application:', error);
    return res.status(500).json({ 
      statusCode: 500, 
      msg: 'Internal server error' 
    });
  }
}

/**
 * Send email notification to admin
 */
async function sendEmailNotification(applicationData: any) {
  // Using nodemailer or similar service
  // For now, we'll use a simple fetch to a notification service
  // You can integrate with SendGrid, AWS SES, or other email services
  
  const emailContent = `
新的活動申請

活動：${applicationData.eventTitle}
活動 ID：${applicationData.eventId}

申請人資訊：
- 姓名：${applicationData.userName}
- 黑客松註冊信箱：${applicationData.userEmail}
- Defintek 信箱：${applicationData.definitekEmail}

申請時間：${new Date(applicationData.appliedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}

請登入後台查看詳細資訊。
  `.trim();

  console.log('Email notification prepared:');
  console.log(emailContent);
  console.log('To: reyer.chu@rwa.nexus');

  // TODO: Integrate with actual email service
  // For example, using SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: 'reyer.chu@rwa.nexus',
  //   from: 'no-reply@hackathon.com.tw',
  //   subject: `新的活動申請：${applicationData.eventTitle}`,
  //   text: emailContent,
  // });
}

/**
 * Get applications for a specific event (admin only)
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { eventId } = req.query;
    
    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ 
        statusCode: 400, 
        msg: 'Event ID is required' 
      });
    }

    const userToken = req.headers['authorization'];
    if (!userToken) {
      return res.status(401).json({ 
        statusCode: 401, 
        msg: 'Unauthorized' 
      });
    }

    // Only allow admins to view applications
    const isAuthorized = await userIsAuthorized(userToken, ['super_admin', 'admin']);
    if (!isAuthorized) {
      return res.status(403).json({ 
        statusCode: 403, 
        msg: 'Forbidden: Admin access required' 
      });
    }

    const db = firestore();
    const snapshot = await db
      .collection(EVENT_APPLICATIONS)
      .where('eventId', '==', eventId)
      .orderBy('appliedAt', 'desc')
      .get();

    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(applications);

  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ 
      statusCode: 500, 
      msg: 'Internal server error' 
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
        msg: `Method ${method} Not Allowed` 
      });
  }
}

