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
    console.log('[Event Application API] Received POST request');
    console.log('[Event Application API] Body:', JSON.stringify(req.body, null, 2));
    
    const { eventId, eventTitle, definitekEmail, userEmail, userName } = req.body;

    if (!eventId || !definitekEmail || !userEmail) {
      console.error('[Event Application API] Missing required fields:', {
        eventId: !!eventId,
        definitekEmail: !!definitekEmail,
        userEmail: !!userEmail,
      });
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

    // Verify user token is valid (any authenticated user can apply)
    // We'll check if they're registered by verifying their email exists
    try {
      console.log('[Event Application API] Verifying token...');
      const decodedToken = await firestore().app.auth().verifyIdToken(userToken);
      if (!decodedToken || !decodedToken.uid) {
        console.error('[Event Application API] Invalid token - no uid');
        return res.status(401).json({ 
          statusCode: 401, 
          msg: 'Invalid authentication token' 
        });
      }
      console.log('[Event Application API] Token verified for user:', decodedToken.uid);
    } catch (error) {
      console.error('[Event Application API] Token verification error:', error);
      return res.status(401).json({ 
        statusCode: 401, 
        msg: 'Invalid authentication token' 
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

