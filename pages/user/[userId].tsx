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

interface NFTCampaignInfo {
  campaignId: string;
  name: string;
  description: string;
  imageUrl: string;
  network: string;
  contractAddress: string;
  maxSupply: number;
  currentSupply: number;
  startDate?: Date;
  endDate?: Date;
  eligible: boolean;
  alreadyMinted: boolean;
  mintRecord?: {
    mintedAt: Date;
    transactionHash: string;
    tokenId?: number;
  };
  reason?: string;
}

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
  nftCampaigns?: NFTCampaignInfo[];
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

    // Check if userId is a valid MD5 hash (32 hex characters)
    const isMd5Hash = typeof userId === 'string' && /^[a-f0-9]{32}$/i.test(userId);
    
    if (!isMd5Hash) {
      console.log('[UserPublic] ❌ Invalid URL format. Only email hash URLs are allowed.');
      setError('此頁面 URL 格式已過時。請使用正確的個人頁面連結。');
      setLoading(false);
      return;
    }

    fetchUserInfo();
  }, [userId, router.query.refresh]); // Re-fetch when refresh parameter changes

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
      
      // Check if userId is a Firebase UID (not a MD5 hash)
      // MD5 hash is always 32 characters of hex (0-9a-f)
      const isMd5Hash = typeof userId === 'string' && /^[a-f0-9]{32}$/i.test(userId);
      
      if (!isMd5Hash && typeof userId === 'string') {
        console.log('[UserPublic] Detected Firebase UID, fetching user to get email hash...');
        // This is a Firebase UID, try to get the email and redirect
        try {
          const response = await fetch(`/api/user/${userId}/public`);
          if (response.ok) {
            const data = await response.json();
            const email = data.user?.email;
            if (email) {
              const hash = emailToHash(email);
              console.log('[UserPublic] Redirecting to email hash URL:', `/user/${hash}`);
              router.replace(`/user/${hash}`);
              return;
            }
          }
        } catch (err) {
          console.error('[UserPublic] Failed to get user email for redirect:', err);
        }
      }
      
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
                          <div className="flex items-center gap-1 text-green-900">
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
                              <div className="flex items-center gap-1 text-green-900">
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

          {/* NFT Campaigns Section - 公開顯示 */}
          {user.nftCampaigns && user.nftCampaigns.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[22px] md:text-[28px] font-bold mb-4" style={{ color: '#1a3a6e' }}>
                NFT 證書
              </h2>
              <div className="w-14 h-1 mb-6" style={{ backgroundColor: '#8B4049' }}></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.nftCampaigns.map((campaign, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm border-l-4 overflow-hidden hover:shadow-md transition-shadow"
                    style={{ 
                      borderLeftColor: campaign.alreadyMinted 
                        ? '#14532d' // 深綠色 - 已鑄造
                        : campaign.eligible 
                          ? '#1a3a6e' // 深藍色 - 可鑄造
                          : '#991b1b' // 深紅色 - 未鑄造但已額滿
                    }}
                  >
                    {/* Image */}
                    {campaign.imageUrl && (
                      <Link href={`/nft/${campaign.campaignId}`}>
                        <a>
                          <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                            <img
                              src={campaign.imageUrl}
                              alt={campaign.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `
                                  <div class="flex flex-col items-center justify-center h-full text-gray-400">
                                    <svg class="w-16 h-16 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                    </svg>
                                    <span class="text-sm">NFT 圖片</span>
                                  </div>
                                `;
                              }}
                            />
                          </div>
                        </a>
                      </Link>
                    )}

                    {/* Content */}
                    <div className="p-5">
                      <Link href={`/nft/${campaign.campaignId}`}>
                        <a className="hover:text-blue-600 transition-colors">
                          <h3
                            className="text-[16px] md:text-[18px] font-semibold mb-2"
                            style={{ color: '#1a3a6e' }}
                          >
                            {campaign.name}
                          </h3>
                        </a>
                      </Link>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {campaign.description}
                      </p>

                      {/* Network & Supply Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {campaign.network.charAt(0).toUpperCase() + campaign.network.slice(1)}
                        </span>
                        <span>
                          {campaign.currentSupply} / {campaign.maxSupply} 已鑄造
                        </span>
                      </div>

                      {/* Status / Action - 只有頁面所有者才能看到 mint 按鈕 */}
                      {campaign.alreadyMinted && campaign.mintRecord ? (
                        <div>
                          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-green-900 bg-opacity-10 rounded-lg border border-green-900 border-opacity-20">
                            <svg
                              className="w-5 h-5 flex-shrink-0 text-green-900"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <p className="text-sm font-semibold text-green-900">已鑄造</p>
                          </div>
                          {campaign.mintRecord.mintedAt && (
                            <p className="text-xs text-gray-500 text-center mt-2">
                              鑄造於：{new Date(campaign.mintRecord.mintedAt).toLocaleString('zh-TW', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </p>
                          )}
                        </div>
                      ) : canEdit && campaign.eligible ? (
                        // 只有頁面所有者（canEdit=true）才顯示 mint 按鈕
                        <div>
                          <Link href={`/nft/mint?campaign=${campaign.campaignId}`}>
                            <a
                              className="block w-full border-2 py-2 px-4 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300 text-center"
                              style={{
                                borderColor: '#1a3a6e',
                                color: '#1a3a6e',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1a3a6e';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#1a3a6e';
                              }}
                            >
                              鑄造 NFT
                            </a>
                          </Link>
                          {campaign.endDate && (
                            <p className="text-xs text-gray-500 text-center mt-2">
                              截止：{new Date(campaign.endDate).toLocaleString('zh-TW', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </p>
                          )}
                        </div>
                      ) : !canEdit && campaign.eligible ? (
                        // 不是所有者但符合資格 - 顯示灰色 "未鑄造"
                        <div>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-center border border-gray-300">
                            <p className="text-sm font-semibold" style={{ color: '#1a3a6e' }}>未鑄造</p>
                          </div>
                          {campaign.endDate && (
                            <p className="text-xs text-gray-500 text-center mt-2">
                              截止：{new Date(campaign.endDate).toLocaleString('zh-TW', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </p>
                          )}
                        </div>
                      ) : !campaign.alreadyMinted ? (
                        // 不是所有者且未鑄造 - 顯示 "未鑄造"
                        <div>
                          <div className="px-3 py-2 bg-red-50 rounded-lg text-center border border-red-900 border-opacity-20">
                            <p className="text-sm text-red-900 font-semibold">未鑄造</p>
                          </div>
                          {campaign.endDate && (
                            <p className="text-xs text-gray-500 text-center mt-2">
                              截止：{new Date(campaign.endDate).toLocaleString('zh-TW', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </p>
                          )}
                        </div>
                      ) : (
                        // 其他原因不可鑄造
                        <div className="px-3 py-2 bg-red-50 rounded-lg text-center border border-red-900 border-opacity-20">
                          <p className="text-sm text-red-900 font-semibold">{campaign.reason || '暫不可鑄造'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <HomeFooter />
    </>
  );
}
