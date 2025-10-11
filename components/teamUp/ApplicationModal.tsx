/**
 * 應徵對話框組件
 */

import React, { useState } from 'react';
import { validatePublicField } from '../../lib/teamUp/validation';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { message: string; contactForOwner: string }) => Promise<void>;
  needTitle: string;
}

export default function ApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  needTitle,
}: ApplicationModalProps) {
  const [message, setMessage] = useState('');
  const [contactForOwner, setContactForOwner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ message?: string; contact?: string }>({});

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: { message?: string; contact?: string } = {};

    // 驗證申請訊息
    if (!message.trim()) {
      newErrors.message = '請填寫申請訊息';
    } else if (message.length < 10) {
      newErrors.message = '申請訊息至少需要 10 個字';
    } else if (message.length > 500) {
      newErrors.message = '申請訊息不能超過 500 個字';
    } else {
      const piiCheck = validatePublicField(message);
      if (!piiCheck.valid) {
        newErrors.message = piiCheck.error || '請勿包含個人隱私資訊';
      }
    }

    // 驗證聯繫方式
    if (!contactForOwner.trim()) {
      newErrors.contact = '請填寫聯繫方式';
    } else if (contactForOwner.length < 3) {
      newErrors.contact = '聯繫方式至少需要 3 個字';
    } else if (contactForOwner.length > 100) {
      newErrors.contact = '聯繫方式不能超過 100 個字';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        message: message.trim(),
        contactForOwner: contactForOwner.trim(),
      });
      // 成功後關閉對話框
      onClose();
      // 清空表單
      setMessage('');
      setContactForOwner('');
      setErrors({});
    } catch (error: any) {
      setErrors({ message: error.message || '提交失敗，請稍後再試' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* 對話框 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 md:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 關閉按鈕 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* 標題 */}
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
            應徵隊友需求
          </h2>
          <p className="text-gray-600 mb-6">應徵：{needTitle}</p>

          {/* 表單 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 申請訊息 */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                申請訊息 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.message ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="介紹您的背景、技能、為什麼想加入這個團隊..."
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-start mt-1">
                {errors.message ? (
                  <p className="text-sm text-red-600">{errors.message}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    至少 10 個字，請勿包含個人隱私資訊（如電話、Email）
                  </p>
                )}
                <span className="text-sm text-gray-400 ml-2 whitespace-nowrap">
                  {message.length}/500
                </span>
              </div>
            </div>

            {/* 聯繫方式 */}
            <div>
              <label
                htmlFor="contactForOwner"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                您的聯繫方式 <span className="text-red-500">*</span>
              </label>
              <input
                id="contactForOwner"
                type="text"
                value={contactForOwner}
                onChange={(e) => setContactForOwner(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.contact ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例如：Telegram @username, Line ID, Discord username"
                disabled={isSubmitting}
              />
              {errors.contact ? (
                <p className="text-sm text-red-600 mt-1">{errors.contact}</p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">此資訊僅會私下提供給需求發布者</p>
              )}
              <div className="text-sm text-gray-400 mt-1 text-right">
                {contactForOwner.length}/100
              </div>
            </div>

            {/* 提示資訊 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">📌 提交後</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 需求發布者會收到您的應徵通知</li>
                <li>• 您的聯繫方式會私下提供給發布者</li>
                <li>• 您可以在「我的儀表板」查看應徵狀態</li>
                <li>• 發布者會透過您提供的方式聯繫您</li>
              </ul>
            </div>

            {/* 按鈕 */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1a3a6e' }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    提交中...
                  </span>
                ) : (
                  '提交應徵'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
