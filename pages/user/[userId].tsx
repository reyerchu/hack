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
import { useAuthContext } from '../../lib/user/AuthContext';
import { emailToHash } from '../../lib/utils/email-hash';

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
    awards?: Array<{ trackName: string; awardTitle: string; project?: string }>;
  }[];
  nftMintStatus?: {
    eligible: boolean;
    alreadyMinted: boolean;
    campaign?: {
      id: string;
      name: string;
      description: string;
      imageUrl: string;
    };
    mintRecord?: {
      mintedAt: Date;
      transactionHash: string;
    };
  };
}

export default function UserPublicPage() {
  const router = useRouter();
  const { userId } = router.query;
  const { user: currentUser, isSignedIn } = useAuthContext();
  const [user, setUser] = useState<UserPublicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    fetchUserInfo();
  }, [userId]);

  // Check if current user can edit this profile
  useEffect(() => {
    if (!isSignedIn || !currentUser?.preferredEmail || !userId) {
      setCanEdit(false);
      return;
    }

    // Check if the current user's email hash matches the userId in the URL
    const currentUserHash = emailToHash(currentUser.preferredEmail);
    setCanEdit(currentUserHash === userId);
  }, [isSignedIn, currentUser?.preferredEmail, userId]);

  // Copy wallet address to clipboard
  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000); // Clear after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-[28px] md:text-[36px] font-bold" style={{ color: '#1a3a6e' }}>
                  {user.displayName}
                </h1>
              </div>
              <div className="flex gap-2">
                {canEdit && user.nftMintStatus?.eligible && !user.nftMintStatus.alreadyMinted && (
                  <Link href="/nft/mint">
                    <a
                      className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      style={{
                        backgroundColor: '#8B4049',
                        color: '#ffffff',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#a05059';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#8B4049';
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      鑄造 NFT
                    </a>
                  </Link>
                )}
                {canEdit && user.nftMintStatus?.alreadyMinted && user.nftMintStatus.mintRecord && (
                  <div className="px-4 py-2 rounded-lg bg-green-100 text-green-800 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm">已鑄造</span>
                  </div>
                )}
                {canEdit && (
                  <button
                    onClick={() => router.push('/profile?edit=true')}
                    className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
            </div>
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
                      {(() => {
                        const firstName = user.firstName || '';
                        const lastName = user.lastName || '';
                        // Check if name contains Chinese characters
                        const hasChinese = /[\u4e00-\u9fa5]/.test(firstName + lastName);
                        // For Chinese names: lastName + firstName (姓 + 名)
                        // For English names: firstName + lastName
                        return hasChinese
                          ? `${lastName}${firstName}`.trim()
                          : `${firstName} ${lastName}`.trim();
                      })()}
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
                    <span className="text-sm font-semibold text-gray-700 block mb-1">
                      EVM 錢包地址:
                    </span>
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
                      onClick={() => copyToClipboard(user.evmAddress!)}
                      style={{
                        backgroundColor:
                          copiedAddress === user.evmAddress ? '#f0fdf4' : 'transparent',
                      }}
                    >
                      <p className="text-sm text-gray-600 font-mono break-all flex-1">
                        {user.evmAddress}
                      </p>
                      <div className="flex-shrink-0">
                        {copiedAddress === user.evmAddress ? (
                          <div className="flex items-center gap-1 text-green-600">
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-xs font-medium">已複製</span>
                          </div>
                        ) : (
                          <svg
                            className="w-4 h-4 text-gray-400 group-hover:text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {user.walletAddresses && user.walletAddresses.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-sm font-semibold text-gray-700 block mb-2">
                      其他錢包地址:
                    </span>
                    <div className="space-y-2">
                      {user.walletAddresses.map((wallet, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
                          onClick={() => copyToClipboard(wallet.address)}
                          style={{
                            backgroundColor:
                              copiedAddress === wallet.address ? '#f0fdf4' : 'transparent',
                          }}
                        >
                          <span className="text-gray-700 font-semibold text-sm min-w-[100px]">
                            {wallet.chainName}:
                          </span>
                          <span className="text-gray-600 font-mono text-sm break-all flex-1">
                            {wallet.address}
                          </span>
                          <div className="flex-shrink-0">
                            {copiedAddress === wallet.address ? (
                              <div className="flex items-center gap-1 text-green-600">
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                <span className="text-xs font-medium">已複製</span>
                              </div>
                            ) : (
                              <svg
                                className="w-4 h-4 text-gray-400 group-hover:text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            )}
                          </div>
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
                      {team.role && <p className="text-sm text-gray-600 mb-2">{team.role}</p>}

                      {/* Team Awards */}
                      {team.awards && team.awards.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {team.awards.map((award: any, awardIndex: number) => {
                            // Extract main award title (remove content in parentheses)
                            const mainTitle = award.awardTitle
                              .replace(/[（(][^）)]*[）)]/g, '')
                              .trim();

                            return (
                              <div
                                key={awardIndex}
                                className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold"
                                style={{
                                  backgroundColor: '#1a3a6e',
                                  color: '#ffffff',
                                }}
                              >
                                <span className="mr-1">🏆</span>
                                <span>{mainTitle}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
