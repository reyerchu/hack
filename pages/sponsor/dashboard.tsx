/**
 * 赞助商仪表板主页面
 * 
 * 功能：
 * - 显示赞助商负责的赛道概览
 * - 统计数据（赛道数、提交数、队伍数、平均分）
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

  // 权限检查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/dashboard');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      // 非赞助商用户，跳转到主页
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

  // 如果没有赛道，显示欢迎页面
  if (tracks.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-8" style={{ color: '#1a3a6e' }}>
            赞助商仪表板
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
              欢迎使用赞助商平台
            </h2>
            <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
              您的账号暂未关联任何赛道。如有疑问，请联系管理员。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 主要仪表板内容
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
            赞助商仪表板
          </h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            欢迎回来！以下是您负责赛道的最新数据。
          </p>
        </div>

        {/* Statistics */}
        <DashboardStats stats={stats} loading={statsLoading} />

        {/* My Tracks */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
            我的赛道
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                onClick={() => router.push(`/sponsor/tracks/${track.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
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
                    {track.permissions.canEdit ? '可编辑' : '只读'}
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
                    <span style={{ color: '#6b7280' }}>队伍数：</span>
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
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions trackId={tracks[0]?.id} />

        {/* Notifications */}
        <NotificationCenter notifications={notifications} onMarkAsRead={markAsRead} />

        {/* Activity Log - TODO: 实现实际的活动日志数据获取 */}
        <ActivityLog logs={[]} />
      </div>
    </div>
  );
}

