/**
 * RoleSelector - 角色选择器组件
 */

import React, { useState } from 'react';
import { TEAM_ROLES } from '../../lib/teamUp/constants';

interface RoleSelectorProps {
  selected: string[];
  onChange: (roles: string[]) => void;
  availableRoles?: string[];
  maxSelection?: number;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export default function RoleSelector({
  selected,
  onChange,
  availableRoles = TEAM_ROLES,
  maxSelection,
  placeholder = '選擇角色',
  label,
  required = false,
}: RoleSelectorProps) {
  const [customRole, setCustomRole] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleRoleToggle = (role: string) => {
    if (selected.includes(role)) {
      // 移除角色
      onChange(selected.filter((r) => r !== role));
    } else {
      // 添加角色
      if (maxSelection && selected.length >= maxSelection) {
        alert(`最多只能選擇 ${maxSelection} 個角色`);
        return;
      }
      onChange([...selected, role]);
    }
  };

  const handleAddCustomRole = () => {
    const trimmedRole = customRole.trim();

    if (!trimmedRole) {
      return;
    }

    if (selected.includes(trimmedRole)) {
      alert('此角色已經添加');
      return;
    }

    if (maxSelection && selected.length >= maxSelection) {
      alert(`最多只能選擇 ${maxSelection} 個角色`);
      return;
    }

    onChange([...selected, trimmedRole]);
    setCustomRole('');
    setShowCustomInput(false);
  };

  const handleRemoveCustomRole = (role: string) => {
    onChange(selected.filter((r) => r !== role));
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
          {maxSelection && ` (最多 ${maxSelection} 個)`}
        </label>
      )}

      {/* 預設角色 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {availableRoles.map((role) => {
          if (role === '其他') {
            return null; // 其他角色單獨處理
          }

          const isSelected = selected.includes(role);
          return (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleToggle(role)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {role}
            </button>
          );
        })}
      </div>

      {/* 已選擇的自定義角色 */}
      {selected.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">已選擇：</div>
          <div className="flex flex-wrap gap-2">
            {selected.map((role, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
              >
                {role}
                <button
                  type="button"
                  onClick={() => handleRemoveCustomRole(role)}
                  className="hover:text-red-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 自定義角色 */}
      {!showCustomInput ? (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加其他角色
        </button>
      ) : (
        <div className="flex gap-2 items-start">
          <input
            type="text"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomRole();
              }
            }}
            placeholder="輸入自定義角色"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={20}
          />
          <button
            type="button"
            onClick={handleAddCustomRole}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            添加
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setCustomRole('');
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
          >
            取消
          </button>
        </div>
      )}

      {selected.length === 0 && <p className="mt-2 text-xs text-gray-500">{placeholder}</p>}
    </div>
  );
}
