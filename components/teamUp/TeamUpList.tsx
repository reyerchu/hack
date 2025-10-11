/**
 * TeamUpList - 找隊友列表組件
 */

import React from 'react';
import Link from 'next/link';
import { TeamNeed } from '../../lib/teamUp/types';
import TeamUpCard from './TeamUpCard';
import EmptyState from './EmptyState';

interface TeamUpListProps {
  needs: TeamNeed[];
  loading?: boolean;
  onNeedClick?: (needId: string) => void;
  emptyMessage?: string;
}

export default function TeamUpList({
  needs,
  loading = false,
  onNeedClick,
  emptyMessage = '目前沒有找隊友需求',
}: TeamUpListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (needs.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title={emptyMessage}
        description="試試調整篩選條件，或等待更多隊友發布需求"
        action={
          <Link href="/team-up/create">
            <a
              className="inline-block border-2 px-6 py-3 text-sm font-medium uppercase tracking-wider transition-colors duration-300"
              style={{
                borderColor: '#1a3a6e',
                color: '#1a3a6e',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a3a6e';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1a3a6e';
              }}
            >
              發布找隊友需求
            </a>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {needs.map((need) => (
        <TeamUpCard
          key={need.id}
          need={need}
          onClick={() => {
            if (onNeedClick) {
              onNeedClick(need.id);
            } else {
              window.location.href = `/team-up/${need.id}`;
            }
          }}
        />
      ))}
    </div>
  );
}
