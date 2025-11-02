/**
 * API: 用户隐私设置
 * 
 * GET: 获取当前用户的隐私设置
 * PUT: 更新当前用户的隐私设置
 */

import { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';

// 验证用户身份
async function verifyUser(req: NextApiRequest): Promise<{ userId: string; email: string } | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    return {
      userId: decodedToken.uid,
      email: decodedToken.email || '',
    };
  } catch (error) {
    console.error('[PrivacySettings] Auth error:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  initializeApi();
  
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'PUT') {
    return handlePut(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userAuth = await verifyUser(req);
    if (!userAuth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = admin.firestore();
    
    // 尝试从 registrations 获取用户信息
    let userDoc = await db.collection('registrations').doc(userAuth.userId).get();
    
    if (!userDoc.exists) {
      // 尝试用 email 查找
      const usersByEmail = await db
        .collection('registrations')
        .where('email', '==', userAuth.email)
        .limit(1)
        .get();
      
      if (!usersByEmail.empty) {
        userDoc = usersByEmail.docs[0];
      }
    }

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // 返回用户的隐私设置，如果没有则返回默认值
    const privacySettings = userData?.privacySettings || {
      showEmail: false,
      showRole: false,
      showSchool: false,
      showGithub: false,
      showLinkedin: false,
      showPhone: false,
    };

    return res.status(200).json({
      success: true,
      privacySettings,
      displayName: userData?.displayName || userData?.firstName || userAuth.email,
    });
  } catch (error: any) {
    console.error('[PrivacySettings GET] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get privacy settings' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userAuth = await verifyUser(req);
    if (!userAuth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { privacySettings } = req.body;

    if (!privacySettings || typeof privacySettings !== 'object') {
      return res.status(400).json({ error: 'Invalid privacy settings' });
    }

    const db = admin.firestore();
    
    // 尝试从 registrations 获取用户信息
    let userDocRef = db.collection('registrations').doc(userAuth.userId);
    let userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      // 尝试用 email 查找
      const usersByEmail = await db
        .collection('registrations')
        .where('email', '==', userAuth.email)
        .limit(1)
        .get();
      
      if (!usersByEmail.empty) {
        userDocRef = usersByEmail.docs[0].ref;
        userDoc = usersByEmail.docs[0];
      }
    }

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 更新隐私设置
    await userDocRef.update({
      privacySettings: {
        showEmail: privacySettings.showEmail || false,
        showRole: privacySettings.showRole || false,
        showSchool: privacySettings.showSchool || false,
        showGithub: privacySettings.showGithub || false,
        showLinkedin: privacySettings.showLinkedin || false,
        showPhone: privacySettings.showPhone || false,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
    });
  } catch (error: any) {
    console.error('[PrivacySettings PUT] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update privacy settings' });
  }
}

