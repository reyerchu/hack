/**
 * 我的需求列表组件
 */

import React from 'react';
import { useRouter } from 'next/router';
import { TeamNeed } from '../../../lib/teamUp/types';
import { TRACK_COLORS, STAGE_ICONS } from '../../../lib/teamUp/constants';

interface MyNeedsListProps {
  needs: (TeamNeed & {
    stats?: {
      totalApplications: number;
      unreadApplications: number;
      pendingApplications: number;
    };
  })[];
  onRefresh?: () => void;
  onToggleNeed?: (needId: string, currentIsOpen: boolean) => Promise<void>;
  toggleLoading?: { [key: string]: boolean };
}

export default function MyNeedsList({
  needs,
  onRefresh,
  onToggleNeed,
  toggleLoading = {},
}: MyNeedsListProps) {
  const router = useRouter();

  if (needs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">還沒有發布需求</h3>
        <p className="text-gray-600 mb-6">發布您的找隊友需求，吸引志同道合的夥伴加入</p>
        <button
          onClick={() => router.push('/team-up/create')}
          className="px-6 py-3 text-white rounded-lg transition-colors"
          style={{ backgroundColor: '#1a3a6e' }}
        >
          發布需求
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {needs.map((need) => (
        <div
          key={need.id}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* 標題和標籤 */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{need.title}</h3>
                  {!need.isOpen && (
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                      已關閉
                    </span>
                  )}
                  {need.isHidden && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                      已隱藏
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 text-sm rounded ${TRACK_COLORS[need.projectTrack]}`}>
                    {need.projectTrack}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded flex items-center gap-1">
                    <span>{STAGE_ICONS[need.projectStage]}</span>
                    <span>{need.projectStage}</span>
                  </span>
                </div>
              </div>

              {/* 簡介 */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{need.brief}</p>

              {/* 統計信息 */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <span>{need.viewCount || 0} 次瀏覽</span>
                </div>
                {need.stats && (
                  <>
                    <div className="flex items-center gap-1">
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span>{need.stats.totalApplications} 個申請</span>
                    </div>
                    {need.stats.unreadApplications > 0 && (
                      <div className="flex items-center gap-1 text-blue-600 font-medium">
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                        <span>{need.stats.unreadApplications} 個未讀</span>
                      </div>
                    )}
                    {need.stats.pendingApplications > 0 && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <span>⏰ {need.stats.pendingApplications} 個待處理</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex flex-col gap-2 ml-4">
              {/* Toggle 開關 */}
              {onToggleNeed && (
                <button
                  onClick={() => onToggleNeed(need.id, need.isOpen)}
                  disabled={toggleLoading[need.id]}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    need.isOpen ? 'bg-green-500' : 'bg-gray-300'
                  } ${toggleLoading[need.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={need.isOpen ? '關閉應徵' : '開放應徵'}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      need.isOpen ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}

              <button
                onClick={() => router.push(`/team-up/${need.id}`)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                查看
              </button>
              <button
                onClick={() => router.push(`/team-up/edit/${need.id}`)}
                className="px-4 py-2 text-sm text-white rounded-lg transition-colors whitespace-nowrap"
                style={{ backgroundColor: '#1a3a6e' }}
              >
                編輯
              </button>
              {need.stats && need.stats.totalApplications > 0 && (
                <button
                  onClick={() => router.push(`/dashboard/team-up/applications/${need.id}`)}
                  className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors relative whitespace-nowrap"
                >
                  管理申請
                  {need.stats.unreadApplications > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {need.stats.unreadApplications}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
