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
  submissionRequirements?: string | any[];
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      // Use track.id (document ID) instead of trackId (field value) for permission check
      const trackDocId = challenge?.track?.id || challenge?.trackId;

      if (!isSignedIn || !user || !challenge || !trackDocId) {
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
        console.log('[PublicChallengePage] Checking permission for track:', trackDocId);
        const response = await fetch(`/api/sponsor/tracks/${trackDocId}/check-permission`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          // ApiResponse.success returns { success: true, data: { canEdit: true } }
          const canEditValue = result.data?.canEdit || result.canEdit || false;
          setCanEdit(canEditValue);
          console.log('[PublicChallengePage] Permission check result:', canEditValue);
        } else {
          console.error('[PublicChallengePage] Permission check failed:', response.status);
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

  // 處理刪除挑戰
  const handleDelete = async () => {
    if (!challengeId) return;

    try {
      setIsDeleting(true);
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        alert('請先登入');
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/sponsor/tracks/${challengeId}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '刪除失敗');
      }

      alert('挑戰已成功刪除');
      if (challenge?.track?.id) {
        router.push(`/tracks/${challenge.track.id}`);
      } else {
        router.push('/tracks-challenges');
      }
    } catch (error: any) {
      console.error('[PublicChallengePage] Delete error:', error);
      alert(`刪除失敗：${error.message}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

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
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() =>
                      router.push(
                        `/sponsor/tracks/${
                          challenge.track?.id || challenge.trackId
                        }/challenge?challengeId=${challengeId}&mode=edit&returnUrl=${encodeURIComponent(
                          router.asPath,
                        )}`,
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: '#059669', color: '#ffffff' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#047857';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#059669';
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
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#b91c1c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    刪除挑戰
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 挑戰詳情 */}
          <div className="space-y-6">
            {/* 挑戰描述 */}
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
                {challenge.description ? linkifyText(challenge.description, '#2563eb') : '暫無描述'}
              </div>
            </div>

            {/* 獎金詳情 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2
                className="text-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: '#1a3a6e' }}
              >
                <span className="text-2xl">💰</span>
                獎金詳情
              </h2>
              <p className="text-lg font-medium" style={{ color: '#059669' }}>
                {formatPrizes(challenge.prizes) || '暫無獎金資訊'}
              </p>
            </div>

            {/* 提交要求 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2
                className="text-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: '#1a3a6e' }}
              >
                📋 提交要求
              </h2>
              {challenge.submissionRequirements ? (
                Array.isArray(challenge.submissionRequirements) ? (
                  // New format: array of requirement objects
                  <div className="space-y-3">
                    {challenge.submissionRequirements.map((req: any, idx: number) => {
                      let icon = '•';
                      let typeLabel = '';
                      if (req.type === 'file') {
                        icon = '📎';
                        typeLabel = '檔案';
                      } else if (req.type === 'link') {
                        icon = '🔗';
                        typeLabel = '連結';
                      } else if (req.type === 'checkbox') {
                        icon = '☑️';
                        typeLabel = '勾選確認';
                      } else if (req.type === 'text') {
                        icon = '✍️';
                        typeLabel = '文字回應';
                      }

                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg"
                          style={{ backgroundColor: '#f9fafb' }}
                        >
                          <span className="text-2xl flex-shrink-0">{icon}</span>
                          <div className="flex-1">
                            {typeLabel && (
                              <div
                                className="text-xs font-semibold mb-1"
                                style={{ color: '#1a3a6e' }}
                              >
                                {typeLabel}
                              </div>
                            )}
                            <p className="text-base" style={{ color: '#374151' }}>
                              {req.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Old format: string
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
                )
              ) : (
                <div className="text-base" style={{ color: '#9ca3af' }}>
                  暫無提交要求
                </div>
              )}
            </div>

            {/* 評分標準 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2
                className="text-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: '#1a3a6e' }}
              >
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
                {formatCriteria(challenge.evaluationCriteria) || '暫無評分標準'}
              </div>
            </div>
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

      {/* 刪除確認模態框 */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
              確認刪除挑戰
            </h3>
            <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
              您確定要刪除挑戰「{challenge?.title}」嗎？
              <br />
              <span style={{ color: '#dc2626' }}>此操作無法撤銷。</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: isDeleting ? '#f87171' : '#dc2626',
                  color: '#ffffff',
                  opacity: isDeleting ? 0.7 : 1,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) e.currentTarget.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) e.currentTarget.style.backgroundColor = '#dc2626';
                }}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    刪除中...
                  </>
                ) : (
                  '確認刪除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
