/**
 * FilterPanel - 篩選面板組件
 */

import React, { useState } from 'react';
import { GetNeedsQueryParams } from '../../lib/teamUp/types';
import {
  TEAM_ROLES,
  SORT_OPTIONS,
  PROJECT_TRACKS,
  PROJECT_STAGES,
} from '../../lib/teamUp/constants';

interface FilterPanelProps {
  filters: GetNeedsQueryParams;
  onChange: (filters: GetNeedsQueryParams) => void;
  onReset: () => void;
}

export default function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof GetNeedsQueryParams, value: any) => {
    onChange({
      ...filters,
      [key]: value,
      offset: 0, // 重置分頁
    });
  };

  const handleRoleToggle = (role: string) => {
    // 如果點擊「所有」
    if (role === '所有') {
      // 清空所有角色篩選
      handleFilterChange('roles', undefined);
      return;
    }

    // 如果點擊其他角色
    const currentRoles = filters.roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];

    // 如果取消所有角色後變成空陣列，則回到「所有」狀態
    handleFilterChange('roles', newRoles.length > 0 ? newRoles : undefined);
  };

  // 處理專案狀態篩選（已有專案/尋找題目中）
  const handleProjectStatusToggle = (status: 'hasProject' | 'seekingTopic') => {
    const currentStatuses = (filters as any).projectStatuses || ['hasProject', 'seekingTopic'];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s: string) => s !== status)
      : [...currentStatuses, status];

    // 如果兩個都沒選，默認顯示全部（兩個都選中）
    const finalStatuses = newStatuses.length === 0 ? ['hasProject', 'seekingTopic'] : newStatuses;
    handleFilterChange('projectStatuses' as any, finalStatuses);
  };

  const hasActiveFilters =
    (filters.roles && filters.roles.length > 0) ||
    filters.track ||
    filters.stage ||
    // 檢查專案狀態是否不是默認值（默認是兩個都選中）
    ((filters as any).projectStatuses &&
      (filters as any).projectStatuses.length > 0 &&
      (filters as any).projectStatuses.length < 2);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      {/* 标题栏 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">篩選條件</h3>
          {hasActiveFilters && (
            <span
              className="px-2 py-1 text-xs rounded"
              style={{ backgroundColor: '#e8eef5', color: '#1a3a6e' }}
            >
              已篩選
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              清除篩選
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-900 md:hidden"
          >
            {isExpanded ? '收起' : '展開'}
          </button>
        </div>
      </div>

      {/* 篩選內容 */}
      <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        {/* 專案狀態篩選 - 放最上面，默認全選 */}
        <div>
          <div className="flex flex-wrap gap-2">
            {/* 已有專案按鈕 */}
            <button
              onClick={() => handleProjectStatusToggle('hasProject')}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={
                (filters as any).projectStatuses?.includes('hasProject')
                  ? { backgroundColor: '#1a3a6e', color: 'white' }
                  : { backgroundColor: '#f3f4f6', color: '#374151' }
              }
              onMouseEnter={(e) => {
                if (!(filters as any).projectStatuses?.includes('hasProject')) {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!(filters as any).projectStatuses?.includes('hasProject')) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
            >
              已有專案
            </button>

            {/* 尋找題目中按鈕 */}
            <button
              onClick={() => handleProjectStatusToggle('seekingTopic')}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={
                (filters as any).projectStatuses?.includes('seekingTopic')
                  ? { backgroundColor: '#1a3a6e', color: 'white' }
                  : { backgroundColor: '#f3f4f6', color: '#374151' }
              }
              onMouseEnter={(e) => {
                if (!(filters as any).projectStatuses?.includes('seekingTopic')) {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!(filters as any).projectStatuses?.includes('seekingTopic')) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
            >
              尋找題目中
            </button>
          </div>
        </div>

        {/* 需要角色 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            需要角色 {filters.roles && filters.roles.length > 0 && `(已選 ${filters.roles.length})`}
          </label>
          <div className="flex flex-wrap gap-2">
            {/* 「所有」按鈕 - 預設選中 */}
            <button
              onClick={() => handleRoleToggle('所有')}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={
                !filters.roles || filters.roles.length === 0
                  ? { backgroundColor: '#1a3a6e', color: 'white' }
                  : { backgroundColor: '#f3f4f6', color: '#374151' }
              }
              onMouseEnter={(e) => {
                if (filters.roles && filters.roles.length > 0) {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (filters.roles && filters.roles.length > 0) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
            >
              所有
            </button>

            {/* 其他角色按鈕 */}
            {TEAM_ROLES.map((role) => {
              const isSelected = filters.roles?.includes(role);
              return (
                <button
                  key={role}
                  onClick={() => handleRoleToggle(role)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={
                    isSelected
                      ? { backgroundColor: '#1a3a6e', color: 'white' }
                      : { backgroundColor: '#f3f4f6', color: '#374151' }
                  }
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        {/* 分隔線 */}
        <div className="border-t border-gray-200"></div>

        {/* 排序方式、目標賽道、專案階段 - 同一行 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 排序方式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
            <select
              value={filters.sort || 'latest'}
              onChange={(e) => handleFilterChange('sort', e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#1a3a6e' } as React.CSSProperties}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 目標賽道 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">目標賽道</label>
            <select
              value={filters.track || ''}
              onChange={(e) => handleFilterChange('track', e.target.value || undefined)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#1a3a6e' } as React.CSSProperties}
            >
              <option value="">全部賽道</option>
              {PROJECT_TRACKS.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </div>

          {/* 專案階段 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">專案階段</label>
            <select
              value={filters.stage || ''}
              onChange={(e) => handleFilterChange('stage', e.target.value || undefined)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#1a3a6e' } as React.CSSProperties}
            >
              <option value="">全部階段</option>
              {PROJECT_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
