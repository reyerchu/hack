/**
 * 評審決選頁面
 *
 * 對提交進行評分、排名和決選
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '../../../../lib/user/AuthContext';
import { useIsSponsor } from '../../../../lib/sponsor/hooks';
import JudgingTable from '../../../../components/sponsor/JudgingTable';
import type { TeamSubmission, ExtendedChallenge } from '../../../../lib/sponsor/types';

export default function JudgingPage() {
  const router = useRouter();
  const { trackId } = router.query;
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const [submissions, setSubmissions] = useState<TeamSubmission[]>([]);
  const [challenge, setChallenge] = useState<ExtendedChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/dashboard');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  // 獲取數據
  useEffect(() => {
    if (!trackId || !isSignedIn) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await (window as any).firebase.auth().currentUser?.getIdToken();

        // 並行獲取提交和挑戰資訊
        const [submissionsRes, challengeRes] = await Promise.all([
          fetch(`/api/sponsor/tracks/${trackId}/submissions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/sponsor/tracks/${trackId}/challenge`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!submissionsRes.ok || !challengeRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const submissionsData = await submissionsRes.json();
        const challengeData = await challengeRes.json();

        setSubmissions(submissionsData.submissions || []);
        setChallenge(challengeData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trackId, isSignedIn]);

  const handleScoreUpdate = async (submissionId: string, scores: Record<string, number>) => {
    try {
      const token = await (window as any).firebase.auth().currentUser?.getIdToken();

      const response = await fetch(`/api/sponsor/submissions/${submissionId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ criteriaScores: scores }),
      });

      if (!response.ok) {
        throw new Error('Failed to save scores');
      }

      // 刷新提交列表
      const updatedSubmission = await response.json();
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? updatedSubmission : s)));
    } catch (err: any) {
      console.error('Error updating scores:', err);
      throw err;
    }
  };

  const handleStatusUpdate = async (submissionId: string, status: TeamSubmission['status']) => {
    try {
      const token = await (window as any).firebase.auth().currentUser?.getIdToken();

      const response = await fetch(`/api/sponsor/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // 更新本地狀態
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, status } : s)));
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(`更新失败：${err.message}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="h-96 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
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

  const criteria = challenge?.evaluationCriteria || [
    { name: '创新性', weight: 30 },
    { name: '技术實現', weight: 30 },
    { name: '完成度', weight: 20 },
    { name: '展示效果', weight: 20 },
  ];

  const winners = submissions.filter((s) => s.status === 'winner');
  const shortlisted = submissions.filter((s) => s.status === 'shortlisted');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/sponsor/tracks/${trackId}`}>
            <a
              className="inline-flex items-center gap-1 text-sm font-medium mb-4 hover:underline"
              style={{ color: '#1a3a6e' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回賽道詳情
            </a>
          </Link>

          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
            評審與決選
          </h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            對提交進行評分並确定獲獎名单
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
          >
            <h3 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
              总提交数
            </h3>
            <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
              {submissions.length}
            </p>
          </div>

          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac' }}
          >
            <h3 className="text-sm font-medium mb-2" style={{ color: '#166534' }}>
              入围
            </h3>
            <p className="text-3xl font-bold" style={{ color: '#166534' }}>
              {shortlisted.length}
            </p>
          </div>

          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: '#fce7f3', border: '1px solid #f9a8d4' }}
          >
            <h3 className="text-sm font-medium mb-2" style={{ color: '#9f1239' }}>
              獲獎
            </h3>
            <p className="text-3xl font-bold" style={{ color: '#9f1239' }}>
              {winners.length}
            </p>
          </div>
        </div>

        {/* Evaluation Criteria */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
            評分標准
          </h2>
          <div className="flex flex-wrap gap-4">
            {criteria.map((c, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ backgroundColor: '#e8eef5' }}
              >
                <span className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
                  {c.name}
                </span>
                <span className="text-sm font-semibold" style={{ color: '#6b7280' }}>
                  {c.weight}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Judging Table */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
        >
          <JudgingTable
            submissions={submissions}
            criteria={criteria}
            onScoreUpdate={handleScoreUpdate}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>

        {/* Winners Section */}
        {winners.length > 0 && (
          <div
            className="mt-6 rounded-lg p-6"
            style={{ backgroundColor: '#fce7f3', border: '2px solid #f9a8d4' }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#9f1239' }}>
              🏆 獲獎名单
            </h2>
            <div className="space-y-3">
              {winners
                .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
                .map((winner, index) => (
                  <div
                    key={winner.id}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold" style={{ color: '#9f1239' }}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold" style={{ color: '#1a3a6e' }}>
                          {winner.teamName}
                        </p>
                        {winner.projectName && (
                          <p className="text-sm" style={{ color: '#6b7280' }}>
                            {winner.projectName}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-lg font-bold" style={{ color: '#1a3a6e' }}>
                      {winner.finalScore?.toFixed(1)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
