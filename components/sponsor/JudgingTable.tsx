/**
 * 評分表格组件
 * 
 * 顯示所有提交的評分和排名
 */

import React, { useState } from 'react';
import Link from 'next/link';
import type { TeamSubmission } from '../../lib/sponsor/types';

interface JudgingTableProps {
  submissions: TeamSubmission[];
  onScoreUpdate?: (submissionId: string, scores: Record<string, number>) => Promise<void>;
  onStatusUpdate?: (submissionId: string, status: TeamSubmission['status']) => Promise<void>;
  criteria: Array<{ name: string; weight: number }>;
}

export default function JudgingTable({
  submissions,
  onScoreUpdate,
  onStatusUpdate,
  criteria,
}: JudgingTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const handleEditStart = (submission: TeamSubmission) => {
    setEditingId(submission.id);
    const initialScores: Record<string, number> = {};
    criteria.forEach((c) => {
      initialScores[c.name] = submission.criteriaScores?.[c.name] || 0;
    });
    setScores(initialScores);
  };

  const handleSave = async (submissionId: string) => {
    if (!onScoreUpdate) return;

    try {
      setSaving(true);
      await onScoreUpdate(submissionId, scores);
      setEditingId(null);
    } catch (err) {
      console.error('Error saving scores:', err);
      alert('保存失败，請重试');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setScores({});
  };

  const calculateFinalScore = (submission: TeamSubmission) => {
    if (!submission.criteriaScores) return 0;

    let total = 0;
    let weightSum = 0;

    criteria.forEach((c) => {
      const score = submission.criteriaScores?.[c.name] || 0;
      total += score * (c.weight / 100);
      weightSum += c.weight / 100;
    });

    return weightSum > 0 ? total / weightSum : 0;
  };

  const sortedSubmissions = [...submissions].sort((a, b) => {
    const scoreA = a.finalScore || calculateFinalScore(a);
    const scoreB = b.finalScore || calculateFinalScore(b);
    return scoreB - scoreA;
  });

  const getStatusBadge = (status: TeamSubmission['status']) => {
    const styles: Record<TeamSubmission['status'], { bg: string; text: string; label: string }> = {
      draft: { bg: '#f3f4f6', text: '#6b7280', label: '草稿' },
      submitted: { bg: '#dbeafe', text: '#1e40af', label: '已提交' },
      under_review: { bg: '#fef3c7', text: '#92400e', label: '審核中' },
      shortlisted: { bg: '#dcfce7', text: '#166534', label: '入圍' },
      winner: { bg: '#fce7f3', text: '#9f1239', label: '🏆 獲獎' },
      accepted: { bg: '#dcfce7', text: '#166534', label: '✓ 錄取' },
      rejected: { bg: '#fee2e2', text: '#991b1b', label: '未入選' },
    };
    return styles[status] || styles.draft;
  };

  if (submissions.length === 0) {
    return (
      <div
        className="rounded-lg p-12 text-center"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
      >
        <p className="text-sm" style={{ color: '#6b7280' }}>
          暂无提交需要評審
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ backgroundColor: '#ffffff' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#1a3a6e' }}>
              排名
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#1a3a6e' }}>
              隊伍名称
            </th>
            {criteria.map((c) => (
              <th key={c.name} className="px-4 py-3 text-center text-sm font-semibold" style={{ color: '#1a3a6e' }}>
                {c.name}
                <br />
                <span className="text-xs font-normal" style={{ color: '#6b7280' }}>
                  ({c.weight}%)
                </span>
              </th>
            ))}
            <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: '#1a3a6e' }}>
              总分
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: '#1a3a6e' }}>
              狀態
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: '#1a3a6e' }}>
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSubmissions.map((submission, index) => {
            const isEditing = editingId === submission.id;
            const statusBadge = getStatusBadge(submission.status);
            const finalScore = submission.finalScore || calculateFinalScore(submission);

            return (
              <tr key={submission.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                {/* 排名 */}
                <td className="px-4 py-3 text-center font-semibold" style={{ color: '#1a3a6e' }}>
                  {index + 1}
                </td>

                {/* 隊伍名称 */}
                <td className="px-4 py-3">
                  <Link href={`/sponsor/submissions/${submission.id}`}>
                    <a className="text-sm font-medium hover:underline" style={{ color: '#1a3a6e' }}>
                      {submission.teamName}
                    </a>
                  </Link>
                  {submission.projectName && (
                    <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                      {submission.projectName}
                    </p>
                  )}
                </td>

                {/* 各项評分 */}
                {criteria.map((c) => (
                  <td key={c.name} className="px-4 py-3 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scores[c.name] || 0}
                        onChange={(e) =>
                          setScores({ ...scores, [c.name]: parseFloat(e.target.value) || 0 })
                        }
                        className="w-16 px-2 py-1 border rounded text-center text-sm"
                        style={{ borderColor: '#d1d5db' }}
                      />
                    ) : (
                      <span className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
                        {submission.criteriaScores?.[c.name]?.toFixed(1) || '-'}
                      </span>
                    )}
                  </td>
                ))}

                {/* 总分 */}
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-bold" style={{ color: '#1a3a6e' }}>
                    {finalScore.toFixed(1)}
                  </span>
                </td>

                {/* 狀態 */}
                <td className="px-4 py-3 text-center">
                  {onStatusUpdate ? (
                    <select
                      value={submission.status}
                      onChange={(e) =>
                        onStatusUpdate(submission.id, e.target.value as TeamSubmission['status'])
                      }
                      className="text-xs px-2 py-1 rounded-full border"
                      style={{
                        backgroundColor: statusBadge.bg,
                        color: statusBadge.text,
                        borderColor: statusBadge.text,
                      }}
                    >
                      <option value="submitted">已提交</option>
                      <option value="under_review">审核中</option>
                      <option value="shortlisted">入围</option>
                      <option value="winner">獲獎</option>
                      <option value="rejected">未入選</option>
                    </select>
                  ) : (
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: statusBadge.bg,
                        color: statusBadge.text,
                      }}
                    >
                      {statusBadge.label}
                    </span>
                  )}
                </td>

                {/* 操作 */}
                <td className="px-4 py-3 text-center">
                  {isEditing ? (
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleSave(submission.id)}
                        disabled={saving}
                        className="px-3 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: '#1a3a6e',
                          color: '#ffffff',
                        }}
                      >
                        {saving ? '...' : '保存'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-3 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: '#e5e7eb',
                          color: '#6b7280',
                        }}
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditStart(submission)}
                      className="px-3 py-1 text-xs font-medium rounded transition-colors"
                      style={{
                        backgroundColor: '#e8eef5',
                        color: '#1a3a6e',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a3a6e';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#e8eef5';
                        e.currentTarget.style.color = '#1a3a6e';
                      }}
                    >
                      評分
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

