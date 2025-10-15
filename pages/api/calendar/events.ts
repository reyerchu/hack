import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

/**
 * Google Calendar 事件管理 API
 *
 * GET: 獲取用戶 Google Calendar 事件
 * POST: 添加事件到 Google Calendar
 *
 * 需要：
 * - Authorization header 包含 access_token
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetEvents(req, res);
  } else if (req.method === 'POST') {
    return handleAddEvent(req, res);
  } else {
    return res.status(405).json({ error: '不支援的 HTTP 方法' });
  }
}

/**
 * 添加事件到 Google Calendar
 */
async function handleAddEvent(req: NextApiRequest, res: NextApiResponse) {
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

    // 從請求體獲取事件資料
    const { title, description, location, startTime, endTime } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({
        error: '缺少必要資料',
        message: '必須提供 title, startTime, endTime',
      });
    }

    // 準備事件資料
    const event = {
      summary: title,
      description: description || '',
      location: location || '',
      start: {
        dateTime: startTime,
        timeZone: 'Asia/Taipei',
      },
      end: {
        dateTime: endTime,
        timeZone: 'Asia/Taipei',
      },
    };

    // 添加事件
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    res.status(200).json({
      success: true,
      event: response.data,
      message: '事件已成功添加到 Google Calendar',
    });
  } catch (error: any) {
    console.error('添加 Google Calendar 事件失敗:', error);

    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'token 已失效或無效',
        message: '請重新授權',
      });
    }

    res.status(500).json({
      error: '添加日曆事件失敗',
      message: error.message,
    });
  }
}

/**
 * 獲取 Google Calendar 事件
 */
async function handleGetEvents(req: NextApiRequest, res: NextApiResponse) {
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
        message: '請重新授權',
      });
    }

    res.status(500).json({
      error: '獲取日曆事件失敗',
      message: error.message,
    });
  }
}
