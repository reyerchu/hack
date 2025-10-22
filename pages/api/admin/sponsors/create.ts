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
    managers,
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
      managers: managers || [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_SPONSORS)
      .doc(id)
      .set(newSponsor);

    // Create sponsor-user-mappings and grant sponsor permissions
    if (managers && Array.isArray(managers) && managers.length > 0) {
      console.log('[create] Processing managers:', managers);
      
      for (const email of managers) {
        if (!email || typeof email !== 'string') continue;
        
        const normalizedEmail = email.trim().toLowerCase();
        
        // Find user by email in registrations collection
        const userQuery = await db.collection('registrations')
          .where('email', '==', normalizedEmail)
          .limit(1)
          .get();
        
        if (userQuery.empty) {
          console.log('[create] ⚠️ Manager email not found:', normalizedEmail);
          continue;
        }
        
        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        
        // Get user's current permissions (support both flat and nested structure)
        let userPermissions = userData?.permissions || userData?.user?.permissions || [];
        
        // Ensure permissions is an array
        if (!Array.isArray(userPermissions)) {
          userPermissions = [];
        }
        
        // Add 'sponsor' permission if not already present
        if (!userPermissions.includes('sponsor')) {
          userPermissions.push('sponsor');
          
          // Update user's permissions in Firestore
          if (userData?.user) {
            // Nested structure: update user.permissions
            await userDoc.ref.update({
              'user.permissions': userPermissions,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            // Flat structure: update permissions directly
            await userDoc.ref.update({
              permissions: userPermissions,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
          }
          
          console.log('[create] ✅ Added sponsor permission to user:', normalizedEmail);
        } else {
          console.log('[create] ℹ️ User already has sponsor permission:', normalizedEmail);
        }
        
        console.log('[create] Creating mapping:', {
          email: normalizedEmail,
          userId: userDoc.id,
          sponsorId: id,
          role: 'admin',
          updatedPermissions: userPermissions,
        });
        
        // Create mapping with 'admin' role (full edit permissions)
        await db.collection('sponsor-user-mappings').add({
          userId: userDoc.id,
          sponsorId: id,
          role: 'admin',
          email: normalizedEmail,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: userId,
        });
      }
      
      console.log('[create] Successfully processed', managers.length, 'managers');
    }

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

