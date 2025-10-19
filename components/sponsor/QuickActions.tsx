/**
 * 赞助商仪表板 - 快速操作组件
 */

import React from 'react';
import Link from 'next/link';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface QuickActionsProps {
  trackId?: string;
}

export default function QuickActions({ trackId }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      title: '管理挑战题目',
      description: '上传或编辑赛道挑战内容',
      href: trackId ? `/sponsor/tracks/${trackId}/challenge` : '/sponsor/tracks',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      title: '查看提交',
      description: '浏览队伍的项目提交',
      href: trackId ? `/sponsor/tracks/${trackId}/submissions` : '/sponsor/submissions',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      title: '评审与决选',
      description: '对提交进行评分和排名',
      href: trackId ? `/sponsor/tracks/${trackId}/judging` : '/sponsor/judging',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
    {
      title: '数据报告',
      description: '查看参与度与品牌曝光',
      href: '/sponsor/reports',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
        快速操作
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <a
              className="block rounded-lg p-6 border-2 transition-all duration-200 hover:shadow-lg relative"
              style={{
                borderColor: '#e5e7eb',
                backgroundColor: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1a3a6e';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              {action.badge && (
                <div
                  className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                  }}
                >
                  {action.badge}
                </div>
              )}

              <div className="mb-3" style={{ color: '#1a3a6e' }}>
                {action.icon}
              </div>

              <h3 className="text-base font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                {action.title}
              </h3>

              <p className="text-sm" style={{ color: '#6b7280' }}>
                {action.description}
              </p>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}

