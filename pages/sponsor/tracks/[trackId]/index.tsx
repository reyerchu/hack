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

  // Handle add challenge
  const handleAddChallengeClick = () => {
    setNewChallengeData({
      title: '',
      description: '',
      prizes: '',
      submissionRequirements: '',
    });
    setCreateMessage('');
    setShowAddChallengeModal(true);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
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
                {track.name || track.trackName}
              </h1>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                {track.description || '賽道管理與數據總覽'}
              </p>
            </div>

            {track.permissions?.canEdit && (
              <button
                onClick={handleAddChallengeClick}
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                新增挑戰
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
                  match: challenge.trackId === trackId
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
                        {challenge.prizes && challenge.prizes.length > 0 && (
                          <div className="text-sm" style={{ color: '#059669' }}>
                            💰 獎金: {challenge.prizes.join(', ')}
                          </div>
                        )}
                        {/* 添加调试信息 */}
                        {challenge.trackId !== trackId && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                            ⚠️ 警告: trackId 不匹配 ({challenge.trackId} !== {trackId})
                          </div>
                        )}
                      </div>
                      <Link href={`/sponsor/tracks/${trackId}/challenge?challengeId=${challenge.id}`}>
                        <a
                          onClick={() => {
                            console.log('[Track Detail] Navigating to challenge:', {
                              url: `/sponsor/tracks/${trackId}/challenge?challengeId=${challenge.id}`,
                              challengeId: challenge.id,
                              challengeTitle: challenge.title,
                              challengeTrackId: challenge.trackId,
                              expectedTrackId: trackId
                            });
                          }}
                          className="ml-4 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors"
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b7280' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
    </div>
  );
}

