/**
 * API: /api/admin/sponsors
 *
 * GET - 獲取所有 sponsors 列表（僅供 admin 使用）
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../lib/admin/init';
import { requireAuth, ApiResponse, AuthenticatedRequest } from '../../../../lib/sponsor/middleware';
import { SPONSOR_COLLECTIONS } from '../../../../lib/sponsor/collections';

initializeApi();
const db = firestore();

/**
 * GET - 獲取所有 sponsors
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  console.log('[/api/admin/sponsors] ========== GET 請求開始 ==========');

  if (!(await requireAuth(req, res))) {
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const userPermissions = authReq.userPermissions || [];

  // 檢查權限：只有 super_admin 和 admin 可以查看所有 sponsors
  if (
    !userPermissions.includes('super_admin') &&
    !userPermissions.includes('admin') &&
    userPermissions[0] !== 'super_admin' &&
    userPermissions[0] !== 'admin'
  ) {
    return ApiResponse.forbidden(res, '只有 admin 可以查看所有 sponsors');
  }

  try {
    console.log('[/api/admin/sponsors] 查詢所有 sponsors...');
    const sponsorsSnapshot = await db
      .collection(SPONSOR_COLLECTIONS.EXTENDED_SPONSORS)
      .orderBy('name', 'asc')
      .get();

    const sponsors = sponsorsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log('[/api/admin/sponsors] 找到', sponsors.length, '個 sponsors');
    return ApiResponse.success(res, { sponsors });
  } catch (error: any) {
    console.error('[/api/admin/sponsors] ❌ Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch sponsors', 500);
  }
}

/**
 * Main handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
