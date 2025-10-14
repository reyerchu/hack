import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

/**
 * Google Calendar OAuth 授權端點
 * 
 * 用途：
 * 1. 生成 OAuth 授權 URL
 * 2. 處理 OAuth 回調
 * 3. 交換授權碼獲取 access token
 */

// OAuth 2.0 配置
const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('缺少 Google OAuth 配置。請設置 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET 環境變數。');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const oauth2Client = getOAuth2Client();

      // 生成授權 URL
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events',
        ],
        prompt: 'consent', // 強制顯示同意畫面，確保獲得 refresh_token
      });

      res.status(200).json({ authUrl });
    } catch (error: any) {
      console.error('生成授權 URL 失敗:', error);
      res.status(500).json({ 
        error: '生成授權 URL 失敗', 
        message: error.message,
        details: '請確認已設置 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET 環境變數'
      });
    }
  } else if (req.method === 'POST') {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: '缺少授權碼' });
      }

      const oauth2Client = getOAuth2Client();

      // 交換授權碼獲取 tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // 返回 tokens（在生產環境中應該加密存儲）
      res.status(200).json({ 
        tokens,
        message: '授權成功'
      });
    } catch (error: any) {
      console.error('交換授權碼失敗:', error);
      res.status(500).json({ 
        error: '授權失敗', 
        message: error.message 
      });
    }
  } else {
    res.status(405).json({ error: '不支援的 HTTP 方法' });
  }
}

