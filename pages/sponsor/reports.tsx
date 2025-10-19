/**
 * 報告與分析頁面
 * 
 * 顯示贊助商的數據報告和分析
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '../../lib/user/AuthContext';
import { useIsSponsor, useSponsorTracks } from '../../lib/sponsor/hooks';
import ReportCard from '../../components/sponsor/ReportCard';

export default function ReportsPage() {
  const router = useRouter();
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();
  const { tracks, loading: tracksLoading } = useSponsorTracks();

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/reports');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  // 計算汇总數據
  const totalSubmissions = tracks.reduce((sum, track) => sum + track.stats.submissionCount, 0);
  const totalTeams = tracks.reduce((sum, track) => sum + track.stats.teamCount, 0);
  const avgScore = tracks.length > 0
    ? tracks.reduce((sum, track) => sum + (track.stats.averageScore || 0), 0) / tracks.length
    : 0;

  const handleDownload = (reportType: string, format: 'pdf' | 'csv') => {
    // TODO: 實現實際的報告生成和下载
    console.log(`Downloading ${reportType} in ${format} format`);
    alert(`${reportType} ${format.toUpperCase()} 下载功能將在後續版本中實現`);
  };

  if (authLoading || tracksLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/sponsor/dashboard">
            <a className="inline-flex items-center gap-1 text-sm font-medium mb-4 hover:underline" style={{ color: '#1a3a6e' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回儀表板
            </a>
          </Link>

          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
            數據報告與分析
          </h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            查看参與度、品牌曝光和活动效果數據
          </p>
        </div>

        {/* 關键指標 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-lg p-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <h3 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
              总項目提交
            </h3>
            <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
              {totalSubmissions}
            </p>
            <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
              來自 {totalTeams} 個隊伍
            </p>
          </div>

          <div className="rounded-lg p-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <h3 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
              赞助賽道
            </h3>
            <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
              {tracks.length}
            </p>
            <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
              {tracks.filter(t => t.stats.submissionCount > 0).length} 個有提交
            </p>
          </div>

          <div className="rounded-lg p-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <h3 className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>
              平均质量分
            </h3>
            <p className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
              {avgScore > 0 ? avgScore.toFixed(1) : '-'}
            </p>
            <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
              所有賽道平均
            </p>
          </div>
        </div>

        {/* 報告列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 参與度報告 */}
          <ReportCard
            title="参與度報告"
            description="包含參賽隊伍數量、提交時間分佈、完成率等數據"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            data={{
              '隊伍数': `${totalTeams} 队`,
              '提交数': `${totalSubmissions} 個`,
              '参與率': totalTeams > 0 ? `${((totalSubmissions / totalTeams) * 100).toFixed(0)}%` : '-',
            }}
            onDownload={(format) => handleDownload('参與度報告', format)}
          />

          {/* 項目质量報告 */}
          <ReportCard
            title="項目质量報告"
            description="包含各賽道的評分分佈、獲獎項目、評審意見等"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            }
            data={{
              '平均分': avgScore > 0 ? avgScore.toFixed(1) : '-',
              '最高分': tracks.length > 0 ? Math.max(...tracks.map(t => t.stats.averageScore || 0)).toFixed(1) : '-',
              '入围数': tracks.reduce((sum, t) => sum + (t.stats.shortlistedCount || 0), 0),
            }}
            onDownload={(format) => handleDownload('項目质量報告', format)}
          />

          {/* 品牌曝光報告 */}
          <ReportCard
            title="品牌曝光報告"
            description="包含网站访问量、社交媒體互动、媒體报道等"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            }
            data={{
              '頁面访问': '待統計',
              '社交互动': '待統計',
              '媒體报道': '待統計',
            }}
            onDownload={(format) => handleDownload('品牌曝光報告', format)}
          />

          {/* 活动效果報告 */}
          <ReportCard
            title="活动效果報告"
            description="包含活动 ROI、目標達成率、参與者反饋等"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
            data={{
              '目標達成': '待评估',
              '满意度': '待调查',
              '投资回报': '待計算',
            }}
            onDownload={(format) => handleDownload('活动效果報告', format)}
          />
        </div>

        {/* 賽道详细報告 */}
        {tracks.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
              賽道详细報告
            </h2>
            <div className="space-y-4">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="rounded-lg p-6"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: '#1a3a6e' }}>
                        {track.trackName}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                        賽道 ID: {track.id}
                      </p>
                    </div>
                    <Link href={`/sponsor/tracks/${track.id}`}>
                      <a
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                        style={{
                          backgroundColor: '#e8eef5',
                          color: '#1a3a6e',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1a3a6e';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#e8eef5';
                          e.currentTarget.style.color = '#1a3a6e';
                        }}
                      >
                        查看詳情
                      </a>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>
                        項目提交
                      </p>
                      <p className="text-lg font-semibold" style={{ color: '#1a3a6e' }}>
                        {track.stats.submissionCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>
                        參賽隊伍
                      </p>
                      <p className="text-lg font-semibold" style={{ color: '#1a3a6e' }}>
                        {track.stats.teamCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>
                        平均分数
                      </p>
                      <p className="text-lg font-semibold" style={{ color: '#1a3a6e' }}>
                        {track.stats.averageScore ? track.stats.averageScore.toFixed(1) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>
                        最高分
                      </p>
                      <p className="text-lg font-semibold" style={{ color: '#1a3a6e' }}>
                        {track.stats.highestScore ? track.stats.highestScore.toFixed(1) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 導出說明 */}
        <div
          className="mt-8 rounded-lg p-6"
          style={{ backgroundColor: '#e8eef5', border: '1px solid #1a3a6e' }}
        >
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#1a3a6e' }}>
            📊 關於數據導出
          </h3>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            • PDF 報告包含完整的數據分析、圖表和說明文字
            <br />
            • CSV 文件包含原始數據，方便進行二次分析
            <br />
            • 所有數據均即時更新，可隨時下载最新版本
            <br />• 報告生成功能將在後續版本中完善
          </p>
        </div>
      </div>
    </div>
  );
}

