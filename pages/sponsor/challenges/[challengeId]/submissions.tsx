/**
 * 赞助商查看挑战提交页面
 *
 * 显示某个挑战的所有团队提交数据
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthContext } from '../../../../lib/user/AuthContext';
import { useIsSponsor } from '../../../../lib/sponsor/hooks';
import SponsorHeader from '../../../../components/sponsor/SponsorHeader';

interface Submission {
  id: string;
  teamId: string;
  teamName: string;
  challengeId: string;
  trackId: string;
  submissions: any[];
  extraItems?: any[];
  submittedBy: {
    userId: string;
    email: string;
    name: string;
  };
  submittedAt: string;
  updatedAt: string;
  status: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
}

export default function ChallengeSubmissionsPage() {
  const router = useRouter();
  const { challengeId } = router.query;
  const { isSignedIn, user, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=' + encodeURIComponent(router.asPath));
    } else if (!authLoading && isSignedIn && !isSponsor) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  // Load submissions
  useEffect(() => {
    const loadSubmissions = async () => {
      if (!challengeId || !user?.token) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/sponsor/challenges/${challengeId}/submissions`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '無法載入提交數據');
        }

        const data = await response.json();
        setChallenge(data.data.challenge);
        setSubmissions(data.data.submissions || []);
      } catch (err: any) {
        console.error('[ChallengeSubmissions] Load error:', err);
        setError(err.message || '載入失敗');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isSignedIn && isSponsor) {
      loadSubmissions();
    }
  }, [challengeId, user, authLoading, isSignedIn, isSponsor]);

  const toggleExpanded = (submissionId: string) => {
    const newExpanded = new Set(expandedSubmissions);
    if (newExpanded.has(submissionId)) {
      newExpanded.delete(submissionId);
    } else {
      newExpanded.add(submissionId);
    }
    setExpandedSubmissions(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file':
        return '📎';
      case 'link':
        return '🔗';
      case 'checkbox':
        return '☑️';
      case 'text':
        return '✍️';
      default:
        return '📝';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'file':
        return '檔案';
      case 'link':
        return '連結';
      case 'checkbox':
        return '勾選確認';
      case 'text':
        return '文字回應';
      default:
        return type;
    }
  };

  if (authLoading || !isSignedIn || !isSponsor) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>團隊提交 - {challenge?.title || '挑戰'}</title>
      </Head>
      <SponsorHeader />

      <div className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-20">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm mb-4 hover:underline"
              style={{ color: '#6b7280' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回
            </button>

            {challenge && (
              <>
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
                  {challenge.title}
                </h1>
                <p className="text-lg mb-4" style={{ color: '#6b7280' }}>
                  團隊提交數據
                </p>
              </>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div
                className="inline-block animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: '#1a3a6e' }}
              ></div>
              <p className="mt-4" style={{ color: '#6b7280' }}>
                載入中...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p style={{ color: '#991b1b' }}>❌ {error}</p>
            </div>
          )}

          {/* No Submissions */}
          {!loading && !error && submissions.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p style={{ color: '#6b7280' }}>暫無團隊提交</p>
            </div>
          )}

          {/* Submissions List */}
          {!loading && !error && submissions.length > 0 && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div
                className="bg-white rounded-lg shadow-sm p-6 border-l-4"
                style={{ borderColor: '#1a3a6e' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-full"
                    style={{ backgroundColor: '#e0e7ff' }}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: '#1a3a6e' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                      {submissions.length}
                    </p>
                    <p className="text-sm" style={{ color: '#6b7280' }}>
                      個團隊已提交
                    </p>
                  </div>
                </div>
              </div>

              {/* Submissions */}
              {submissions.map((submission) => {
                const isExpanded = expandedSubmissions.has(submission.id);

                return (
                  <div
                    key={submission.id}
                    className="bg-white rounded-lg shadow-sm border"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    {/* Header */}
                    <div
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleExpanded(submission.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link href={`/teams/${submission.teamId}/public`}>
                              <a
                                className="text-xl font-bold hover:underline"
                                style={{ color: '#1a3a6e' }}
                              >
                                {submission.teamName}
                              </a>
                            </Link>
                            <span
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                backgroundColor:
                                  submission.status === 'submitted' ? '#dcfce7' : '#f3f4f6',
                                color: submission.status === 'submitted' ? '#166534' : '#6b7280',
                              }}
                            >
                              {submission.status === 'submitted' ? '已提交' : submission.status}
                            </span>
                          </div>
                          <div className="text-sm space-y-1" style={{ color: '#6b7280' }}>
                            <p>
                              提交人：{submission.submittedBy.name || submission.submittedBy.email}
                            </p>
                            <p>
                              提交時間：{new Date(submission.submittedAt).toLocaleString('zh-TW')}
                            </p>
                            {submission.updatedAt !== submission.submittedAt && (
                              <p>
                                更新時間：{new Date(submission.updatedAt).toLocaleString('zh-TW')}
                              </p>
                            )}
                          </div>
                        </div>
                        <svg
                          className={`w-5 h-5 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          style={{ color: '#6b7280' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t" style={{ borderColor: '#e5e7eb' }}>
                        {/* Required Submissions */}
                        {submission.submissions && submission.submissions.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold mb-3" style={{ color: '#1a3a6e' }}>
                              必填項目
                            </h4>
                            <div className="space-y-3">
                              {submission.submissions.map((item: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-4 rounded-lg"
                                  style={{
                                    backgroundColor: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <span className="text-xl">{getTypeIcon(item.type)}</span>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span
                                          className="text-xs font-medium px-2 py-1 rounded"
                                          style={{ backgroundColor: '#e0e7ff', color: '#1a3a6e' }}
                                        >
                                          {getTypeLabel(item.type)}
                                        </span>
                                        <p
                                          className="text-sm font-medium"
                                          style={{ color: '#374151' }}
                                        >
                                          {item.description}
                                        </p>
                                      </div>

                                      {/* File */}
                                      {item.type === 'file' && item.fileUrl && (
                                        <div className="mt-2">
                                          <a
                                            href={item.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded hover:underline"
                                            style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}
                                          >
                                            <svg
                                              className="w-4 h-4"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                              />
                                            </svg>
                                            {item.fileName || '下載文件'}
                                            {item.fileSize && (
                                              <span className="text-xs">
                                                ({(item.fileSize / 1024).toFixed(2)} KB)
                                              </span>
                                            )}
                                          </a>
                                        </div>
                                      )}

                                      {/* Link */}
                                      {item.type === 'link' && item.value && (
                                        <div className="mt-2">
                                          <a
                                            href={item.value}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm hover:underline"
                                            style={{ color: '#2563eb' }}
                                          >
                                            {item.value}
                                          </a>
                                        </div>
                                      )}

                                      {/* Checkbox */}
                                      {item.type === 'checkbox' && (
                                        <div
                                          className="mt-2 text-sm"
                                          style={{ color: item.checked ? '#059669' : '#dc2626' }}
                                        >
                                          {item.checked ? '✓ 已確認' : '✗ 未確認'}
                                        </div>
                                      )}

                                      {/* Text */}
                                      {item.type === 'text' && item.value && (
                                        <div
                                          className="mt-2 p-3 rounded text-sm"
                                          style={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e5e7eb',
                                            whiteSpace: 'pre-wrap',
                                          }}
                                        >
                                          {item.value}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Extra Items */}
                        {submission.extraItems && submission.extraItems.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-semibold mb-3" style={{ color: '#1a3a6e' }}>
                              額外項目
                            </h4>
                            <div className="space-y-3">
                              {submission.extraItems.map((item: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-4 rounded-lg"
                                  style={{
                                    backgroundColor: '#fef3c7',
                                    border: '1px solid #fbbf24',
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <span className="text-xl">{getTypeIcon(item.type)}</span>
                                    <div className="flex-1">
                                      <p
                                        className="text-sm font-medium mb-2"
                                        style={{ color: '#92400e' }}
                                      >
                                        {item.description}
                                      </p>

                                      {/* File */}
                                      {item.type === 'file' && item.fileUrl && (
                                        <a
                                          href={item.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded hover:underline"
                                          style={{ backgroundColor: '#fde68a', color: '#92400e' }}
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                          </svg>
                                          {item.fileName || '下載文件'}
                                        </a>
                                      )}

                                      {/* Link */}
                                      {item.type === 'link' && item.value && (
                                        <a
                                          href={item.value}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm hover:underline"
                                          style={{ color: '#92400e' }}
                                        >
                                          {item.value}
                                        </a>
                                      )}

                                      {/* Text */}
                                      {item.type === 'text' && item.value && (
                                        <div
                                          className="p-3 rounded text-sm"
                                          style={{
                                            backgroundColor: '#fef9e7',
                                            border: '1px solid #fbbf24',
                                            whiteSpace: 'pre-wrap',
                                          }}
                                        >
                                          {item.value}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
