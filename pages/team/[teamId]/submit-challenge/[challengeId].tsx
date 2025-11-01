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

  // Submission form state
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);

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

        // Initialize submission form
        if (challengeInfo.submissionRequirements && Array.isArray(challengeInfo.submissionRequirements)) {
          const initialSubmissions = challengeInfo.submissionRequirements.map((req: SubmissionRequirement) => ({
            type: req.type,
            description: req.description,
            value: req.type === 'checkbox' ? false : '',
            file: null,
          }));
          setSubmissions(initialSubmissions);
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
                          已選擇：{item.file.name} ({(item.file.size / 1024).toFixed(2)} KB)
                        </p>
                      )}
                    </div>
                  )}

                  {item.type === 'link' && (
                    <input
                      type="url"
                      value={item.value || ''}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ borderColor: '#d1d5db' }}
                    />
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

