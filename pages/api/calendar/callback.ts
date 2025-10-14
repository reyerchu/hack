import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Google OAuth 回調端點
 * 
 * Google 會將用戶重定向到此端點，並帶上授權碼
 * 然後我們將授權碼發送給前端，讓前端調用 /api/calendar/auth POST 端點交換 tokens
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, error } = req.query;

  if (error) {
    // 用戶拒絕授權或發生錯誤
    return res.redirect(`/schedule?auth_error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect('/schedule?auth_error=no_code');
  }

  // 將授權碼傳回前端
  // 前端會調用 /api/calendar/auth POST 端點來交換 tokens
  return res.redirect(`/schedule?auth_code=${encodeURIComponent(code as string)}`);
}

