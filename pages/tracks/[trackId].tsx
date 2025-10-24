/**
 * 公開賽道詳情頁面
 *
 * 供所有參賽者查看賽道的詳細資訊
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

interface Challenge {
  id: string;
  title: string;
  description: string;
  prizes?: string | any[];
  submissionRequirements?: string;
  evaluationCriteria?: string | any[];
  trackId?: string;
}

interface Track {
  id: string;
  name: string;
  description?: string;
  sponsorName?: string;
  sponsorId?: string;
  totalPrize?: number;
  challenges?: Challenge[];
}

export default function PublicTrackDetailPage() {
  const router = useRouter();
  const { trackId } = router.query;
  const { isSignedIn, user } = useAuthContext();

  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // 檢查編輯權限（sponsor/admin）
  useEffect(() => {
    const checkPermission = async () => {
      if (!isSignedIn || !user || !trackId || !track) {
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
        const response = await fetch(`/api/sponsor/tracks/${trackId}/check-permission`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCanEdit(data.canEdit || false);
          console.log('[PublicTrackPage] Permission check result:', data.canEdit);
        } else {
          setCanEdit(false);
        }
      } catch (err) {
        console.error('[PublicTrackPage] Permission check error:', err);
        setCanEdit(false);
      } finally {
        setCheckingPermission(false);
      }
    };

    checkPermission();
  }, [isSignedIn, user, trackId, track]);

  // 處理刪除賽道
  const handleDelete = async () => {
    if (!trackId) return;

    try {
      setIsDeleting(true);
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        alert('請先登入');
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/sponsor/tracks/${trackId}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '刪除失敗');
      }

      alert('賽道已成功刪除');
      router.push('/tracks-challenges');
    } catch (error: any) {
      console.error('[PublicTrackPage] Delete error:', error);
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
              <p className="text-gray-600 mb-6">{error || '無法載入賽道資訊'}</p>
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回
          </button>

          {/* 賽道標題 */}
          <div className="mb-8 bg-white rounded-lg p-8 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-4xl font-bold" style={{ color: '#1a3a6e' }}>
                {track.name}
              </h1>
              {canEdit && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      router.push(`/sponsor/tracks/${trackId}?mode=edit&returnUrl=${encodeURIComponent(router.asPath)}`)
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
                    編輯賽道
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    刪除賽道
                  </button>
                </div>
              )}
            </div>
            {track.description && (
              <p
                className="text-lg mb-4"
                style={{
                  color: '#6b7280',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: '1.75',
                }}
              >
                {track.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              {track.sponsorName && (
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
                    {track.sponsorName}
                  </span>
                </div>
              )}
              {track.totalPrize !== undefined && track.totalPrize > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span style={{ color: '#6b7280' }}>總獎金：</span>
                  <span className="font-bold text-lg" style={{ color: '#059669' }}>
                    {track.totalPrize >= 1000
                      ? `${(track.totalPrize / 1000).toFixed(1)}k`
                      : track.totalPrize}{' '}
                    USD
                  </span>
                </div>
              )}
              {track.challenges && track.challenges.length > 0 && (
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span style={{ color: '#6b7280' }}>挑戰數量：</span>
                  <span className="font-medium" style={{ color: '#1a3a6e' }}>
                    {track.challenges.length}
                  </span>
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
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold" style={{ color: '#1a3a6e' }}>
                        {challenge.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Link href={`/challenges/${challenge.id}`}>
                          <a
                            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                            style={{ backgroundColor: '#1a3a6e', color: '#ffffff' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#2a4a7e';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#1a3a6e';
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
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
                            查看詳情
                          </a>
                        </Link>
                        {canEdit && (
                          <button
                            onClick={() =>
                              router.push(
                                `/sponsor/tracks/${trackId}/challenge?challengeId=${challenge.id}&mode=edit&returnUrl=${encodeURIComponent(router.asPath)}`,
                              )
                            }
                            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                            style={{ backgroundColor: '#059669', color: '#ffffff' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#047857';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#059669';
                            }}
                          >
                            <svg
                              className="w-4 h-4"
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
                            編輯
                          </button>
                        )}
                      </div>
                    </div>

                    {challenge.description && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
                          挑戰描述
                        </h4>
                        <p
                          className="text-sm"
                          style={{
                            color: '#374151',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            lineHeight: '1.75',
                          }}
                        >
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
                        <p
                          className="text-sm"
                          style={{
                            color: '#374151',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            lineHeight: '1.75',
                          }}
                        >
                          {challenge.submissionRequirements}
                        </p>
                      </div>
                    )}

                    {challenge.evaluationCriteria && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
                          📊 評分標準
                        </h4>
                        <p
                          className="text-sm"
                          style={{
                            color: '#374151',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            lineHeight: '1.75',
                          }}
                        >
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
              確認刪除賽道
            </h3>
            <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
              您確定要刪除賽道「{track?.name}」嗎？
              <br />
              <span style={{ color: '#dc2626' }}>此操作無法撤銷，該賽道的所有挑戰也將被刪除。</span>
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
