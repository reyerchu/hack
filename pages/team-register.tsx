import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthContext } from '../lib/user/AuthContext';
import RequestHelper from '../lib/request-helper';
import CommitmentContent from '../components/CommitmentContent';

/**
 * Team Registration Page
 * 
 * Features:
 * - Team name input
 * - Team members must be registered (validate by email)
 * - Each member has a role and edit permission flag
 * - Select multiple tracks to participate in
 * - Must agree to commitment terms
 * - Leader (current user) also needs to specify role
 */

interface Track {
  id: string;
  name: string;
  description?: string;
  sponsorName?: string;
  trackId?: string;
}

interface TeamMember {
  email: string;
  role: string;
  hasEditRight: boolean;
  isValid?: boolean;
  isValidating?: boolean;
  name?: string;
}

// Predefined role options
const ROLE_OPTIONS = [
  '前端開發',
  '後端開發',
  '全端開發',
  '設計師',
  '產品經理',
  '數據分析',
  '區塊鏈開發',
  '智能合約開發',
  'DevOps',
  '測試工程師',
  '其他',
];

export default function TeamRegisterPage() {
  const router = useRouter();
  const { isSignedIn, hasProfile, user, profile } = useAuthContext();
  
  // Form states
  const [teamName, setTeamName] = useState('');
  const [myRole, setMyRole] = useState('');
  const [myHasEditRight, setMyHasEditRight] = useState(true); // Leader defaults to having edit rights
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [showCommitment, setShowCommitment] = useState(false);
  
  // Data states
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  
  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isSignedIn || !hasProfile) {
      router.push('/auth');
    }
  }, [isSignedIn, hasProfile, router]);

  // Fetch tracks on mount
  useEffect(() => {
    if (isSignedIn && user) {
      fetchTracks();
    }
  }, [isSignedIn, user]);

  const fetchTracks = async () => {
    if (!user?.token) return;

    setIsLoadingTracks(true);
    try {
      const response = await RequestHelper.get<{ data: Track[] }>(
        '/api/tracks/all',
        { headers: { Authorization: user.token } }
      );

      if (response.error) {
        console.error('[TeamRegister] Failed to fetch tracks:', response.error);
        setTracks([]);
        return;
      }

      const tracksData = response.data?.data || response.data || [];
      if (Array.isArray(tracksData)) {
        setTracks(tracksData);
        console.log('[TeamRegister] Loaded tracks:', tracksData.length);
      } else {
        console.error('[TeamRegister] Tracks data is not an array:', tracksData);
        setTracks([]);
      }
    } catch (error) {
      console.error('[TeamRegister] Error fetching tracks:', error);
      setTracks([]);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  // Toggle track selection
  const toggleTrack = (trackId: string) => {
    setSelectedTracks((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
    );
  };

  // Add new team member
  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { email: '', role: '', hasEditRight: false }]);
  };

  // Remove team member
  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  // Handle email change with validation
  const handleEmailChange = async (index: number, email: string) => {
    const updated = [...teamMembers];
    updated[index].email = email;
    updated[index].isValid = undefined;
    updated[index].name = undefined;
    setTeamMembers(updated);

    // Validate email if it looks valid
    if (validateEmail(email)) {
      await validateTeamMemberEmail(index, email);
    }
  };

  // Handle role change
  const handleRoleChange = (index: number, role: string) => {
    const updated = [...teamMembers];
    updated[index].role = role;
    setTeamMembers(updated);
  };

  // Handle edit right change
  const handleEditRightChange = (index: number, hasEditRight: boolean) => {
    const updated = [...teamMembers];
    updated[index].hasEditRight = hasEditRight;
    setTeamMembers(updated);
  };

  // Basic email validation
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validate if email is registered
  const validateTeamMemberEmail = async (index: number, email: string) => {
    if (!user?.token) return;

    const updated = [...teamMembers];
    updated[index].isValidating = true;
    setTeamMembers(updated);

    try {
      const response = await RequestHelper.post<{ isValid: boolean; name?: string }>(
        '/api/team-register/validate-email',
        { email },
        { headers: { Authorization: user.token } }
      );

      const updatedAfter = [...teamMembers];
      updatedAfter[index].isValidating = false;
      updatedAfter[index].isValid = response.data?.isValid || false;
      updatedAfter[index].name = response.data?.name;
      setTeamMembers(updatedAfter);
    } catch (error) {
      console.error('[TeamRegister] Email validation error:', error);
      const updatedAfter = [...teamMembers];
      updatedAfter[index].isValidating = false;
      updatedAfter[index].isValid = false;
      setTeamMembers(updatedAfter);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.token) {
      setSubmitMessage('請先登入');
      setSubmitSuccess(false);
      return;
    }

    // Validation
    if (!teamName.trim()) {
      setSubmitMessage('請輸入團隊名稱');
      setSubmitSuccess(false);
      return;
    }

    if (!myRole.trim()) {
      setSubmitMessage('請選擇您的角色');
      setSubmitSuccess(false);
      return;
    }

    if (teamMembers.length === 0) {
      setSubmitMessage('請至少添加一位團隊成員');
      setSubmitSuccess(false);
      return;
    }

    // Validate all team members
    for (let i = 0; i < teamMembers.length; i++) {
      const member = teamMembers[i];
      
      if (!member.email.trim()) {
        setSubmitMessage(`請輸入第 ${i + 1} 位成員的 Email`);
        setSubmitSuccess(false);
        return;
      }

      if (!validateEmail(member.email)) {
        setSubmitMessage(`第 ${i + 1} 位成員的 Email 格式不正確`);
        setSubmitSuccess(false);
        return;
      }

      if (!member.role.trim()) {
        setSubmitMessage(`請選擇第 ${i + 1} 位成員的角色`);
        setSubmitSuccess(false);
        return;
      }

      if (member.isValid === false) {
        setSubmitMessage(`第 ${i + 1} 位成員的 Email (${member.email}) 尚未註冊`);
        setSubmitSuccess(false);
        return;
      }
    }

    // Check for duplicate emails
    const emails = teamMembers.map(m => m.email.toLowerCase());
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      setSubmitMessage('團隊成員 Email 不能重複');
      setSubmitSuccess(false);
      return;
    }

    // Check if leader email is in team members
    const leaderEmail = profile?.user?.email || user.email;
    if (leaderEmail && emails.includes(leaderEmail.toLowerCase())) {
      setSubmitMessage('團隊成員中不應包含您自己的 Email');
      setSubmitSuccess(false);
      return;
    }

    if (selectedTracks.length === 0) {
      setSubmitMessage('請至少選擇一個賽道');
      setSubmitSuccess(false);
      return;
    }

    if (!hasAgreed) {
      setSubmitMessage('請閱讀並同意參賽者承諾書');
      setSubmitSuccess(false);
      return;
    }

    // Submit
    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitSuccess(false);

    try {
      const response = await RequestHelper.post(
        '/api/team-register/submit',
        {
          teamName: teamName.trim(),
          teamLeader: {
            email: leaderEmail,
            name: profile?.user?.name || profile?.user?.displayName || '未提供',
            role: myRole,
            hasEditRight: myHasEditRight,
          },
          teamMembers: teamMembers.map(m => ({
            email: m.email.trim(),
            name: m.name,
            role: m.role.trim(),
            hasEditRight: m.hasEditRight,
          })),
          tracks: selectedTracks,
          agreedToCommitment: hasAgreed,
        },
        { headers: { Authorization: user.token } }
      );

      if (response.error) {
        setSubmitMessage(response.error || '報名失敗，請稍後再試');
        setSubmitSuccess(false);
      } else {
        setSubmitMessage('報名成功！通知郵件已發送給所有團隊成員。');
        setSubmitSuccess(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          router.push('/profile');
        }, 3000);
      }
    } catch (error: any) {
      console.error('[TeamRegister] Submission error:', error);
      setSubmitMessage(error.message || '提交失敗，請稍後再試');
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
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-left mb-4" style={{ color: '#1a3a6e' }}>
                團隊報名
              </h1>
              <p className="text-lg text-gray-600">
                組建您的團隊，選擇參賽賽道，開始您的黑客松之旅
              </p>
            </div>

            {/* Registration Deadline Notice - At Top */}
            <div className="mb-8 flex items-start gap-2 p-4 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}>
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#92400e' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm" style={{ color: '#92400e' }}>
                <span className="font-semibold">報名截止日期：2025年10月27日 23:59</span>
                <br />
                截止前您可以隨時編輯或更改報名資料。您可以用不同團隊名稱多次報名。
              </div>
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
                    required
                  />
                </div>
              </div>

              {/* Team Leader (Me) */}
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a3a6e' }}>
                  我的資訊（團隊領導者）
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      我的 Email
                    </label>
                    <input
                      type="text"
                      value={profile?.user?.email || user?.email || ''}
                      className="w-full px-4 py-3 border rounded-lg bg-gray-50"
                      style={{ borderColor: '#d1d5db' }}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      我的角色 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={myRole}
                      onChange={(e) => setMyRole(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: '#d1d5db' }}
                      disabled={isSubmitting}
                      required
                    >
                      <option value="">請選擇角色</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="myEditRight"
                      checked={myHasEditRight}
                      onChange={(e) => setMyHasEditRight(e.target.checked)}
                      className="w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
                      style={{ accentColor: '#1a3a6e' }}
                      disabled={isSubmitting}
                    />
                    <label htmlFor="myEditRight" className="text-sm" style={{ color: '#374151' }}>
                      擁有編輯報名資料的權限
                    </label>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                    團隊成員 <span style={{ color: '#ef4444' }}>*</span>
                  </h2>
                  <button
                    type="button"
                    onClick={addTeamMember}
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: '#1a3a6e', color: 'white' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a4a7e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a3a6e';
                    }}
                    disabled={isSubmitting}
                  >
                    + 新增成員
                  </button>
                </div>

                {teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    請點擊「新增成員」按鈕添加您的團隊成員
                    <br />
                    <span className="text-sm">（團隊成員必須已註冊本平台）</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {teamMembers.map((member, index) => (
                      <div key={index} className="p-4 border-2 rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-semibold" style={{ color: '#1a3a6e' }}>
                            成員 {index + 1}
                          </h3>
                          <button
                            type="button"
                            onClick={() => removeTeamMember(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                            disabled={isSubmitting}
                          >
                            移除
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Email */}
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                              Email <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="email"
                                value={member.email}
                                onChange={(e) => handleEmailChange(index, e.target.value)}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{ borderColor: '#d1d5db' }}
                                placeholder="member@example.com"
                                disabled={isSubmitting}
                                required
                              />
                              {member.isValidating && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                </div>
                              )}
                            </div>
                            {member.isValid === true && (
                              <div className="mt-1 text-sm text-green-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {member.name ? `已驗證：${member.name}` : '此 Email 已註冊'}
                              </div>
                            )}
                            {member.isValid === false && (
                              <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                此 Email 尚未註冊
                              </div>
                            )}
                          </div>

                          {/* Role */}
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                              角色 <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(index, e.target.value)}
                              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ borderColor: '#d1d5db' }}
                              disabled={isSubmitting}
                              required
                            >
                              <option value="">請選擇角色</option>
                              {ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </div>

                          {/* Edit Right */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`editRight-${index}`}
                              checked={member.hasEditRight}
                              onChange={(e) => handleEditRightChange(index, e.target.checked)}
                              className="w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
                              style={{ accentColor: '#1a3a6e' }}
                              disabled={isSubmitting}
                            />
                            <label htmlFor={`editRight-${index}`} className="text-sm" style={{ color: '#374151' }}>
                              擁有編輯報名資料的權限
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Select Tracks */}
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
                  選擇賽道 <span style={{ color: '#ef4444' }}>*</span>
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  請選擇您的團隊想要參加的賽道（可多選）。稍後上傳交付物時，您可以選擇具體的挑戰。
                </p>

                {isLoadingTracks ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    <p className="mt-4 text-gray-600">載入賽道中...</p>
                  </div>
                ) : tracks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    目前沒有可用的賽道
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className="border-2 rounded-lg transition-all"
                        style={{
                          borderColor: selectedTracks.includes(track.id) ? '#1a3a6e' : '#e5e7eb',
                          backgroundColor: selectedTracks.includes(track.id) ? '#f0f4ff' : 'transparent',
                        }}
                      >
                        <label className="flex items-start gap-3 p-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTracks.includes(track.id)}
                            onChange={() => toggleTrack(track.id)}
                            disabled={isSubmitting}
                            className="mt-1 w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
                            style={{ accentColor: '#1a3a6e' }}
                          />
                          <div className="flex-grow">
                            <div className="font-semibold" style={{ color: '#1a3a6e' }}>
                              {track.name}
                            </div>
                            {track.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {track.description}
                              </div>
                            )}
                            {track.sponsorName && (
                              <div className="text-sm text-gray-500 mt-1">
                                贊助商：{track.sponsorName}
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTracks.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm" style={{ color: '#1a3a6e' }}>
                      已選擇 {selectedTracks.length} 個賽道
                    </div>
                  </div>
                )}
              </div>

              {/* Commitment Agreement */}
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a3a6e' }}>
                  參賽者承諾書 <span style={{ color: '#ef4444' }}>*</span>
                </h2>

                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setShowCommitment(!showCommitment)}
                    className="flex items-center gap-2 text-sm font-medium hover:underline"
                    style={{ color: '#1a3a6e' }}
                  >
                    {showCommitment ? '收起' : '展開'}參賽者承諾書
                    <svg
                      className={`w-5 h-5 transform transition-transform ${showCommitment ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showCommitment && (
                  <div className="mb-6 p-6 border rounded-lg max-h-96 overflow-y-auto" style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
                    <CommitmentContent />
                    <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: '#e5e7eb' }}>
                      <Link href="/commitment">
                        <a target="_blank" rel="noopener noreferrer" className="text-sm hover:underline inline-flex items-center gap-1" style={{ color: '#1a3a6e' }}>
                          在新視窗中開啟完整內容
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </Link>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}>
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#92400e' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm" style={{ color: '#92400e' }}>
                    ⚠️ 請務必詳細閱讀參賽者承諾書，確認了解所有條款後再勾選同意。
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="hasAgreed"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
                    style={{ accentColor: '#1a3a6e' }}
                    disabled={isSubmitting}
                    required
                  />
                  <label htmlFor="hasAgreed" className="text-sm font-medium cursor-pointer" style={{ color: '#374151' }}>
                    我已詳細閱讀並同意遵守參賽者承諾書的所有條款 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                </div>
              </div>

              {/* Submit Message */}
              {submitMessage && (
                <div
                  className={`p-4 rounded-lg ${
                    submitSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p className={submitSuccess ? 'text-green-800' : 'text-red-800'}>
                    {submitMessage}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting || !hasAgreed}
                  className="px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isSubmitting || !hasAgreed ? '#9ca3af' : '#1a3a6e',
                    color: 'white',
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
