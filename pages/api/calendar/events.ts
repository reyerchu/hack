import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

/**
 * 獲取用戶 Google Calendar 事件
 * 
 * 需要：
 * - Authorization header 包含 access_token
 * - Query parameters: timeMin, timeMax (可選)
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '不支援的 HTTP 方法' });
  }

  try {
    // 從 header 獲取 access_token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '缺少授權 token' });
    }

    const accessToken = authHeader.substring(7);

    // 設置 OAuth2 客戶端
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // 創建 Calendar API 客戶端
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // 獲取查詢參數
    const { timeMin, timeMax, q } = req.query;

    // 準備請求參數
    const requestParams: any = {
      calendarId: 'primary',
      maxResults: 2500, // 最多獲取 2500 個事件
      singleEvents: true,
      orderBy: 'startTime',
    };

    if (timeMin) {
      requestParams.timeMin = timeMin;
    } else {
      // 默認從當前時間開始
      requestParams.timeMin = new Date().toISOString();
    }

    if (timeMax) {
      requestParams.timeMax = timeMax;
    }

    if (q) {
      requestParams.q = q; // 搜索關鍵字
    }

    // 獲取事件
    const response = await calendar.events.list(requestParams);

    const events = response.data.items || [];

    // 返回事件列表
    res.status(200).json({
      events,
      count: events.length,
    });
  } catch (error: any) {
    console.error('獲取 Google Calendar 事件失敗:', error);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'token 已失效或無效',
        message: '請重新授權'
      });
    }

    res.status(500).json({ 
      error: '獲取日曆事件失敗', 
      message: error.message 
    });
  }
}

