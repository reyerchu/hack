/**
 * 通知管理頁面
 * 
 * 查看和管理所有通知
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '../../lib/user/AuthContext';
import { useIsSponsor, useSponsorNotifications } from '../../lib/sponsor/hooks';
import NotificationCenter from '../../components/sponsor/NotificationCenter';

export default function NotificationsPage() {
  const router = useRouter();
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { notifications, loading, error, unreadCount, markAsRead, deleteNotification, refetch } =
    useSponsorNotifications(showUnreadOnly);

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/notifications');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.isRead);

    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }

    refetch();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#991b1b' }}>
              加载失败
            </h2>
            <p className="text-sm" style={{ color: '#7f1d1d' }}>
              {error}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 rounded-lg font-medium"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
              }}
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/sponsor/dashboard">
            <a className="inline-flex items-center gap-1 text-sm font-medium mb-4 hover:underline" style={{ color: '#1a3a6e' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回儀表板
            </a>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
                通知中心
              </h1>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                {unreadCount > 0
                  ? `您有 ${unreadCount} 条未读通知`
                  : '所有通知已读'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-0 cursor-pointer"
              style={{
                accentColor: '#1a3a6e',
              }}
            />
            <span className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
              只顯示未读
            </span>
          </label>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: '#e8eef5',
                color: '#1a3a6e',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a3a6e';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e8eef5';
                e.currentTarget.style.color = '#1a3a6e';
              }}
            >
              全部標记為已读
            </button>
          )}
        </div>

        {/* Notifications */}
        {notifications.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
          >
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: '#9ca3af' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#1a3a6e' }}>
              {showUnreadOnly ? '暂无未读通知' : '暂无通知'}
            </h2>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              {showUnreadOnly
                ? '所有通知已读，做得好！'
                : '当有新的提交或活动时，您會收到通知'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg p-4 border transition-all duration-200 ${
                  notification.isRead ? 'opacity-60' : ''
                }`}
                style={{
                  backgroundColor: notification.isRead ? '#f9fafb' : '#ffffff',
                  borderColor: notification.isRead
                    ? '#e5e7eb'
                    : notification.priority === 'high'
                    ? '#dc2626'
                    : notification.priority === 'medium'
                    ? '#f59e0b'
                    : '#1a3a6e',
                  borderWidth: notification.isRead ? '1px' : '2px',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3
                        className="text-sm font-semibold"
                        style={{ color: '#1a3a6e' }}
                      >
                        {notification.title}
                      </h3>
                      <span className="text-xs flex-shrink-0" style={{ color: '#9ca3af' }}>
                        {(() => {
                          const date = notification.createdAt instanceof Date
                            ? notification.createdAt
                            : new Date((notification.createdAt as any)._seconds * 1000);
                          return date.toLocaleDateString('zh-TW', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                        })()}
                      </span>
                    </div>

                    <p className="text-sm mb-3" style={{ color: '#6b7280' }}>
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-2">
                      {notification.actionUrl && (
                        <a
                          href={notification.actionUrl}
                          className="text-sm font-medium hover:underline"
                          style={{ color: '#1a3a6e' }}
                        >
                          查看詳情 →
                        </a>
                      )}

                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs px-3 py-1 rounded transition-colors"
                          style={{
                            backgroundColor: '#e8eef5',
                            color: '#1a3a6e',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1a3a6e';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#e8eef5';
                            e.currentTarget.style.color = '#1a3a6e';
                          }}
                        >
                          標记為已读
                        </button>
                      )}

                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-xs px-3 py-1 rounded transition-colors ml-auto"
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#991b1b';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                          e.currentTarget.style.color = '#991b1b';
                        }}
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

