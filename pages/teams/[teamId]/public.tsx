/**
 * 團隊公開頁面
 *
 * 顯示團隊的隊名、隊友、報名的賽道挑戰及得獎狀況
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppHeader from '../../../components/AppHeader';
import HomeFooter from '../../../components/homeComponents/HomeFooter';
import { useAuthContext } from '../../../lib/user/AuthContext';

interface TeamPublicInfo {
  teamId: string;
  teamName: string;
  description: string;
  createdAt: any;
  evmWalletAddress: string;
  otherWallets: Array<{ chain: string; address: string }>;
  demoDaySubmission?: {
    onePager?: { title: string; value: string; type: string; teamName: string };
    githubRepos?: Array<{ title: string; value: string; type: string }>;
  };
  leader: {
    userId: string;
    displayName: string;
    role: string;
  };
  members: {
    userId: string;
    displayName: string;
    role: string;
  }[];
  tracks: {
    trackId: string;
    trackName: string;
    sponsor: string;
  }[];
  challenges: {
    challengeId: string;
    challengeTitle: string;
    trackId: string;
    trackName?: string;
    submissionStatus?: string;
  }[];
  awards: Array<{ trackName: string; awardTitle: string; project?: string }>;
}

export default function TeamPublicPage() {
  const router = useRouter();
  const { teamId } = router.query;
  const { user, isSignedIn } = useAuthContext();
  const [team, setTeam] = useState<TeamPublicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const ADMIN_EMAIL = 'reyerchu@defintek.io';
  const isAdmin = user?.preferredEmail === ADMIN_EMAIL;

  const handleDeleteTeam = async () => {
    if (!isAdmin || !user?.token || !teamId) return;

    const confirmDelete = window.confirm(
      `⚠️ 警告：您確定要刪除團隊「${team?.teamName}」嗎？\n\n此操作無法撤銷！`,
    );

    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/team-register/${teamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: user.token,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '刪除失敗');
      }

      alert('✅ 團隊已成功刪除');
      router.push('/admin/teams');
    } catch (error: any) {
      console.error('[TeamPublic] Delete error:', error);
      alert(`刪除失敗：${error.message || '未知錯誤'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!teamId) return;

    const fetchTeamInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teams/${teamId}/public`);

        if (!response.ok) {
          throw new Error('Failed to fetch team info');
        }

        const data = await response.json();
        setTeam(data.team);
      } catch (err: any) {
        console.error('[TeamPublic] Error:', err);
        setError(err.message || '獲取團隊資訊失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamInfo();
  }, [teamId]);

  // Check if user has edit permission
  useEffect(() => {
    if (!teamId || !isSignedIn || !user?.token) {
      setCanEdit(false);
      return;
    }

    const checkEditPermission = async () => {
      try {
        const response = await fetch(`/api/team-register/${teamId}`, {
          headers: {
            Authorization: user.token,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCanEdit(data.data?.canEdit === true);
        } else {
          setCanEdit(false);
        }
      } catch (err) {
        console.error('[TeamPublic] Error checking edit permission:', err);
        setCanEdit(false);
      }
    };

    checkEditPermission();
  }, [teamId, isSignedIn, user?.token]);

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

  if (error || !team) {
    return (
      <>
        <Head>
          <title>Team Not Found - RWA Hackathon Taiwan</title>
        </Head>
        <AppHeader />
        <div
          className="min-h-screen bg-gray-50 flex items-center justify-center"
          style={{ paddingTop: '80px' }}
        >
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
              找不到團隊
            </h1>
            <p className="text-gray-600 mb-6">{error || '該團隊不存在'}</p>
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
        <title>{team.teamName} - RWA Hackathon Taiwan</title>
        <meta name="description" content={`${team.teamName} 團隊主頁`} />
      </Head>
      <AppHeader />

      <section className="bg-gray-50 py-16 md:py-24" style={{ paddingTop: '80px' }}>
        <div className="max-w-[1000px] mx-auto px-8 md:px-12">
          {/* Team Header */}
          <div
            className="mb-10 bg-white rounded-lg shadow-md p-6 md:p-8 border-l-4"
            style={{ borderLeftColor: '#1a3a6e' }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-[28px] md:text-[36px] font-bold" style={{ color: '#1a3a6e' }}>
                  {team.teamName}
                </h1>
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <button
                    onClick={() => router.push(`/team-register?edit=${teamId}`)}
                    className="ml-4 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
                {isAdmin && (
                  <button
                    onClick={handleDeleteTeam}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#dc2626',
                      border: '2px solid #dc2626',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isDeleting) e.currentTarget.style.backgroundColor = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      if (!isDeleting) e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    {isDeleting ? '刪除中...' : '刪除'}
                  </button>
                )}
              </div>
            </div>
            <div className="w-20 h-1 mb-4" style={{ backgroundColor: '#8B4049' }}></div>

            {/* Awards - Prominent display after divider */}
            {team.awards && team.awards.length > 0 && (
              <div className="mt-6 mb-4">
                <div className="flex flex-wrap gap-3">
                  {team.awards.map((award, index) => {
                    // Extract main award title (remove content in parentheses)
                    const mainTitle = award.awardTitle.replace(/[（(][^）)]*[）)]/g, '').trim();

                    return (
                      <Link key={index} href="/winners">
                        <a
                          className="inline-flex items-center px-5 py-3 rounded-lg text-base md:text-lg font-semibold shadow-sm hover:shadow-md transition-all"
                          style={{
                            backgroundColor: '#1a3a6e',
                            color: '#ffffff',
                            border: '1px solid #2a4a7e',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2a4a7e';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#1a3a6e';
                          }}
                        >
                          <span className="text-xl mr-2">🏆</span>
                          <span>{mainTitle}</span>
                        </a>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {team.description && (
              <p className="text-[14px] md:text-[16px] text-gray-700 mt-4">{team.description}</p>
            )}
          </div>

          {/* Team Members (including leader as first member) */}
          {(team.leader || (team.members && team.members.length > 0)) && (
            <div className="mb-8">
              <h2
                className="text-[20px] md:text-[24px] font-bold mb-4"
                style={{ color: '#1a3a6e' }}
              >
                隊員
              </h2>
              <div className="w-12 h-1 mb-4" style={{ backgroundColor: '#8B4049' }}></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Leader as first member with dark background */}
                {team.leader && (
                  <Link href={`/user/${team.leader.userId}`}>
                    <a
                      className="py-3 px-5 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4"
                      style={{ backgroundColor: '#8B4049', borderLeftColor: '#a85a63' }}
                    >
                      <p className="text-[15px] font-semibold mb-1 text-white">
                        {team.leader.displayName}
                      </p>
                      {team.leader.role && (
                        <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                          {team.leader.role}
                        </p>
                      )}
                    </a>
                  </Link>
                )}

                {/* Other members with light background */}
                {team.members &&
                  team.members.map((member, index) => (
                    <Link key={index} href={`/user/${member.userId}`}>
                      <a
                        className="bg-white py-3 px-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4"
                        style={{ borderLeftColor: '#94a3b8' }}
                      >
                        <p className="text-[15px] font-semibold mb-1" style={{ color: '#1a3a6e' }}>
                          {member.displayName}
                        </p>
                        {member.role && <p className="text-xs text-gray-600">{member.role}</p>}
                      </a>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* Wallet Addresses */}
          {(team.evmWalletAddress || (team.otherWallets && team.otherWallets.length > 0)) && (
            <div className="mb-8">
              <h2
                className="text-[20px] md:text-[24px] font-bold mb-4"
                style={{ color: '#1a3a6e' }}
              >
                錢包地址
              </h2>
              <div className="w-12 h-1 mb-4" style={{ backgroundColor: '#8B4049' }}></div>

              {/* EVM Wallet Address */}
              {team.evmWalletAddress && (
                <div
                  className="bg-white py-4 px-6 rounded-lg shadow-sm mb-3 border-l-4"
                  style={{ borderLeftColor: '#1a3a6e' }}
                >
                  <h3 className="text-[14px] font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                    EVM 錢包地址
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    支援 Ethereum、Arbitrum 等 EVM 兼容鏈
                  </p>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
                    onClick={() => copyToClipboard(team.evmWalletAddress)}
                    style={{
                      backgroundColor:
                        copiedAddress === team.evmWalletAddress ? '#f0fdf4' : 'transparent',
                    }}
                  >
                    <p className="text-sm font-mono break-all flex-1" style={{ color: '#374151' }}>
                      {team.evmWalletAddress}
                    </p>
                    <div className="flex-shrink-0">
                      {copiedAddress === team.evmWalletAddress ? (
                        <div className="flex items-center gap-1 text-green-600">
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-xs font-medium">已複製</span>
                        </div>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
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

              {/* Other Wallet Addresses */}
              {team.otherWallets && team.otherWallets.length > 0 && (
                <div className="space-y-3">
                  {team.otherWallets.map((wallet, index) => (
                    <div
                      key={index}
                      className="bg-white py-4 px-6 rounded-lg shadow-sm border-l-4"
                      style={{ borderLeftColor: '#94a3b8' }}
                    >
                      <h3 className="text-[14px] font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                        {wallet.chain}
                      </h3>
                      <div
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
                        onClick={() => copyToClipboard(wallet.address)}
                        style={{
                          backgroundColor:
                            copiedAddress === wallet.address ? '#f0fdf4' : 'transparent',
                        }}
                      >
                        <p
                          className="text-sm font-mono break-all flex-1"
                          style={{ color: '#374151' }}
                        >
                          {wallet.address}
                        </p>
                        <div className="flex-shrink-0">
                          {copiedAddress === wallet.address ? (
                            <div className="flex items-center gap-1 text-green-600">
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span className="text-xs font-medium">已複製</span>
                            </div>
                          ) : (
                            <svg
                              className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Demo Day Submission */}
          {team.demoDaySubmission && (
            <div className="mb-8">
              <h2
                className="text-[20px] md:text-[24px] font-bold mb-4"
                style={{ color: '#1a3a6e' }}
              >
                Demo Day 提交作品
              </h2>
              <div className="w-12 h-1 mb-4" style={{ backgroundColor: '#8B4049' }}></div>
              <div className="space-y-4">
                {/* One Pager */}
                {team.demoDaySubmission.onePager && (
                  <div
                    className="bg-white py-4 px-6 rounded-lg shadow-sm border-l-4"
                    style={{ borderLeftColor: '#8B4049' }}
                  >
                    <h3 className="text-[16px] font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                      📄{' '}
                      <a
                        href={team.demoDaySubmission.onePager.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        一頁簡介
                      </a>
                    </h3>
                  </div>
                )}

                {/* GitHub Repos - Always show */}
                <div
                  className="bg-white py-4 px-6 rounded-lg shadow-sm border-l-4"
                  style={{ borderLeftColor: '#8B4049' }}
                >
                  <h3 className="text-[16px] font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                    💻 Github 上公開的原始碼（MIT 授權）
                  </h3>
                  {team.demoDaySubmission.githubRepos &&
                  team.demoDaySubmission.githubRepos.length > 0 ? (
                    <div className="space-y-2">
                      {team.demoDaySubmission.githubRepos.map((repo, index) => (
                        <div key={index}>
                          <a
                            href={repo.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm break-all"
                          >
                            {repo.value}
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">尚未提供</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Challenges */}
          {team.challenges && team.challenges.length > 0 && (
            <div className="mb-8">
              <h2
                className="text-[20px] md:text-[24px] font-bold mb-4"
                style={{ color: '#1a3a6e' }}
              >
                參加的挑戰
              </h2>
              <div className="w-12 h-1 mb-4" style={{ backgroundColor: '#8B4049' }}></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.challenges.map((challenge, index) => (
                  <Link key={index} href={`/challenges/${challenge.challengeId}`}>
                    <a
                      className="bg-white py-4 px-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4"
                      style={{ borderLeftColor: '#94a3b8' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3
                            className="text-[15px] md:text-[17px] font-semibold"
                            style={{ color: '#1a3a6e' }}
                          >
                            {challenge.challengeTitle}
                          </h3>
                          {challenge.trackName && (
                            <p className="text-xs text-gray-600 mt-1">{challenge.trackName}</p>
                          )}
                        </div>
                        {challenge.submissionStatus && (
                          <span
                            className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                            style={{
                              backgroundColor:
                                challenge.submissionStatus === '提交完成' ? '#dcfce7' : '#fee2e2',
                              color:
                                challenge.submissionStatus === '提交完成' ? '#166534' : '#991b1b',
                            }}
                          >
                            {challenge.submissionStatus}
                          </span>
                        )}
                      </div>
                    </a>
                  </Link>
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
