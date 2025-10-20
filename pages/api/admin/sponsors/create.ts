/**
 * API: /api/admin/sponsors/create
 * 
 * POST - 新增 sponsor（僅供 admin 使用）
 */

import { NextApiRequest, NextApiResponse } from 'next';
import firebase from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';
import {
  requireAuth,
  ApiResponse,
  AuthenticatedRequest,
} from '../../../../lib/sponsor/middleware';
import { SPONSOR_COLLECTIONS } from '../../../../lib/sponsor/collections';

initializeApi();
const db = firebase.firestore();

/**
 * POST - 新增 sponsor
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  console.log('[/api/admin/sponsors/create] ========== POST 請求開始 ==========');
  
  if (!(await requireAuth(req, res))) {
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const userPermissions = authReq.userPermissions || [];

  // 檢查權限：只有 super_admin 和 admin 可以新增 sponsors
  if (!userPermissions.includes('super_admin') && 
      !userPermissions.includes('admin') &&
      userPermissions[0] !== 'super_admin' && 
      userPermissions[0] !== 'admin') {
    return ApiResponse.forbidden(res, '只有 admin 可以新增 sponsors');
  }

  const {
    id,
    name,
    tier,
    description,
    logoUrl,
    websiteUrl,
    contactEmail,
    contactName,
  } = req.body;

  // 驗證必填欄位
  if (!id || !name) {
    return ApiResponse.error(res, 'Sponsor ID 和名稱為必填項', 400);
  }

  try {
    console.log('[create] 檢查 sponsor ID 是否已存在...');
    const existingDoc = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_SPONSORS)
      .doc(id)
      .get();

    if (existingDoc.exists) {
      console.log('[create] ❌ Sponsor ID 已存在');
      return ApiResponse.error(res, 'Sponsor ID 已存在，請使用不同的 ID', 400);
    }

    // 創建新 sponsor
    console.log('[create] 創建新 sponsor...');
    const newSponsor = {
      name: name,
      tier: tier || 'other',
      description: description || '',
      logo: logoUrl || '',
      website: websiteUrl || '',
      contactEmail: contactEmail || '',
      contactPerson: contactName || '',
      createdAt: firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_SPONSORS)
      .doc(id)
      .set(newSponsor);

    // 記錄活動日誌
    console.log('[create] 記錄活動日誌...');
    try {
      await db.collection('sponsor-activity-logs').add({
        userId: userId,
        action: 'create_sponsor',
        resourceType: 'sponsor',
        resourceId: id,
        sponsorName: name,
        tier: tier,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[create] Failed to log activity:', logError);
    }

    console.log('[create] ✅ Sponsor 新增成功');
    return ApiResponse.success(res, {
      message: '成功新增 sponsor',
      sponsor: {
        id: id,
        ...newSponsor,
      },
    });
  } catch (error: any) {
    console.error('[create] ❌ Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to create sponsor', 500);
  }
}

/**
 * Main handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

