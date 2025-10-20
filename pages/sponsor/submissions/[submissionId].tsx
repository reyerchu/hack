/**
 * 提交詳情頁面
 * 
 * 顯示單個隊伍提交的完整資訊
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '../../../lib/user/AuthContext';
import { useIsSponsor, useSubmission } from '../../../lib/sponsor/hooks';
import type { TeamSubmission } from '../../../lib/sponsor/types';

export default function SubmissionDetailPage() {
  const router = useRouter();
  const { submissionId } = router.query;
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const { submission, loading, error } = useSubmission(submissionId as string);
  const [updating, setUpdating] = useState(false);

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/dashboard');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  const handleStatusChange = async (newStatus: TeamSubmission['status']) => {
    if (!submission) return;

    try {
      setUpdating(true);

      const token = await (window as any).firebase.auth().currentUser?.getIdToken();

      const response = await fetch(`/api/sponsor/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // 刷新頁面數據
      window.location.reload();
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(`更新失败：${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleRecommend = async () => {
    if (!submission) return;

    try {
      setUpdating(true);

      const token = await (window as any).firebase.auth().currentUser?.getIdToken();

      const response = await fetch(`/api/sponsor/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isRecommended: !submission.isRecommended }),
      });

      if (!response.ok) {
        throw new Error('Failed to update recommendation');
      }

      window.location.reload();
    } catch (err: any) {
      console.error('Error updating recommendation:', err);
      alert(`更新失败：${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="h-96 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !submission) {
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
              {error || '找不到該提交'}
            </p>
            <Link href="/sponsor/dashboard">
              <a className="inline-block mt-4 text-sm font-medium hover:underline" style={{ color: '#991b1b' }}>
                返回儀表板
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/sponsor/tracks/${submission.trackId}/submissions`}>
            <a className="inline-flex items-center gap-1 text-sm font-medium mb-4 hover:underline" style={{ color: '#1a3a6e' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回提交列表
            </a>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
                {submission.teamName}
              </h1>
              {submission.projectName && (
                <p className="text-lg" style={{ color: '#6b7280' }}>
                  {submission.projectName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={handleRecommend}
            disabled={updating}
            className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: submission.isRecommended ? '#f59e0b' : '#e5e7eb',
              color: submission.isRecommended ? '#ffffff' : '#1a3a6e',
            }}
          >
            {submission.isRecommended ? '★ 已推荐' : '☆ 推荐'}
          </button>

          <select
            value={submission.status}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            disabled={updating}
            className="px-4 py-2 rounded-lg border font-medium disabled:opacity-50"
            style={{ borderColor: '#d1d5db' }}
          >
            <option value="draft">草稿</option>
            <option value="submitted">已提交</option>
            <option value="under_review">审核中</option>
            <option value="shortlisted">入围</option>
            <option value="winner">獲獎</option>
            <option value="rejected">未入選</option>
          </select>

          <Link href={`/sponsor/tracks/${submission.trackId}/judging?submission=${submissionId}`}>
            <a
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: '#1a3a6e',
                color: '#ffffff',
              }}
            >
              前往評分
            </a>
          </Link>
        </div>

        {/* Basic Info */}
        <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
            基本資訊
          </h2>

          <div className="space-y-4">
            {submission.oneLiner && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b7280' }}>
                  一句话简介
                </label>
                <p className="text-sm" style={{ color: '#1a3a6e' }}>
                  {submission.oneLiner}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b7280' }}>
                  提交時間
                </label>
                <p className="text-sm" style={{ color: '#1a3a6e' }}>
                  {formatDate(submission.submittedAt)}
                </p>
              </div>

              {submission.finalScore !== undefined && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#6b7280' }}>
                    最终評分
                  </label>
                  <p className="text-sm font-semibold" style={{ color: '#1a3a6e' }}>
                    {submission.finalScore.toFixed(1)} / 100
                  </p>
                </div>
              )}
            </div>

            {submission.tags && submission.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
                  標签
                </label>
                <div className="flex flex-wrap gap-2">
                  {submission.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: '#e8eef5',
                        color: '#1a3a6e',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project Description */}
        {submission.projectDescription && (
          <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
              項目描述
            </h2>
            <div className="prose prose-sm max-w-none" style={{ color: '#4b5563' }}>
              {submission.projectDescription.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
            相關链接
          </h2>
          <div className="space-y-3">
            {submission.githubRepo && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b7280' }}>
                  GitHub 倉库
                </label>
                <a
                  href={submission.githubRepo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                  style={{ color: '#1a3a6e' }}
                >
                  {submission.githubRepo}
                </a>
              </div>
            )}

            {submission.demoUrl && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b7280' }}>
                  Demo 链接
                </label>
                <a
                  href={submission.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                  style={{ color: '#1a3a6e' }}
                >
                  {submission.demoUrl}
                </a>
              </div>
            )}

            {submission.videoUrl && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#6b7280' }}>
                  演示视频
                </label>
                <a
                  href={submission.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                  style={{ color: '#1a3a6e' }}
                >
                  {submission.videoUrl}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Team Members */}
        {submission.teamMembers && submission.teamMembers.length > 0 && (
          <div className="rounded-lg p-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
              隊伍成员 ({submission.teamMembers.length})
            </h2>
            <div className="space-y-3">
              {submission.teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: '#f9fafb' }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
                      {member.name}
                    </p>
                    {member.role && (
                      <p className="text-xs" style={{ color: '#6b7280' }}>
                        {member.role}
                      </p>
                    )}
                  </div>
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-sm hover:underline"
                      style={{ color: '#1a3a6e' }}
                    >
                      聯繫
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

