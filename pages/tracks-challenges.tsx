/**
 * 賽道挑戰頁面
 * 
 * 公開頁面，展示所有賽道和挑戰
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { RequestHelper } from '../lib/request-helper';

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
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await RequestHelper.get<{ data: Track[] }>('/api/tracks-challenges/all');

      if (response.error) {
        throw new Error(response.error);
      }

      setTracks(response.data?.data || []);
    } catch (err: any) {
      console.error('[TracksChallenges] Error:', err);
      setError(err.message || '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const openTrackModal = (track: Track) => {
    setSelectedTrack(track);
    setSelectedChallenge(null);
    setShowModal(true);
  };

  const openChallengeModal = (track: Track, challenge: Challenge) => {
    setSelectedTrack(track);
    setSelectedChallenge(challenge);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setSelectedTrack(null);
      setSelectedChallenge(null);
    }, 300);
  };

  const formatPrize = (prizes: any[]) => {
    if (!Array.isArray(prizes) || prizes.length === 0) return '';
    
    return prizes.map((prize: any) => {
      if (typeof prize === 'object' && prize.amount) {
        const currency = prize.currency === 'TWD' ? '台幣' : 'USD';
        return `${currency} ${prize.amount.toLocaleString()} ${prize.description || ''}`;
      }
      return prize;
    }).join('，');
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
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-lg p-6" style={{ backgroundColor: '#ffffff', border: '2px solid #e5e7eb' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1a3a6e' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>{tracks.length}</p>
                  <p className="text-sm" style={{ color: '#6b7280' }}>賽道總數</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-6" style={{ backgroundColor: '#ffffff', border: '2px solid #e5e7eb' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#d97706' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
                    {tracks.reduce((sum, t) => sum + t.challengeCount, 0)}
                  </p>
                  <p className="text-sm" style={{ color: '#6b7280' }}>挑戰總數</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-6" style={{ backgroundColor: '#ffffff', border: '2px solid #e5e7eb' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#059669' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
                    ${tracks.reduce((sum, t) => sum + t.totalPrize, 0).toLocaleString()}
                  </p>
                  <p className="text-sm" style={{ color: '#6b7280' }}>總獎金池價值 (USD)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tracks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                style={{ backgroundColor: '#ffffff', border: '2px solid #e5e7eb' }}
                onClick={() => openTrackModal(track)}
              >
                {/* Track Header */}
                <div className="p-6 border-b" style={{ borderColor: '#e5e7eb', backgroundColor: '#f8fafc' }}>
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
                  <p className="text-sm mb-4 line-clamp-3" style={{ color: '#374151' }}>
                    {track.description || '探索此賽道的精彩挑戰'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
                    <div className="text-center">
                      <p className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                        {track.challengeCount}
                      </p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>挑戰</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold" style={{ color: '#059669' }}>
                        ${track.totalPrize.toLocaleString()}
                      </p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>總獎金 (USD)</p>
                    </div>
                  </div>

                  {/* Challenges List */}
                  {track.challenges.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold mb-2" style={{ color: '#6b7280' }}>
                        包含挑戰：
                      </p>
                      {track.challenges.slice(0, 3).map((challenge) => (
                        <div
                          key={challenge.id}
                          className="p-2 rounded hover:bg-blue-50 transition-colors"
                          style={{ border: '1px solid #e5e7eb' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openChallengeModal(track, challenge);
                          }}
                        >
                          <p className="text-sm font-medium truncate" style={{ color: '#1a3a6e' }}>
                            {challenge.title}
                          </p>
                        </div>
                      ))}
                      {track.challenges.length > 3 && (
                        <p className="text-xs text-center py-2" style={{ color: '#6b7280' }}>
                          還有 {track.challenges.length - 3} 個挑戰...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
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

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex-1 min-w-0">
                {selectedChallenge ? (
                  // 显示挑战标题
                  <h2 className="text-2xl font-bold truncate" style={{ color: '#1a3a6e' }}>
                    {selectedChallenge.title}
                  </h2>
                ) : selectedTrack?.sponsorLogo ? (
                  // 有 logo：显示 logo
                  <img
                    src={selectedTrack.sponsorLogo}
                    alt={selectedTrack.sponsorName}
                    className="h-16 w-auto object-contain"
                    title={selectedTrack.name}
                  />
                ) : (
                  // 无 logo：显示标题
                  <h2 className="text-2xl font-bold truncate" style={{ color: '#1a3a6e' }}>
                    {selectedTrack?.name}
                  </h2>
                )}
                <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                  {selectedTrack?.sponsorName}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="ml-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b7280' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {selectedChallenge ? (
                /* Challenge Details */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                      挑戰描述
                    </h3>
                    <p className="text-base whitespace-pre-wrap" style={{ color: '#374151' }}>
                      {selectedChallenge.description || '暫無描述'}
                    </p>
                  </div>

                  {selectedChallenge.prizes && selectedChallenge.prizes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                        💰 獎金詳情
                      </h3>
                      <p className="text-base" style={{ color: '#059669' }}>
                        {formatPrize(selectedChallenge.prizes)}
                      </p>
                    </div>
                  )}

                  {selectedChallenge.submissionRequirements && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                        提交要求
                      </h3>
                      <p className="text-base whitespace-pre-wrap" style={{ color: '#374151' }}>
                        {selectedChallenge.submissionRequirements}
                      </p>
                    </div>
                  )}

                  {selectedChallenge.evaluationCriteria && selectedChallenge.evaluationCriteria.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                        評分標準
                      </h3>
                      <ul className="space-y-2">
                        {selectedChallenge.evaluationCriteria.map((criterion: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span style={{ color: '#1a3a6e' }}>•</span>
                            <span style={{ color: '#374151' }}>
                              {typeof criterion === 'string' ? criterion : criterion.description || criterion.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedChallenge.resources && selectedChallenge.resources.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                        參考資源
                      </h3>
                      <ul className="space-y-2">
                        {selectedChallenge.resources.map((resource: any, idx: number) => (
                          <li key={idx}>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {resource.title || resource.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : selectedTrack ? (
                /* Track Details */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                      賽道描述
                    </h3>
                    <p className="text-base whitespace-pre-wrap" style={{ color: '#374151' }}>
                      {selectedTrack.description || '暫無描述'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a3a6e' }}>
                      挑戰列表 ({selectedTrack.challenges.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedTrack.challenges.map((challenge) => (
                        <div
                          key={challenge.id}
                          className="p-4 rounded-lg border-2 hover:border-blue-500 transition-all cursor-pointer"
                          style={{ borderColor: '#e5e7eb' }}
                          onClick={() => setSelectedChallenge(challenge)}
                        >
                          <h4 className="font-semibold mb-1" style={{ color: '#1a3a6e' }}>
                            {challenge.title}
                          </h4>
                          <p className="text-sm line-clamp-2" style={{ color: '#6b7280' }}>
                            {challenge.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

