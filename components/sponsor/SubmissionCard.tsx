/**
 * 提交卡片组件
 * 
 * 顯示單個隊伍提交的摘要資訊
 */

import React from 'react';
import Link from 'next/link';
import type { TeamSubmission } from '../../lib/sponsor/types';

interface SubmissionCardProps {
  submission: TeamSubmission;
  onClick?: () => void;
}

export default function SubmissionCard({ submission, onClick }: SubmissionCardProps) {
  const getStatusColor = (status: TeamSubmission['status']) => {
    const colors = {
      draft: { bg: '#f3f4f6', text: '#6b7280', label: '草稿' },
      submitted: { bg: '#dbeafe', text: '#1e40af', label: '已提交' },
      under_review: { bg: '#fef3c7', text: '#92400e', label: '审核中' },
      shortlisted: { bg: '#dcfce7', text: '#166534', label: '入围' },
      winner: { bg: '#fce7f3', text: '#9f1239', label: '🏆 獲獎' },
      rejected: { bg: '#fee2e2', text: '#991b1b', label: '未入選' },
    };
    return colors[status] || colors.draft;
  };

  const statusStyle = getStatusColor(submission.status);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate" style={{ color: '#1a3a6e' }}>
            {submission.teamName}
          </h3>
          {submission.projectName && (
            <p className="text-sm mt-1 truncate" style={{ color: '#6b7280' }}>
              項目：{submission.projectName}
            </p>
          )}
        </div>

        <span
          className="flex-shrink-0 ml-3 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: statusStyle.bg,
            color: statusStyle.text,
          }}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* One-liner */}
      {submission.oneLiner && (
        <p className="text-sm mb-4 line-clamp-2" style={{ color: '#4b5563' }}>
          {submission.oneLiner}
        </p>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>
            提交時間
          </p>
          <p className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
            {formatDate(submission.submittedAt)}
          </p>
        </div>

        {submission.finalScore !== undefined && (
          <div>
            <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>
              評分
            </p>
            <p className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
              {submission.finalScore.toFixed(1)} / 100
            </p>
          </div>
        )}

        <div>
          <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>
            隊伍成员
          </p>
          <p className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
            {submission.teamMembers?.length || 0} 人
          </p>
        </div>

        {submission.githubRepo && (
          <div>
            <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>
              GitHub
            </p>
            <a
              href={submission.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline truncate block"
              style={{ color: '#1a3a6e' }}
              onClick={(e) => e.stopPropagation()}
            >
              查看倉库 →
            </a>
          </div>
        )}
      </div>

      {/* Tags */}
      {submission.tags && submission.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {submission.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: '#e8eef5',
                color: '#1a3a6e',
              }}
            >
              {tag}
            </span>
          ))}
          {submission.tags.length > 3 && (
            <span className="px-2 py-1 text-xs" style={{ color: '#9ca3af' }}>
              +{submission.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: '#e5e7eb' }}>
        <Link href={`/sponsor/submissions/${submission.id}`}>
          <a
            className="text-sm font-medium hover:underline"
            style={{ color: '#1a3a6e' }}
            onClick={(e) => e.stopPropagation()}
          >
            查看詳情 →
          </a>
        </Link>

        {submission.isRecommended && (
          <div className="flex items-center gap-1" style={{ color: '#f59e0b' }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-medium">推荐</span>
          </div>
        )}
      </div>
    </div>
  );
}

