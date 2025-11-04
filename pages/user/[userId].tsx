/**
 * 個人公開頁面
 *
 * 顯示用戶的公開資訊和參與的團隊
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppHeader from '../../components/AppHeader';
import HomeFooter from '../../components/homeComponents/HomeFooter';

interface UserPublicInfo {
  userId: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  teamStatus?: string;
  email?: string;
  role?: string;
  school?: string;
  github?: string;
  linkedin?: string;
  phone?: string;
  website?: string;
  resume?: string;
  evmAddress?: string;
  walletAddresses?: Array<{ chainName: string; address: string }>;
  teams: {
    teamId: string;
    teamName: string;
    role: string;
  }[];
}

export default function UserPublicPage() {
  const router = useRouter();
  const { userId } = router.query;
  const [user, setUser] = useState<UserPublicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    fetchUserInfo();
  }, [userId]);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/${userId}/public`);

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err: any) {
      console.error('[UserPublic] Error:', err);
      setError(err.message || '獲取用戶資訊失敗');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... - RWA Hackathon Taiwan</title>
        </Head>
        <AppHeader />
        <div
          className="min-h-screen bg-gray-50 flex items-center justify-center"
          style={{ paddingTop: '80px' }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: '#1a3a6e' }}
            ></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
        <HomeFooter />
      </>
    );
  }

  if (error || !user) {
    return (
      <>
        <Head>
          <title>User Not Found - RWA Hackathon Taiwan</title>
        </Head>
        <AppHeader />
        <div
          className="min-h-screen bg-gray-50 flex items-center justify-center"
          style={{ paddingTop: '80px' }}
        >
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
              找不到使用者
            </h1>
            <p className="text-gray-600 mb-6">{error || '該使用者不存在或資訊不可見'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: '#1a3a6e',
                color: '#ffffff',
              }}
            >
              返回首頁
            </button>
          </div>
        </div>
        <HomeFooter />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{user.displayName} - RWA Hackathon Taiwan</title>
        <meta name="description" content={`${user.displayName} 的個人主頁`} />
      </Head>
      <AppHeader />

      <section className="bg-gray-50 py-16 md:py-24" style={{ paddingTop: '80px' }}>
        <div className="max-w-[1000px] mx-auto px-8 md:px-12">
          {/* User Header */}
          <div
            className="mb-10 bg-white rounded-lg shadow-md p-6 md:p-8 border-l-4"
            style={{ borderLeftColor: '#1a3a6e' }}
          >
            <h1 className="text-[28px] md:text-[36px] font-bold mb-2" style={{ color: '#1a3a6e' }}>
              {user.displayName}
            </h1>
            <div className="w-20 h-1 mb-4" style={{ backgroundColor: '#8B4049' }}></div>

            {/* User Info Grid */}
            {(user.firstName ||
              user.lastName ||
              user.email ||
              user.role ||
              user.school ||
              user.github ||
              user.linkedin ||
              user.phone ||
              user.website ||
              user.evmAddress ||
              (user.walletAddresses && user.walletAddresses.length > 0) ||
              user.resume) && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user.firstName || user.lastName) && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">姓名:</span>
                    <p className="text-sm text-gray-600">
                      {`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                    </p>
                  </div>
                )}
                {user.email && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Email:</span>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                )}
                {user.role && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">角色:</span>
                    <p className="text-sm text-gray-600">{user.role}</p>
                  </div>
                )}
                {user.school && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">學校/公司:</span>
                    <p className="text-sm text-gray-600">{user.school}</p>
                  </div>
                )}
                {user.github && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">GitHub:</span>
                    <p className="text-sm text-gray-600">
                      <a
                        href={`https://github.com/${user.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {user.github}
                      </a>
                    </p>
                  </div>
                )}
                {user.linkedin && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">LinkedIn:</span>
                    <p className="text-sm text-gray-600">
                      <a
                        href={
                          user.linkedin.startsWith('http')
                            ? user.linkedin
                            : `https://${user.linkedin}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {user.linkedin.replace(/^https?:\/\//, '')}
                      </a>
                    </p>
                  </div>
                )}
                {user.phone && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">電話:</span>
                    <p className="text-sm text-gray-600">{user.phone}</p>
                  </div>
                )}
                {user.website && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">個人網站:</span>
                    <p className="text-sm text-gray-600">
                      <a
                        href={
                          user.website.startsWith('http') ? user.website : `https://${user.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {user.website}
                      </a>
                    </p>
                  </div>
                )}
                {user.evmAddress && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">EVM 錢包地址:</span>
                    <p className="text-sm text-gray-600 font-mono break-all">{user.evmAddress}</p>
                  </div>
                )}
                {user.walletAddresses && user.walletAddresses.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-sm font-semibold text-gray-700 block mb-2">
                      其他錢包地址:
                    </span>
                    <div className="space-y-1">
                      {user.walletAddresses.map((wallet, index) => (
                        <div key={index} className="flex gap-2 text-sm">
                          <span className="text-gray-700 font-semibold min-w-[100px]">
                            {wallet.chainName}:
                          </span>
                          <span className="text-gray-600 font-mono break-all">
                            {wallet.address}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {user.resume && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">履歷:</span>
                    <p className="text-sm text-gray-600">
                      <span className="text-gray-600 break-all">{user.resume}</span>{' '}
                      <button
                        onClick={() => {
                          fetch(`/api/resume/${user.userId}`)
                            .then((res) => res.json())
                            .then((data) => {
                              if (data.success && data.url) {
                                window.open(data.url, '_blank');
                              } else {
                                alert('無法獲取履歷鏈接');
                              }
                            })
                            .catch(() => alert('無法獲取履歷鏈接'));
                        }}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        (下載)
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Teams Section */}
          <div className="mb-8">
            <h2 className="text-[22px] md:text-[28px] font-bold mb-4" style={{ color: '#1a3a6e' }}>
              參與的團隊
            </h2>
            <div className="w-14 h-1 mb-6" style={{ backgroundColor: '#8B4049' }}></div>

            {user.teams && user.teams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.teams.map((team, index) => (
                  <Link key={index} href={`/teams/${team.teamId}/public`}>
                    <a
                      className="bg-white py-4 px-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4"
                      style={{ borderLeftColor: '#94a3b8' }}
                    >
                      <h3
                        className="text-[16px] md:text-[18px] font-semibold mb-1"
                        style={{ color: '#1a3a6e' }}
                      >
                        {team.teamName}
                      </h3>
                      {team.role && <p className="text-sm text-gray-600">{team.role}</p>}
                    </a>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white py-8 px-6 rounded-lg text-center border border-gray-200">
                <p className="text-gray-600">尚未參與任何團隊</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <HomeFooter />
    </>
  );
}
