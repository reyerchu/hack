/**
 * Sponsor 挑戰管理頁面
 * 
 * 顯示和管理所有賽道下的挑戰
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthContext } from '../../lib/user/AuthContext';
import { useSponsorTracks, useIsSponsor } from '../../lib/sponsor/hooks';
import SponsorHeader from '../../components/sponsor/SponsorHeader';
import firebase from 'firebase/app';
import 'firebase/auth';

export default function SponsorChallengesPage() {
  const router = useRouter();
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const { tracks, loading: tracksLoading, error: tracksError } = useSponsorTracks();
  const [allChallenges, setAllChallenges] = useState<any[]>([]);

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/challenges');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  // Extract all challenges from tracks
  useEffect(() => {
    if (tracks && tracks.length > 0) {
      const challenges: any[] = [];
      tracks.forEach((track: any) => {
        if (track.challenges && Array.isArray(track.challenges)) {
          track.challenges.forEach((challenge: any) => {
            challenges.push({
              ...challenge,
              trackId: track.id,
              trackName: track.name,
            });
          });
        }
      });
      setAllChallenges(challenges);
    } else {
      setAllChallenges([]);
    }
  }, [tracks]);

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
        <title>挑戰管理 - 贊助商儀表板</title>
        <meta name="description" content="管理所有挑戰" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="mb-12 text-left">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
              贊助商儀表板
            </h1>
          </div>
          
          <SponsorHeader />

          {/* Challenges List Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
              挑戰管理
            </h2>
            <p className="text-sm mt-2" style={{ color: '#6b7280' }}>
              所有賽道下的挑戰列表，點擊賽道名稱可進入賽道頁面新增挑戰
            </p>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#1a3a6e' }}></div>
              <p className="text-base" style={{ color: '#6b7280' }}>載入挑戰資料中...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-semibold mb-2">載入失敗</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {!loading && !error && allChallenges.length === 0 && (
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#1a3a6e' }}>尚無挑戰</h3>
              <p className="text-base mb-4" style={{ color: '#6b7280' }}>
                請先前往「賽道管理」創建賽道，然後在賽道頁面中新增挑戰
              </p>
              <button
                onClick={() => router.push('/sponsor/tracks')}
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
                前往賽道管理
              </button>
            </div>
          )}

          {!loading && !error && allChallenges.length > 0 && (
            <div className="space-y-6">
              {/* Group by track */}
              {tracks.map((track: any) => {
                const trackChallenges = allChallenges.filter((c: any) => c.trackId === track.id);
                if (trackChallenges.length === 0) return null;

                return (
                  <div key={track.id} className="bg-white rounded-lg shadow-sm border-2 p-6" style={{ borderColor: '#e5e7eb' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className="text-lg font-bold cursor-pointer hover:underline"
                        style={{ color: '#1a3a6e' }}
                        onClick={() => router.push(`/sponsor/tracks/${track.id}`)}
                      >
                        {track.name}
                      </h3>
                      <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                        {trackChallenges.length} 個挑戰
                      </span>
                    </div>

                    <div className="space-y-3">
                      {trackChallenges.map((challenge: any) => (
                        <div
                          key={challenge.id}
                          className="border-2 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                          style={{ borderColor: '#e5e7eb' }}
                          onClick={() => router.push(`/sponsor/tracks/${track.id}/challenge?challengeId=${challenge.id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1" style={{ color: '#1a3a6e' }}>
                                {challenge.title}
                              </h4>
                              {challenge.description && (
                                <p className="text-sm mb-2" style={{ color: '#6b7280' }}>
                                  {challenge.description.length > 150
                                    ? `${challenge.description.substring(0, 150)}...`
                                    : challenge.description}
                                </p>
                              )}
                              {challenge.prizes && challenge.prizes.length > 0 && (
                                <div className="flex items-center gap-2 text-sm" style={{ color: '#059669' }}>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span>獎金: {challenge.prizes.join(', ')}</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/sponsor/tracks/${track.id}/challenge?challengeId=${challenge.id}`);
                              }}
                              className="ml-4 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors"
                              style={{
                                borderColor: '#1a3a6e',
                                color: '#1a3a6e',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1a3a6e';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#1a3a6e';
                              }}
                            >
                              編輯
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => router.push(`/sponsor/tracks/${track.id}`)}
                      className="mt-4 w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                    >
                      前往賽道頁面新增更多挑戰
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

