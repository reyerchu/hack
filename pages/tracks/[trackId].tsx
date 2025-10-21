/**
 * 公開賽道詳情頁面（只讀版本）
 * 
 * 供所有參賽者查看賽道的詳細資訊
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import AppHeader from '../../components/AppHeader';

interface Challenge {
  id: string;
  title: string;
  description: string;
  prizes?: string | any[];
  submissionRequirements?: string;
  evaluationCriteria?: string | any[];
}

interface Track {
  id: string;
  name: string;
  description?: string;
  sponsorName?: string;
  totalPrize?: number;
  challenges?: Challenge[];
}

export default function PublicTrackDetailPage() {
  const router = useRouter();
  const { trackId } = router.query;

  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 獲取賽道詳情（公開 API，不需要認證）
  useEffect(() => {
    const fetchTrackDetails = async () => {
      if (!trackId) return;

      try {
        setLoading(true);
        setError(null);

        console.log('[PublicTrackPage] Fetching track:', trackId);
        const response = await fetch(`/api/tracks/${trackId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to fetch track details');
        }

        const data = await response.json();
        console.log('[PublicTrackPage] Received data:', data);
        setTrack(data.data || data);
      } catch (err: any) {
        console.error('[PublicTrackPage] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackDetails();
  }, [trackId]);

  // 格式化獎金顯示
  const formatPrizes = (prizes: string | any[]): string => {
    if (typeof prizes === 'string') {
      return prizes;
    }
    if (Array.isArray(prizes) && prizes.length > 0) {
      if (typeof prizes[0] === 'object') {
        return prizes.map((p: any) => 
          `${p.currency === 'TWD' ? '台幣' : 'USD'} ${p.amount.toLocaleString()} ${p.description || ''}`
        ).join('，');
      }
      return prizes.join(', ');
    }
    return '';
  };

  // 格式化評分標準
  const formatCriteria = (criteria: string | any[]): string => {
    if (typeof criteria === 'string') {
      return criteria;
    }
    if (Array.isArray(criteria) && criteria.length > 0) {
      return criteria.map((c: any) => 
        typeof c === 'object' ? c.name : c
      ).join('、');
    }
    return '';
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>載入中... | Hackathon</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
          <div className="container mx-auto px-4 py-12">
            <div className="text-center py-20">
              <div className="inline-block animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-6 text-lg text-gray-600">載入賽道資訊中...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !track) {
    return (
      <>
        <Head>
          <title>錯誤 | Hackathon</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto text-center py-20">
              <svg className="mx-auto mb-6 w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                載入失敗
              </h1>
              <p className="text-gray-600 mb-6">
                {error || '無法載入賽道資訊'}
              </p>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#1a3a6e', color: '#ffffff' }}
              >
                返回上一頁
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{track.name} | Hackathon</title>
        <meta name="description" content={track.description || `查看 ${track.name} 的詳細資訊`} />
      </Head>
      <AppHeader />
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* 返回按鈕 */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: '#1a3a6e' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>

          {/* 賽道標題 */}
          <div className="mb-8 bg-white rounded-lg p-8 shadow-sm">
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
              {track.name}
            </h1>
            {track.description && (
              <p className="text-lg mb-4" style={{ color: '#6b7280' }}>
                {track.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              {track.sponsorName && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" style={{ color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span style={{ color: '#6b7280' }}>贊助商：</span>
                  <span className="font-medium" style={{ color: '#1a3a6e' }}>{track.sponsorName}</span>
                </div>
              )}
              {track.totalPrize !== undefined && track.totalPrize > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span style={{ color: '#6b7280' }}>總獎金：</span>
                  <span className="font-bold text-lg" style={{ color: '#059669' }}>
                    {track.totalPrize >= 1000 ? `${(track.totalPrize / 1000).toFixed(1)}k` : track.totalPrize} USD
                  </span>
                </div>
              )}
              {track.challenges && track.challenges.length > 0 && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" style={{ color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span style={{ color: '#6b7280' }}>挑戰數量：</span>
                  <span className="font-medium" style={{ color: '#1a3a6e' }}>{track.challenges.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* 挑戰列表 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a3a6e' }}>
              賽道挑戰
            </h2>
            {track.challenges && track.challenges.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {track.challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="bg-white rounded-lg p-6 shadow-sm border"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <h3 className="text-xl font-semibold mb-3" style={{ color: '#1a3a6e' }}>
                      {challenge.title}
                    </h3>
                    
                    {challenge.description && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
                          挑戰描述
                        </h4>
                        <p className="text-sm" style={{ color: '#374151' }}>
                          {challenge.description}
                        </p>
                      </div>
                    )}

                    {challenge.prizes && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
                          💰 獎金詳情
                        </h4>
                        <p className="text-sm font-medium" style={{ color: '#059669' }}>
                          {formatPrizes(challenge.prizes)}
                        </p>
                      </div>
                    )}

                    {challenge.submissionRequirements && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
                          📋 提交要求
                        </h4>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: '#374151' }}>
                          {challenge.submissionRequirements}
                        </p>
                      </div>
                    )}

                    {challenge.evaluationCriteria && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
                          📊 評分標準
                        </h4>
                        <p className="text-sm" style={{ color: '#374151' }}>
                          {formatCriteria(challenge.evaluationCriteria)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="bg-white rounded-lg p-12 text-center border-2 border-dashed"
                style={{ borderColor: '#d1d5db' }}
              >
                <svg
                  className="mx-auto mb-4 w-12 h-12"
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
                <p className="text-lg font-medium" style={{ color: '#6b7280' }}>
                  此賽道尚未添加挑戰
                </p>
              </div>
            )}
          </div>

          {/* 行動按鈕 */}
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
              準備好參加這個賽道了嗎？
            </h3>
            <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
              前往團隊報名頁面，選擇您的賽道並開始您的黑客松之旅
            </p>
            <Link href="/team-register">
              <a
                className="inline-block px-8 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#1a3a6e', color: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a4a7e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                }}
              >
                前往團隊報名
              </a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

