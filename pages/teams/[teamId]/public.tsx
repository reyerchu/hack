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

interface TeamPublicInfo {
  teamId: string;
  teamName: string;
  description: string;
  createdAt: any;
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
  awards: any[];
}

export default function TeamPublicPage() {
  const router = useRouter();
  const { teamId } = router.query;
  const [team, setTeam] = useState<TeamPublicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            <h1 className="text-[28px] md:text-[36px] font-bold mb-2" style={{ color: '#1a3a6e' }}>
              {team.teamName}
            </h1>
            <div className="w-20 h-1 mb-4" style={{ backgroundColor: '#8B4049' }}></div>

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

          {/* Tracks */}
          {team.tracks && team.tracks.length > 0 && (
            <div className="mb-8">
              <h2
                className="text-[20px] md:text-[24px] font-bold mb-4"
                style={{ color: '#1a3a6e' }}
              >
                報名的賽道
              </h2>
              <div className="w-12 h-1 mb-4" style={{ backgroundColor: '#8B4049' }}></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.tracks.map((track, index) => (
                  <Link key={index} href={`/tracks/${track.trackId}`}>
                    <a
                      className="bg-white py-4 px-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4"
                      style={{ borderLeftColor: '#1a3a6e' }}
                    >
                      <h3
                        className="text-[16px] md:text-[18px] font-semibold mb-1"
                        style={{ color: '#1a3a6e' }}
                      >
                        {track.trackName}
                      </h3>
                      {track.sponsor && (
                        <p className="text-sm text-gray-600">贊助商: {track.sponsor}</p>
                      )}
                    </a>
                  </Link>
                ))}
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

          {/* Awards (if any) */}
          {team.awards && team.awards.length > 0 && (
            <div className="mb-8">
              <h2
                className="text-[20px] md:text-[24px] font-bold mb-4"
                style={{ color: '#1a3a6e' }}
              >
                獲獎情況
              </h2>
              <div className="w-12 h-1 mb-4" style={{ backgroundColor: '#8B4049' }}></div>
              <div className="space-y-3">
                {team.awards.map((award, index) => (
                  <div
                    key={index}
                    className="bg-white py-4 px-6 rounded-lg shadow-sm border-l-4"
                    style={{ borderLeftColor: '#8B4049' }}
                  >
                    <h3 className="text-[16px] font-semibold" style={{ color: '#1a3a6e' }}>
                      {award.awardName}
                    </h3>
                    {award.trackName && (
                      <p className="text-sm text-gray-600 mt-1">{award.trackName}</p>
                    )}
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
