/**
 * NeedForm - 需求表单组件
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { TeamNeedFormData, FormValidationErrors } from '../../lib/teamUp/types';
import {
  PROJECT_TRACKS,
  PROJECT_STAGES,
  FIELD_LIMITS,
  DETAILED_TEAM_ROLES,
} from '../../lib/teamUp/constants';
import { validateTeamNeedForm, validatePublicField } from '../../lib/teamUp/validation';
import RoleSelector from './RoleSelector';

interface NeedFormProps {
  initialData?: Partial<TeamNeedFormData>;
  onSubmit: (data: TeamNeedFormData) => Promise<void>;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

export default function NeedForm({
  initialData,
  onSubmit,
  isEdit = false,
  isSubmitting: externalIsSubmitting = false,
}: NeedFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormValidationErrors>({});

  const [formData, setFormData] = useState<TeamNeedFormData>({
    title: initialData?.title || '',
    projectTrack: initialData?.projectTrack || '',
    projectStage: initialData?.projectStage || '',
    brief: initialData?.brief || '',
    rolesNeeded: initialData?.rolesNeeded || [],
    haveRoles: initialData?.haveRoles || [],
    otherNeeds: initialData?.otherNeeds || '',
    contactHint: initialData?.contactHint || '',
    isOpen: initialData?.isOpen !== undefined ? initialData.isOpen : true,
  });

  // 實時驗證
  const validateField = (field: keyof TeamNeedFormData, value: any) => {
    // PII 檢測（公開字段）
    const publicFields = ['title', 'brief', 'otherNeeds'];
    if (publicFields.includes(field) && typeof value === 'string') {
      const result = validatePublicField(value);
      if (!result.valid) {
        setErrors((prev) => ({ ...prev, [field]: result.error! }));
        return;
      }
    }

    // 清除該字段的錯誤
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleChange = (field: keyof TeamNeedFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 完整驗證
    const validationErrors = validateTeamNeedForm(formData, isEdit);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // 滾動到第一個錯誤
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.getElementsByName(firstErrorField)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // 成功後的跳轉由父組件處理
    } catch (error: any) {
      alert(error.message || '提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitting = isSubmitting || externalIsSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 項目名稱 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          專案名稱 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          onBlur={(e) => validateField('title', e.target.value)}
          maxLength={FIELD_LIMITS.TITLE_MAX}
          className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
            errors.title
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="請輸入專案名稱"
          disabled={submitting}
        />
        <div className="flex justify-between mt-1">
          {errors.title && <span className="text-red-500 text-sm">{errors.title}</span>}
          <span className="text-gray-500 text-sm ml-auto">
            {formData.title.length}/{FIELD_LIMITS.TITLE_MAX}
          </span>
        </div>
      </div>

      {/* 目標賽道 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          目標賽道 <span className="text-red-500">*</span>
        </label>
        <select
          name="projectTrack"
          value={formData.projectTrack}
          onChange={(e) => handleChange('projectTrack', e.target.value)}
          className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
            errors.projectTrack
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          disabled={submitting}
        >
          <option value="">請選擇</option>
          {PROJECT_TRACKS.map((track) => (
            <option key={track} value={track}>
              {track}
            </option>
          ))}
        </select>
        {errors.projectTrack && (
          <span className="text-red-500 text-sm mt-1 block">{errors.projectTrack}</span>
        )}
      </div>

      {/* 專案階段 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          專案階段 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROJECT_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => handleChange('projectStage', stage)}
              className={`p-3 border rounded-lg text-left transition-colors ${
                formData.projectStage === stage
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              disabled={submitting}
            >
              {stage}
            </button>
          ))}
        </div>
        {errors.projectStage && (
          <span className="text-red-500 text-sm mt-1 block">{errors.projectStage}</span>
        )}
      </div>

      {/* 專案簡介 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          專案簡介 <span className="text-red-500">*</span>
        </label>
        <textarea
          name="brief"
          value={formData.brief}
          onChange={(e) => handleChange('brief', e.target.value)}
          onBlur={(e) => validateField('brief', e.target.value)}
          maxLength={FIELD_LIMITS.BRIEF_MAX}
          rows={6}
          className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
            errors.brief
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="請描述專案方向、目前進度等（不可包含聯繫方式）"
          disabled={submitting}
        />
        <div className="flex justify-between mt-1">
          {errors.brief && <span className="text-red-500 text-sm">{errors.brief}</span>}
          <span className="text-gray-500 text-sm ml-auto">
            {formData.brief.length}/{FIELD_LIMITS.BRIEF_MAX}
          </span>
        </div>
      </div>

      {/* 需要角色 */}
      <div>
        <RoleSelector
          label="需要角色"
          required
          selected={formData.rolesNeeded}
          onChange={(roles) => handleChange('rolesNeeded', roles)}
          placeholder="請至少選擇一個角色"
          maxSelection={10}
          availableRoles={Array.from(DETAILED_TEAM_ROLES)}
        />
        {errors.rolesNeeded && (
          <span className="text-red-500 text-sm mt-1 block">{errors.rolesNeeded}</span>
        )}
      </div>

      {/* 現有團隊成員 */}
      <div>
        <RoleSelector
          label="現有團隊成員 (可選)"
          selected={formData.haveRoles}
          onChange={(roles) => handleChange('haveRoles', roles)}
          placeholder="選擇現有成員的角色"
          maxSelection={10}
          availableRoles={Array.from(DETAILED_TEAM_ROLES)}
        />
        {errors.haveRoles && (
          <span className="text-red-500 text-sm mt-1 block">{errors.haveRoles}</span>
        )}
      </div>

      {/* 其他需求 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">其他需求 (可選)</label>
        <textarea
          name="otherNeeds"
          value={formData.otherNeeds}
          onChange={(e) => handleChange('otherNeeds', e.target.value)}
          onBlur={(e) => validateField('otherNeeds', e.target.value)}
          maxLength={FIELD_LIMITS.OTHER_NEEDS_MAX}
          rows={3}
          className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
            errors.otherNeeds
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="例如：希望有使用過 Solidity 的經驗（不可包含聯繫方式）"
          disabled={submitting}
        />
        <div className="flex justify-between mt-1">
          {errors.otherNeeds && <span className="text-red-500 text-sm">{errors.otherNeeds}</span>}
          <span className="text-gray-500 text-sm ml-auto">
            {formData.otherNeeds.length}/{FIELD_LIMITS.OTHER_NEEDS_MAX}
          </span>
        </div>
      </div>

      {/* 聯繫提示 */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          聯繫提示 <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-700 mb-3">
          當有人應徵時，這段提示會私下提供給對方，引導他們如何聯繫你。
        </p>
        <input
          type="text"
          name="contactHint"
          value={formData.contactHint}
          onChange={(e) => handleChange('contactHint', e.target.value)}
          maxLength={FIELD_LIMITS.CONTACT_HINT_MAX}
          className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
            errors.contactHint
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="例如：加我 Telegram @username"
          disabled={submitting}
        />
        <div className="flex justify-between mt-1">
          {errors.contactHint && <span className="text-red-500 text-sm">{errors.contactHint}</span>}
          <span className="text-gray-500 text-sm ml-auto">
            {formData.contactHint.length}/{FIELD_LIMITS.CONTACT_HINT_MAX}
          </span>
        </div>
      </div>

      {/* 開放應徵狀態（僅編輯模式顯示） */}
      {isEdit && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isOpen}
              onChange={(e) => handleChange('isOpen', e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={submitting}
            />
            <span className="ml-3 text-sm font-medium text-gray-900">開放應徵</span>
          </label>
          <p className="mt-2 text-sm text-gray-600 ml-8">
            {formData.isOpen
              ? '✓ 此需求正在開放應徵，其他用戶可以看到並應徵'
              : '✗ 此需求已關閉，不接受新的應徵（您仍可查看已有的應徵）'}
          </p>
        </div>
      )}

      {/* 提示訊息 */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              ⚠️ 請勿在專案簡介和其他需求中留下任何聯繫方式（Email、電話、社交帳號等），
              系統會自動檢測並阻止提交。請使用「聯繫提示」欄位。
            </p>
          </div>
        </div>
      </div>

      {/* 通用錯誤訊息 */}
      {errors._general && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
          <p className="text-sm text-red-800">{errors._general}</p>
        </div>
      )}

      {/* 提交按鈕 */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={submitting}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={submitting || Object.keys(errors).length > 0}
          className="flex-1 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: submitting || Object.keys(errors).length > 0 ? '#9ca3af' : '#1a3a6e',
          }}
        >
          {submitting ? '處理中...' : isEdit ? '更新需求' : '發布需求'}
        </button>
      </div>
    </form>
  );
}
