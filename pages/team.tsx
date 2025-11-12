import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthContext } from '../lib/user/AuthContext';
import { RequestHelper } from '../lib/request-helper';
import CommitmentContent from '../components/CommitmentContent';
import { linkifyText } from '../lib/utils/linkify';

/**
 * Team Edit Page (Simplified)
 *
 * Features:
 * - Edit team name
 * - Edit ALL team members (including team leader in the list)
 * - Each member has a role and edit permission flag
 * - Select multiple tracks to participate in
 * - This page is ONLY for editing existing teams
 */

interface Track {
  id: string;
  name: string;
  description?: string;
  sponsorName?: string;
  trackId?: string;
  totalPrize?: number;
  challenges?: Array<{
    id: string;
    title: string;
    description?: string;
    prizes?: any;
    submissionRequirements?: string;
  }>;
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
  const { isSignedIn, hasProfile, user, profile, loading } = useAuthContext();

  // Edit mode detection
  const editTeamId = router.query.edit as string | undefined;
  const isEditMode = !!editTeamId;

  // Form states
  const [teamName, setTeamName] = useState('');
  const [myEmail, setMyEmail] = useState('');
  const [myRole, setMyRole] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [showCommitment, setShowCommitment] = useState(false);

  // Wallet address states
  const [evmWalletAddress, setEvmWalletAddress] = useState('');
  const [otherWallets, setOtherWallets] = useState<Array<{ chain: string; address: string }>>([]);
  const [newWallet, setNewWallet] = useState({ chain: '', address: '' });

  // Registration deadline check
  const REGISTRATION_DEADLINE = new Date('2025-10-29T23:59:00+08:00');
  const isRegistrationClosed = new Date() > REGISTRATION_DEADLINE;

