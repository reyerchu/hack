/**
 * 賽道詳情頁面
 *
 * 顯示單個賽道的详细資訊、統計數據和管理選項
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import firebase from 'firebase/app';
import 'firebase/auth';
import { useAuthContext } from '../../../../lib/user/AuthContext';
import { useIsSponsor } from '../../../../lib/sponsor/hooks';
import { linkifyText } from '../../../../lib/utils/linkify';

export default function TrackDetailPage() {
  const router = useRouter();
  const { trackId } = router.query;
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Challenge Modal
  const [showAddChallengeModal, setShowAddChallengeModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [newChallengeData, setNewChallengeData] = useState({
    title: '',
    description: '',
    prizes: '',
    submissionRequirements: '',
  });

  // Edit Track Modal
  const [showEditTrackModal, setShowEditTrackModal] = useState(false);
  const [isEditingTrack, setIsEditingTrack] = useState(false);
  const [editTrackMessage, setEditTrackMessage] = useState('');
  const [editTrackData, setEditTrackData] = useState({
    name: '',
    description: '',
    submissionDeadline: '',
  });

  // Delete Challenge Modal
  const [showDeleteChallengeModal, setShowDeleteChallengeModal] = useState(false);
  const [deletingChallengeId, setDeletingChallengeId] = useState<string | null>(null);
  const [deletingChallengeTitle, setDeletingChallengeTitle] = useState('');
  const [isDeletingChallenge, setIsDeletingChallenge] = useState(false);
  const [deleteChallengeMessage, setDeleteChallengeMessage] = useState('');

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/dashboard');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  // 獲取賽道詳情
  const fetchTrackDetails = async () => {
    if (!trackId || !isSignedIn) return;

    try {
      setLoading(true);
      setError(null);

      // 安全获取 Firebase ID token
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('無法獲取認證令牌');
      }
      const token = await currentUser.getIdToken();

      console.log('[TrackDetailPage] 發送請求:', `/api/sponsor/tracks/${trackId}`);
      const response = await fetch(`/api/sponsor/tracks/${trackId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[TrackDetailPage] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[TrackDetailPage] API 錯誤:', errorData);
        throw new Error(errorData.error || 'Failed to fetch track details');
      }

      const data = await response.json();
      console.log('[TrackDetailPage] 收到數據:', data);
      setTrack(data.data || data);
    } catch (err: any) {
      console.error('Error fetching track:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackDetails();
  }, [trackId, isSignedIn]);

  // Handle add challenge - 创建空挑战后跳转到编辑页面
  const handleAddChallengeClick = async () => {
    try {
      setIsCreating(true);
      setCreateMessage('');

      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        alert('請先登入');
        return;
      }

      const token = await currentUser.getIdToken();

      // 创建一个带有基本信息的新挑战
      const response = await fetch(`/api/sponsor/tracks/${trackId}/challenges/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: '新挑戰',
          description: '',
          prizes: '',
          submissionRequirements: '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 跳转到挑战编辑页面
        // API 返回格式: { success: true, challenge: { id, challengeId, ... } }
        const newChallengeId = data.challenge?.challengeId || data.challengeId;
        console.log('[AddChallenge] Response data:', data);
        console.log('[AddChallenge] New challengeId:', newChallengeId);

        if (newChallengeId) {
          router.push(`/sponsor/tracks/${trackId}/challenge?challengeId=${newChallengeId}`);
        } else {
          console.error('[AddChallenge] Failed to get challengeId from response:', data);
          alert('創建挑戰成功，但無法獲取挑戰 ID');
          fetchTrackDetails();
        }
      } else {
        alert(`❌ ${data.error || '創建失敗'}`);
      }
    } catch (error: any) {
      console.error('Failed to create challenge:', error);
      alert('❌ 創建挑戰時發生錯誤');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateChallenge = async () => {
    try {
      setIsCreating(true);
      setCreateMessage('');

      // Validation
      if (!newChallengeData.title.trim()) {
        setCreateMessage('❌ 請輸入挑戰標題');
        return;
      }

      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        setCreateMessage('❌ 請先登入');
        return;
      }

      const token = await currentUser.getIdToken();

      const response = await fetch(`/api/sponsor/tracks/${trackId}/challenges/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newChallengeData),
      });

      const data = await response.json();

      if (response.ok) {
        setCreateMessage('✅ 挑戰創建成功！');
        setTimeout(() => {
          setShowAddChallengeModal(false);
          fetchTrackDetails(); // Refresh track data
        }, 1500);
      } else {
        setCreateMessage(`❌ ${data.error || '創建失敗'}`);
      }
    } catch (error: any) {
      console.error('Failed to create challenge:', error);
      setCreateMessage('❌ 創建挑戰時發生錯誤');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle edit track
  const handleEditTrackClick = () => {
    if (track) {
      // Convert Firestore timestamp to datetime-local format
      let deadlineValue = '';
      if (track.submissionDeadline) {
        try {
          const date = track.submissionDeadline.toDate
            ? track.submissionDeadline.toDate()
            : new Date(track.submissionDeadline);
          // Format to YYYY-MM-DDTHH:MM (datetime-local format)
          deadlineValue = date.toISOString().slice(0, 16);
        } catch (e) {
          console.error('Error converting deadline:', e);
        }
      }

      setEditTrackData({
        name: track.name || '',
        description: track.description || '',
        submissionDeadline: deadlineValue,
      });
      setEditTrackMessage('');
      setShowEditTrackModal(true);
    }
  };

  // Handle delete challenge
  const handleDeleteChallengeClick = (challengeId: string, challengeTitle: string) => {
    setDeletingChallengeId(challengeId);
    setDeletingChallengeTitle(challengeTitle);
    setDeleteChallengeMessage('');
    setShowDeleteChallengeModal(true);
  };

  const handleConfirmDeleteChallenge = async () => {
    if (!deletingChallengeId) return;

    try {
      setIsDeletingChallenge(true);
      setDeleteChallengeMessage('');

      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        setDeleteChallengeMessage('❌ 請先登入');
        return;
      }

      const token = await currentUser.getIdToken();

      const response = await fetch(
        `/api/sponsor/tracks/${trackId}/challenge?challengeId=${deletingChallengeId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setDeleteChallengeMessage('✅ 挑戰已成功刪除！');
        setTimeout(() => {
          setShowDeleteChallengeModal(false);
          setDeletingChallengeId(null);
          setDeletingChallengeTitle('');
          fetchTrackDetails(); // Refresh track data
        }, 1500);
      } else {
        setDeleteChallengeMessage(`❌ ${data.error || '刪除失敗'}`);
      }
    } catch (error: any) {
      console.error('Failed to delete challenge:', error);
      setDeleteChallengeMessage('❌ 刪除挑戰時發生錯誤');
    } finally {
      setIsDeletingChallenge(false);
    }
  };

  const handleUpdateTrack = async () => {
    try {
      setIsEditingTrack(true);
      setEditTrackMessage('');

      // Validation
      if (!editTrackData.name.trim()) {
        setEditTrackMessage('❌ 請輸入賽道名稱');
        return;
      }

      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        setEditTrackMessage('❌ 請先登入');
        return;
      }

      const token = await currentUser.getIdToken();

      const response = await fetch(`/api/sponsor/tracks/${trackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editTrackData),
      });

      const data = await response.json();

      if (response.ok) {
        setEditTrackMessage('✅ 賽道更新成功！');
        setTimeout(() => {
          setShowEditTrackModal(false);
          fetchTrackDetails(); // Refresh track data
        }, 1500);
      } else {
        setEditTrackMessage(`❌ ${data.error || '更新失敗'}`);
      }
    } catch (error: any) {
      console.error('Failed to update track:', error);
      setEditTrackMessage('❌ 更新賽道時發生錯誤');
    } finally {
      setIsEditingTrack(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
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
              <a
                className="inline-block mt-4 text-sm font-medium hover:underline"
                style={{ color: '#991b1b' }}
              >
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Header */}
        <div className="mb-6">
          <Link href="/sponsor/dashboard">
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
              返回儀表板
            </a>
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
                  {track.name || track.trackName}
                </h1>
                {track.permissions?.canEdit && (
                  <button
                    onClick={handleEditTrackClick}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#1a3a6e',
                      border: '1px solid #e5e7eb',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div
                className="text-sm"
                style={{
                  color: '#6b7280',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: '1.6',
                }}
              >
                {track.description
                  ? linkifyText(track.description, '#1a3a6e')
                  : '賽道管理與數據總覽'}
              </div>
            </div>

            {track.permissions?.canEdit && (
              <button
                onClick={handleAddChallengeClick}
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors shrink-0"
                style={{
                  backgroundColor: isCreating ? '#9ca3af' : '#1a3a6e',
                  color: '#ffffff',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  opacity: isCreating ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isCreating) e.currentTarget.style.backgroundColor = '#2a4a7e';
                }}
                onMouseLeave={(e) => {
                  if (!isCreating) e.currentTarget.style.backgroundColor = '#1a3a6e';
                }}
              >
                {isCreating ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    創建中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    新增挑戰
                  </>
                )}
              </button>
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

        {/* 挑戰列表 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
            賽道挑戰
          </h2>
          {track.challenges && track.challenges.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {track.challenges.map((challenge: any) => {
                // 添加详细日志
                console.log('[Track Detail] Challenge:', {
                  id: challenge.id,
                  title: challenge.title,
                  trackId: challenge.trackId,
                  currentPageTrackId: trackId,
                  match: challenge.trackId === trackId,
                });

                return (
                  <div
                    key={challenge.id}
                    className="rounded-lg p-6 shadow-sm border"
                    style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                          {challenge.title}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                          {challenge.description}
                        </p>
                        {challenge.prizes && (
                          <div className="text-sm" style={{ color: '#059669' }}>
                            💰 獎金:{' '}
                            {typeof challenge.prizes === 'string'
                              ? challenge.prizes
                              : Array.isArray(challenge.prizes) && challenge.prizes.length > 0
                              ? typeof challenge.prizes[0] === 'object'
                                ? challenge.prizes
                                    .map(
                                      (p: any) =>
                                        `${
                                          p.currency === 'TWD' ? '台幣' : 'USD'
                                        } ${p.amount.toLocaleString()} ${p.description}`,
                                    )
                                    .join('，')
                                : challenge.prizes.join(', ')
                              : ''}
                          </div>
                        )}
                        {/* 添加调试信息 */}
                        {challenge.trackId !== trackId && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                            ⚠️ 警告: trackId 不匹配 ({challenge.trackId} !== {trackId})
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        {/* View Submissions Button */}
                        <button
                          onClick={() =>
                            router.push(`/sponsor/challenges/${challenge.id}/submissions`)
                          }
                          className="px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors"
                          style={{
                            borderColor: '#10b981',
                            color: '#10b981',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#10b981';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#10b981';
                          }}
                        >
                          查看提交
                        </button>

                        <Link
                          href={`/sponsor/tracks/${trackId}/challenge?challengeId=${challenge.id}`}
                        >
                          <a
                            onClick={() => {
                              console.log('[Track Detail] Navigating to challenge:', {
                                url: `/sponsor/tracks/${trackId}/challenge?challengeId=${challenge.id}`,
                                challengeId: challenge.id,
                                challengeTitle: challenge.title,
                                challengeTrackId: challenge.trackId,
                                expectedTrackId: trackId,
                              });
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors"
                            style={{
                              borderColor: '#1a3a6e',
                              color: '#1a3a6e',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#1a3a6e';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#1a3a6e';
                            }}
                          >
                            編輯
                          </a>
                        </Link>
                        {track.permissions?.canEdit && (
                          <button
                            onClick={() =>
                              handleDeleteChallengeClick(challenge.id, challenge.title)
                            }
                            className="px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors"
                            style={{
                              borderColor: '#dc2626',
                              color: '#dc2626',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#dc2626';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#dc2626';
                            }}
                          >
                            刪除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-lg p-12 text-center border-2 border-dashed"
              style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb' }}
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
              <p className="text-lg font-medium mb-2" style={{ color: '#6b7280' }}>
                此賽道尚未添加挑戰
              </p>
              <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
                點擊上方「新增挑戰」按鈕來創建第一個挑戰
              </p>
            </div>
          )}
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href={`/sponsor/tracks/${trackId}/submissions`}>
            <a
              className="block rounded-lg p-6 border-2 transition-all hover:shadow-lg"
              style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
            >
              <svg
                className="w-8 h-8 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#1a3a6e' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
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
            <a
              className="block rounded-lg p-6 border-2 transition-all hover:shadow-lg"
              style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
            >
              <svg
                className="w-8 h-8 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#1a3a6e' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
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
            <a
              className="block rounded-lg p-6 border-2 transition-all hover:shadow-lg"
              style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
            >
              <svg
                className="w-8 h-8 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#1a3a6e' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
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

      {/* Add Challenge Modal */}
      {showAddChallengeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#ffffff' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                  新增挑戰
                </h2>
                <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                  為賽道創建一個新的挑戰
                </p>
              </div>
              <button
                onClick={() => setShowAddChallengeModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                disabled={isCreating}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: '#6b7280' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  挑戰標題 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newChallengeData.title}
                  onChange={(e) =>
                    setNewChallengeData({ ...newChallengeData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="例如：最佳 RWA 應用創新獎"
                  disabled={isCreating}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  挑戰描述
                </label>
                <textarea
                  value={newChallengeData.description}
                  onChange={(e) =>
                    setNewChallengeData({ ...newChallengeData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="詳細描述挑戰內容..."
                  rows={4}
                  disabled={isCreating}
                />
              </div>

              {/* Prizes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  獎金（多個獎項請用逗號分隔）
                </label>
                <input
                  type="text"
                  value={newChallengeData.prizes}
                  onChange={(e) =>
                    setNewChallengeData({ ...newChallengeData, prizes: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="例如：冠軍 $10,000, 亞軍 $5,000"
                  disabled={isCreating}
                />
              </div>

              {/* Submission Requirements */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  提交要求
                </label>
                <textarea
                  value={newChallengeData.submissionRequirements}
                  onChange={(e) =>
                    setNewChallengeData({
                      ...newChallengeData,
                      submissionRequirements: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="列出提交的具體要求..."
                  rows={3}
                  disabled={isCreating}
                />
              </div>

              {/* Message */}
              {createMessage && (
                <div
                  className="p-4 rounded-lg text-sm"
                  style={{
                    backgroundColor: createMessage.startsWith('✅') ? '#d1fae5' : '#fee2e2',
                    color: createMessage.startsWith('✅') ? '#065f46' : '#991b1b',
                  }}
                >
                  {createMessage}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowAddChallengeModal(false)}
                  className="px-6 py-2 rounded-lg font-medium border-2 transition-colors"
                  style={{
                    borderColor: '#d1d5db',
                    color: '#6b7280',
                  }}
                  disabled={isCreating}
                >
                  取消
                </button>
                <button
                  onClick={handleCreateChallenge}
                  className="px-6 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: isCreating ? '#9ca3af' : '#1a3a6e',
                    color: '#ffffff',
                  }}
                  disabled={isCreating}
                >
                  {isCreating ? '創建中...' : '確認創建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Track Modal */}
      {showEditTrackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#ffffff' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                  編輯賽道
                </h2>
                <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                  更新賽道的基本資訊
                </p>
              </div>
              <button
                onClick={() => setShowEditTrackModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                disabled={isEditingTrack}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: '#6b7280' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Track Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  賽道名稱 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editTrackData.name}
                  onChange={(e) => setEditTrackData({ ...editTrackData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="例如：Sui 賽道"
                  disabled={isEditingTrack}
                />
              </div>

              {/* Track Description */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  賽道描述
                </label>
                <textarea
                  value={editTrackData.description}
                  onChange={(e) =>
                    setEditTrackData({ ...editTrackData, description: e.target.value })
                  }
                  rows={5}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="描述這個賽道的主題、目標和特色..."
                  disabled={isEditingTrack}
                />
              </div>

              {/* Submission Deadline */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  截止提交時間 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  value={editTrackData.submissionDeadline}
                  onChange={(e) =>
                    setEditTrackData({ ...editTrackData, submissionDeadline: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  disabled={isEditingTrack}
                />
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                  在此時間後將禁止團隊提交作品
                </p>
              </div>

              {/* Message */}
              {editTrackMessage && (
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: editTrackMessage.includes('✅') ? '#dcfce7' : '#fee2e2',
                    border: `1px solid ${editTrackMessage.includes('✅') ? '#86efac' : '#fecaca'}`,
                    color: editTrackMessage.includes('✅') ? '#166534' : '#991b1b',
                  }}
                >
                  {editTrackMessage}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowEditTrackModal(false)}
                  className="px-6 py-2 rounded-lg font-medium border-2 transition-colors"
                  style={{
                    borderColor: '#d1d5db',
                    color: '#6b7280',
                  }}
                  disabled={isEditingTrack}
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateTrack}
                  className="px-6 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: isEditingTrack ? '#9ca3af' : '#1a3a6e',
                    color: '#ffffff',
                  }}
                  disabled={isEditingTrack}
                >
                  {isEditingTrack ? '更新中...' : '確認更新'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Challenge Confirmation Modal */}
      {showDeleteChallengeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg p-8 max-w-md w-full" style={{ backgroundColor: '#ffffff' }}>
            <div className="mb-6">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4"
                style={{ backgroundColor: '#fee2e2' }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: '#dc2626' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-center mb-2" style={{ color: '#1a3a6e' }}>
                確認刪除挑戰
              </h2>
              <p className="text-sm text-center mb-4" style={{ color: '#6b7280' }}>
                您確定要刪除以下挑戰嗎？此操作無法撤銷。
              </p>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
                  {deletingChallengeTitle}
                </p>
              </div>
            </div>

            {deleteChallengeMessage && (
              <div
                className="mb-4 p-3 rounded-lg text-sm text-center"
                style={{
                  backgroundColor: deleteChallengeMessage.includes('成功') ? '#d1fae5' : '#fee2e2',
                  color: deleteChallengeMessage.includes('成功') ? '#065f46' : '#991b1b',
                }}
              >
                {deleteChallengeMessage}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteChallengeModal(false);
                  setDeletingChallengeId(null);
                  setDeletingChallengeTitle('');
                }}
                className="flex-1 px-6 py-2 rounded-lg font-medium border-2 transition-colors"
                style={{
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                }}
                disabled={isDeletingChallenge}
              >
                取消
              </button>
              <button
                onClick={handleConfirmDeleteChallenge}
                className="flex-1 px-6 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: isDeletingChallenge ? '#9ca3af' : '#dc2626',
                  color: '#ffffff',
                }}
                disabled={isDeletingChallenge}
              >
                {isDeletingChallenge ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
