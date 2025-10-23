/**
 * 贊助商儀表板主頁面
 *
 * 功能：
 * - 顯示贊助商負責的賽道概覽
 * - 統計數據（賽道数、提交数、隊伍数、平均分）
 * - 快速操作入口
 * - 通知中心
 * - 活动日志
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthContext } from '../../lib/user/AuthContext';
import {
  useSponsorTracks,
  useTrackStats,
  useSponsorNotifications,
  useIsSponsor,
} from '../../lib/sponsor/hooks';
import DashboardStats from '../../components/sponsor/DashboardStats';
import QuickActions from '../../components/sponsor/QuickActions';
import NotificationCenter from '../../components/sponsor/NotificationCenter';
import ActivityLog from '../../components/sponsor/ActivityLog';
import SponsorHeader from '../../components/sponsor/SponsorHeader';
import firebase from 'firebase/app';
import 'firebase/auth';

export default function SponsorDashboard() {
  const router = useRouter();
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const {
    tracks,
    loading: tracksLoading,
    error: tracksError,
    refetch: refetchTracks,
  } = useSponsorTracks();
  const { stats, loading: statsLoading } = useTrackStats();
  const { notifications, markAsRead } = useSponsorNotifications();

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  // Add track modal state
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [newTrackData, setNewTrackData] = useState({
    name: '',
    description: '',
    sponsorId: '',
    sponsorName: '',
  });
  const [sponsors, setSponsors] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(false);

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/dashboard');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      // 非贊助商用戶，跳转到主頁
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  // Handle delete challenge
  const handleDeleteClick = (track: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrack(track);
    setDeleteMessage('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTrack) return;

    try {
      setIsDeleting(true);
      setDeleteMessage('');

      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('未登入');
      }
      const token = await currentUser.getIdToken();

      console.log('[Dashboard] Deleting track:', selectedTrack.id);
      const apiUrl = `/api/sponsor/tracks/${selectedTrack.id}/delete`;
      console.log('[Dashboard] API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[Dashboard] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Dashboard] Error data:', errorData);
        throw new Error(errorData.error || errorData.details || '刪除失敗');
      }

      const data = await response.json();
      console.log('[Dashboard] Success data:', data);

      setDeleteMessage('✅ Challenge 已成功刪除！');

      // Wait 1.5 seconds then close modal and refresh
      setTimeout(() => {
        setShowDeleteModal(false);
        refetchTracks();
      }, 1500);
    } catch (err: any) {
      console.error('[Dashboard] Error deleting challenge:', err);
      console.error('[Dashboard] Error details:', err.message, err.stack);
      setDeleteMessage(`❌ ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle add track
  const handleAddTrackClick = async () => {
    setNewTrackData({
      name: '',
      description: '',
      sponsorId: '',
      sponsorName: '',
    });
    setCreateMessage('');
    setShowAddTrackModal(true);

    // Fetch sponsors list
    try {
      setLoadingSponsors(true);
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/admin/sponsors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSponsors(data.data?.sponsors || []);
      }
    } catch (error) {
      console.error('Failed to fetch sponsors:', error);
    } finally {
      setLoadingSponsors(false);
    }
  };

  const handleCreateTrack = async () => {
    try {
      setIsCreating(true);
      setCreateMessage('');

      // Validation
      if (!newTrackData.name.trim()) {
        setCreateMessage('❌ 請輸入賽道名稱');
        return;
      }
      if (!newTrackData.sponsorId || !newTrackData.sponsorName.trim()) {
        setCreateMessage('❌ 請選擇贊助商');
        return;
      }

      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('未登入');
      }
      const token = await currentUser.getIdToken();

      console.log('[Dashboard] Creating track:', newTrackData);
      const response = await fetch('/api/sponsor/tracks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTrackData),
      });

      console.log('[Dashboard] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Dashboard] Error data:', errorData);
        throw new Error(errorData.error || errorData.details || '創建失敗');
      }

      const data = await response.json();
      console.log('[Dashboard] Success data:', data);

      setCreateMessage('✅ 賽道已成功創建！');

      // Wait 1.5 seconds then close modal and refresh
      setTimeout(() => {
        setShowAddTrackModal(false);
        refetchTracks();
      }, 1500);
    } catch (err: any) {
      console.error('[Dashboard] Error creating track:', err);
      setCreateMessage(`❌ ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Loading state
  if (authLoading || tracksLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="animate-pulse">
            <div
              className="h-10 bg-gray-300 rounded w-1/3 mb-8"
              style={{ backgroundColor: '#e5e7eb' }}
            ></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-300 rounded-lg"
                  style={{ backgroundColor: '#e5e7eb' }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (tracksError) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#991b1b' }}>
              加载失败
            </h2>
            <p className="text-sm" style={{ color: '#7f1d1d' }}>
              {tracksError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-lg font-medium"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
              }}
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 如果没有賽道，顯示歡迎頁面
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col flex-grow">
        <Head>
          <title>儀表板 - 贊助商儀表板</title>
          <meta name="description" content="贊助商儀表板" />
        </Head>

        <div className="min-h-screen bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mb-12 text-left">
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
                贊助商儀表板
              </h1>
            </div>

            <SponsorHeader />

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                我的賽道
              </h2>
              {/* Show Add Track button for admins */}
              {isSponsor && (
                <button
                  onClick={handleAddTrackClick}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors"
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
                  新增賽道
                </button>
              )}
            </div>

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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h2 className="text-xl font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                歡迎使用贊助商平台
              </h2>
              <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
                您的帳號暫未關聯任何賽道。{isSponsor && '點擊上方「新增賽道」按鈕開始創建。'}
                {!isSponsor && '如有疑問，請聯繫管理員。'}
              </p>
            </div>
          </div>
        </div>

        {/* Add Track Modal - also available in empty state */}
        {showAddTrackModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => !isCreating && setShowAddTrackModal(false)}
          >
            <div
              className="bg-white rounded-lg p-8 max-w-lg w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                  style={{ backgroundColor: '#dbeafe' }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: '#1a3a6e' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#1a3a6e' }}>
                    新增賽道
                  </h3>
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    創建一個新的競賽賽道
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {/* Track Name */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                    賽道名稱 <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newTrackData.name}
                    onChange={(e) => setNewTrackData({ ...newTrackData, name: e.target.value })}
                    placeholder="例如：RWA 創新應用賽道"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: '#d1d5db' }}
                    disabled={isCreating}
                  />
                </div>

                {/* Sponsor Name */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                    贊助商名稱 <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  {loadingSponsors ? (
                    <div
                      className="w-full px-4 py-2 border rounded-lg"
                      style={{ borderColor: '#d1d5db' }}
                    >
                      <span className="text-sm" style={{ color: '#6b7280' }}>
                        載入贊助商列表...
                      </span>
                    </div>
                  ) : (
                    <select
                      value={newTrackData.sponsorId}
                      onChange={(e) => {
                        const selectedSponsor = sponsors.find((s) => s.id === e.target.value);
                        setNewTrackData({
                          ...newTrackData,
                          sponsorId: e.target.value,
                          sponsorName: selectedSponsor?.name || '',
                        });
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: '#d1d5db' }}
                      disabled={isCreating || loadingSponsors}
                    >
                      <option value="">請選擇贊助商...</option>
                      {sponsors.map((sponsor) => (
                        <option key={sponsor.id} value={sponsor.id}>
                          {sponsor.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                    賽道描述
                  </label>
                  <textarea
                    value={newTrackData.description}
                    onChange={(e) =>
                      setNewTrackData({ ...newTrackData, description: e.target.value })
                    }
                    placeholder="簡要描述這個賽道的目標和要求..."
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: '#d1d5db' }}
                    disabled={isCreating}
                  />
                </div>
              </div>

              {createMessage && (
                <div
                  className={`p-4 mb-4 rounded-lg ${
                    createMessage.includes('✅')
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p
                    className="text-sm"
                    style={{
                      color: createMessage.includes('✅') ? '#166534' : '#991b1b',
                    }}
                  >
                    {createMessage}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddTrackModal(false)}
                  disabled={isCreating}
                  className="flex-1 border-2 px-6 py-3 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  style={{
                    borderColor: '#d1d5db',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleCreateTrack}
                  disabled={isCreating}
                  className="flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: '#1a3a6e',
                    color: '#ffffff',
                  }}
                >
                  {isCreating ? '創建中...' : '確認創建'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 主要儀表板內容
  return (
    <div className="flex flex-col flex-grow">
      <Head>
        <title>儀表板 - 贊助商儀表板</title>
        <meta name="description" content="贊助商儀表板" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          {/* Header */}
          <div className="mb-12 text-left">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
              贊助商儀表板
            </h1>
          </div>

          <SponsorHeader />

          {/* Getting Started Guide - 移到最上方 */}
          <div
            className="mb-4 rounded-lg p-4"
            style={{ backgroundColor: '#e8f4fd', border: '2px solid #1a3a6e' }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: '#1a3a6e' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold mb-1.5" style={{ color: '#1a3a6e' }}>
                  📋 贊助商功能指南
                </h3>
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm"
                  style={{ color: '#374151' }}
                >
                  <div>
                    • <strong>查看賽道</strong>：點擊下方賽道卡片
                  </div>
                  <div>
                    • <strong>管理挑戰</strong>：編輯題目、上傳文件
                  </div>
                  <div>
                    • <strong>審核提交</strong>：查看團隊項目、評分
                  </div>
                  <div>
                    • <strong>聯繫團隊</strong>：與優秀團隊互動
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <DashboardStats stats={stats} loading={statsLoading} />

          {/* My Tracks */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold" style={{ color: '#1a3a6e' }}>
                我的賽道
              </h2>
              <button
                onClick={handleAddTrackClick}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
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
                新增賽道
              </button>
            </div>
            <div className="space-y-4">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="rounded-lg p-5 shadow-sm"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                >
                  {/* Track Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1" style={{ color: '#1a3a6e' }}>
                        {track.name}
                      </h3>
                      <p className="text-sm" style={{ color: '#6b7280' }}>
                        {track.challenges?.length || 0} 個挑戰 • {track.stats.submissionCount}{' '}
                        個提交 • {track.stats.teamCount} 個隊伍
                        {track.stats.averageScore !== undefined &&
                          ` • 平均分: ${track.stats.averageScore.toFixed(1)}`}
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 rounded text-xs font-semibold"
                      style={{
                        backgroundColor: track.permissions.canEdit ? '#dcfce7' : '#e5e7eb',
                        color: track.permissions.canEdit ? '#166534' : '#6b7280',
                      }}
                    >
                      {track.permissions.canEdit ? '可編輯' : '只读'}
                    </span>
                  </div>

                  {/* Challenges List */}
                  {track.challenges && track.challenges.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-semibold" style={{ color: '#1a3a6e' }}>
                        挑戰列表：
                      </h4>
                      <div className="space-y-2">
                        {track.challenges.map((challenge) => (
                          <div
                            key={challenge.id}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            style={{ border: '1px solid #e5e7eb' }}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
                                {challenge.title || challenge.track}
                              </p>
                              {challenge.description && (
                                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                                  {challenge.description.substring(0, 100)}
                                  {challenge.description.length > 100 ? '...' : ''}
                                </p>
                              )}
                              {challenge.prizes && (
                                <p
                                  className="text-xs mt-1 font-medium"
                                  style={{ color: '#059669' }}
                                >
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
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {track.permissions.canEdit && (
                                <>
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/sponsor/tracks/${track.id}/challenge?challengeId=${challenge.id}&mode=edit`,
                                      )
                                    }
                                    className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                                    style={{
                                      backgroundColor: '#059669',
                                      color: '#ffffff',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#047857';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#059669';
                                    }}
                                  >
                                    編輯
                                  </button>
                                  <button
                                    className="text-sm px-2 py-1.5 rounded-lg transition-colors"
                                    style={{
                                      backgroundColor: '#dc2626',
                                      color: '#ffffff',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#b91c1c';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#dc2626';
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(
                                        {
                                          ...track,
                                          id: challenge.trackId,
                                          name: challenge.title || challenge.track,
                                        },
                                        e,
                                      );
                                    }}
                                    title="刪除挑戰"
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
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#1a3a6e' }}>
              快速操作
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() =>
                  router.push(
                    tracks[0] ? `/sponsor/tracks/${tracks[0].id}/challenge` : '/sponsor/tracks',
                  )
                }
                className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-lg text-left"
                style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1a3a6e';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <div className="mb-1.5" style={{ color: '#1a3a6e' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold mb-0.5" style={{ color: '#1a3a6e' }}>
                  管理挑戰題目
                </h3>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  上傳或編輯賽道內容
                </p>
              </button>

              <button
                onClick={() =>
                  router.push(
                    tracks[0]
                      ? `/sponsor/tracks/${tracks[0].id}/submissions`
                      : '/sponsor/submissions',
                  )
                }
                className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-lg text-left"
                style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1a3a6e';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <div className="mb-1.5" style={{ color: '#1a3a6e' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold mb-0.5" style={{ color: '#1a3a6e' }}>
                  查看提交
                </h3>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  瀏覽隊伍的項目提交
                </p>
              </button>

              <button
                onClick={() =>
                  router.push(
                    tracks[0] ? `/sponsor/tracks/${tracks[0].id}/judging` : '/sponsor/judging',
                  )
                }
                className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-lg text-left"
                style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1a3a6e';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <div className="mb-1.5" style={{ color: '#1a3a6e' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold mb-0.5" style={{ color: '#1a3a6e' }}>
                  評審與決選
                </h3>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  對提交進行評分排名
                </p>
              </button>

              <button
                onClick={() => router.push('/sponsor/reports')}
                className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-lg text-left"
                style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1a3a6e';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <div className="mb-1.5" style={{ color: '#1a3a6e' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold mb-0.5" style={{ color: '#1a3a6e' }}>
                  數據報告
                </h3>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  查看參與度與品牌曝光
                </p>
              </button>
            </div>
          </div>

          {/* Notifications - 只在有通知時顯示 */}
          {notifications && notifications.length > 0 && (
            <NotificationCenter notifications={notifications} onMarkAsRead={markAsRead} />
          )}

          {/* Activity Log - 暫時隱藏，待實際數據接入後再顯示 */}
          {/* <ActivityLog logs={[]} /> */}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTrack && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
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
              <div>
                <h3 className="text-xl font-bold" style={{ color: '#1a3a6e' }}>
                  確認刪除 Challenge
                </h3>
              </div>
            </div>

            <p className="text-base mb-6" style={{ color: '#6b7280' }}>
              確定要刪除 <strong style={{ color: '#1a3a6e' }}>{selectedTrack.name}</strong> 嗎？
              此操作無法撤銷。
            </p>

            {deleteMessage && (
              <div
                className={`p-4 mb-4 rounded-lg ${
                  deleteMessage.includes('✅')
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p
                  className="text-sm"
                  style={{
                    color: deleteMessage.includes('✅') ? '#166534' : '#991b1b',
                  }}
                >
                  {deleteMessage}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 border-2 px-6 py-3 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                style={{
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  backgroundColor: 'transparent',
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                }}
              >
                {isDeleting ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Track Modal */}
      {showAddTrackModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !isCreating && setShowAddTrackModal(false)}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                style={{ backgroundColor: '#dbeafe' }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: '#1a3a6e' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: '#1a3a6e' }}>
                  新增賽道
                </h3>
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  創建一個新的競賽賽道
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Track Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                  賽道名稱 <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newTrackData.name}
                  onChange={(e) => setNewTrackData({ ...newTrackData, name: e.target.value })}
                  placeholder="例如：RWA 創新應用賽道"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  disabled={isCreating}
                />
              </div>

              {/* Sponsor Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                  贊助商名稱 <span style={{ color: '#dc2626' }}>*</span>
                </label>
                {loadingSponsors ? (
                  <div
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: '#d1d5db' }}
                  >
                    <span className="text-sm" style={{ color: '#6b7280' }}>
                      載入贊助商列表...
                    </span>
                  </div>
                ) : (
                  <select
                    value={newTrackData.sponsorId}
                    onChange={(e) => {
                      const selectedSponsor = sponsors.find((s) => s.id === e.target.value);
                      setNewTrackData({
                        ...newTrackData,
                        sponsorId: e.target.value,
                        sponsorName: selectedSponsor?.name || '',
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: '#d1d5db' }}
                    disabled={isCreating || loadingSponsors}
                  >
                    <option value="">請選擇贊助商...</option>
                    {sponsors.map((sponsor) => (
                      <option key={sponsor.id} value={sponsor.id}>
                        {sponsor.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                  賽道描述
                </label>
                <textarea
                  value={newTrackData.description}
                  onChange={(e) =>
                    setNewTrackData({ ...newTrackData, description: e.target.value })
                  }
                  placeholder="簡要描述這個賽道的目標和要求..."
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  disabled={isCreating}
                />
              </div>
            </div>

            {createMessage && (
              <div
                className={`p-4 mb-4 rounded-lg ${
                  createMessage.includes('✅')
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p
                  className="text-sm"
                  style={{
                    color: createMessage.includes('✅') ? '#166534' : '#991b1b',
                  }}
                >
                  {createMessage}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowAddTrackModal(false)}
                disabled={isCreating}
                className="flex-1 border-2 px-6 py-3 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                style={{
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  backgroundColor: 'transparent',
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreateTrack}
                disabled={isCreating}
                className="flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: '#1a3a6e',
                  color: '#ffffff',
                }}
              >
                {isCreating ? '創建中...' : '確認創建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
