import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthContext } from '../lib/user/AuthContext';
import { RequestHelper } from '../lib/request-helper';
import CommitmentContent from '../components/CommitmentContent';

/**
 * Team Registration Page for Hackathon
 * 
 * Route: /team-register
 * 
 * Requirements:
 * - Only accessible to registered users
 * - Team members must be registered (validate by email)
 * - Select multiple challenges to participate in
 * - Must agree to commitment terms
 */

interface Challenge {
  id: string;
  title: string;
  track?: string;
  sponsorName?: string;
  organization?: string;
}

interface TeamMember {
  email: string;
  isValid?: boolean;
  isValidating?: boolean;
  name?: string;
}

export default function TeamRegisterPage() {
  const router = useRouter();
  const { isSignedIn, hasProfile, user, profile } = useAuthContext();
  
  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([{ email: '' }]);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [showCommitment, setShowCommitment] = useState(false);
  const [expandedChallenges, setExpandedChallenges] = useState<Set<string>>(new Set());
  
  // Data states
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(false);
  
  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Redirect if not signed in
  useEffect(() => {
    if (!isSignedIn && !hasProfile) {
      router.push('/auth');
    }
  }, [isSignedIn, hasProfile, router]);

  // Fetch available challenges
  useEffect(() => {
    if (isSignedIn && user) {
      fetchChallenges();
    }
  }, [isSignedIn, user]);

  const fetchChallenges = async () => {
    try {
      setIsLoadingChallenges(true);
      const response = await RequestHelper.get<{ data: Challenge[] }>(
        '/api/challenges/all',
        {
          headers: {
            Authorization: user.token,
          },
        }
      );

      if (response.error) {
        console.error('Failed to fetch challenges:', response.error);
        setChallenges([]);
        return;
      }

      // Handle nested data structure from API
      const challengesData = response.data?.data || response.data || [];
      console.log('[TeamRegister] Fetched challenges:', challengesData);
      
      if (Array.isArray(challengesData)) {
        setChallenges(challengesData);
      } else {
        console.error('[TeamRegister] Challenges data is not an array:', challengesData);
        setChallenges([]);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setChallenges([]);
    } finally {
      setIsLoadingChallenges(false);
    }
  };

  const addTeamMember = () => {
    if (teamMembers.length >= 5) {
      alert('團隊成員最多 5 人');
      return;
    }
    setTeamMembers([...teamMembers, { email: '' }]);
  };

  const removeTeamMember = (index: number) => {
    if (teamMembers.length <= 1) {
      alert('至少需要 1 位隊友');
      return;
    }
    const newMembers = teamMembers.filter((_, i) => i !== index);
    setTeamMembers(newMembers);
  };

  const updateTeamMemberEmail = (index: number, email: string) => {
    const newMembers = [...teamMembers];
    newMembers[index] = { email, isValid: undefined };
    setTeamMembers(newMembers);
  };

  const validateEmail = async (index: number) => {
    const member = teamMembers[index];
    if (!member.email || !member.email.trim()) {
      return;
    }

    // Update validating state
    const newMembers = [...teamMembers];
    newMembers[index] = { ...member, isValidating: true };
    setTeamMembers(newMembers);

    try {
      const { data, error } = await RequestHelper.post(
        '/api/team-register/validate-email',
        {
          email: member.email.trim(),
        },
        {
          headers: {
            Authorization: user.token,
          },
        }
      );

      const updatedMembers = [...teamMembers];
      if (error || !data.isValid) {
        updatedMembers[index] = { 
          ...member, 
          isValid: false, 
          isValidating: false,
          name: undefined
        };
      } else {
        updatedMembers[index] = { 
          ...member, 
          isValid: true, 
          isValidating: false,
          name: data.name
        };
      }
      setTeamMembers(updatedMembers);
    } catch (error) {
      console.error('Error validating email:', error);
      const updatedMembers = [...teamMembers];
      updatedMembers[index] = { ...member, isValid: false, isValidating: false };
      setTeamMembers(updatedMembers);
    }
  };

  const toggleChallenge = (challengeId: string) => {
    if (selectedChallenges.includes(challengeId)) {
      setSelectedChallenges(selectedChallenges.filter(id => id !== challengeId));
    } else {
      setSelectedChallenges([...selectedChallenges, challengeId]);
    }
  };

  const toggleChallengeExpand = (challengeId: string) => {
    const newExpanded = new Set(expandedChallenges);
    if (newExpanded.has(challengeId)) {
      newExpanded.delete(challengeId);
    } else {
      newExpanded.add(challengeId);
    }
    setExpandedChallenges(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage('');
    setSubmitSuccess(false);

    // Validation
    if (!teamName.trim()) {
      setSubmitMessage('❌ 請輸入團隊名稱');
      return;
    }

    if (teamMembers.some(m => !m.email.trim())) {
      setSubmitMessage('❌ 請填寫所有隊友的 Email');
      return;
    }

    if (teamMembers.some(m => m.isValid === false)) {
      setSubmitMessage('❌ 有隊友 Email 尚未註冊，請確認');
      return;
    }

    if (teamMembers.some(m => m.isValid === undefined)) {
      setSubmitMessage('❌ 請先驗證所有隊友的 Email');
      return;
    }

    if (selectedChallenges.length === 0) {
      setSubmitMessage('❌ 請至少選擇一個挑戰');
      return;
    }

    if (!hasAgreed) {
      setSubmitMessage('❌ 請閱讀並同意參賽者承諾書');
      return;
    }

    // Submit
    try {
      setIsSubmitting(true);
      const { data, error } = await RequestHelper.post(
        '/api/team-register/submit',
        {
          teamName: teamName.trim(),
          teamMembers: teamMembers.map(m => m.email.trim()),
          challenges: selectedChallenges,
          agreedToCommitment: hasAgreed,
        },
        {
          headers: {
            Authorization: user.token,
          },
        }
      );

      if (error) {
        setSubmitMessage(`❌ 報名失敗：${error}`);
        setSubmitSuccess(false);
      } else {
        setSubmitMessage('✅ 報名成功！我們會盡快審核您的申請。');
        setSubmitSuccess(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          router.push('/profile');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      setSubmitMessage(`❌ 報名失敗：${error.message || '伺服器錯誤'}`);
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSignedIn || !hasProfile) {
    return null;
  }

  return (
    <>
      <Head>
        <title>團隊報名 - RWA 黑客松</title>
        <meta name="description" content="黑客松團隊報名頁面" />
      </Head>

      <div className="flex flex-col flex-grow">
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 py-20">
            {/* Title */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-left mb-4" style={{ color: '#1a3a6e' }}>
                團隊報名
              </h1>
              <p className="text-lg text-gray-600">
                組建您的團隊，選擇挑戰賽道，開始您的黑客松之旅
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Team Name */}
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a3a6e' }}>
                  團隊資訊
                </h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    團隊名稱 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: '#d1d5db' }}
                    placeholder="例如：創新者聯盟"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Team Members */}
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                    團隊成員 <span className="text-sm font-normal text-gray-500">(最多 5 人)</span>
                  </h2>
                  <button
                    type="button"
                    onClick={addTeamMember}
                    disabled={teamMembers.length >= 5 || isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: '#1a3a6e',
                      color: '#ffffff',
                    }}
                    onMouseEnter={(e) => {
                      if (teamMembers.length < 5 && !isSubmitting) {
                        e.currentTarget.style.backgroundColor = '#2a4a7e';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a3a6e';
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    新增隊友
                  </button>
                </div>

                <div className="space-y-4">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-grow">
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) => updateTeamMemberEmail(index, e.target.value)}
                            onBlur={() => validateEmail(index)}
                            className="flex-grow px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ borderColor: '#d1d5db' }}
                            placeholder={`隊友 ${index + 1} 的 Email (必須已註冊)`}
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => validateEmail(index)}
                            disabled={!member.email.trim() || member.isValidating || isSubmitting}
                            className="px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: '#f3f4f6',
                              color: '#1a3a6e',
                              border: '1px solid #e5e7eb',
                            }}
                          >
                            {member.isValidating ? '驗證中...' : '驗證'}
                          </button>
                          {teamMembers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTeamMember(index)}
                              disabled={isSubmitting}
                              className="px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                              style={{
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fecaca',
                              }}
                            >
                              移除
                            </button>
                          )}
                        </div>
                        
                        {member.isValid === true && (
                          <div className="mt-2 text-sm flex items-center gap-2" style={{ color: '#16a34a' }}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            ✓ 已驗證 {member.name && `- ${member.name}`}
                          </div>
                        )}
                        {member.isValid === false && (
                          <div className="mt-2 text-sm flex items-center gap-2" style={{ color: '#dc2626' }}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            ✗ 此 Email 尚未註冊
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Challenge Selection */}
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-3" style={{ color: '#1a3a6e' }}>
                    選擇挑戰 <span style={{ color: '#ef4444' }}>*</span>
                  </h2>
                  <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}>
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#92400e' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm" style={{ color: '#92400e' }}>
                      <span className="font-semibold">報名截止日期：2025年10月27日 23:59</span>
                      <br />
                      截止前您可以隨時編輯或更改報名資料。
                    </div>
                  </div>
                </div>

                {isLoadingChallenges ? (
                  <div className="text-center py-8 text-gray-500">
                    載入挑戰列表中...
                  </div>
                ) : challenges.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    目前沒有可報名的挑戰
                  </div>
                ) : (
                  <div className="space-y-3">
                    {challenges.map((challenge) => (
                      <div
                        key={challenge.id}
                        className="border-2 rounded-lg transition-all"
                        style={{
                          borderColor: selectedChallenges.includes(challenge.id) ? '#1a3a6e' : '#e5e7eb',
                          backgroundColor: selectedChallenges.includes(challenge.id) ? '#f0f4ff' : 'transparent',
                        }}
                      >
                        {/* Challenge Header */}
                        <div className="flex items-start gap-3 p-4">
                          <label className="flex items-start gap-3 flex-grow cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedChallenges.includes(challenge.id)}
                              onChange={() => toggleChallenge(challenge.id)}
                              disabled={isSubmitting}
                              className="mt-1 w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
                              style={{ accentColor: '#1a3a6e' }}
                            />
                            <div className="flex-grow">
                              <div className="font-semibold" style={{ color: '#1a3a6e' }}>
                                {challenge.title}
                              </div>
                              {(challenge.track || challenge.sponsorName || challenge.organization) && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {challenge.track && `賽道：${challenge.track}`}
                                  {(challenge.sponsorName || challenge.organization) && ` | ${challenge.sponsorName || challenge.organization}`}
                                </div>
                              )}
                            </div>
                          </label>
                          
                          {/* Expand/Collapse Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleChallengeExpand(challenge.id);
                            }}
                            className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: '#1a3a6e' }}
                          >
                            <svg
                              className={`w-5 h-5 transform transition-transform ${expandedChallenges.has(challenge.id) ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {/* Challenge Details (Expandable) */}
                        {expandedChallenges.has(challenge.id) && (
                          <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: '#e5e7eb' }}>
                            <div className="space-y-3 text-sm">
                              {(challenge as any).description && (
                                <div>
                                  <div className="font-semibold text-gray-700 mb-1">挑戰描述</div>
                                  <div className="text-gray-600">{(challenge as any).description}</div>
                                </div>
                              )}
                              {(challenge as any).prizes && (
                                <div>
                                  <div className="font-semibold text-gray-700 mb-1">獎金詳情</div>
                                  <div className="text-gray-600">
                                    {Array.isArray((challenge as any).prizes)
                                      ? (challenge as any).prizes.join('、')
                                      : (challenge as any).prizes}
                                  </div>
                                </div>
                              )}
                              {(challenge as any).submissionRequirements && (
                                <div>
                                  <div className="font-semibold text-gray-700 mb-1">提交要求</div>
                                  <div className="text-gray-600">{(challenge as any).submissionRequirements}</div>
                                </div>
                              )}
                              {!(challenge as any).description && !(challenge as any).prizes && !(challenge as any).submissionRequirements && (
                                <div className="text-gray-500 italic">暫無詳細資料</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedChallenges.length > 0 && (
                  <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#f0f4ff', borderLeft: '4px solid #1a3a6e' }}>
                    <div className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
                      已選擇 {selectedChallenges.length} 個挑戰
                    </div>
                  </div>
                )}
              </div>

              {/* Commitment Agreement */}
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a3a6e' }}>
                  參賽者承諾書 <span style={{ color: '#ef4444' }}>*</span>
                </h2>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}>
                    <p className="text-sm" style={{ color: '#92400e' }}>
                      ⚠️ 請務必詳細閱讀參賽者承諾書，確認了解所有條款後再勾選同意。
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCommitment(!showCommitment)}
                    className="w-full px-4 py-3 rounded-lg text-left font-medium transition-colors flex items-center justify-between"
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#1a3a6e',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <span>{showCommitment ? '收起' : '查看'}參賽者承諾書</span>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${showCommitment ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showCommitment && (
                    <div className="border-2 rounded-lg p-6 max-h-96 overflow-y-auto bg-white" style={{ borderColor: '#e5e7eb' }}>
                      <CommitmentContent />
                      <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: '#e5e7eb' }}>
                        <Link href="/commitment">
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline inline-flex items-center gap-1"
                            style={{ color: '#1a3a6e' }}
                          >
                            在新視窗中開啟完整內容
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </Link>
                      </div>
                    </div>
                  )}

                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                    style={{
                      borderColor: hasAgreed ? '#1a3a6e' : '#e5e7eb',
                      backgroundColor: hasAgreed ? '#f0f4ff' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={hasAgreed}
                      onChange={(e) => setHasAgreed(e.target.checked)}
                      disabled={isSubmitting}
                      className="mt-1 w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
                      style={{ accentColor: '#1a3a6e' }}
                    />
                    <div className="text-sm">
                      <span className="font-medium" style={{ color: '#1a3a6e' }}>
                        我已詳細閱讀並同意遵守參賽者承諾書的所有條款
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Message */}
              {submitMessage && (
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: submitSuccess ? '#dcfce7' : '#fee2e2',
                    border: `1px solid ${submitSuccess ? '#86efac' : '#fecaca'}`,
                    color: submitSuccess ? '#166534' : '#991b1b',
                  }}
                >
                  {submitMessage}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-lg font-medium border-2 transition-colors disabled:opacity-50"
                  style={{
                    borderColor: '#d1d5db',
                    color: '#6b7280',
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !hasAgreed}
                  className="px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: (isSubmitting || !hasAgreed) ? '#9ca3af' : '#1a3a6e',
                    color: '#ffffff',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && hasAgreed) {
                      e.currentTarget.style.backgroundColor = '#2a4a7e';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting && hasAgreed) {
                      e.currentTarget.style.backgroundColor = '#1a3a6e';
                    }
                  }}
                >
                  {isSubmitting ? '提交中...' : '提交報名'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

