/**
 * API: /api/team-up/stats
 *
 * GET - 獲取統計數據
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import { getTeamUpStats } from '../../../lib/teamUp/db';
import { ERROR_CODES, ERROR_MESSAGES } from '../../../lib/teamUp/constants';

initializeApi();

/**
 * GET /api/team-up/stats
 * 獲取統計數據（公開）
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const stats = await getTeamUpStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error in GET /api/team-up/stats:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      },
    });
  }
}

/**
 * API Handler
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    default:
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: '不支援的請求方法',
        },
      });
  }
}
