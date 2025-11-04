/**
 * 賽道挑戰頁面
 *
 * 公開頁面，展示所有賽道和挑戰
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { RequestHelper } from '../lib/request-helper';
import { linkifyText } from '../lib/utils/linkify';

interface Challenge {
  id: string;
  trackId: string;
  title: string;
  description: string;
  submissionRequirements: string;
  evaluationCriteria: any[];
  prizes: any[];
  resources: any[];
  attachments: any[];
}

interface Track {
  id: string;
  name: string;
  description: string;
  sponsorName: string;
  sponsorLogo: string;
  sponsorId: string;
  totalPrize: number;
  challengeCount: number;
  challenges: Challenge[];
}

export default function TracksChallengesPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await RequestHelper.get<{ data: Track[] }>('/api/tracks-challenges/all', {});

      if (response.status !== 200) {
        throw new Error('Failed to fetch tracks');
      }

      setTracks(response.data.data || []);
    } catch (err: any) {
      console.error('[TracksChallenges] Error:', err);
      setError(err.message || '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>賽道挑戰 | Hackathon</title>
        </Head>
        <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center py-20">
              <div className="inline-block animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-6 text-lg text-gray-600">載入賽道挑戰中...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>賽道挑戰 | Hackathon</title>
        </Head>
        <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center py-20">
              <p className="text-lg" style={{ color: '#dc2626' }}>
                {error}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>賽道挑戰 | Hackathon</title>
        <meta name="description" content="瀏覽所有黑客松賽道和挑戰" />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
              賽道挑戰
            </h1>
            <p className="text-xl mb-8" style={{ color: '#6b7280' }}>
              探索所有賽道及其挑戰，找到最適合您的參賽方向
            </p>

            {/* Important Resources */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
              <a
                href="https://www.notion.so/2025-RWA-Hackathon-Track-292deb3d23d8800394f3e2919de54329"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                style={{ backgroundColor: '#1a3a6e' }}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                所有賽道說明文件
              </a>

              <a
                href="https://www.youtube.com/playlist?list=PLgQqxmnk8AudMJgxZZ5kMOwcqHAjZ_4UJ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                style={{ backgroundColor: '#d97706' }}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                所有賽道工作坊錄影
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              className="rounded-lg p-6"
              style={{ backgroundColor: '#ffffff', border: '2px solid #e5e7eb' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
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
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
                    {tracks.length}
                  </p>
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    賽道總數
                  </p>
                </div>
              </div>
            </div>

            <div
              className="rounded-lg p-6"
              style={{ backgroundColor: '#ffffff', border: '2px solid #e5e7eb' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#fef3c7' }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: '#d97706' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
                    {tracks.reduce((sum, t) => sum + t.challengeCount, 0)}
                  </p>
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    挑戰總數
                  </p>
                </div>
              </div>
            </div>

            <div
              className="rounded-lg p-6"
              style={{ backgroundColor: '#ffffff', border: '2px solid #e5e7eb' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#dcfce7' }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: '#059669' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
                    ${tracks.reduce((sum, t) => sum + t.totalPrize, 0).toLocaleString()}
                  </p>
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    總獎金池價值 (USD)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tracks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => (
              <Link key={track.id} href={`/tracks/${track.id}`}>
                <a
                  className="block rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  style={{ backgroundColor: '#ffffff', border: '2px solid #e5e7eb' }}
                >
                  {/* Track Header */}
                  <div
                    className="p-6 border-b"
                    style={{ borderColor: '#e5e7eb', backgroundColor: '#f8fafc' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {track.sponsorLogo ? (
                        // 有 logo：只显示 logo
                        <img
                          src={track.sponsorLogo}
                          alt={track.sponsorName}
                          className="h-12 w-auto object-contain"
                          title={track.name}
                        />
                      ) : (
                        // 无 logo（AWS 和 RWA）：只显示标题
                        <h3 className="text-xl font-bold" style={{ color: '#1a3a6e' }}>
                          {track.name}
                        </h3>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: '#6b7280' }}>
                      {track.sponsorName}
                    </p>
                  </div>

                  {/* Track Body */}
                  <div className="p-6">
                    <div
                      className="text-sm mb-4 line-clamp-3"
                      style={{
                        color: '#374151',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        lineHeight: '1.75',
                      }}
                    >
                      {linkifyText(track.description || '探索此賽道的精彩挑戰', '#2563eb')}
                    </div>

                    {/* Stats */}
                    <div
                      className="flex items-center justify-between mb-4 pt-4 border-t"
                      style={{ borderColor: '#e5e7eb' }}
                    >
                      <div className="text-center">
                        <p className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                          {track.challengeCount}
                        </p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>
                          挑戰
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold" style={{ color: '#059669' }}>
                          ${track.totalPrize.toLocaleString()}
                        </p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>
                          總獎金 (USD)
                        </p>
                      </div>
                    </div>

                    {/* Challenges List */}
                    {track.challenges && track.challenges.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold mb-2" style={{ color: '#6b7280' }}>
                          包含挑戰：
                        </p>
                        {track.challenges.slice(0, 3).map((challenge) => (
                          <Link key={challenge.id} href={`/challenges/${challenge.id}`}>
                            <a
                              className="block p-2 rounded hover:bg-blue-50 transition-colors"
                              style={{ border: '1px solid #e5e7eb' }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: '#1a3a6e' }}
                              >
                                {challenge.title}
                              </p>
                            </a>
                          </Link>
                        ))}
                        {track.challenges.length > 3 && (
                          <p className="text-xs text-center py-2" style={{ color: '#6b7280' }}>
                            還有 {track.challenges.length - 3} 個挑戰...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </a>
              </Link>
            ))}
          </div>

          {tracks.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg" style={{ color: '#6b7280' }}>
                目前沒有開放的賽道
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