  // Data states
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set());
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // PDF upload states (for Demo Day track)
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfDeleting, setPdfDeleting] = useState(false);
  const [pdfMessage, setPdfMessage] = useState('');
  const [submittedPdf, setSubmittedPdf] = useState<{
    fileUrl: string;
    fileName: string;
    uploadedAt: any;
    uploadedBy: string;
  } | null>(null);

  // Redirect if not authenticated (wait for loading to complete)
  useEffect(() => {
    if (!loading && (!isSignedIn || !hasProfile)) {
      // Redirect to info page for non-authenticated users
      router.push('/team-register-info');
    }
  }, [loading, isSignedIn, hasProfile, router]);

  // Fetch tracks immediately when auth is ready
  useEffect(() => {
    if (!loading && isSignedIn && user?.token) {
      fetchTracks();
    }
  }, [loading, isSignedIn, user?.token]);

  // Extract email from profile when it's ready
  useEffect(() => {
    if (profile || user) {
      const email =
        (profile as any)?.user?.preferredEmail ||
        (profile as any)?.preferredEmail ||
        (profile as any)?.user?.email ||
        (user as any)?.email ||
        (profile as any)?.email ||
        (user as any)?.user?.email ||
        '';

      if (email) {
        setMyEmail(email);
      }
    }
  }, [profile, user]);

  // Load team data in edit mode
  useEffect(() => {
    if (isEditMode && editTeamId && user?.token && !isLoadingTeam) {
      loadTeamData(editTeamId);
    }
  }, [isEditMode, editTeamId, user?.token]);

  const loadTeamData = async (teamId: string) => {
    if (!user?.token) return;

    try {
      setIsLoadingTeam(true);
      console.log('[TeamRegister] Loading team data for edit:', teamId);

      const response = await RequestHelper.get<any>(`/api/team-register/${teamId}`, {
        headers: { Authorization: user.token },
      });

      if (response.data?.error) {
        setSubmitMessage('載入團隊資料失敗：' + response.data.error);
        return;
      }

      const teamData = response.data.data;
      console.log('[TeamRegister] Loaded team data:', teamData);

      // Populate form
      setTeamName(teamData.teamName || '');

      // For /team page: Include team leader in the members list
      const allMembers = teamData.teamMembers || [];
      if (teamData.teamLeader) {
        // Add leader as the first member
        const leaderMember: TeamMember = {
          email: teamData.teamLeader.email,
          role: teamData.teamLeader.role || '',
          hasEditRight: true, // Leader always has edit rights
          isValid: true,
          name: teamData.teamLeader.name || '',
        };
        setTeamMembers([leaderMember, ...allMembers]);
      } else {
        setTeamMembers(allMembers);
      }

      setSelectedTracks(teamData.tracks?.map((t: any) => t.id) || []);
      setSubmittedPdf(teamData.submittedPdf || null);
      setHasAgreed(true); // Auto-agree for edit mode

      // Load wallet addresses
      setEvmWalletAddress(teamData.evmWalletAddress || '');
      setOtherWallets(teamData.otherWallets || []);
    } catch (err: any) {
      console.error('[TeamRegister] Load error:', err);
      setSubmitMessage('載入團隊資料失敗：' + (err.message || '未知錯誤'));
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const fetchTracks = async (forceRefresh: boolean = false) => {
    if (!user?.token) {
      return;
    }

    setIsLoadingTracks(true);
    try {
      // Add cache-busting parameter to get fresh data
      const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
      const response = await RequestHelper.get<{ data: Track[] }>(`/api/tracks/all${cacheBuster}`, {
        headers: {
          Authorization: user.token,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if ((response as any).error) {
        console.error('[TeamRegister] Failed to fetch tracks:', (response as any).error);
        setTracks([]);
        return;
      }

      const tracksData = response.data?.data || response.data || [];
      if (Array.isArray(tracksData)) {
        setTracks(tracksData);

        // Auto-select all tracks by default (only for new registration, not edit mode)
        if (!isEditMode && tracksData.length > 0) {
          const allTrackIds = tracksData.map((track: Track) => track.id);
          setSelectedTracks(allTrackIds);
          console.log('[TeamRegister] Auto-selected all tracks:', allTrackIds);
        }
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

  // Refresh tracks data
  const handleRefreshTracks = () => {
    fetchTracks(true);
  };

  // Toggle track selection
  const toggleTrack = (trackId: string) => {
    setSelectedTracks((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId],
    );
  };

  // Toggle track expansion
  const toggleTrackExpand = (trackId: string) => {
    setExpandedTracks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  // Handle PDF upload (for Demo Day track)
  const handlePdfUpload = async (file: File) => {
    if (!user?.token || !editTeamId) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setPdfMessage('請上傳 PDF 文件');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setPdfMessage('文件大小不能超過 10MB');
      return;
    }

    try {
      setPdfUploading(true);
      setPdfMessage('上傳中...');

      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('teamId', editTeamId);
      formData.append('teamName', teamName);

      const response = await fetch('/api/team-pdf/upload', {
        method: 'POST',
        headers: {
          Authorization: user.token,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setPdfMessage(data.error || '上傳失敗');
        return;
      }

      setPdfMessage('上傳成功！已發送通知郵件給管理員。');
      setSubmittedPdf({
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        uploadedAt: new Date(),
        uploadedBy: myEmail,
      });

      // Clear message after 3 seconds
      setTimeout(() => {
        setPdfMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('[PDF Upload] Error:', error);
      setPdfMessage('上傳失敗：' + error.message);
    } finally {
      setPdfUploading(false);
    }
  };

  // Handle PDF delete
  const handlePdfDelete = async () => {
    if (!user?.token || !editTeamId) return;

    if (!confirm('確定要刪除已提交的 PDF 嗎？刪除後可以重新上傳。')) {
      return;
    }

    try {
      setPdfDeleting(true);

      const response = await fetch('/api/team-pdf/delete', {
        method: 'DELETE',
        headers: {
          Authorization: user.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId: editTeamId }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert('刪除失敗：' + (data.error || '未知錯誤'));
        return;
      }

      setPdfMessage('PDF 已刪除');
      setSubmittedPdf(null);

      // Clear message after 3 seconds
      setTimeout(() => {
        setPdfMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('[PDF Delete] Error:', error);
      alert('刪除失敗：' + error.message);
    } finally {
      setPdfDeleting(false);
    }
  };

  // Format prize display
  const formatPrizes = (prizes: any): string => {
    if (!prizes) return '未設定';

    if (typeof prizes === 'string') {
      return prizes;
    }

    if (Array.isArray(prizes) && prizes.length > 0) {
      if (typeof prizes[0] === 'object' && prizes[0].amount !== undefined) {
        // New structured format
        return prizes
          .map(
            (p: any) =>
              `${p.currency === 'TWD' ? '台幣' : 'USD'} ${p.amount.toLocaleString()} ${
                p.description
              }`,
          )
          .join('，');
      } else {
        // Old format: array of strings
        return prizes.join(', ');
      }
    }

    if (typeof prizes === 'number') {
      return prizes.toLocaleString();
    }

    return '未設定';
  };

  // State for new member being added
  const [newMember, setNewMember] = useState({ email: '', role: '', hasEditRight: false });
  const [isValidatingMember, setIsValidatingMember] = useState(false);
  const [memberValidationError, setMemberValidationError] = useState('');

  // Add new team member (with email validation)
  const addTeamMember = async () => {
    if (!newMember.email.trim() || !newMember.role.trim()) {
      return;
    }

    // Basic email format validation
    if (!validateEmail(newMember.email)) {
      setMemberValidationError('Email 格式不正確');
      return;
    }

    // Check for duplicate email in current team members
    const normalizedEmail = newMember.email.trim().toLowerCase();
    if (teamMembers.some((m) => m.email.toLowerCase() === normalizedEmail)) {
      setMemberValidationError('此 Email 已在團隊成員列表中');
      return;
    }

    // Validate email with backend
    setIsValidatingMember(true);
    setMemberValidationError('');

    try {
      if (!user?.token) {
        setMemberValidationError('請先登入');
        setIsValidatingMember(false);
        return;
      }

      const response = (await RequestHelper.post(
        '/api/team-register/validate-email',
        { headers: { Authorization: user.token } },
        { email: normalizedEmail },
      )) as any;

      const data = response.data || response;

      if (data.isValid) {
        // Email is registered, add to team members
        setTeamMembers([
          ...teamMembers,
          {
            email: newMember.email.trim(),
            role: newMember.role.trim(),
            hasEditRight: newMember.hasEditRight,
          },
        ]);
        // Reset new member form
        setNewMember({ email: '', role: '', hasEditRight: false });
        setMemberValidationError('');
      } else {
        setMemberValidationError('此 Email 尚未註冊');
      }
    } catch (error: any) {
      console.error('[AddTeamMember] Validation error:', error);
      setMemberValidationError('驗證失敗，請稍後再試');
    } finally {
      setIsValidatingMember(false);
    }
  };

  // Remove team member
  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  // Basic email validation
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.token) {
      setSubmitMessage('請先登入');
      setSubmitSuccess(false);
      return;
    }

    // This page is ONLY for editing, not for creating new teams
    if (!isEditMode || !editTeamId) {
      setSubmitMessage('此頁面僅供編輯現有團隊');
      setSubmitSuccess(false);
      return;
    }

    // Validation
    if (!teamName.trim()) {
      setSubmitMessage('請輸入團隊名稱');
      setSubmitSuccess(false);
      return;
    }

    if (teamMembers.length === 0) {
      setSubmitMessage('至少需要一位團隊成員（包括團隊報名者）');
      setSubmitSuccess(false);
      return;
    }

    // Validate all team members (backend will validate if emails are registered)
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
    }

    // Check for duplicate emails
    const emails = teamMembers.map((m) => m.email.toLowerCase());
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      setSubmitMessage('團隊成員 Email 不能重複');
      setSubmitSuccess(false);
      return;
    }

    // Only validate tracks and commitment if registration is still open
    if (!isRegistrationClosed) {
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
    }

    // Submit
    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitSuccess(false);

    try {
      // The first member in the list is the team leader
      const leader = teamMembers[0];
      const members = teamMembers.slice(1); // Rest are regular members

      const requestData = {
        teamName: teamName.trim(),
        teamMembers: members.map((m) => ({
          email: m.email.trim(),
          name: m.name,
          role: m.role.trim(),
          hasEditRight: m.hasEditRight,
        })),
        tracks: selectedTracks,
        evmWalletAddress: evmWalletAddress.trim(),
        otherWallets: otherWallets.filter((w) => w.chain.trim() && w.address.trim()),
      };

      // Update existing team
      console.log('[Team Edit] Updating team:', editTeamId);
      const response = await RequestHelper.put(
        `/api/team-register/${editTeamId}`,
        { headers: { Authorization: user.token } },
        requestData,
      );

      if ((response as any).error || response.data?.error) {
        setSubmitMessage((response as any).error || response.data?.error || '更新失敗，請稍後再試');
        setSubmitSuccess(false);
      } else {
        setSubmitMessage('更新成功！');
        setSubmitSuccess(true);

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      }
    } catch (error: any) {
      console.error('[TeamRegister] Submission error:', error);
      setSubmitMessage(error.message || '提交失敗，請稍後再試');
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="inline-block animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="mt-4 text-gray-600">載入中...</p>
      </div>
    );
  }

  // Redirect happening, show nothing
  if (!isSignedIn || !hasProfile) {
    return null;
  }

  return (
    <>
      <Head>
        <title>編輯團隊 - RWA 黑客松</title>
        <meta name="description" content="編輯黑客松團隊資料" />
      </Head>

      <div className="flex flex-col flex-grow" style={{ backgroundColor: '#0f1419' }}>
        <div className="min-h-screen" style={{ backgroundColor: '#0f1419' }}>
          <div className="max-w-5xl mx-auto px-4 py-20">
            {/* Title */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-left mb-4" style={{ color: '#ffffff' }}>
                編輯團隊
              </h1>
              <p className="text-lg" style={{ color: '#9ca3af' }}>
                更新您的團隊資訊、成員和參賽賽道
              </p>
              {isEditMode && editTeamId && (
                <p className="text-xs text-gray-400 mt-2">團隊 ID: {editTeamId}</p>
              )}
            </div>

            {/* Registration Deadline Notice - At Top */}
            {!isRegistrationClosed && (
              <div
                className="mb-8 flex items-start gap-2 p-4 rounded-lg"
                style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: '#92400e' }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm" style={{ color: '#92400e' }}>
                  <span className="font-semibold">報名截止日期：2025年10月29日 23:59</span>
                  <br />
                  截止前您可以隨時編輯或更改報名資料。
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Team Name */}
              <div
                className="rounded-lg p-8 shadow-lg"
                style={{ backgroundColor: '#1a2332', border: '1px solid #2d3748' }}
              >
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#ffffff' }}>
                  團隊資訊
                </h2>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#e5e7eb' }}>
                    團隊名稱 <span style={{ color: '#ef4444' }}>*</span>
                    <span className="text-xs text-gray-500 ml-2">({teamName.length}/30)</span>
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    maxLength={30}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: '#4b5563', backgroundColor: '#0f1419', color: '#ffffff' }}
                    placeholder="例如：創新者聯盟"
                    disabled={isSubmitting}
                    required
                  />
                  {teamName.length >= 30 && (
                    <p className="text-xs text-orange-600 mt-1">已達到最大字數限制</p>
                  )}
                </div>
              </div>

              {/* Team Members - Including Team Leader */}
              <div
                className="rounded-lg p-8 shadow-lg"
                style={{ backgroundColor: '#1a2332', border: '1px solid #2d3748' }}
              >
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#ffffff' }}>
                  團隊成員
                </h2>

                {/* 已添加的成員列表 - First member is the team leader */}
                <div className="space-y-3 mb-6">
                  {teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 rounded-lg"
                      style={{
                        backgroundColor: index === 0 ? '#1a2332' : '#1a2332',
                        border: index === 0 ? '2px solid #1a3a6e' : '1px solid #374151',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          {index === 0 && (
                            <span
                              className="text-xs px-2 py-1 rounded font-bold"
                              style={{ backgroundColor: '#1a3a6e', color: '#ffffff' }}
                            >
                              團隊報名者
                            </span>
                          )}
                          <span className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                            {member.email}
                          </span>
                          <span
                            className="text-sm px-2 py-1 rounded"
                            style={{ backgroundColor: '#1a3a6e', color: '#d1d5db' }}
                          >
                            {member.role}
                          </span>
                          {member.hasEditRight && (
                            <span
                              className="text-xs px-2 py-1 rounded"
                              style={{ backgroundColor: '#10403b', color: '#d1d5db' }}
                            >
                              ✓ 可編輯
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTeamMember(index)}
                        className="text-sm px-3 py-1 rounded hover:bg-red-100 flex-shrink-0"
                        style={{ color: '#dc2626' }}
                        disabled={isSubmitting || index === 0}
                        title={index === 0 ? '無法刪除團隊報名者' : '刪除此成員'}
                      >
                        {index === 0 ? '🔒' : '刪除'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* 添加新成員的輸入區域 */}
                <div
                  className="space-y-4 p-4 rounded-lg"
                  style={{ backgroundColor: '#1a2332', border: '2px dashed #374151' }}
                >
                  <div className="text-sm font-medium mb-3" style={{ color: '#9ca3af' }}>
                    + 新增成員
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e5e7eb' }}>
                      Email <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => {
                        setNewMember({ ...newMember, email: e.target.value });
                        setMemberValidationError(''); // Clear error when typing
                      }}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        borderColor: memberValidationError ? '#dc2626' : '#d1d5db',
                        backgroundColor: '#ffffff',
                      }}
                      placeholder="member@example.com"
                      disabled={isSubmitting || isValidatingMember}
                    />
                    {memberValidationError ? (
                      <div
                        className="mt-1 text-xs flex items-center gap-1"
                        style={{ color: '#dc2626' }}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {memberValidationError}
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-gray-500">成員必須已註冊本平台</div>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e5e7eb' }}>
                      角色 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: '#d1d5db', backgroundColor: '#ffffff' }}
                      disabled={isSubmitting || isValidatingMember}
                    >
                      <option value="">請選擇角色</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Edit Right */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="newMemberEditRight"
                      checked={newMember.hasEditRight}
                      onChange={(e) =>
                        setNewMember({ ...newMember, hasEditRight: e.target.checked })
                      }
                      className="w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
                      style={{ accentColor: '#1a3a6e' }}
                      disabled={isSubmitting || isValidatingMember}
                    />
                    <label
                      htmlFor="newMemberEditRight"
                      className="text-sm"
                      style={{ color: '#e5e7eb' }}
                    >
                      擁有編輯報名資料的權限
                    </label>
                  </div>

                  {/* 添加按鈕 */}
                  <button
                    type="button"
                    onClick={addTeamMember}
                    className="w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    style={{
                      backgroundColor:
                        newMember.email.trim() && newMember.role.trim() && !isValidatingMember
                          ? '#1a3a6e'
                          : '#9ca3af',
                      color: 'white',
                      cursor:
                        newMember.email.trim() && newMember.role.trim() && !isValidatingMember
                          ? 'pointer'
                          : 'not-allowed',
                    }}
                    onMouseEnter={(e) => {
                      if (newMember.email.trim() && newMember.role.trim() && !isValidatingMember) {
                        e.currentTarget.style.backgroundColor = '#2a4a7e';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (newMember.email.trim() && newMember.role.trim() && !isValidatingMember) {
                        e.currentTarget.style.backgroundColor = '#1a3a6e';
                      }
                    }}
                    disabled={
                      isSubmitting ||
                      isValidatingMember ||
                      !newMember.email.trim() ||
                      !newMember.role.trim()
                    }
                  >
                    {isValidatingMember && (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    )}
                    {isValidatingMember ? '驗證中...' : '添加成員'}
                  </button>
                </div>
              </div>

              {/* Select Tracks */}
              {!isRegistrationClosed && (
                <div
                  className="rounded-lg p-8 shadow-lg"
                  style={{ backgroundColor: '#1a2332', border: '1px solid #2d3748' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                      選擇賽道 <span style={{ color: '#ef4444' }}>*</span>
                    </h2>
                    <button
                      type="button"
                      onClick={handleRefreshTracks}
                      disabled={isLoadingTracks}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: isLoadingTracks ? '#9ca3af' : '#1a3a6e',
                        color: '#ffffff',
                        cursor: isLoadingTracks ? 'not-allowed' : 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoadingTracks) {
                          e.currentTarget.style.backgroundColor = '#2a4a7e';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoadingTracks) {
                          e.currentTarget.style.backgroundColor = '#1a3a6e';
                        }
                      }}
                    >
                      <svg
                        className={`w-4 h-4 ${isLoadingTracks ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {isLoadingTracks ? '刷新中...' : '刷新'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    請選擇您的團隊想要參加的賽道（可多選）。之後上傳交付物時，您再選擇具體的挑戰。
                  </p>

                  {isLoadingTracks ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                      <p className="mt-4 text-gray-600">載入賽道中...</p>
                    </div>
                  ) : tracks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">目前沒有可用的賽道</div>
                  ) : (
                    <div className="space-y-3">
                      {tracks.map((track) => {
                        const isExpanded = expandedTracks.has(track.id);
                        return (
                          <div
                            key={track.id}
                            className="border-2 rounded-lg transition-all"
                            style={{
                              borderColor: selectedTracks.includes(track.id)
                                ? '#1a3a6e'
                                : '#e5e7eb',
                              backgroundColor: selectedTracks.includes(track.id)
                                ? '#f0f4ff'
                                : 'transparent',
                            }}
                          >
                            {/* Track Header */}
                            <div className="flex items-start gap-3 p-4">
                              <input
                                type="checkbox"
                                checked={selectedTracks.includes(track.id)}
                                onChange={() => toggleTrack(track.id)}
                                disabled={isSubmitting}
                                className="mt-1 w-5 h-5 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                style={{ accentColor: '#1a3a6e' }}
                              />
                              <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                  <a
                                    href={`/tracks/${track.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold hover:underline flex items-center gap-1"
                                    style={{ color: '#1a3a6e' }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {track.name}
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
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      />
                                    </svg>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => toggleTrackExpand(track.id)}
                                    className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                                    disabled={isSubmitting}
                                  >
                                    <svg
                                      className={`w-5 h-5 transform transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                      style={{ color: '#1a3a6e' }}
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
                                  </button>
                                </div>
                                {track.description && (
                                  <div
                                    className="text-sm text-gray-600 mt-1"
                                    style={{
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word',
                                      lineHeight: '1.75',
                                    }}
                                  >
                                    {linkifyText(track.description, '#2563eb')}
                                  </div>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  {track.sponsorName && (
                                    <div className="text-gray-500">贊助商：{track.sponsorName}</div>
                                  )}
                                  {track.totalPrize !== undefined && track.totalPrize > 0 && (
                                    <div className="font-medium" style={{ color: '#059669' }}>
                                      💰 總獎金:{' '}
                                      {track.totalPrize >= 1000
                                        ? `${(track.totalPrize / 1000).toFixed(1)}k`
                                        : track.totalPrize}{' '}
                                      USD
                                    </div>
                                  )}
                                  {track.challenges && track.challenges.length > 0 && (
                                    <div className="text-gray-500">
                                      {track.challenges.length} 個挑戰
                                    </div>
                                  )}
                                </div>

                                {/* Demo Day PDF Upload - Show directly in card when selected */}
                                {(track.name === 'Demo Day' ||
                                  track.name?.toLowerCase().includes('demo') ||
                                  track.name?.toLowerCase().includes('簡報')) &&
                                  selectedTracks.includes(track.id) &&
                                  editTeamId && (
                                    <div
                                      className="mt-4 p-3 rounded-lg border"
                                      style={{
                                        backgroundColor: submittedPdf ? '#f0fdf4' : '#fef3c7',
                                        borderColor: submittedPdf ? '#86efac' : '#fcd34d',
                                      }}
                                    >
                                      <div className="flex items-start gap-3">
                                        <span className="text-2xl mt-0.5">
                                          {submittedPdf ? '✅' : '📄'}
                                        </span>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between mb-2">
                                            <span
                                              className="text-sm font-semibold"
                                              style={{
                                                color: submittedPdf ? '#166534' : '#92400e',
                                              }}
                                            >
                                              Demo Day 申請文件
                                            </span>
                                            {submittedPdf && (
                                              <span
                                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                style={{
                                                  backgroundColor: '#dcfce7',
                                                  color: '#166534',
                                                }}
                                              >
                                                已提交
                                              </span>
                                            )}
                                          </div>

                                          {submittedPdf ? (
                                            <div className="space-y-2">
                                              {/* File info */}
                                              <div className="text-xs space-y-1">
                                                <div className="flex items-start gap-2">
                                                  <span
                                                    className="font-medium"
                                                    style={{ color: '#166534', minWidth: '60px' }}
                                                  >
                                                    檔案名稱：
                                                  </span>
                                                  <span className="text-gray-700 break-all">
                                                    {submittedPdf.fileName}
                                                  </span>
                                                </div>
                                                {submittedPdf.uploadedBy && (
                                                  <div className="flex items-start gap-2">
                                                    <span
                                                      className="font-medium"
                                                      style={{ color: '#166534', minWidth: '60px' }}
                                                    >
                                                      上傳者：
                                                    </span>
                                                    <span className="text-gray-700">
                                                      {submittedPdf.uploadedBy}
                                                    </span>
                                                  </div>
                                                )}
                                                {submittedPdf.uploadedAt && (
                                                  <div className="flex items-start gap-2">
                                                    <span
                                                      className="font-medium"
                                                      style={{ color: '#166534', minWidth: '60px' }}
                                                    >
                                                      上傳時間：
                                                    </span>
                                                    <span className="text-gray-700">
                                                      {new Date(
                                                        submittedPdf.uploadedAt,
                                                      ).toLocaleString('zh-TW', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                        hour12: false,
                                                      })}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Action buttons */}
                                              <div className="flex gap-2 pt-1">
                                                <a
                                                  href={submittedPdf.fileUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs px-3 py-1.5 rounded font-medium border"
                                                  style={{
                                                    borderColor: '#1a3a6e',
                                                    color: '#1a3a6e',
                                                    backgroundColor: 'white',
                                                  }}
                                                >
                                                  📎 查看檔案
                                                </a>
                                                <button
                                                  type="button"
                                                  onClick={handlePdfDelete}
                                                  disabled={pdfDeleting}
                                                  className="text-xs px-3 py-1.5 rounded font-medium"
                                                  style={{
                                                    backgroundColor: pdfDeleting
                                                      ? '#9ca3af'
                                                      : '#dc2626',
                                                    color: 'white',
                                                    opacity: pdfDeleting ? 0.6 : 1,
                                                    cursor: pdfDeleting ? 'not-allowed' : 'pointer',
                                                  }}
                                                >
                                                  {pdfDeleting ? '刪除中...' : '🗑️ 刪除檔案'}
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div>
                                              <p
                                                className="text-xs mb-2"
                                                style={{ color: '#92400e' }}
                                              >
                                                請上傳您的 Demo Day 申請文件（PDF 格式，最大 10MB）
                                              </p>
                                              <label
                                                htmlFor="demo-day-pdf-upload-inline"
                                                className="cursor-pointer text-xs px-4 py-2 rounded font-medium inline-flex items-center gap-2"
                                                style={{
                                                  backgroundColor: pdfUploading
                                                    ? '#9ca3af'
                                                    : '#1a3a6e',
                                                  color: 'white',
                                                  opacity: pdfUploading ? 0.6 : 1,
                                                  cursor: pdfUploading ? 'not-allowed' : 'pointer',
                                                }}
                                              >
                                                {pdfUploading ? '⏳ 上傳中...' : '📤 上傳 PDF'}
                                              </label>
                                              <input
                                                id="demo-day-pdf-upload-inline"
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                disabled={pdfUploading}
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    handlePdfUpload(file);
                                                  }
                                                  e.target.value = '';
                                                }}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {pdfMessage && (
                                        <div
                                          className="mt-3 text-xs text-center p-2 rounded"
                                          style={{
                                            backgroundColor: pdfMessage.includes('成功')
                                              ? '#dcfce7'
                                              : '#fee2e2',
                                            color: pdfMessage.includes('成功')
                                              ? '#166534'
                                              : '#991b1b',
                                          }}
                                        >
                                          {pdfMessage}
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>

                            {/* Expanded Track Details */}
                            {isExpanded && (
                              <div
                                className="px-4 pb-4 border-t"
                                style={{ borderColor: '#e5e7eb' }}
                              >
                                {/* Demo Day PDF Upload Section */}
                                {(track.name === 'Demo Day' ||
                                  track.name?.toLowerCase().includes('demo') ||
                                  track.name?.toLowerCase().includes('簡報')) &&
                                  selectedTracks.includes(track.id) &&
                                  editTeamId && (
                                    <div
                                      className="mt-4 mb-4 p-4 rounded-lg"
                                      style={{ backgroundColor: '#fef3c7' }}
                                    >
                                      <h4
                                        className="font-medium text-sm mb-3"
                                        style={{ color: '#92400e' }}
                                      >
                                        📄 Demo Day 申請文件
                                      </h4>
                                      <p className="text-xs mb-3" style={{ color: '#92400e' }}>
                                        參加 Demo Day 賽道需要提交 PDF 文件
                                      </p>

                                      {submittedPdf ? (
                                        <div className="bg-white border border-green-500 rounded-lg p-4">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <svg
                                                className="w-8 h-8 text-green-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                              </svg>
                                              <div>
                                                <div className="font-medium text-green-800">
                                                  已提交
                                                </div>
                                                <div className="text-sm text-green-700">
                                                  文件：{submittedPdf.fileName}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <a
                                                href={submittedPdf.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 rounded-lg border-2 font-medium transition-colors text-sm"
                                                style={{ borderColor: '#1a3a6e', color: '#1a3a6e' }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.backgroundColor = '#f0f4ff';
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.backgroundColor =
                                                    'transparent';
                                                }}
                                              >
                                                查看
                                              </a>
                                              <button
                                                type="button"
                                                onClick={handlePdfDelete}
                                                disabled={pdfDeleting}
                                                className="px-3 py-1.5 rounded-lg font-medium transition-colors text-sm"
                                                style={{
                                                  backgroundColor: pdfDeleting
                                                    ? '#9ca3af'
                                                    : '#dc2626',
                                                  color: 'white',
                                                  cursor: pdfDeleting ? 'not-allowed' : 'pointer',
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (!pdfDeleting)
                                                    e.currentTarget.style.backgroundColor =
                                                      '#b91c1c';
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (!pdfDeleting)
                                                    e.currentTarget.style.backgroundColor =
                                                      '#dc2626';
                                                }}
                                              >
                                                {pdfDeleting ? '刪除中...' : '刪除'}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
                                          <div className="text-center">
                                            <svg
                                              className="mx-auto h-12 w-12 text-gray-400"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                              />
                                            </svg>
                                            <div className="mt-2">
                                              <label
                                                htmlFor="demo-day-pdf-upload"
                                                className="cursor-pointer inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors"
                                                style={{
                                                  backgroundColor: pdfUploading
                                                    ? '#9ca3af'
                                                    : '#1a3a6e',
                                                  color: 'white',
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (!pdfUploading)
                                                    e.currentTarget.style.backgroundColor =
                                                      '#2a4a7e';
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (!pdfUploading)
                                                    e.currentTarget.style.backgroundColor =
                                                      '#1a3a6e';
                                                }}
                                              >
                                                {pdfUploading ? '上傳中...' : '選擇 PDF 文件'}
                                              </label>
                                              <input
                                                id="demo-day-pdf-upload"
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                disabled={pdfUploading}
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    handlePdfUpload(file);
                                                  }
                                                  e.target.value = '';
                                                }}
                                              />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                              僅接受 PDF 格式，最大 10MB
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                              提交後將發送通知郵件給管理員
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                      {/* PDF Message */}
                                      {pdfMessage && (
                                        <div
                                          className="mt-3 p-2 rounded-lg text-sm text-center"
                                          style={{
                                            backgroundColor: pdfMessage.includes('成功')
                                              ? '#d1fae5'
                                              : pdfMessage.includes('刪除')
                                              ? '#fee2e2'
                                              : '#fef3c7',
                                            color: pdfMessage.includes('成功')
                                              ? '#065f46'
                                              : pdfMessage.includes('刪除')
                                              ? '#991b1b'
                                              : '#92400e',
                                          }}
                                        >
                                          {pdfMessage}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                {/* Challenges Section */}
                                {track.challenges && track.challenges.length > 0 && (
                                  <div className="mt-4 space-y-3">
                                    <h4
                                      className="font-medium text-sm"
                                      style={{ color: '#1a3a6e' }}
                                    >
                                      包含的挑戰：
                                    </h4>
                                    {track.challenges.map((challenge, idx) => (
                                      <div
                                        key={challenge.id || idx}
                                        className="p-3 rounded-lg"
                                        style={{
                                          backgroundColor: '#f9fafb',
                                          border: '1px solid #e5e7eb',
                                        }}
                                      >
                                        <div
                                          className="font-medium text-sm mb-1"
                                          style={{ color: '#1a3a6e' }}
                                        >
                                          {challenge.title}
                                        </div>
                                        {challenge.description && (
                                          <div
                                            className="text-xs text-gray-600 mb-2"
                                            style={{
                                              whiteSpace: 'pre-wrap',
                                              wordBreak: 'break-word',
                                              overflowWrap: 'break-word',
                                              lineHeight: '1.75',
                                            }}
                                          >
                                            {linkifyText(challenge.description, '#2563eb')}
                                          </div>
                                        )}
                                        {challenge.prizes && (
                                          <div
                                            className="text-xs font-medium mb-1"
                                            style={{ color: '#059669' }}
                                          >
                                            💰 {formatPrizes(challenge.prizes)}
                                          </div>
                                        )}
                                        {challenge.submissionRequirements && (
                                          <div
                                            className="text-xs text-gray-500"
                                            style={{
                                              whiteSpace: 'pre-wrap',
                                              wordBreak: 'break-word',
                                              overflowWrap: 'break-word',
                                              lineHeight: '1.75',
                                            }}
                                          >
                                            📋{' '}
                                            {linkifyText(
                                              challenge.submissionRequirements,
                                              '#2563eb',
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
              )}

              {/* Commitment Agreement */}
              {!isRegistrationClosed && (
                <div
                  className="rounded-lg p-8 shadow-lg"
                  style={{ backgroundColor: '#1a2332', border: '1px solid #2d3748' }}
                >
                  <h2 className="text-2xl font-bold mb-6" style={{ color: '#ffffff' }}>
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
                        className={`w-5 h-5 transform transition-transform ${
                          showCommitment ? 'rotate-180' : ''
                        }`}
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
                    </button>
                  </div>

                  {showCommitment && (
                    <div
                      className="mb-6 p-6 border rounded-lg max-h-96 overflow-y-auto"
                      style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}
                    >
                      <CommitmentContent />
                      <div
                        className="mt-6 pt-4 border-t text-center"
                        style={{ borderColor: '#e5e7eb' }}
                      >
                        <Link href="/commitment">
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline inline-flex items-center gap-1"
                            style={{ color: '#1a3a6e' }}
                          >
                            在新視窗中開啟完整內容
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
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </Link>
                      </div>
                    </div>
                  )}

                  <div
                    className="flex items-start gap-2 p-3 rounded-lg"
                    style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: '#92400e' }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
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
                    <label
                      htmlFor="hasAgreed"
                      className="text-sm font-medium cursor-pointer"
                      style={{ color: '#e5e7eb' }}
                    >
                      我已詳細閱讀並同意遵守參賽者承諾書的所有條款{' '}
                      <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Wallet Addresses */}
              <div
                className="rounded-lg p-8 shadow-lg"
                style={{ backgroundColor: '#1a2332', border: '1px solid #2d3748' }}
              >
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#ffffff' }}>
                  錢包地址
                </h2>

                {/* EVM Wallet Address */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#e5e7eb' }}>
                    EVM 錢包地址
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    支援 Ethereum、Arbitrum 等 EVM 兼容鏈
                  </p>
                  <input
                    type="text"
                    value={evmWalletAddress}
                    onChange={(e) => setEvmWalletAddress(e.target.value)}
                    placeholder="0x..."
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: '#e5e7eb' }}
                  />
                </div>

                {/* Other Wallet Addresses */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#e5e7eb' }}>
                    其他錢包地址
                  </label>

                  {/* Existing Wallets List */}
                  {otherWallets.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {otherWallets.map((wallet, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg"
                          style={{ backgroundColor: '#1a2332', border: '1px solid #374151' }}
                        >
                          <div className="flex-grow">
                            <div className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
                              {wallet.chain}
                            </div>
                            <div className="text-sm text-gray-600 break-all">{wallet.address}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setOtherWallets(otherWallets.filter((_, i) => i !== index));
                            }}
                            disabled={isSubmitting}
                            className="flex-shrink-0 p-2 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                            style={{ color: '#ef4444' }}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Wallet */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newWallet.chain}
                          onChange={(e) => setNewWallet({ ...newWallet, chain: e.target.value })}
                          placeholder="鏈名（例如：BTC、Solana、Sui...）"
                          disabled={isSubmitting}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ borderColor: '#e5e7eb' }}
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newWallet.address}
                          onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                          placeholder="錢包地址"
                          disabled={isSubmitting}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ borderColor: '#e5e7eb' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (newWallet.chain.trim() && newWallet.address.trim()) {
                            setOtherWallets([...otherWallets, { ...newWallet }]);
                            setNewWallet({ chain: '', address: '' });
                          }
                        }}
                        disabled={
                          isSubmitting || !newWallet.chain.trim() || !newWallet.address.trim()
                        }
                        className="px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor:
                            newWallet.chain.trim() && newWallet.address.trim()
                              ? '#1a3a6e'
                              : '#9ca3af',
                          color: '#ffffff',
                          cursor:
                            newWallet.chain.trim() && newWallet.address.trim()
                              ? 'pointer'
                              : 'not-allowed',
                        }}
                        onMouseEnter={(e) => {
                          if (newWallet.chain.trim() && newWallet.address.trim()) {
                            e.currentTarget.style.backgroundColor = '#2a4a7e';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (newWallet.chain.trim() && newWallet.address.trim()) {
                            e.currentTarget.style.backgroundColor = '#1a3a6e';
                          }
                        }}
                      >
                        + 新增錢包地址
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Message */}
              {submitMessage && (
                <div
                  className={`p-4 rounded-lg ${
                    submitSuccess
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p className={submitSuccess ? 'text-green-800' : 'text-red-800'}>
                    {submitMessage}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center gap-4">
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => router.push('/profile')}
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-lg border-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: '#d1d5db',
                      color: '#374151',
                    }}
                  >
                    取消
                  </button>
                )}
                <button
                  type="submit"
                  disabled={
                    isSubmitting || (!isEditMode && !hasAgreed) || (isEditMode && isLoadingTeam)
                  }
                  className="px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor:
                      isSubmitting || (!isEditMode && !hasAgreed) || (isEditMode && isLoadingTeam)
                        ? '#9ca3af'
                        : '#1a3a6e',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && (isEditMode || hasAgreed) && !isLoadingTeam) {
                      e.currentTarget.style.backgroundColor = '#2a4a7e';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting && (isEditMode || hasAgreed) && !isLoadingTeam) {
                      e.currentTarget.style.backgroundColor = '#1a3a6e';
                    }
                  }}
                >
                  {isSubmitting
                    ? isEditMode
                      ? '更新中...'
                      : '提交中...'
                    : isEditMode
                    ? '保存修改'
                    : '提交報名'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
