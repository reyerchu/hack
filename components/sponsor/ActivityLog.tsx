/**
 * 贊助商儀表板 - 活动日志组件
 */

import React from 'react';
import type { SponsorActivityLog } from '../../lib/sponsor/types';

interface ActivityLogProps {
  logs: SponsorActivityLog[];
  maxItems?: number;
}

export default function ActivityLog({ logs, maxItems = 10 }: ActivityLogProps) {
  const displayLogs = logs.slice(0, maxItems);

  if (logs.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
          最近活动
        </h2>
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
        >
          <p className="text-sm" style={{ color: '#6b7280' }}>
            暂无活动記錄
          </p>
        </div>
      </div>
    );
  }

  const getActionIcon = (action: SponsorActivityLog['action']) => {
    switch (action) {
      case 'view_submission':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        );
      case 'update_challenge':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        );
      case 'score_submission':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        );
      case 'download_report':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const getActionLabel = (action: SponsorActivityLog['action']) => {
    const labels: Record<SponsorActivityLog['action'], string> = {
      view_submission: '查看提交',
      edit_challenge: '編輯挑戰',
      update_challenge: '更新挑戰',
      score_team: '評分隊伍',
      score_submission: '評分',
      update_track: '更新賽道',
      contact_team: '聯絡隊伍',
      export_report: '匯出報告',
      download_report: '下載報告',
      other: '其他操作',
    };
    return labels[action] || action;
  };

  const formatTimestamp = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
        最近活动
      </h2>

      <div
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
      >
        <div className="divide-y" style={{ borderColor: '#e5e7eb' }}>
          {displayLogs.map((log, index) => (
            <div
              key={log.id || index}
              className="p-4 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 mt-1 p-2 rounded-full"
                  style={{ backgroundColor: '#e8eef5', color: '#1a3a6e' }}
                >
                  {getActionIcon(log.action)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
                        {getActionLabel(log.action)}
                      </p>
                      {log.details && (
                        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                          {log.details}
                        </p>
                      )}
                      {log.metadata?.trackName && (
                        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                          賽道：{log.metadata.trackName}
                        </p>
                      )}
                    </div>

                    <span className="text-xs flex-shrink-0" style={{ color: '#9ca3af' }}>
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {logs.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm font-medium hover:underline" style={{ color: '#1a3a6e' }}>
            查看更多活动 ({logs.length - maxItems} 条)
          </button>
        </div>
      )}
    </div>
  );
}
