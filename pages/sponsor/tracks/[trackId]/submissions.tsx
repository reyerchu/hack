/**
 * 賽道提交列表頁面
 * 
 * 顯示特定賽道的所有隊伍提交
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '../../../../lib/user/AuthContext';
import { useIsSponsor } from '../../../../lib/sponsor/hooks';
import SubmissionCard from '../../../../components/sponsor/SubmissionCard';
import type { TeamSubmission } from '../../../../lib/sponsor/types';

export default function SubmissionsListPage() {
  const router = useRouter();
  const { trackId } = router.query;
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const [submissions, setSubmissions] = useState<TeamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TeamSubmission['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/dashboard');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  // 獲取提交列表
  useEffect(() => {
    if (!trackId || !isSignedIn) return;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await (window as any).firebase.auth().currentUser?.getIdToken();

        const response = await fetch(`/api/sponsor/tracks/${trackId}/submissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }

        const data = await response.json();
        setSubmissions(data.submissions || []);
      } catch (err: any) {
        console.error('Error fetching submissions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [trackId, isSignedIn]);

  // 筛選和排序
  const filteredSubmissions = submissions
    .filter((sub) => filter === 'all' || sub.status === filter)
    .sort((a, b) => {
      if (sortBy === 'score') {
        return (b.finalScore || 0) - (a.finalScore || 0);
      }
      // 默认按提交時間倒序
      const dateA = a.submittedAt?.toDate?.() || new Date(a.submittedAt || 0);
      const dateB = b.submittedAt?.toDate?.() || new Date(b.submittedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-300 rounded"></div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/sponsor/tracks/${trackId}`}>
            <a className="inline-flex items-center gap-1 text-sm font-medium mb-4 hover:underline" style={{ color: '#1a3a6e' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回賽道詳情
            </a>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
                隊伍提交
              </h1>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                共 {submissions.length} 個提交
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: '#6b7280' }}>
              狀態：
            </span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: '#d1d5db' }}
            >
              <option value="all">全部</option>
              <option value="draft">草稿</option>
              <option value="submitted">已提交</option>
              <option value="under_review">审核中</option>
              <option value="shortlisted">入围</option>
              <option value="winner">獲獎</option>
              <option value="rejected">未入選</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: '#6b7280' }}>
              排序：
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: '#d1d5db' }}
            >
              <option value="date">提交時間</option>
              <option value="score">評分</option>
            </select>
          </div>
        </div>

        {/* Submissions Grid */}
        {filteredSubmissions.length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#1a3a6e' }}>
              暂无提交
            </h2>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              {filter === 'all' ? '還没有隊伍提交項目' : '該狀態下暂无提交'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onClick={() => router.push(`/sponsor/submissions/${submission.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

