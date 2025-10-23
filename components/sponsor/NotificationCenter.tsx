/**
 * 贊助商儀表板 - 通知中心组件
 */

import React, { useState } from 'react';
import type { SponsorNotification } from '../../lib/sponsor/types';

interface NotificationCenterProps {
  notifications: SponsorNotification[];
  onMarkAsRead?: (notificationId: string) => void;
}

export default function NotificationCenter({
  notifications,
  onMarkAsRead,
}: NotificationCenterProps) {
  const [expanded, setExpanded] = useState(false);

  // 只顯示未读通知
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const displayNotifications = expanded ? notifications : unreadNotifications.slice(0, 5);

  if (notifications.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
          通知中心
        </h2>
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
        >
          <svg
            className="w-12 h-12 mx-auto mb-3"
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
          <p className="text-sm" style={{ color: '#6b7280' }}>
            暂无新通知
          </p>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type: SponsorNotification['type']) => {
    switch (type) {
      case 'new_submission':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case 'submission_update':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      case 'deadline_reminder':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getNotificationColor = (priority: SponsorNotification['priority']) => {
    switch (priority) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      default:
        return '#1a3a6e';
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold" style={{ color: '#1a3a6e' }}>
          通知中心
          {unreadNotifications.length > 0 && (
            <span
              className="ml-2 px-2 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
              }}
            >
              {unreadNotifications.length}
            </span>
          )}
        </h2>

        {notifications.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-medium"
            style={{ color: '#1a3a6e' }}
          >
            {expanded ? '收起' : '查看全部'}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-lg p-4 border transition-all duration-200 ${
              notification.isRead ? 'opacity-60' : ''
            }`}
            style={{
              backgroundColor: notification.isRead ? '#f9fafb' : '#ffffff',
              borderColor: notification.isRead
                ? '#e5e7eb'
                : getNotificationColor(notification.priority),
              borderWidth: notification.isRead ? '1px' : '2px',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 mt-1"
                style={{ color: getNotificationColor(notification.priority) }}
              >
                {getNotificationIcon(notification.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold" style={{ color: '#1a3a6e' }}>
                    {notification.title}
                  </h3>
                  <span className="text-xs flex-shrink-0" style={{ color: '#9ca3af' }}>
                    {(() => {
                      const date =
                        notification.createdAt instanceof Date
                          ? notification.createdAt
                          : new Date((notification.createdAt as any)._seconds * 1000);
                      return date.toLocaleDateString('zh-TW', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    })()}
                  </span>
                </div>

                <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                  {notification.message}
                </p>

                {notification.actionUrl && (
                  <a
                    href={notification.actionUrl}
                    className="inline-block text-sm font-medium mt-2 hover:underline"
                    style={{ color: '#1a3a6e' }}
                  >
                    查看詳情 →
                  </a>
                )}
              </div>

              {!notification.isRead && onMarkAsRead && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="flex-shrink-0 text-xs px-2 py-1 rounded hover:bg-gray-100"
                  style={{ color: '#6b7280' }}
                  title="標记為已读"
                >
                  ✓
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {expanded && notifications.length > 5 && (
        <button
          onClick={() => setExpanded(false)}
          className="w-full mt-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors"
          style={{
            borderColor: '#e5e7eb',
            color: '#6b7280',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          收起通知
        </button>
      )}
    </div>
  );
}
