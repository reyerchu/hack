/**
 * 賽道詳情頁面
 * 
 * 顯示單個賽道的详细資訊、統計數據和管理選項
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '../../../../lib/user/AuthContext';
import { useIsSponsor } from '../../../../lib/sponsor/hooks';

export default function TrackDetailPage() {
  const router = useRouter();
  const { trackId } = router.query;
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const [track, setTrack] = useState<any>(null);
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

  // 獲取賽道詳情
  useEffect(() => {
    if (!trackId || !isSignedIn) return;

    const fetchTrackDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await (window as any).firebase.auth().currentUser?.getIdToken();

        const response = await fetch(`/api/sponsor/tracks/${trackId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch track details');
        }

        const data = await response.json();
        setTrack(data);
      } catch (err: any) {
        console.error('Error fetching track:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackDetails();
  }, [trackId, isSignedIn]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !track) {
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
              {error || '找不到該賽道'}
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {track.trackName}
              </h1>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                賽道管理與數據總覽
              </p>
            </div>

            {track.permissions?.canEdit && (
              <Link href={`/sponsor/tracks/${trackId}/challenge`}>
                <a
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors"
                  style={{
                    backgroundColor: '#1a3a6e',
                    color: '#ffffff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a4a7e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a3a6e';
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  編輯挑戰
                </a>
              </Link>
            )}
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
            <h3 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
              項目提交
            </h3>
            <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
              {track.stats?.submissionCount || 0}
            </p>
          </div>

          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
            <h3 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
              參賽隊伍
            </h3>
            <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
              {track.stats?.teamCount || 0}
            </p>
          </div>

          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
            <h3 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
              平均分数
            </h3>
            <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
              {track.stats?.averageScore ? track.stats.averageScore.toFixed(1) : '-'}
            </p>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href={`/sponsor/tracks/${trackId}/submissions`}>
            <a className="block rounded-lg p-6 border-2 transition-all hover:shadow-lg" style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}>
              <svg className="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1a3a6e' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                查看提交
              </h3>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                浏览所有隊伍的項目提交
              </p>
            </a>
          </Link>

          <Link href={`/sponsor/tracks/${trackId}/judging`}>
            <a className="block rounded-lg p-6 border-2 transition-all hover:shadow-lg" style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}>
              <svg className="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1a3a6e' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                評審與決選
              </h3>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                對項目進行評分和排名
              </p>
            </a>
          </Link>

          <Link href="/sponsor/reports">
            <a className="block rounded-lg p-6 border-2 transition-all hover:shadow-lg" style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}>
              <svg className="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1a3a6e' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                數據報告
              </h3>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                查看参與度和品牌曝光數據
              </p>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}

