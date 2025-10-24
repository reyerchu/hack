/**
 * 公開挑戰詳情頁面
 *
 * 供所有參賽者查看挑戰的詳細資訊
 * Sponsor/Admin 可以看到編輯按鈕
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import AppHeader from '../../components/AppHeader';
import { useAuthContext } from '../../lib/user/AuthContext';
import firebase from 'firebase/app';
import 'firebase/auth';
import { linkifyText } from '../../lib/utils/linkify';

interface Track {
  id: string;
  trackId: string;
  name: string;
  sponsorName?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  prizes?: string | any[];
  submissionRequirements?: string;
  evaluationCriteria?: string | any[];
  trackId?: string;
  track?: Track;
  sponsorName?: string;
}

export default function PublicChallengeDetailPage() {
  const router = useRouter();
  const { challengeId } = router.query;
  const { isSignedIn, user } = useAuthContext();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(false);

  // 獲取挑戰詳情（公開 API，不需要認證）
  useEffect(() => {
    const fetchChallengeDetails = async () => {
      if (!challengeId) return;

      try {
        setLoading(true);
        setError(null);

        console.log('[PublicChallengePage] Fetching challenge:', challengeId);
        const response = await fetch(`/api/challenges/${challengeId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to fetch challenge details');
        }

        const result = await response.json();
        console.log('[PublicChallengePage] Received data:', result);
        setChallenge(result.data);
      } catch (err: any) {
        console.error('[PublicChallengePage] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeDetails();
  }, [challengeId]);

  // 檢查編輯權限（sponsor/admin）
  useEffect(() => {
    const checkPermission = async () => {
      if (!isSignedIn || !user || !challenge || !challenge.trackId) {
        setCanEdit(false);
        return;
      }

      try {
        setCheckingPermission(true);
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
          setCanEdit(false);
          return;
        }

        const token = await currentUser.getIdToken();
        const response = await fetch(
          `/api/sponsor/tracks/${challenge.trackId}/check-permission`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setCanEdit(data.canEdit || false);
          console.log('[PublicChallengePage] Permission check result:', data.canEdit);
        } else {
          setCanEdit(false);
        }
      } catch (err) {
        console.error('[PublicChallengePage] Permission check error:', err);
        setCanEdit(false);
      } finally {
        setCheckingPermission(false);
      }
    };

    checkPermission();
  }, [isSignedIn, user, challenge]);

  // 格式化獎金顯示
  const formatPrizes = (prizes: string | any[]): string => {
    if (typeof prizes === 'string') {
      return prizes;
    }
    if (Array.isArray(prizes) && prizes.length > 0) {
      if (typeof prizes[0] === 'object') {
        return prizes
          .map(
            (p: any) =>
              `${p.currency === 'TWD' ? '台幣' : 'USD'} ${p.amount.toLocaleString()} ${
                p.description || ''
              }`,
          )
          .join('，');
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
      return criteria.map((c: any) => (typeof c === 'object' ? c.name : c)).join('\n');
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
              <p className="mt-6 text-lg text-gray-600">載入挑戰資訊中...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !challenge) {
    return (
      <>
        <Head>
          <title>錯誤 | Hackathon</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto text-center py-20">
              <svg
                className="mx-auto mb-6 w-16 h-16 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h1 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                載入失敗
              </h1>
              <p className="text-gray-600 mb-6">{error || '無法載入挑戰資訊'}</p>
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
        <title>{challenge.title} | Hackathon</title>
        <meta
          name="description"
          content={challenge.description || `查看 ${challenge.title} 的詳細資訊`}
        />
      </Head>
      <AppHeader />
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* 返回按鈕 */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-sm font-medium hover:underline"
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
            返回
          </button>

          {/* 挑戰標題卡片 */}
          <div className="mb-8 bg-white rounded-lg p-8 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                  {challenge.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {challenge.track && (
                    <Link href={`/tracks/${challenge.track.id}`}>
                      <a className="flex items-center gap-2 hover:underline">
                        <svg
                          className="w-5 h-5"
                          style={{ color: '#6b7280' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                        <span style={{ color: '#6b7280' }}>賽道：</span>
                        <span className="font-medium" style={{ color: '#1a3a6e' }}>
                          {challenge.track.name}
                        </span>
                      </a>
                    </Link>
                  )}
                  {challenge.sponsorName && (
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        style={{ color: '#6b7280' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span style={{ color: '#6b7280' }}>贊助商：</span>
                      <span className="font-medium" style={{ color: '#1a3a6e' }}>
                        {challenge.sponsorName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={() =>
                    router.push(
                      `/sponsor/tracks/${challenge.trackId}/challenge?challengeId=${challengeId}&mode=edit&returnUrl=${encodeURIComponent(router.asPath)}`,
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0"
                  style={{ backgroundColor: '#059669', color: '#ffffff' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#047857';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  編輯挑戰
                </button>
              )}
            </div>
          </div>

          {/* 挑戰詳情 */}
          <div className="space-y-6">
            {/* 挑戰描述 */}
            {challenge.description && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                  挑戰描述
                </h2>
                <div
                  className="text-base"
                  style={{
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    lineHeight: '1.75',
                  }}
                >
                  {linkifyText(challenge.description, '#2563eb')}
                </div>
              </div>
            )}

            {/* 獎金詳情 */}
            {challenge.prizes && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#1a3a6e' }}>
                  <span className="text-2xl">💰</span>
                  獎金詳情
                </h2>
                <p className="text-lg font-medium" style={{ color: '#059669' }}>
                  {formatPrizes(challenge.prizes)}
                </p>
              </div>
            )}

            {/* 提交要求 */}
            {challenge.submissionRequirements && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#1a3a6e' }}>
                  📋 提交要求
                </h2>
                <div
                  className="text-base"
                  style={{
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    lineHeight: '1.75',
                  }}
                >
                  {linkifyText(challenge.submissionRequirements, '#2563eb')}
                </div>
              </div>
            )}

            {/* 評分標準 */}
            {challenge.evaluationCriteria && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#1a3a6e' }}>
                  📊 評分標準
                </h2>
                <div
                  className="text-base"
                  style={{
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    lineHeight: '1.75',
                  }}
                >
                  {formatCriteria(challenge.evaluationCriteria)}
                </div>
              </div>
            )}
          </div>

          {/* 行動按鈕 */}
          <div className="mt-8 bg-white rounded-lg p-8 shadow-sm text-center">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
              準備好接受這個挑戰了嗎？
            </h3>
            <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
              前往團隊報名頁面，選擇您的賽道並開始您的黑客松之旅
            </p>
            <div className="flex items-center justify-center gap-4">
              {challenge.track && (
                <Link href={`/tracks/${challenge.track.id}`}>
                  <a
                    className="inline-block px-6 py-3 rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#1a3a6e',
                      border: '2px solid #1a3a6e',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    查看完整賽道
                  </a>
                </Link>
              )}
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
      </div>
    </>
  );
}

