/**
 * Admin Challenge Management 頁面
 * 
 * Super_admin 可以：
 * - 查看所有 challenges
 * - 將 challenges 分配給不同的 sponsors
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import firebase from 'firebase/app';
import 'firebase/auth';
import { useAuthContext } from '../../lib/user/AuthContext';
import AdminHeader from '../../components/adminComponents/AdminHeader';
import type { ExtendedChallenge } from '../../lib/sponsor/types';

interface Sponsor {
  id: string;
  name: string;
  tier?: string;
}

export default function ChallengeManagementPage() {
  const router = useRouter();
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);

  const [challenges, setChallenges] = useState<ExtendedChallenge[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 分配 modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<ExtendedChallenge | null>(null);
  const [selectedSponsorId, setSelectedSponsorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState('');

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/admin/challenge-management');
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
            console.log('[ChallengeManagement] API 響應:', data);
            
            // 支持多種數據格式
            const profile = data.data || data;
            const permissions = profile.permissions || profile.user?.permissions || [];
            console.log('[ChallengeManagement] permissions:', permissions);
            
            const hasAdminAccess =
              permissions.includes('super_admin') ||
              permissions.includes('admin') ||
              permissions[0] === 'super_admin' ||
              permissions[0] === 'admin';

            console.log('[ChallengeManagement] hasAdminAccess:', hasAdminAccess);
            setIsAdmin(hasAdminAccess);

            if (!hasAdminAccess) {
              console.log('[ChallengeManagement] 無權限，跳轉到首頁');
              router.push('/');
            }
          } else {
            console.error('[ChallengeManagement] API 請求失敗:', response.status);
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

  // 獲取 challenges 和 sponsors
  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
          throw new Error('未登入');
        }
        const token = await currentUser.getIdToken();

        // 獲取 challenges
        const challengesRes = await fetch('/api/admin/challenges', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!challengesRes.ok) {
          throw new Error('無法獲取 challenges');
        }

        const challengesData = await challengesRes.json();
        setChallenges(challengesData.data?.challenges || []);

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
  const handleAssignClick = (challenge: ExtendedChallenge) => {
    setSelectedChallenge(challenge);
    setSelectedSponsorId(challenge.sponsorId || '');
    setAssignMessage('');
    setShowAssignModal(true);
  };

  // 執行分配
  const handleAssignSubmit = async () => {
    if (!selectedChallenge || !selectedSponsorId) return;

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

      const response = await fetch(
        `/api/admin/challenges/${selectedChallenge.trackId}/assign`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sponsorId: selectedSponsorId,
            sponsorName: selectedSponsor.name,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '分配失敗');
      }

      const data = await response.json();
      setAssignMessage('✅ 分配成功！');

      // 更新本地 challenges 列表
      setChallenges((prev) =>
        prev.map((c) =>
          c.trackId === selectedChallenge.trackId
            ? { ...c, sponsorId: selectedSponsorId, sponsorName: selectedSponsor.name }
            : c
        )
      );

      // 2 秒後關閉 modal
      setTimeout(() => {
        setShowAssignModal(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error assigning challenge:', err);
      setAssignMessage(`❌ ${err.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col flex-grow">
        <Head>
          <title>Challenge 管理 - 管理員儀表板</title>
          <meta name="description" content="Challenge Management" />
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
          <title>Challenge 管理 - 管理員儀表板</title>
          <meta name="description" content="Challenge Management" />
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
        <title>Challenge 管理 - 管理員儀表板</title>
        <meta name="description" content="Challenge Management" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2 text-left" style={{ color: '#1a3a6e' }}>
              管理儀表板
            </h1>
          </div>
          
          <AdminHeader />

          {/* Challenge Management Section */}
          <div className="mb-12">
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: '#1a3a6e' }}
            >
              Challenge 分配管理
            </h2>
            <p className="text-base text-gray-600 mb-6">
              將 challenges 分配給不同的 sponsors
            </p>

        {/* Challenges Table */}
        <div
          className="rounded-lg shadow-sm overflow-hidden"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
        >
          <table className="min-w-full divide-y" style={{ borderColor: '#e5e7eb' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: '#6b7280' }}
                >
                  Track ID
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: '#6b7280' }}
                >
                  賽道名稱
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: '#6b7280' }}
                >
                  當前 Sponsor
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: '#6b7280' }}
                >
                  狀態
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ color: '#6b7280' }}
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#e5e7eb' }}>
              {challenges.map((challenge) => (
                <tr key={challenge.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono" style={{ color: '#6b7280' }}>
                    {challenge.trackId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold" style={{ color: '#1a3a6e' }}>
                      {challenge.track}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm" style={{ color: '#374151' }}>
                      {challenge.sponsorName || '-'}
                    </div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>
                      {challenge.sponsorId || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{
                        backgroundColor: challenge.status === 'published' ? '#dcfce7' : '#e5e7eb',
                        color: challenge.status === 'published' ? '#166534' : '#6b7280',
                      }}
                    >
                      {challenge.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleAssignClick(challenge)}
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

          {challenges.length === 0 && (
            <div className="text-center py-12">
              <p className="text-base" style={{ color: '#6b7280' }}>
                沒有找到 challenges
              </p>
            </div>
          )}
        </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedChallenge && (
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
              分配 Challenge
            </h2>

            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: '#6b7280' }}>
                賽道：
              </p>
              <p className="text-base font-semibold" style={{ color: '#1a3a6e' }}>
                {selectedChallenge.track}
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

