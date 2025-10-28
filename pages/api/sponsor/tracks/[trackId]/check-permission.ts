/**
 * API endpoint to check if user has edit permission for a track
 * GET /api/sponsor/tracks/[trackId]/check-permission
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';
import { requireAuth, ApiResponse } from '../../../../../lib/sponsor/middleware';
import { checkTrackAccess } from '../../../../../lib/sponsor/permissions';

initializeApi();
const db = firestore();

interface AuthenticatedRequest extends NextApiRequest {
  userId?: string;
  isAdmin?: boolean;
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  console.log('[check-permission] Checking track permission');

  if (!(await requireAuth(req, res))) {
    console.log('[check-permission] Authentication failed');
    return ApiResponse.unauthorized(res, 'Unauthorized');
  }

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const { trackId } = req.query;

  if (!trackId || typeof trackId !== 'string') {
    return ApiResponse.error(res, 'Invalid track ID', 400);
  }

  try {
    console.log('[check-permission] Checking permission for user:', userId, 'track:', trackId);

    // Check if user has access to this track
    const canEdit = await checkTrackAccess(userId, trackId);

    console.log('[check-permission] Result:', { userId, trackId, canEdit });

    return ApiResponse.success(res, { canEdit });
  } catch (error: any) {
    console.error('[check-permission] Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to check permission', 500);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
