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

    // 从 user-privacy-settings 集合获取隐私设置
    const privacyDoc = await db.collection('user-privacy-settings').doc(userAuth.userId).get();

    // 如果有隐私设置，返回它；否则返回默认值
    const settings = privacyDoc.exists
      ? privacyDoc.data()
      : {
          showName: false,
          showEmail: false,
          showRole: false,
          showSchool: false,
          showGithub: false,
          showLinkedin: false,
          showPhone: false,
          showWebsite: false,
          showResume: false,
          showEvmAddress: false,
          showWalletAddresses: false,
        };

    console.log('[PrivacySettings GET] Loaded settings for', userAuth.userId, ':', settings);

    return res.status(200).json({
      success: true,
      settings, // 前端期望的字段名是 settings
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

    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid privacy settings' });
    }

    const db = admin.firestore();

    // 保存到 user-privacy-settings 集合
    const privacyDocRef = db.collection('user-privacy-settings').doc(userAuth.userId);

    const privacyData = {
      showName: settings.showName === true,
      showEmail: settings.showEmail === true,
      showRole: settings.showRole === true,
      showSchool: settings.showSchool === true,
      showGithub: settings.showGithub === true,
      showLinkedin: settings.showLinkedin === true,
      showPhone: settings.showPhone === true,
      showWebsite: settings.showWebsite === true,
      showResume: settings.showResume === true,
      showEvmAddress: settings.showEvmAddress === true,
      showWalletAddresses: settings.showWalletAddresses === true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await privacyDocRef.set(privacyData, { merge: true });

    console.log('[PrivacySettings PUT] Saved settings for', userAuth.userId, ':', privacyData);

    return res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
    });
  } catch (error: any) {
    console.error('[PrivacySettings PUT] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update privacy settings' });
  }
}
