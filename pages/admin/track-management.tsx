/**
 * Admin Track Management 頁面
 *
 * Super_admin 可以：
 * - 查看所有 tracks
 * - 將 tracks 分配給不同的 sponsors
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import firebase from 'firebase/app';
import 'firebase/auth';
import { useAuthContext } from '../../lib/user/AuthContext';
import AdminHeader from '../../components/adminComponents/AdminHeader';

interface Track {
  id: string;
  trackId: string;
  name: string;
  description?: string;
  sponsorId: string;
  sponsorName: string;
  status: string;
  createdAt?: any;
}

interface Sponsor {
  id: string;
  name: string;
  tier?: string;
}

export default function TrackManagementPage() {
  const router = useRouter();
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 分配 modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedSponsorId, setSelectedSponsorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState('');

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/admin/track-management');
    } else if (!authLoading && isSignedIn) {
      // 檢查是否是 admin
      const checkAdmin = async () => {
        try {
          const currentUser = firebase.auth().currentUser;
          if (!currentUser) return;

          const token = await currentUser.getIdToken();
          const response = await fetch('/api/user/profile', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[TrackManagement] API 響應:', data);

            // 支持多種數據格式
            const profile = data.data || data;
            const permissions = profile.permissions || profile.user?.permissions || [];
            console.log('[TrackManagement] permissions:', permissions);

            const hasAdminAccess =
              permissions.includes('super_admin') ||
              permissions.includes('admin') ||
              permissions[0] === 'super_admin' ||
              permissions[0] === 'admin';

            console.log('[TrackManagement] hasAdminAccess:', hasAdminAccess);
            setIsAdmin(hasAdminAccess);

            if (!hasAdminAccess) {
              console.log('[TrackManagement] 無權限，跳轉到首頁');
              router.push('/');
            }
          } else {
            console.error('[TrackManagement] API 請求失敗:', response.status);
            router.push('/');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          router.push('/');
        }
      };

      checkAdmin();
    }
  }, [authLoading, isSignedIn, router]);

  // 獲取 tracks 和 sponsors
  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
          console.error('[TrackManagement] 用戶未登入');
          throw new Error('未登入');
        }
        const token = await currentUser.getIdToken();
        console.log('[TrackManagement] 獲取到 token，開始請求...');

        // 獲取 tracks
        const tracksRes = await fetch('/api/admin/tracks', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('[TrackManagement] API Response status:', tracksRes.status);

        if (!tracksRes.ok) {
          const errorData = await tracksRes.json().catch(() => ({}));
          console.error('[TrackManagement] API Error:', errorData);
          throw new Error(errorData.error || errorData.details || '無法獲取 tracks');
        }

        const tracksData = await tracksRes.json();
        console.log('[TrackManagement] ===== API Response =====');
        console.log('[TrackManagement] Full response:', tracksData);
        console.log('[TrackManagement] success:', tracksData.success);
        console.log('[TrackManagement] data object:', tracksData.data);
        console.log('[TrackManagement] tracks array:', tracksData.data?.tracks);
        console.log('[TrackManagement] tracks count:', tracksData.data?.tracks?.length || 0);

        if (tracksData.data?.tracks) {
          console.log('[TrackManagement] Sample track:', tracksData.data.tracks[0]);
        }

        console.log('[TrackManagement] ========================');

        setTracks(tracksData.data?.tracks || []);

        // 獲取 sponsors
        const sponsorsRes = await fetch('/api/admin/sponsors', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!sponsorsRes.ok) {
          throw new Error('無法獲取 sponsors');
        }

        const sponsorsData = await sponsorsRes.json();
        setSponsors(sponsorsData.data?.sponsors || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  // 打開分配 modal
  const handleAssignClick = (track: Track) => {
    setSelectedTrack(track);
    setSelectedSponsorId(track.sponsorId || '');
    setAssignMessage('');
    setShowAssignModal(true);
  };

  // 執行分配
  const handleAssignSubmit = async () => {
    if (!selectedTrack || !selectedSponsorId) return;

    const selectedSponsor = sponsors.find((s) => s.id === selectedSponsorId);
    if (!selectedSponsor) {
      setAssignMessage('請選擇 sponsor');
      return;
    }

    try {
      setIsAssigning(true);
      setAssignMessage('');

      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('未登入');
      }
      const token = await currentUser.getIdToken();

      const response = await fetch(`/api/admin/tracks/${selectedTrack.trackId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sponsorId: selectedSponsorId,
          sponsorName: selectedSponsor.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '分配失敗');
      }

      const data = await response.json();
      setAssignMessage('✅ 分配成功！');

      // 更新本地 tracks 列表
      setTracks((prev) =>
        prev.map((t) =>
          t.trackId === selectedTrack.trackId
            ? { ...t, sponsorId: selectedSponsorId, sponsorName: selectedSponsor.name }
            : t,
        ),
      );

      // 2 秒後關閉 modal
      setTimeout(() => {
        setShowAssignModal(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error assigning track:', err);
      setAssignMessage(`❌ ${err.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col flex-grow">
        <Head>
          <title>Track 管理 - 管理員儀表板</title>
          <meta name="description" content="Track Management" />
        </Head>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-2 text-left" style={{ color: '#1a3a6e' }}>
                管理儀表板
              </h1>
            </div>
            <AdminHeader />
            <div className="animate-pulse">
              <div className="h-12 bg-gray-300 rounded w-1/3 mb-6"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-grow">
        <Head>
          <title>Track 管理 - 管理員儀表板</title>
          <meta name="description" content="Track Management" />
        </Head>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-2 text-left" style={{ color: '#1a3a6e' }}>
                管理儀表板
              </h1>
            </div>
            <AdminHeader />
            <div
              className="rounded-lg p-6 border-2"
              style={{ backgroundColor: '#fee2e2', borderColor: '#fecaca' }}
            >
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#991b1b' }}>
                載入失敗
              </h2>
              <p className="text-base" style={{ color: '#7f1d1d' }}>
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow">
      <Head>
        <title>Track 管理 - 管理員儀表板</title>
        <meta name="description" content="Track Management" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2 text-left" style={{ color: '#1a3a6e' }}>
              管理儀表板
            </h1>
          </div>

          <AdminHeader />

          {/* Track Management Section */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
              賽道管理
            </h2>
            <button
              onClick={() => alert('請前往 Sponsor Dashboard 創建賽道')}
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

          {tracks.length === 0 ? (
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
                尚未找到賽道
              </p>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                請使用「新增賽道」功能創建賽道
              </p>
            </div>
          ) : (
            <div
              className="bg-white rounded-lg shadow-sm border-2"
              style={{ borderColor: '#e5e7eb' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className="border-b-2"
                      style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}
                    >
                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: '#374151' }}
                      >
                        Track ID
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: '#374151' }}
                      >
                        賽道名稱
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: '#374151' }}
                      >
                        當前 Sponsor
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: '#374151' }}
                      >
                        狀態
                      </th>
                      <th
                        className="px-6 py-4 text-right text-sm font-semibold"
                        style={{ color: '#374151' }}
                      >
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracks.map((track) => (
                      <tr key={track.id} className="border-b" style={{ borderColor: '#e5e7eb' }}>
                        <td className="px-6 py-4 text-sm" style={{ color: '#1a3a6e' }}>
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {track.trackId}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: '#1a3a6e' }}>
                          <div>{track.name}</div>
                          {track.description && (
                            <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                              {track.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#6b7280' }}>
                          <div>{track.sponsorName || '-'}</div>
                          {track.sponsorId && (
                            <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                              {track.sponsorId}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: track.status === 'active' ? '#dcfce7' : '#e5e7eb',
                              color: track.status === 'active' ? '#166534' : '#6b7280',
                            }}
                          >
                            {track.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleAssignClick(track)}
                            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
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
                            重新分配
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedTrack && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !isAssigning && setShowAssignModal(false)}
        >
          <div
            className="rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            style={{ backgroundColor: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
              分配 Track
            </h2>

            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: '#6b7280' }}>
                賽道：
              </p>
              <p className="text-base font-semibold" style={{ color: '#1a3a6e' }}>
                {selectedTrack.name}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                選擇 Sponsor
              </label>
              <select
                value={selectedSponsorId}
                onChange={(e) => setSelectedSponsorId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                style={{ borderColor: '#d1d5db' }}
                disabled={isAssigning}
              >
                <option value="">-- 選擇 Sponsor --</option>
                {sponsors.map((sponsor) => (
                  <option key={sponsor.id} value={sponsor.id}>
                    {sponsor.name} {sponsor.tier ? `(${sponsor.tier})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {assignMessage && (
              <div
                className="mb-4 p-3 rounded-md text-sm"
                style={{
                  backgroundColor: assignMessage.startsWith('✅') ? '#dcfce7' : '#fee2e2',
                  color: assignMessage.startsWith('✅') ? '#166534' : '#991b1b',
                }}
              >
                {assignMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={isAssigning}
                className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                }}
                onMouseEnter={(e) => {
                  if (!isAssigning) e.currentTarget.style.backgroundColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
              >
                取消
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={isAssigning || !selectedSponsorId}
                className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#1a3a6e',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  if (!isAssigning && selectedSponsorId) {
                    e.currentTarget.style.backgroundColor = '#2a4a7e';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                }}
              >
                {isAssigning ? '分配中...' : '確認分配'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
