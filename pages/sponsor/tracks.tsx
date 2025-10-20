/**
 * Sponsor 賽道管理頁面
 * 
 * 顯示和管理贊助商負責的所有賽道
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthContext } from '../../lib/user/AuthContext';
import { useSponsorTracks, useIsSponsor } from '../../lib/sponsor/hooks';
import SponsorHeader from '../../components/sponsor/SponsorHeader';
import firebase from 'firebase/app';
import 'firebase/auth';

export default function SponsorTracksPage() {
  const router = useRouter();
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const { tracks, loading: tracksLoading, error: tracksError, refetch: refetchTracks } = useSponsorTracks();

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

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/tracks');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

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
      const response = await fetch('/api/sponsor/tracks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTrackData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCreateMessage('✅ 賽道創建成功！');
        setTimeout(() => {
          setShowAddTrackModal(false);
          refetchTracks();
        }, 1500);
      } else {
        setCreateMessage(`❌ ${data.error || '創建失敗'}`);
      }
    } catch (error: any) {
      console.error('Failed to create track:', error);
      setCreateMessage(`❌ 錯誤: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (track: any) => {
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

      const response = await fetch(`/api/sponsor/tracks/${selectedTrack.id}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDeleteMessage('✅ 刪除成功！');
        setTimeout(() => {
          setShowDeleteModal(false);
          refetchTracks();
        }, 1500);
      } else {
        setDeleteMessage(`❌ ${data.error || '刪除失敗'}`);
      }
    } catch (error: any) {
      console.error('Failed to delete track:', error);
      setDeleteMessage(`❌ 錯誤: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || !isSignedIn || !isSponsor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#1a3a6e' }}></div>
          <p className="text-base" style={{ color: '#6b7280' }}>載入中...</p>
        </div>
      </div>
    );
  }

  const loading = tracksLoading;
  const error = tracksError;

  return (
    <div className="flex flex-col flex-grow">
      <Head>
        <title>賽道管理 - 贊助商儀表板</title>
        <meta name="description" content="管理贊助商賽道" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="mb-12 text-left">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
              贊助商儀表板
            </h1>
          </div>
          
          <SponsorHeader />

          {/* Tracks List Section */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
              賽道管理
            </h2>
            <button
              onClick={handleAddTrackClick}
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
              新增賽道
            </button>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#1a3a6e' }}></div>
              <p className="text-base" style={{ color: '#6b7280' }}>載入賽道資料中...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-semibold mb-2">載入失敗</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {!loading && !error && tracks.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border-2 p-12 text-center" style={{ borderColor: '#e5e7eb' }}>
              <svg
                className="mx-auto mb-4 w-16 h-16"
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
              <h3 className="text-xl font-bold mb-2" style={{ color: '#1a3a6e' }}>尚無賽道</h3>
              <p className="text-base mb-4" style={{ color: '#6b7280' }}>
                點擊上方「新增賽道」按鈕開始創建您的第一個賽道
              </p>
            </div>
          )}

          {!loading && !error && tracks.length > 0 && (
            <div className="grid grid-cols-1 gap-6">
              {tracks.map((track: any) => (
                <div
                  key={track.id}
                  className="bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  style={{ borderColor: '#e5e7eb' }}
                  onClick={() => router.push(`/sponsor/tracks/${track.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
                        {track.name}
                      </h3>
                      {track.description && (
                        <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                          {track.description}
                        </p>
                      )}
                      <div className="flex items-center gap-6 text-sm" style={{ color: '#6b7280' }}>
                        <span>挑戰數: {track.challenges?.length || 0}</span>
                        <span>提交數: {track.stats?.submissionCount || 0}</span>
                        <span>隊伍數: {track.stats?.teamCount || 0}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(track);
                      }}
                      className="ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: '#991b1b',
                        color: '#ffffff',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#7f1d1d';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#991b1b';
                      }}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Track Modal - Similar to admin pages */}
      {showAddTrackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h3 className="text-2xl font-bold mb-6" style={{ color: '#1a3a6e' }}>
              新增賽道
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  賽道名稱 *
                </label>
                <input
                  type="text"
                  value={newTrackData.name}
                  onChange={(e) => setNewTrackData({ ...newTrackData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="輸入賽道名稱"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  賽道描述
                </label>
                <textarea
                  value={newTrackData.description}
                  onChange={(e) => setNewTrackData({ ...newTrackData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  rows={4}
                  placeholder="輸入賽道描述"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  贊助商 *
                </label>
                {loadingSponsors ? (
                  <div className="w-full px-4 py-2 border rounded-lg" style={{ borderColor: '#d1d5db' }}>
                    <span className="text-sm" style={{ color: '#6b7280' }}>載入贊助商列表...</span>
                  </div>
                ) : (
                  <select
                    value={newTrackData.sponsorId}
                    onChange={(e) => {
                      const selectedSponsor = sponsors.find(s => s.id === e.target.value);
                      setNewTrackData({ 
                        ...newTrackData, 
                        sponsorId: e.target.value,
                        sponsorName: selectedSponsor?.name || ''
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
            </div>

            {createMessage && (
              <div className={`p-4 rounded-lg mb-4 ${createMessage.includes('✅') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-2`}>
                <p className="text-sm font-medium">{createMessage}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleCreateTrack}
                disabled={isCreating}
                className="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: isCreating ? '#9ca3af' : '#1a3a6e',
                  color: '#ffffff',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isCreating) e.currentTarget.style.backgroundColor = '#2a4a7e';
                }}
                onMouseLeave={(e) => {
                  if (!isCreating) e.currentTarget.style.backgroundColor = '#1a3a6e';
                }}
              >
                {isCreating ? '創建中...' : '確認新增'}
              </button>
              <button
                onClick={() => setShowAddTrackModal(false)}
                disabled={isCreating}
                className="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-8">
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
              確認刪除
            </h3>
            <p className="text-base mb-6" style={{ color: '#374151' }}>
              確定要刪除賽道「{selectedTrack?.name}」嗎？
            </p>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium" style={{ color: '#92400e' }}>
                ⚠️ 此操作無法撤銷！
              </p>
            </div>

            {deleteMessage && (
              <div className={`p-4 rounded-lg mb-4 ${deleteMessage.includes('✅') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-2`}>
                <p className="text-sm font-medium">{deleteMessage}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: isDeleting ? '#9ca3af' : '#991b1b',
                  color: '#ffffff',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) e.currentTarget.style.backgroundColor = '#7f1d1d';
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) e.currentTarget.style.backgroundColor = '#991b1b';
                }}
              >
                {isDeleting ? '刪除中...' : '確認刪除'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

