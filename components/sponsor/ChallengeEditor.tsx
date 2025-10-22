/**
 * 挑戰編輯器组件
 * 
 * 用於編輯賽道挑戰的详细資訊
 */

import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import type { ExtendedChallenge } from '../../lib/sponsor/types';

interface ChallengeEditorProps {
  challenge?: ExtendedChallenge;
  onSave: (data: Partial<ExtendedChallenge>) => Promise<void>;
  loading?: boolean;
  readOnly?: boolean;
}

export default function ChallengeEditor({
  challenge,
  onSave,
  loading,
  readOnly = false,
}: ChallengeEditorProps) {
  // Helper function to convert data to string format
  const getRequirementsString = (challenge: any) => {
    if (!challenge) return '';
    // If submissionRequirements is an object, convert to string
    if (challenge.submissionRequirements && typeof challenge.submissionRequirements === 'object') {
      const reqs = challenge.submissionRequirements;
      const parts: string[] = [];
      if (reqs.requireGithubRepo) parts.push('- 需要提交 GitHub 代碼庫');
      if (reqs.requireDemo) parts.push('- 需要提供 Demo 演示');
      if (reqs.requirePresentation) parts.push('- 需要準備簡報');
      if (reqs.requireDocumentation) parts.push('- 需要提供文檔');
      return parts.length > 0 ? parts.join('\n') : '';
    }
    // Otherwise use requirements or submissionRequirements as string
    return challenge.requirements || challenge.submissionRequirements || '';
  };

  const getPrizesArray = (challenge: any) => {
    if (!challenge) return [];
    
    // If prizes is already an array of objects with currency/amount/description
    if (Array.isArray(challenge.prizes) && challenge.prizes.length > 0 && typeof challenge.prizes[0] === 'object') {
      return challenge.prizes.map((p: any) => ({
        currency: p.currency || 'USD',
        amount: p.amount || 0,
        description: p.description || p.title || '',
      }));
    }
    
    // If prizes is a string, try to parse it
    if (typeof challenge.prizes === 'string' && challenge.prizes.trim()) {
      // For now, return empty array - user will need to re-enter
      return [];
    }
    
    return [];
  };

  const [formData, setFormData] = useState<any>({
    title: challenge?.title || '',
    description: challenge?.description || '',
    requirements: getRequirementsString(challenge),
    prizes: getPrizesArray(challenge),
    evaluationCriteria: challenge?.evaluationCriteria || [],
    resources: challenge?.resources || [],
  });

  const [newCriterion, setNewCriterion] = useState({ name: '' });
  const [newPrize, setNewPrize] = useState({ currency: 'USD', amount: '', description: '' });
  const [newResource, setNewResource] = useState({ title: '', url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (challenge) {
      setFormData({
        title: challenge.title || '',
        description: challenge.description || '',
        requirements: getRequirementsString(challenge),
        prizes: getPrizesArray(challenge),
        evaluationCriteria: challenge.evaluationCriteria || [],
        resources: challenge.resources || [],
      });
    }
  }, [challenge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('[ChallengeEditor] Submitting formData:', {
        title: formData.title,
        evaluationCriteria: formData.evaluationCriteria,
        resources: formData.resources,
        prizes: formData.prizes,
      });
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const addCriterion = () => {
    if (newCriterion.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        evaluationCriteria: [...prev.evaluationCriteria, { name: newCriterion.name }],
      }));
      setNewCriterion({ name: '' });
    }
  };

  const removeCriterion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      evaluationCriteria: prev.evaluationCriteria.filter((_, i) => i !== index),
    }));
  };

  const addPrize = () => {
    if (newPrize.amount && newPrize.description.trim()) {
      setFormData((prev) => ({
        ...prev,
        prizes: [...prev.prizes, {
          currency: newPrize.currency,
          amount: parseFloat(newPrize.amount),
          description: newPrize.description,
        }],
      }));
      setNewPrize({ currency: 'USD', amount: '', description: '' });
    }
  };

  const removePrize = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      prizes: prev.prizes.filter((_, i) => i !== index),
    }));
  };

  const addResource = () => {
    if (newResource.title.trim() && newResource.url.trim()) {
      setFormData((prev) => ({
        ...prev,
        resources: [...prev.resources, { ...newResource }],
      }));
      setNewResource({ title: '', url: '' });
    }
  };

  const removeResource = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本資訊 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
          挑戰標題 *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          disabled={readOnly}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
          style={{
            borderColor: '#d1d5db',
          }}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
          挑戰描述 *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={6}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
          style={{
            borderColor: '#d1d5db',
          }}
          placeholder="详细描述這個挑戰的背景、目標和期望成果..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
          提交要求 *
        </label>
        <textarea
          value={formData.requirements}
          onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
          style={{
            borderColor: '#d1d5db',
          }}
          placeholder="列出參賽隊伍需要提交的內容（代码、Demo、文檔等）..."
          required
        />
      </div>

      {/* 獎金詳情 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
          獎金詳情 *
        </label>
        
        {/* 已添加的奖金列表 */}
        <div className="space-y-2 mb-3">
          {formData.prizes.map((prize: any, index: number) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            >
              <span className="text-sm font-medium" style={{ color: '#059669', minWidth: '60px' }}>
                {prize.currency === 'TWD' ? '台幣' : 'USD'}
              </span>
              <span className="text-sm font-semibold" style={{ color: '#1a3a6e', minWidth: '100px' }}>
                {prize.amount.toLocaleString()}
              </span>
              <span className="flex-1 text-sm" style={{ color: '#6b7280' }}>
                {prize.description}
              </span>
              <button
                type="button"
                onClick={() => removePrize(index)}
                className="text-sm px-2 py-1 rounded hover:bg-red-100"
                style={{ color: '#dc2626' }}
              >
                刪除
              </button>
            </div>
          ))}
        </div>

        {/* 添加新奖金 */}
        <div className="flex gap-3">
          <select
            value={newPrize.currency}
            onChange={(e) => setNewPrize({ ...newPrize, currency: e.target.value })}
            className="px-3 py-2 rounded-lg border"
            style={{ borderColor: '#d1d5db', minWidth: '100px' }}
          >
            <option value="USD">USD</option>
            <option value="TWD">台幣</option>
          </select>
          <input
            type="number"
            value={newPrize.amount}
            onChange={(e) => setNewPrize({ ...newPrize, amount: e.target.value })}
            placeholder="金額"
            className="w-32 px-4 py-2 rounded-lg border"
            style={{ borderColor: '#d1d5db' }}
          />
          <input
            type="text"
            value={newPrize.description}
            onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
            placeholder="描述（例如：第一名）"
            className="flex-1 px-4 py-2 rounded-lg border"
            style={{ borderColor: '#d1d5db' }}
          />
          <button
            type="button"
            onClick={addPrize}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
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
            添加
          </button>
        </div>
        
        {formData.prizes.length === 0 && (
          <p className="text-xs mt-2" style={{ color: '#dc2626' }}>
            * 請至少添加一個獎金項目
          </p>
        )}
      </div>

      {/* 評分標准 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
          評分標准
        </label>
        <div className="space-y-2 mb-3">
          {formData.evaluationCriteria.map((criterion: any, index: number) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            >
              <span className="flex-1 text-sm" style={{ color: '#1a3a6e' }}>
                {criterion.name}
              </span>
              <button
                type="button"
                onClick={() => removeCriterion(index)}
                className="text-sm px-2 py-1 rounded hover:bg-red-100"
                style={{ color: '#dc2626' }}
              >
                刪除
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={newCriterion.name}
            onChange={(e) => setNewCriterion({ name: e.target.value })}
            placeholder="標准名称（如：创新性、技術難度、實用性）"
            className="flex-1 px-4 py-2 rounded-lg border"
            style={{ borderColor: '#d1d5db' }}
          />
          <button
            type="button"
            onClick={addCriterion}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
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
            添加
          </button>
        </div>
      </div>

      {/* 参考资源 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
          参考资源
        </label>
        <div className="space-y-2 mb-3">
          {formData.resources.map((resource, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#1a3a6e' }}>
                  {resource.title}
                </p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:underline truncate block"
                  style={{ color: '#6b7280' }}
                >
                  {resource.url}
                </a>
              </div>
              <button
                type="button"
                onClick={() => removeResource(index)}
                className="text-sm px-2 py-1 rounded hover:bg-red-100 flex-shrink-0"
                style={{ color: '#dc2626' }}
              >
                刪除
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={newResource.title}
            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
            placeholder="资源標題"
            className="w-full px-4 py-2 rounded-lg border"
            style={{ borderColor: '#d1d5db' }}
          />
          <div className="flex gap-3">
            <input
              type="url"
              value={newResource.url}
              onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
              placeholder="资源链接 (https://...)"
              className="flex-1 px-4 py-2 rounded-lg border"
              style={{ borderColor: '#d1d5db' }}
            />
            <button
              type="button"
              onClick={addResource}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
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
              添加
            </button>
          </div>
        </div>
      </div>

      {/* 提交按钮 - 只读模式下隐藏 */}
      {!readOnly && (
        <div className="flex gap-4 pt-6 border-t" style={{ borderColor: '#e5e7eb' }}>
          <button
            type="submit"
            disabled={saving || loading}
            className="px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#1a3a6e',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              if (!saving && !loading) {
                e.currentTarget.style.backgroundColor = '#2a4a7e';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && !loading) {
                e.currentTarget.style.backgroundColor = '#1a3a6e';
              }
            }}
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      )}
    </form>
  );
}

