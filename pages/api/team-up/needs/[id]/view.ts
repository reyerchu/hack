/**
 * API: /api/team-up/needs/:id/view
 *
 * POST - 記錄瀏覽
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../../lib/admin/init';
import { incrementViewCount } from '../../../../../lib/teamUp/db';
import { ERROR_CODES, ERROR_MESSAGES } from '../../../../../lib/teamUp/constants';

initializeApi();

/**
 * POST /api/team-up/needs/:id/view
 * 記錄瀏覽（公開）
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    // Rate limiting 可以在 M6 實現
    // 這裡簡單實現功能

    const viewCount = await incrementViewCount(id as string);

    return res.status(200).json({
      success: true,
      viewCount,
    });
  } catch (error) {
    console.error('Error in POST /api/team-up/needs/:id/view:', error);
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
    case 'POST':
      return handlePost(req, res);
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
