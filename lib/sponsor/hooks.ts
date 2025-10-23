/**
 * Track Sponsor Feature - React Hooks
 *
 * 贊助商功能的自定義 React Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../user/AuthContext';
import firebase from 'firebase/app';
import 'firebase/auth';
import type {
  TrackListResponse,
  ExtendedChallenge,
  TeamSubmission,
  SponsorNotification,
  SponsorActivityLog,
} from './types';

/**
 * 安全地獲取當前用戶的 ID Token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // 檢查 Firebase 是否已初始化
    if (!firebase.apps.length) {
      console.error('Firebase not initialized');
      return null;
    }

    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.error('No current user');
      return null;
    }

    const token = await currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * 獲取贊助商的賽道列表
 */
export function useSponsorTracks() {
  const [tracks, setTracks] = useState<TrackListResponse['tracks']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isSignedIn } = useAuthContext();

  const fetchTracks = useCallback(async () => {
    console.log('[useSponsorTracks] fetchTracks called, isSignedIn:', isSignedIn);

    if (!isSignedIn) {
      console.log('[useSponsorTracks] 用戶未登入，跳過');
      setLoading(false);
      return;
    }

    try {
      console.log('[useSponsorTracks] 開始獲取賽道...');
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        console.error('[useSponsorTracks] 無法獲取 token');
        throw new Error('無法獲取認證令牌');
      }

      console.log('[useSponsorTracks] Token 獲取成功，發送請求到 /api/sponsor/tracks');

      const response = await fetch('/api/sponsor/tracks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[useSponsorTracks] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[useSponsorTracks] API 錯誤:', errorData);
        throw new Error('Failed to fetch tracks');
      }

      const data = await response.json();
      console.log('[useSponsorTracks] 收到數據:', data);
      console.log('[useSponsorTracks] data.data:', data.data);
      console.log('[useSponsorTracks] tracks 數量:', data.data?.tracks?.length || 0);
      setTracks(data.data?.tracks || []);
    } catch (err: any) {
      console.error('[useSponsorTracks] 錯誤:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log('[useSponsorTracks] fetchTracks 完成');
    }
  }, [isSignedIn]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  return {
    tracks,
    loading,
    error,
    refetch: fetchTracks,
  };
}

/**
 * 獲取賽道統計數據
 */
export function useTrackStats() {
  const { tracks, loading, error } = useSponsorTracks();

  const stats = {
    totalTracks: tracks.length,
    totalSubmissions: tracks.reduce((sum, track) => sum + track.stats.submissionCount, 0),
    totalTeams: tracks.reduce((sum, track) => sum + track.stats.teamCount, 0),
    averageScore:
      tracks.length > 0
        ? tracks.reduce((sum, track) => {
            return sum + (track.stats.averageScore || 0);
          }, 0) / tracks.length
        : 0,
  };

  return {
    stats,
    loading,
    error,
  };
}

/**
 * 獲取單個提交詳情
 */
export function useSubmission(submissionId: string | null) {
  const [submission, setSubmission] = useState<TeamSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useAuthContext();

  const fetchSubmission = useCallback(async () => {
    if (!isSignedIn || !submissionId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        throw new Error('無法獲取認證令牌');
      }

      const response = await fetch(`/api/sponsor/submissions/${submissionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch submission');
      }

      const data = await response.json();
      setSubmission(data.data || null);
    } catch (err: any) {
      console.error('Error fetching submission:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, submissionId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  return {
    submission,
    loading,
    error,
    refetch: fetchSubmission,
  };
}

/**
 * 獲取通知列表
 */
export function useSponsorNotifications(unreadOnly = false) {
  const [notifications, setNotifications] = useState<SponsorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isSignedIn } = useAuthContext();

  const fetchNotifications = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        throw new Error('無法獲取認證令牌');
      }

      const response = await fetch(`/api/sponsor/notifications?unreadOnly=${unreadOnly}&limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.data?.notifications || []);
      setUnreadCount(data.data?.unreadCount || 0);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('無法獲取認證令牌');
      }

      const response = await fetch(`/api/sponsor/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // 更新本地狀態
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('無法獲取認證令牌');
      }

      const response = await fetch(`/api/sponsor/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // 更新本地狀態
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err: any) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}

/**
 * 檢查用戶是否有贊助商權限
 */
export function useIsSponsor() {
  const { user } = useAuthContext();

  const isSponsor =
    user?.permissions?.includes('sponsor') ||
    user?.permissions?.includes('admin') ||
    user?.permissions?.includes('super_admin');

  return isSponsor;
}

/**
 * 通用的异步操作 hook
 */
export function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    loading,
    data,
    error,
    execute,
  };
}
