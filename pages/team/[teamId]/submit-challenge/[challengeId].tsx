/**
 * 团队挑战提交页面
 * 
 * 允许团队成员为特定挑战提交资料
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppHeader from '../../../../components/AppHeader';
import { useAuthContext } from '../../../../lib/user/AuthContext';
import firebase from 'firebase/app';
import 'firebase/auth';

interface SubmissionRequirement {
  type: 'file' | 'link' | 'checkbox' | 'text';
  description: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  submissionRequirements?: SubmissionRequirement[];
  trackId?: string;
  trackName?: string;
}

interface Team {
  id: string;
  teamName: string;
  canEdit: boolean;
}

interface SubmissionItem {
  type: string;
  description: string;
  value?: any;
  file?: File | null;
  existingFileUrl?: string | null;
  existingFileName?: string | null;
}

export default function SubmitChallengePage() {
  const router = useRouter();
  const { teamId, challengeId } = router.query;
  const { isSignedIn, user, loading: authLoading } = useAuthContext();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [existingSubmission, setExistingSubmission] = useState<any>(null);

  // Submission form state
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [extraItems, setExtraItems] = useState<SubmissionItem[]>([]);
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [newExtraItem, setNewExtraItem] = useState({
    type: 'file' as 'file' | 'link' | 'text',
    description: '',
  });

  // Load challenge and team data
  useEffect(() => {
    const loadData = async () => {
      if (!teamId || !challengeId || !user?.token) return;

      try {
        setLoading(true);
        setError(null);

        // Load challenge details
        const challengeRes = await fetch(`/api/challenges/${challengeId}`);
        if (!challengeRes.ok) {
          throw new Error('無法載入挑戰資訊');
        }
        const challengeData = await challengeRes.json();
        const challengeInfo = challengeData.data || challengeData;
        setChallenge(challengeInfo);

        // Load team details to verify permission
        const teamRes = await fetch(`/api/team-register/${teamId}`, {
          headers: { Authorization: user.token },
        });
        if (!teamRes.ok) {
          throw new Error('無法載入團隊資訊');
        }
        const teamData = await teamRes.json();
        setTeam(teamData.data || teamData);

        // Load existing submission if any
        const submissionRes = await fetch(
          `/api/team-challenge-submissions/get?teamId=${teamId}&challengeId=${challengeId}`,
          {
            headers: { Authorization: user.token },
          }
        );

        let existingData: any = null;
        if (submissionRes.ok) {
          const submissionData = await submissionRes.json();
          existingData = submissionData.data || submissionData;
          setExistingSubmission(existingData);
        }

        // Initialize submission form
        if (challengeInfo.submissionRequirements && Array.isArray(challengeInfo.submissionRequirements)) {
          const initialSubmissions = challengeInfo.submissionRequirements.map((req: SubmissionRequirement, index: number) => {
            // Try to find existing submission for this requirement
            const existing = existingData?.submissions?.[index];
            
            return {
              type: req.type,
              description: req.description,
              value: existing?.value || existing?.checked || (req.type === 'checkbox' ? false : ''),
              file: null, // Can't prefill file input
              existingFileUrl: existing?.fileUrl || null,
              existingFileName: existing?.fileName || null,
            };
          });
          setSubmissions(initialSubmissions);
        }

        // Load extra items if any
        if (existingData?.extraItems && Array.isArray(existingData.extraItems)) {
          const initialExtraItems = existingData.extraItems.map((item: any) => ({
            type: item.type,
            description: item.description,
            value: item.value || '',
            file: null,
            existingFileUrl: item.fileUrl || null,
            existingFileName: item.fileName || null,
          }));
          setExtraItems(initialExtraItems);
        }
      } catch (err: any) {
        console.error('[SubmitChallenge] Load error:', err);
        setError(err.message || '載入失敗');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isSignedIn) {
      loadData();
    }
  }, [teamId, challengeId, user, authLoading, isSignedIn]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=' + encodeURIComponent(router.asPath));
    }
  }, [authLoading, isSignedIn, router]);

  const handleFileChange = (index: number, file: File | null) => {
    const newSubmissions = [...submissions];
    newSubmissions[index].file = file;
    setSubmissions(newSubmissions);
  };

  const handleValueChange = (index: number, value: any) => {
    const newSubmissions = [...submissions];
    newSubmissions[index].value = value;
    setSubmissions(newSubmissions);
  };

  // Extra items handlers
  const handleExtraFileChange = (index: number, file: File | null) => {
    const newItems = [...extraItems];
    newItems[index].file = file;
    setExtraItems(newItems);
  };

  const handleExtraValueChange = (index: number, value: any) => {
    const newItems = [...extraItems];
    newItems[index].value = value;
    setExtraItems(newItems);
  };

  const addExtraItem = () => {
    if (!newExtraItem.description.trim()) {
      setMessage('❌ 請輸入項目說明');
      return;
    }

    setExtraItems([
      ...extraItems,
      {
        type: newExtraItem.type,
        description: newExtraItem.description,
        value: newExtraItem.type === 'text' ? '' : '',
        file: null,
      },
    ]);

    // Reset form
    setNewExtraItem({
      type: 'file',
      description: '',
    });
    setShowAddExtra(false);
    setMessage('');
  };

  const removeExtraItem = (index: number) => {
    const newItems = extraItems.filter((_, i) => i !== index);
    setExtraItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.token || !teamId || !challengeId) return;

    try {
      setSubmitting(true);
      setMessage('');

      // Validate required fields
      for (let i = 0; i < submissions.length; i++) {
        const sub = submissions[i];
        if (sub.type === 'file' && !sub.file) {
          setMessage(`❌ 請上傳檔案：${sub.description}`);
          return;
        }
        if (sub.type === 'link' && !sub.value?.trim()) {
          setMessage(`❌ 請輸入連結：${sub.description}`);
          return;
        }
        if (sub.type === 'text' && !sub.value?.trim()) {
          setMessage(`❌ 請填寫回應：${sub.description}`);
          return;
        }
      }

      // Upload files first and get URLs
      const processedSubmissions = [];
      for (const sub of submissions) {
        if (sub.type === 'file' && sub.file) {
          // Upload file via backend API (uses Admin SDK to bypass storage rules)
          const formData = new FormData();
          formData.append('file', sub.file);
          formData.append('teamId', teamId as string);
          formData.append('challengeId', challengeId as string);

          const uploadResponse = await fetch('/api/upload-file', {
            method: 'POST',
            headers: {
              Authorization: user.token,
            },
            body: formData,
          });

          if (!uploadResponse.ok) {
            const uploadError = await uploadResponse.json();
            throw new Error(uploadError.error || '文件上傳失敗');
          }

          const uploadData = await uploadResponse.json();
          
          processedSubmissions.push({
            type: sub.type,
            description: sub.description,
            fileUrl: uploadData.fileUrl,
            fileName: uploadData.fileName,
            fileSize: uploadData.fileSize,
          });
        } else if (sub.type === 'checkbox') {
          processedSubmissions.push({
            type: sub.type,
            description: sub.description,
            checked: sub.value || false,
          });
        } else {
          processedSubmissions.push({
            type: sub.type,
            description: sub.description,
            value: sub.value || '',
          });
        }
      }

      // Process extra items
      const processedExtraItems = [];
      for (const extra of extraItems) {
        if (extra.type === 'file') {
          // Only upload if a new file is selected
          if (extra.file) {
            const formData = new FormData();
            formData.append('file', extra.file);
            formData.append('teamId', teamId as string);
            formData.append('challengeId', challengeId as string);

            const uploadResponse = await fetch('/api/upload-file', {
              method: 'POST',
              headers: {
                Authorization: user.token,
              },
              body: formData,
            });

            if (!uploadResponse.ok) {
              const uploadError = await uploadResponse.json();
              throw new Error(uploadError.error || '額外檔案上傳失敗');
            }

            const uploadData = await uploadResponse.json();
            
            processedExtraItems.push({
              type: extra.type,
              description: extra.description,
              fileUrl: uploadData.fileUrl,
              fileName: uploadData.fileName,
              fileSize: uploadData.fileSize,
            });
          } else if (extra.existingFileUrl) {
            // Keep existing file
            processedExtraItems.push({
              type: extra.type,
              description: extra.description,
              fileUrl: extra.existingFileUrl,
              fileName: extra.existingFileName,
            });
          }
        } else if (extra.value?.trim()) {
          // Only include non-empty text/link items
          processedExtraItems.push({
            type: extra.type,
            description: extra.description,
            value: extra.value,
          });
        }
      }

      // Submit to backend
      const response = await fetch(`/api/team-challenge-submissions/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: user.token,
        },
        body: JSON.stringify({
          teamId,
          challengeId,
          trackId: challenge?.trackId,
          submissions: processedSubmissions,
          extraItems: processedExtraItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '提交失敗');
      }

      setMessage('✅ 提交成功！');
      
      // Redirect back after 2 seconds
      setTimeout(() => {
        router.push('/profile?tab=my-teams');
      }, 2000);

    } catch (err: any) {
      console.error('[SubmitChallenge] Submit error:', err);
      setMessage('❌ ' + (err.message || '提交失敗'));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg font-medium"
              style={{ backgroundColor: '#1a3a6e', color: 'white' }}
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!team?.canEdit) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">您沒有權限提交此團隊的資料</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg font-medium"
              style={{ backgroundColor: '#1a3a6e', color: 'white' }}
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>提交挑戰 - {challenge?.title}</title>
      </Head>
      <AppHeader />

      <div className="flex-grow bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-20">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm mb-4 hover:underline"
              style={{ color: '#6b7280' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </button>

            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
              提交挑戰資料
            </h1>
            <p className="text-lg" style={{ color: '#6b7280' }}>
              {team?.teamName} → {challenge?.title}
            </p>
          </div>

          {/* Challenge Description */}
          {challenge?.description && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                挑戰說明
              </h3>
              <p className="text-sm" style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>
                {challenge.description}
              </p>
            </div>
          )}

          {/* Existing Submission Info */}
          {existingSubmission && (
            <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#ecfdf5', border: '1px solid #86efac' }}>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#065f46' }}>
                    您已提交過此挑戰
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                    提交時間：{new Date(existingSubmission.submittedAt).toLocaleString('zh-TW')}
                  </p>
                  {existingSubmission.submittedBy && (
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      提交人：{existingSubmission.submittedBy.name || existingSubmission.submittedBy.email}
                    </p>
                  )}
                  <p className="text-xs mt-2" style={{ color: '#059669' }}>
                    您可以查看、修改並重新提交以下內容
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {submissions.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <p style={{ color: '#6b7280' }}>此挑戰暫無提交要求</p>
              </div>
            ) : (
              submissions.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-6 shadow-sm"
                  style={{ border: '1px solid #e5e7eb' }}
                >
                  {/* Requirement Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-2xl">
                      {item.type === 'file' && '📎'}
                      {item.type === 'link' && '🔗'}
                      {item.type === 'checkbox' && '☑️'}
                      {item.type === 'text' && '✍️'}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold mb-1" style={{ color: '#1a3a6e' }}>
                        {item.type === 'file' && '檔案'}
                        {item.type === 'link' && '連結'}
                        {item.type === 'checkbox' && '勾選確認'}
                        {item.type === 'text' && '文字回應'}
                      </h3>
                      <p className="text-sm" style={{ color: '#374151' }}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Input Field */}
                  {item.type === 'file' && (
                    <div>
                      {/* Show existing file if any */}
                      {item.existingFileUrl && !item.file && (
                        <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium" style={{ color: '#1e40af' }}>
                                  已上傳：{item.existingFileName}
                                </p>
                                <p className="text-xs" style={{ color: '#6b7280' }}>
                                  {existingSubmission?.submittedAt && (
                                    <>提交時間：{new Date(existingSubmission.submittedAt).toLocaleString('zh-TW')}</>
                                  )}
                                </p>
                              </div>
                            </div>
                            <a
                              href={item.existingFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1 rounded hover:underline"
                              style={{ color: '#3b82f6' }}
                            >
                              查看文件
                            </a>
                          </div>
                        </div>
                      )}
                      
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                        className="block w-full text-sm"
                        style={{
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                        }}
                      />
                      {item.file && (
                        <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
                          新選擇：{item.file.name} ({(item.file.size / 1024).toFixed(2)} KB)
                        </p>
                      )}
                      {item.existingFileUrl && (
                        <p className="text-xs mt-2" style={{ color: '#10b981' }}>
                          ✓ 選擇新文件將替換已上傳的文件
                        </p>
                      )}
                    </div>
                  )}

                  {item.type === 'link' && (
                    <div>
                      <input
                        type="url"
                        value={item.value || ''}
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{ borderColor: '#d1d5db' }}
                      />
                      {item.value && (
                        <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
                          <a href={item.value} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#3b82f6' }}>
                            預覽連結 →
                          </a>
                        </p>
                      )}
                    </div>
                  )}

                  {item.type === 'checkbox' && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.value || false}
                        onChange={(e) => handleValueChange(index, e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-sm" style={{ color: '#374151' }}>
                        我確認
                      </span>
                    </label>
                  )}

                  {item.type === 'text' && (
                    <textarea
                      value={item.value || ''}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      rows={4}
                      placeholder="請輸入您的回應..."
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ borderColor: '#d1d5db' }}
                    />
                  )}
                </div>
              ))
            )}

            {/* Extra Items Section */}
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: '#1a3a6e' }}>
                    額外項目（選填）
                  </h3>
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                    您可以添加額外的資料或說明
                  </p>
                </div>
                {!showAddExtra && (
                  <button
                    type="button"
                    onClick={() => setShowAddExtra(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    新增項目
                  </button>
                )}
              </div>

              {/* Add Extra Item Form */}
              {showAddExtra && (
                <div className="bg-white rounded-lg p-4 mb-4 border" style={{ borderColor: '#d1d5db' }}>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                        類型
                      </label>
                      <select
                        value={newExtraItem.type}
                        onChange={(e) => setNewExtraItem({ ...newExtraItem, type: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{ borderColor: '#d1d5db' }}
                      >
                        <option value="file">📎 檔案</option>
                        <option value="link">🔗 連結</option>
                        <option value="text">✍️ 文字說明</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                        說明
                      </label>
                      <input
                        type="text"
                        value={newExtraItem.description}
                        onChange={(e) => setNewExtraItem({ ...newExtraItem, description: e.target.value })}
                        placeholder="例如：團隊照片、補充資料..."
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{ borderColor: '#d1d5db' }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addExtraItem();
                          }
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={addExtraItem}
                        className="px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                        }}
                      >
                        確認新增
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddExtra(false);
                          setNewExtraItem({ type: 'file', description: '' });
                        }}
                        className="px-4 py-2 rounded-lg font-medium border"
                        style={{
                          borderColor: '#d1d5db',
                          color: '#6b7280',
                        }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Extra Items List */}
              {extraItems.length > 0 && (
                <div className="space-y-3">
                  {extraItems.map((extra, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 border"
                      style={{ borderColor: '#e5e7eb' }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xl">
                          {extra.type === 'file' && '📎'}
                          {extra.type === 'link' && '🔗'}
                          {extra.type === 'text' && '✍️'}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
                            {extra.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExtraItem(index)}
                          className="text-sm px-2 py-1 rounded hover:bg-red-50"
                          style={{ color: '#dc2626' }}
                        >
                          刪除
                        </button>
                      </div>

                      {/* Extra Item Input */}
                      {extra.type === 'file' && (
                        <div>
                          {extra.existingFileUrl && !extra.file && (
                            <div className="mb-2 p-2 rounded" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                              <p className="text-xs" style={{ color: '#1e40af' }}>
                                已上傳：{extra.existingFileName}
                              </p>
                            </div>
                          )}
                          <input
                            type="file"
                            onChange={(e) => handleExtraFileChange(index, e.target.files?.[0] || null)}
                            className="block w-full text-sm"
                            style={{
                              padding: '8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                            }}
                          />
                          {extra.file && (
                            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                              已選擇：{extra.file.name}
                            </p>
                          )}
                        </div>
                      )}

                      {extra.type === 'link' && (
                        <input
                          type="url"
                          value={extra.value || ''}
                          onChange={(e) => handleExtraValueChange(index, e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded-lg border text-sm"
                          style={{ borderColor: '#d1d5db' }}
                        />
                      )}

                      {extra.type === 'text' && (
                        <textarea
                          value={extra.value || ''}
                          onChange={(e) => handleExtraValueChange(index, e.target.value)}
                          rows={3}
                          placeholder="請輸入內容..."
                          className="w-full px-3 py-2 rounded-lg border text-sm"
                          style={{ borderColor: '#d1d5db' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {extraItems.length === 0 && !showAddExtra && (
                <p className="text-center text-sm" style={{ color: '#9ca3af' }}>
                  尚未添加額外項目
                </p>
              )}
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.includes('✅')
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p
                  className="text-sm"
                  style={{
                    color: message.includes('✅') ? '#166534' : '#991b1b',
                  }}
                >
                  {message}
                </p>
              </div>
            )}

            {/* Submit Button */}
            {submissions.length > 0 && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="flex-1 border-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{
                    borderColor: '#d1d5db',
                    color: '#6b7280',
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: '#1a3a6e',
                    color: '#ffffff',
                  }}
                >
                  {submitting ? '提交中...' : '確認提交'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

