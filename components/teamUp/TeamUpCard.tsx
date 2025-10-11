/**
 * TeamUpCard - 找隊友需求卡片組件
 */

import React from 'react';
import { TeamNeed } from '../../lib/teamUp/types';
import { TRACK_COLORS, STAGE_ICONS } from '../../lib/teamUp/constants';

interface TeamUpCardProps {
  need: TeamNeed;
  onClick: () => void;
  showStatus?: boolean;
}

export default function TeamUpCard({ need, onClick, showStatus = true }: TeamUpCardProps) {
  // 格式化時間為相對時間
  const formatRelativeTime = (timestamp: any): string => {
    try {
      let date: Date;

      // 處理 Firestore Timestamp 對象
      if (timestamp?.toDate) {
        date = timestamp.toDate();
      }
      // 處理從 API 返回的序列化 Timestamp ({_seconds, _nanoseconds})
      else if (timestamp?._seconds) {
        date = new Date(timestamp._seconds * 1000);
      }
      // 處理其他日期格式
      else {
        date = new Date(timestamp);
      }

      const now = new Date();
      const diff = now.getTime() - date.getTime();

      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 1) return '剛剛';
      if (minutes < 60) return `${minutes} 分鐘前`;
      if (hours < 24) return `${hours} 小時前`;
      if (days < 7) return `${days} 天前`;
      return date.toLocaleDateString('zh-TW');
    } catch (error) {
      console.error('Error formatting relative time:', error, timestamp);
      return '';
    }
  };

  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white"
    >
      {/* 標題和狀態 */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4 line-clamp-2">
          {need.title}
        </h3>
        {showStatus && !need.isOpen && (
          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded whitespace-nowrap">
            已結束
          </span>
        )}
      </div>

      {/* 賽道和階段 */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-1 text-xs rounded ${TRACK_COLORS[need.projectTrack]}`}>
          {need.projectTrack}
        </span>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded flex items-center gap-1">
          <span>{STAGE_ICONS[need.projectStage]}</span>
          <span>{need.projectStage}</span>
        </span>
      </div>

      {/* 需要角色 */}
      <div className="mb-3">
        <div className="text-xs text-gray-600 mb-1">需要角色：</div>
        <div className="flex flex-wrap gap-1">
          {need.rolesNeeded.slice(0, 3).map((role, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {role}
            </span>
          ))}
          {need.rolesNeeded.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">+{need.rolesNeeded.length - 3}</span>
          )}
        </div>
      </div>

      {/* 簡介 */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">{need.brief}</p>

      {/* 底部信息 */}
      <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-medium">
            👤 {need.ownerNickname || need.ownerName || '匿名用戶'}
          </span>
          <span>👀 {need.viewCount}</span>
          {need.applicationCount > 0 && (
            <span className="text-blue-600 font-medium">✉️ {need.applicationCount}</span>
          )}
        </div>
        <span>{formatRelativeTime(need.updatedAt)}</span>
      </div>

      {/* 查看詳情按鈕 */}
      <button
        className="mt-4 w-full py-2 border-2 text-sm font-medium rounded transition-colors duration-300"
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
        查看詳情
      </button>
    </div>
  );
}
