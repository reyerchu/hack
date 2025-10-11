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
import { validateTeamNeedForm } from '../../lib/teamUp/validation';
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

  // 判斷初始是否有專案（如果是編輯模式，檢查標題是否為「尋找題目中」）
  const initialHasProject = isEdit ? initialData?.title !== '尋找題目中' : true;

  const [hasProject, setHasProject] = useState<boolean>(initialHasProject);

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

  // 當「有專案/沒有專案」切換時，自動填充或清空相關字段
  useEffect(() => {
    if (!hasProject) {
      setFormData((prev) => ({
        ...prev,
        title: '尋找題目中',
        projectTrack: '其他',
        projectStage: '還沒有想法',
      }));
      // 清除這些字段的錯誤訊息（因為已自動填入有效值）
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.title;
        delete newErrors.projectTrack;
        delete newErrors.projectStage;
        return newErrors;
      });
    } else {
      // 如果切換回「有專案」
      if (!isEdit) {
        // 創建模式：清空這些字段
        setFormData((prev) => ({
          ...prev,
          title: '',
          projectTrack: '',
          projectStage: '',
        }));
      } else if (initialData?.title === '尋找題目中') {
        // 編輯模式：如果原本是「沒有專案」，現在改為「有專案」，清空這些字段
        setFormData((prev) => ({
          ...prev,
          title: '',
          projectTrack: '',
          projectStage: '',
        }));
      }
      // 如果原本就是「有專案」，保持原有數據不變
    }
  }, [hasProject, isEdit, initialData?.title]);

  // 實時驗證
  const validateField = (field: keyof TeamNeedFormData, value: any) => {
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
      {/* 有專案/沒有專案 選擇 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          您目前的狀態 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setHasProject(true)}
            className={`p-4 border-2 rounded-lg text-center transition-all ${
              hasProject
                ? 'border-blue-600 bg-blue-50 text-blue-600 font-medium'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <div className="text-lg mb-1">💡</div>
            <div className="font-medium">有專案</div>
            <div className="text-xs mt-1 text-gray-600">已有明確的專案方向</div>
          </button>
          <button
            type="button"
            onClick={() => setHasProject(false)}
            className={`p-4 border-2 rounded-lg text-center transition-all ${
              !hasProject
                ? 'border-blue-600 bg-blue-50 text-blue-600 font-medium'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <div className="text-lg mb-1">🔍</div>
            <div className="font-medium">沒有專案</div>
            <div className="text-xs mt-1 text-gray-600">正在尋找題目和團隊</div>
          </button>
        </div>
      </div>

      {/* 項目名稱 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          專案名稱 <span className="text-red-500">*</span>
          {!hasProject && <span className="ml-2 text-sm text-gray-500">(自動填入)</span>}
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
          } ${!hasProject ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          placeholder="請輸入專案名稱"
          disabled={submitting || !hasProject}
          readOnly={!hasProject}
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
          {!hasProject && <span className="ml-2 text-sm text-gray-500">(自動填入)</span>}
        </label>
        <select
          name="projectTrack"
          value={formData.projectTrack}
          onChange={(e) => handleChange('projectTrack', e.target.value)}
          className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
            errors.projectTrack
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } ${!hasProject ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          disabled={submitting || !hasProject}
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
          {!hasProject && <span className="ml-2 text-sm text-gray-500">(自動填入)</span>}
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
              } ${!hasProject ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={submitting || !hasProject}
            >
              {stage}
            </button>
          ))}
        </div>
        {errors.projectStage && (
          <span className="text-red-500 text-sm mt-1 block">{errors.projectStage}</span>
        )}
      </div>

      {/* 專案或個人簡介 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          專案或個人簡介 <span className="text-red-500">*</span>
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
          placeholder={
            hasProject
              ? '請描述您的專案：專案方向、目前進度、技術堆疊、團隊現況等（建議勿包含聯繫方式等個資）'
              : '請簡單介紹您自己：技能專長、想學習的方向、對哪些賽道有興趣等（建議勿包含聯繫方式等個資）'
          }
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
          placeholder="例如：希望有使用過 Solidity 的經驗（建議勿包含聯繫方式等個資）"
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
          當有人應徵時，這段提示會私下提供給對方，引導他們如何聯繫您。
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
