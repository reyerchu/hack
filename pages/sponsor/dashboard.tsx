/**
 * 贊助商儀表板主頁面
 * 
 * 功能：
 * - 顯示贊助商負責的賽道概覽
 * - 統計數據（賽道数、提交数、隊伍数、平均分）
 * - 快速操作入口
 * - 通知中心
 * - 活动日志
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../lib/user/AuthContext';
import {
  useSponsorTracks,
  useTrackStats,
  useSponsorNotifications,
  useIsSponsor,
} from '../../lib/sponsor/hooks';
import DashboardStats from '../../components/sponsor/DashboardStats';
import QuickActions from '../../components/sponsor/QuickActions';
import NotificationCenter from '../../components/sponsor/NotificationCenter';
import ActivityLog from '../../components/sponsor/ActivityLog';

export default function SponsorDashboard() {
  const router = useRouter();
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const { tracks, loading: tracksLoading, error: tracksError } = useSponsorTracks();
  const { stats, loading: statsLoading } = useTrackStats();
  const { notifications, markAsRead } = useSponsorNotifications();

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/dashboard');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      // 非贊助商用戶，跳转到主頁
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  // Loading state
  if (authLoading || tracksLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div
              className="h-10 bg-gray-300 rounded w-1/3 mb-8"
              style={{ backgroundColor: '#e5e7eb' }}
            ></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-300 rounded-lg"
                  style={{ backgroundColor: '#e5e7eb' }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (tracksError) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#991b1b' }}>
              加载失败
            </h2>
            <p className="text-sm" style={{ color: '#7f1d1d' }}>
              {tracksError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-lg font-medium"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
              }}
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 如果没有賽道，顯示歡迎頁面
  if (tracks.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-8" style={{ color: '#1a3a6e' }}>
            贊助商儀表板
          </h1>

          <div
            className="rounded-lg p-12 text-center"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
          >
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: '#9ca3af' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#1a3a6e' }}>
              歡迎使用贊助商平台
            </h2>
            <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
              您的帳號暫未關聯任何賽道。如有疑問，請聯繫管理員。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 主要儀表板內容
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a3a6e' }}>
            贊助商儀表板
          </h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            歡迎回來！以下是您負責賽道的最新數據。
          </p>
        </div>

        {/* Getting Started Guide - 移到最上方 */}
        <div className="mb-4 rounded-lg p-4" style={{ backgroundColor: '#e8f4fd', border: '2px solid #1a3a6e' }}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1a3a6e' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold mb-1.5" style={{ color: '#1a3a6e' }}>
                📋 贊助商功能指南
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm" style={{ color: '#374151' }}>
                <div>• <strong>查看賽道</strong>：點擊下方賽道卡片</div>
                <div>• <strong>管理挑戰</strong>：編輯題目、上傳文件</div>
                <div>• <strong>審核提交</strong>：查看團隊項目、評分</div>
                <div>• <strong>聯繫團隊</strong>：與優秀團隊互動</div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <DashboardStats stats={stats} loading={statsLoading} />

        {/* My Tracks */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            我的賽道
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="rounded-lg p-5 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                onClick={() => router.push(`/sponsor/tracks/${track.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold" style={{ color: '#1a3a6e' }}>
                    {track.trackName}
                  </h3>
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: track.permissions.canEdit ? '#dcfce7' : '#e5e7eb',
                      color: track.permissions.canEdit ? '#166534' : '#6b7280',
                    }}
                  >
                    {track.permissions.canEdit ? '可編輯' : '只读'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#6b7280' }}>提交数：</span>
                    <span className="font-semibold" style={{ color: '#1a3a6e' }}>
                      {track.stats.submissionCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#6b7280' }}>隊伍数：</span>
                    <span className="font-semibold" style={{ color: '#1a3a6e' }}>
                      {track.stats.teamCount}
                    </span>
                  </div>
                  {track.stats.averageScore !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: '#6b7280' }}>平均分：</span>
                      <span className="font-semibold" style={{ color: '#1a3a6e' }}>
                        {track.stats.averageScore.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t" style={{ borderColor: '#e5e7eb' }}>
                  <button
                    className="w-full text-sm font-medium py-2 rounded-lg transition-colors"
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
                    查看詳情
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            快速操作
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => router.push(tracks[0] ? `/sponsor/tracks/${tracks[0].id}/challenge` : '/sponsor/tracks')}
              className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-lg text-left"
              style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1a3a6e';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <div className="mb-1.5" style={{ color: '#1a3a6e' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xs font-semibold mb-0.5" style={{ color: '#1a3a6e' }}>管理挑戰題目</h3>
              <p className="text-xs" style={{ color: '#6b7280' }}>上傳或編輯賽道內容</p>
            </button>

            <button
              onClick={() => router.push(tracks[0] ? `/sponsor/tracks/${tracks[0].id}/submissions` : '/sponsor/submissions')}
              className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-lg text-left"
              style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1a3a6e';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <div className="mb-1.5" style={{ color: '#1a3a6e' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xs font-semibold mb-0.5" style={{ color: '#1a3a6e' }}>查看提交</h3>
              <p className="text-xs" style={{ color: '#6b7280' }}>瀏覽隊伍的項目提交</p>
            </button>

            <button
              onClick={() => router.push(tracks[0] ? `/sponsor/tracks/${tracks[0].id}/judging` : '/sponsor/judging')}
              className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-lg text-left"
              style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1a3a6e';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <div className="mb-1.5" style={{ color: '#1a3a6e' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xs font-semibold mb-0.5" style={{ color: '#1a3a6e' }}>評審與決選</h3>
              <p className="text-xs" style={{ color: '#6b7280' }}>對提交進行評分排名</p>
            </button>

            <button
              onClick={() => router.push('/sponsor/reports')}
              className="rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-lg text-left"
              style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1a3a6e';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <div className="mb-1.5" style={{ color: '#1a3a6e' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xs font-semibold mb-0.5" style={{ color: '#1a3a6e' }}>數據報告</h3>
              <p className="text-xs" style={{ color: '#6b7280' }}>查看參與度與品牌曝光</p>
            </button>
          </div>
        </div>

        {/* Notifications - 只在有通知時顯示 */}
        {notifications && notifications.length > 0 && (
          <NotificationCenter notifications={notifications} onMarkAsRead={markAsRead} />
        )}

        {/* Activity Log - 暫時隱藏，待實際數據接入後再顯示 */}
        {/* <ActivityLog logs={[]} /> */}
      </div>
    </div>
  );
}

