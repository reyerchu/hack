/**
 * 挑战编辑器组件
 * 
 * 用于编辑赛道挑战的详细信息
 */

import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import type { ExtendedChallenge } from '../../lib/sponsor/types';

interface ChallengeEditorProps {
  challenge?: ExtendedChallenge;
  onSave: (data: Partial<ExtendedChallenge>) => Promise<void>;
  loading?: boolean;
}

export default function ChallengeEditor({
  challenge,
  onSave,
  loading,
}: ChallengeEditorProps) {
  const [formData, setFormData] = useState({
    title: challenge?.title || '',
    description: challenge?.description || '',
    requirements: challenge?.requirements || '',
    prizeDetails: challenge?.prizeDetails || '',
    evaluationCriteria: challenge?.evaluationCriteria || [],
    resources: challenge?.resources || [],
  });

  const [newCriterion, setNewCriterion] = useState({ name: '', weight: 20 });
  const [newResource, setNewResource] = useState({ title: '', url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (challenge) {
      setFormData({
        title: challenge.title || '',
        description: challenge.description || '',
        requirements: challenge.requirements || '',
        prizeDetails: challenge.prizeDetails || '',
        evaluationCriteria: challenge.evaluationCriteria || [],
        resources: challenge.resources || [],
      });
    }
  }, [challenge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const addCriterion = () => {
    if (newCriterion.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        evaluationCriteria: [...prev.evaluationCriteria, { ...newCriterion }],
      }));
      setNewCriterion({ name: '', weight: 20 });
    }
  };

  const removeCriterion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      evaluationCriteria: prev.evaluationCriteria.filter((_, i) => i !== index),
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
      {/* 基本信息 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
          挑战标题 *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
          style={{
            borderColor: '#d1d5db',
            focusRing: '#1a3a6e',
          }}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
          挑战描述 *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={6}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
          style={{
            borderColor: '#d1d5db',
          }}
          placeholder="详细描述这个挑战的背景、目标和期望成果..."
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
          placeholder="列出参赛队伍需要提交的内容（代码、Demo、文档等）..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
          奖金详情 *
        </label>
        <textarea
          value={formData.prizeDetails}
          onChange={(e) => setFormData({ ...formData, prizeDetails: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
          style={{
            borderColor: '#d1d5db',
          }}
          placeholder="例如：第一名 $1000、第二名 $500、第三名 $300"
          required
        />
      </div>

      {/* 评分标准 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
          评分标准
        </label>
        <div className="space-y-2 mb-3">
          {formData.evaluationCriteria.map((criterion, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            >
              <span className="flex-1 text-sm" style={{ color: '#1a3a6e' }}>
                {criterion.name}
              </span>
              <span className="text-sm font-semibold" style={{ color: '#6b7280' }}>
                {criterion.weight}%
              </span>
              <button
                type="button"
                onClick={() => removeCriterion(index)}
                className="text-sm px-2 py-1 rounded hover:bg-red-100"
                style={{ color: '#dc2626' }}
              >
                删除
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={newCriterion.name}
            onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
            placeholder="标准名称（如：创新性）"
            className="flex-1 px-4 py-2 rounded-lg border"
            style={{ borderColor: '#d1d5db' }}
          />
          <input
            type="number"
            value={newCriterion.weight}
            onChange={(e) =>
              setNewCriterion({ ...newCriterion, weight: parseInt(e.target.value) || 0 })
            }
            min="0"
            max="100"
            placeholder="权重%"
            className="w-24 px-4 py-2 rounded-lg border"
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
                删除
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={newResource.title}
            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
            placeholder="资源标题"
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

      {/* 提交按钮 */}
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
    </form>
  );
}

