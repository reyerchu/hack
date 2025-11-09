import { useRouter } from 'next/router';
import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../lib/user/AuthContext';
import QRCode from '../components/dashboardComponents/QRCode';
import { RequestHelper } from '../lib/request-helper';
import type { TeamNeed } from '../lib/teamUp/types';
import MyNeedsList from '../components/teamUp/dashboard/MyNeedsList';
import MyApplicationsList from '../components/teamUp/dashboard/MyApplicationsList';
import TeamManagement from '../components/TeamManagement';
import { emailToHash } from '../lib/utils/email-hash';

/**
 * A page that allows a user to modify app or profile settings and see their data.
 *
 * Route: /profile
 */
type TabType = 'profile' | 'teamup-needs' | 'teamup-applications' | 'my-teams';

export default function ProfilePage() {
  const router = useRouter();
  const { isSignedIn, hasProfile, user, profile, updateProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // 從 URL 參數中讀取 tab
    const { tab } = router.query;
    if (tab === 'teamup-needs' || tab === 'teamup-applications') {
      return tab as TabType;
    }
    return 'profile';
  });
  const [isEditing, setIsEditing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    teamStatus: '',
    github: '',
    linkedin: '',
    website: '',
    evmAddress: '',
    walletAddresses: [] as Array<{ chainName: string; address: string }>,
  });
  const [myNeeds, setMyNeeds] = useState<TeamNeed[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [isLoadingNeeds, setIsLoadingNeeds] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<{ [key: string]: boolean }>({});
  const [stats, setStats] = useState<any>(null);
  
  // 直接檢查數據庫中的註冊狀態，而不依賴 hasProfile
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  // 隱私設置狀態
  const [privacySettings, setPrivacySettings] = useState({
    showName: false,
    showEmail: false,
    showRole: false,
    showSchool: false,
    showGithub: false,
    showLinkedin: false,
    showPhone: false,
    showWebsite: false,
    showResume: false,
    showEvmAddress: false,
    showWalletAddresses: false,
  });
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  // 多文件履历状态
  const [resumeFiles, setResumeFiles] = useState<any[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // 獲取用戶隱私設置
  const fetchPrivacySettings = useCallback(async () => {
    if (!user?.token) {
      console.log('[fetchPrivacySettings] No user token, skipping');
      return;
    }

    setIsLoadingPrivacy(true);
    try {
      const response = await fetch('/api/user/privacy-settings', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setPrivacySettings(data.settings);
          console.log('[fetchPrivacySettings] Privacy settings loaded:', data.settings);
        } else {
          console.log('[fetchPrivacySettings] No settings in response, using defaults');
        }
      } else {
        console.warn('[fetchPrivacySettings] Response not ok:', response.status);
      }
    } catch (error) {
      console.error('[fetchPrivacySettings] Error:', error);
      // 使用默認設置
    } finally {
      setIsLoadingPrivacy(false);
    }
  }, [user?.token]);

  const handleEditClick = async () => {
    if (!profile || !profile.user) {
      console.error('[handleEditClick] Profile not loaded');
      return;
    }

    setEditData({
      firstName: profile.user.firstName || '',
      lastName: profile.user.lastName || '',
      nickname: profile.nickname || '',
      teamStatus: profile.teamStatus || '',
      github: profile.github || '',
      linkedin: profile.linkedin || '',
      website: profile.website || '',
      evmAddress: profile.evmAddress || '',
      walletAddresses: profile.walletAddresses || [],
    });

    // 加載隱私設置
    try {
      await fetchPrivacySettings();
    } catch (error) {
      console.error('[handleEditClick] Failed to load privacy settings:', error);
      // 即使隱私設置加載失敗，也允許編輯
    }

    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setResumeFile(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('檔案大小不能超過 5MB');
        event.target.value = '';
        return;
      }
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        alert('只接受 PDF、DOC 或 DOCX 格式的檔案');
        event.target.value = '';
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSaveEdit = async () => {
    try {
      let resumeFileName = profile.resume;

      // Upload new resume if provided
      if (resumeFile) {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        formData.append('fileName', `${user.id}_${resumeFile.name}`);
        formData.append('studyLevel', profile.studyLevel || 'Unknown');
        formData.append('major', profile.major || 'Unknown');

        try {
          await fetch('/api/resume/upload', {
            method: 'POST',
            body: formData,
          });
          resumeFileName = `${user.id}_${resumeFile.name}`;
        } catch (uploadError) {
          console.error('Resume upload failed:', uploadError);
          alert('履歷上傳失敗，但其他資料已更新');
        }
      }

      const updatedProfile = {
        ...profile,
        user: {
          ...profile.user,
          firstName: editData.firstName,
          lastName: editData.lastName,
        },
        nickname: editData.nickname,
        teamStatus: editData.teamStatus,
        github: editData.github,
        linkedin: editData.linkedin,
        website: editData.website,
        evmAddress: editData.evmAddress,
        walletAddresses: editData.walletAddresses,
        resume: resumeFileName,
      };

      console.log('[handleSaveEdit] Saving profile:', updatedProfile);

      // 使用正確的 API
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(updatedProfile),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[handleSaveEdit] Save failed:', response.status, errorText);
        throw new Error(`保存失敗 (${response.status}): ${errorText}`);
      }

      const saveResult = await response.json();
      console.log('[handleSaveEdit] Profile save response:', saveResult);

      // 更新本地 profile
      updateProfile(updatedProfile);
      console.log('✅ Profile updated successfully');

      // 保存隱私設置
      console.log('[handleSaveEdit] Saving privacy settings:', privacySettings);
      try {
        const privacyResponse = await fetch('/api/user/privacy-settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ settings: privacySettings }),
        });

        if (privacyResponse.ok) {
          console.log('[handleSaveEdit] ✅ Privacy settings saved successfully');
        } else {
          console.warn('[handleSaveEdit] Privacy settings save failed:', privacyResponse.status);
        }
      } catch (privacyError) {
        console.error('Failed to save privacy settings:', privacyError);
        // 即使隱私設置保存失敗，也繼續
      }

      setIsEditing(false);
      setResumeFile(null);
      alert('個人資料更新成功！');
    } catch (error: any) {
      console.error('[handleSaveEdit] Error updating profile:', error);
      console.error('[handleSaveEdit] Error details:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response,
      });
      alert('更新失敗，請稍後再試。錯誤：' + (error?.message || '未知錯誤'));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value });
  };

  // 获取履历列表
  const fetchResumeList = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingResumes(true);
    try {
      const response = await fetch(`/api/resume/list?userId=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setResumeFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch resume list:', error);
    } finally {
      setIsLoadingResumes(false);
    }
  }, [user?.id]);

  // 上传新文件
  const handleUploadResume = async (file: File) => {
    if (!user?.id) return;

    // 验证文件大小 (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('檔案大小不能超過 5MB');
      return;
    }

    // 验证文件类型
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      alert('只接受 PDF、DOC 或 DOCX 格式的檔案');
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('fileName', `${user.id}_${file.name}`);
    formData.append('userId', user.id);
    formData.append('studyLevel', profile?.studyLevel || 'Unknown');
    formData.append('major', profile?.major || 'Unknown');

    try {
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('上傳成功！');
        fetchResumeList(); // 刷新列表
      } else {
        alert('上傳失敗');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上傳失敗');
    } finally {
      setUploadingFile(false);
    }
  };

  // 删除文件
  const handleDeleteResume = async (fileName: string) => {
    if (!user?.id || !user?.token) return;

    if (!confirm(`確定要刪除 ${fileName}？`)) return;

    try {
      const response = await fetch('/api/resume/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ fileName }),
      });

      const data = await response.json();
      if (data.success) {
        alert('刪除成功');
        fetchResumeList(); // 刷新列表
      } else {
        alert('刪除失敗：' + data.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('刪除失敗');
    }
  };

  // 獲取用戶發布的找隊友需求
  const fetchMyNeeds = useCallback(async () => {
    if (!user?.token) return;

    setIsLoadingNeeds(true);
    try {
      // 包含所有需求（包括隱藏和已關閉的）
      const response = await fetch('/api/team-up/my-needs?includeHidden=true&includeClosed=true', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Fetched my needs response:', result);
        // API 返回結構是 { success, data: { needs, total } }
        const needs = result.data?.needs || result.needs || [];
        console.log('Parsed needs:', needs);
        setMyNeeds(needs);
      } else {
        console.error('Failed to fetch my needs:', response.status);
      }
    } catch (error) {
      console.error('Error fetching my needs:', error);
    } finally {
      setIsLoadingNeeds(false);
    }
  }, [user?.token]);

  // Toggle 需求開關狀態
  const handleToggleNeed = async (needId: string, currentStatus: boolean) => {
    if (!user?.token) return;

    setToggleLoading({ ...toggleLoading, [needId]: true });
    try {
      const response = await fetch(`/api/team-up/needs/${needId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ isOpen: !currentStatus }),
      });

      if (response.ok) {
        // 更新本地狀態
        setMyNeeds(
          myNeeds.map((need) => (need.id === needId ? { ...need, isOpen: !currentStatus } : need)),
        );
      } else {
        const errorData = await response.json();
        alert(errorData.message || '更新失敗');
      }
    } catch (error) {
      console.error('Error toggling need:', error);
      alert('更新失敗，請稍後再試');
    } finally {
      setToggleLoading({ ...toggleLoading, [needId]: false });
    }
  };

  // 獲取用戶申請的找隊友記錄
  const fetchMyApplications = useCallback(async () => {
    if (!user?.token) return;

    console.log('[fetchMyApplications] Starting to fetch applications for user');
    setIsLoadingApplications(true);
    try {
      const response = await fetch('/api/team-up/my-applications', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      console.log('[fetchMyApplications] Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('[fetchMyApplications] API result:', result);
        console.log('[fetchMyApplications] Applications data:', result.data?.applications);
        console.log(
          '[fetchMyApplications] Applications count:',
          result.data?.applications?.length || 0,
        );
        console.log('[fetchMyApplications] Stats:', result.data?.stats);

        const apps = result.data?.applications || [];
        setMyApplications(apps);
        setStats(result.data?.stats);
        console.log('[fetchMyApplications] Set applications state with', apps.length, 'items');
      } else {
        const errorData = await response.json();
        console.error(
          '[fetchMyApplications] Failed to fetch my applications:',
          response.status,
          errorData,
        );
      }
    } catch (error) {
      console.error('[fetchMyApplications] Error fetching my applications:', error);
    } finally {
      setIsLoadingApplications(false);
    }
  }, [user?.token]);

  // 組件掛載時獲取需求列表、申請記錄和履歷列表
  // 檢查用戶是否已註冊（直接查詢數據庫）
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!user?.id || !user?.token) {
        console.log('[Profile] No user ID or token, skipping registration check');
        setCheckingRegistration(false);
        return;
      }

      console.log('[Profile] 🔍 Checking registration status for user:', user.id);
      
      try {
        const response = await fetch(`/api/userinfo?id=${encodeURIComponent(user.id)}`, {
          headers: { Authorization: user.token },
        });

        console.log('[Profile] 📥 Registration check response:', response.status);

        if (response.status === 200) {
          const data = await response.json();
          console.log('[Profile] ✅ User is registered in database');
          setIsRegistered(true);
          // 同時更新 profile 以保持一致性
          if (!profile) {
            updateProfile(data);
          }
        } else if (response.status === 404) {
          console.log('[Profile] ❌ User not registered (404)');
          setIsRegistered(false);
        } else {
          console.log('[Profile] ⚠️  Registration check failed with status:', response.status);
          setIsRegistered(false);
        }
      } catch (error) {
        console.error('[Profile] ❌ Error checking registration:', error);
        setIsRegistered(false);
      } finally {
        setCheckingRegistration(false);
      }
    };

    checkRegistrationStatus();
  }, [user?.id, user?.token]);

  useEffect(() => {
    if (isSignedIn && user?.token && isRegistered) {
      fetchMyNeeds();
      fetchMyApplications();
      fetchResumeList();
    }
  }, [isSignedIn, user?.token, isRegistered, fetchMyNeeds, fetchMyApplications, fetchResumeList]);

  // Debug logging
  console.log('[Profile Page] 🔍 Render check:', {
    isSignedIn,
    hasProfile,
    isRegistered,
    checkingRegistration,
    user: user ? { id: user.id, email: user.preferredEmail } : null,
    profile: profile ? { id: profile.id, email: profile.email } : null,
  });

  // 正在檢查註冊狀態
  if (checkingRegistration) {
    console.log('[Profile Page] ⏳ Checking registration status...');
    return <div className="p-4 flex-grow text-center">載入中...</div>;
  }

  // 未登入
  if (!isSignedIn) {
    console.log('[Profile Page] ❌ User not signed in, showing message');
    return <div className="p-4 flex-grow text-center">請登入以查看您的個人中心！</div>;
  }

  // 已登入但未註冊
  if (isRegistered === false) {
    console.log('[Profile Page] ❌ User not registered in database, redirecting to /register');
    router.push('/register');
    return <div className="p-4 flex-grow text-center">重定向到註冊頁面...</div>;
  }
  
  // 已註冊但 profile 數據還未載入
  if (!profile || !profile.user) {
    console.log('[Profile Page] ⏳ Profile data still loading...');
    return <div className="p-4 flex-grow text-center">載入個人資料中...</div>;
  }
  
  console.log('[Profile Page] ✅ User is registered and profile loaded, rendering page');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: '#1a3a6e' }}>
            個人中心
          </h1>
          {activeTab === 'profile' && (
            <>
              {!isEditing ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const email = user?.preferredEmail || profile?.email;
                      console.log('[Profile] 查看公開頁面 - email:', email);
                      if (email) {
                        const hash = emailToHash(email);
                        console.log('[Profile] 計算的 hash:', hash);
                        console.log('[Profile] 跳轉到:', `/user/${hash}`);
                        router.push(`/user/${hash}`);
                      } else {
                        console.error('[Profile] ❌ 找不到 email');
                        alert('無法獲取用戶 email，請重新登入');
                      }
                    }}
                    disabled={!profile || !profile.user}
                    className="border-2 px-6 py-2 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: '#8B4049',
                      color: '#8B4049',
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (profile && profile.user) {
                        e.currentTarget.style.backgroundColor = '#8B4049';
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (profile && profile.user) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#8B4049';
                      }
                    }}
                  >
                    查看公開頁面
                  </button>
                  <button
                    onClick={handleEditClick}
                    disabled={!profile || !profile.user}
                    className="border-2 px-6 py-2 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: '#1a3a6e',
                      color: '#1a3a6e',
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (profile && profile.user) {
                        e.currentTarget.style.backgroundColor = '#1a3a6e';
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (profile && profile.user) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#1a3a6e';
                      }
                    }}
                  >
                    編輯個人資料
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    className="border-2 px-6 py-2 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300"
                    style={{
                      borderColor: '#1a3a6e',
                      color: '#1a3a6e',
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a3a6e';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#1a3a6e';
                    }}
                  >
                    儲存
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="border-2 px-6 py-2 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300"
                    style={{
                      borderColor: '#6b7280',
                      color: '#6b7280',
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#6b7280';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }}
                  >
                    取消
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tab 切換 */}
        <div className="border-b-2 mb-8" style={{ borderColor: '#e5e7eb' }}>
          <nav className="-mb-0.5 flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className="py-4 px-1 border-b-2 font-medium text-[14px] transition-colors"
              style={
                activeTab === 'profile'
                  ? { borderColor: '#1a3a6e', color: '#1a3a6e' }
                  : { borderColor: 'transparent', color: '#6b7280' }
              }
              onMouseEnter={(e) => {
                if (activeTab !== 'profile') {
                  e.currentTarget.style.color = '#374151';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'profile') {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              個人資料
            </button>
            <button
              onClick={() => setActiveTab('teamup-needs')}
              className="py-4 px-1 border-b-2 font-medium text-[14px] transition-colors"
              style={
                activeTab === 'teamup-needs'
                  ? { borderColor: '#1a3a6e', color: '#1a3a6e' }
                  : { borderColor: 'transparent', color: '#6b7280' }
              }
              onMouseEnter={(e) => {
                if (activeTab !== 'teamup-needs') {
                  e.currentTarget.style.color = '#374151';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'teamup-needs') {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              我的找隊友需求 ({myNeeds.length})
            </button>
            <button
              onClick={() => setActiveTab('teamup-applications')}
              className="py-4 px-1 border-b-2 font-medium text-[14px] transition-colors"
              style={
                activeTab === 'teamup-applications'
                  ? { borderColor: '#1a3a6e', color: '#1a3a6e' }
                  : { borderColor: 'transparent', color: '#6b7280' }
              }
              onMouseEnter={(e) => {
                if (activeTab !== 'teamup-applications') {
                  e.currentTarget.style.color = '#374151';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'teamup-applications') {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              我的找隊友申請 ({myApplications.length})
            </button>
            <button
              onClick={() => setActiveTab('my-teams')}
              className="py-4 px-1 border-b-2 font-medium text-[14px] transition-colors"
              style={
                activeTab === 'my-teams'
                  ? { borderColor: '#1a3a6e', color: '#1a3a6e' }
                  : { borderColor: 'transparent', color: '#6b7280' }
              }
              onMouseEnter={(e) => {
                if (activeTab !== 'my-teams') {
                  e.currentTarget.style.color = '#374151';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'my-teams') {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              我的團隊
            </button>
          </nav>
        </div>

        {/* 個人資料 Tab */}
        {activeTab === 'profile' && (
          <section className="w-full py-5">
            <div className="flex flex-col gap-y-6">
              {/* QR Code Card */}
              <div className="bg-gray-300 w-full rounded-xl p-6 flex flex-col items-center gap-4">
                <h1 className="font-bold text-xl text-center">黑客松台灣</h1>
                <QRCode data={'hack:' + user.id} loading={false} width={200} height={200} />
                <div className="text-center">
                  <h1 className="font-bold text-xl">{`${profile.user.firstName || ''} ${
                    profile.user.lastName || ''
                  }`}</h1>
                  <p className="text-gray-700">
                    {profile.user.permissions?.[0] === 'hacker'
                      ? '黑客'
                      : profile.user.permissions?.[0] || '未設置'}
                  </p>
                </div>
              </div>

              {/* Profile Information */}
              <div
                className="w-full bg-white rounded-xl border-2 p-8"
                style={{ borderColor: '#e5e7eb' }}
              >
                <h2
                  className="text-2xl font-bold mb-6 pb-3 border-b-2"
                  style={{ color: '#1a3a6e', borderColor: '#e5e7eb' }}
                >
                  個人資料
                </h2>
                <div className="flex flex-col gap-y-6">
                  {/* Name - Editable */}
                  <div className="profile-field">
                    <div className="font-bold text-lg mb-2">姓名</div>
                    {isEditing ? (
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            placeholder="名字"
                            className="border-2 border-gray-400 rounded p-2 flex-1"
                          />
                          <input
                            type="text"
                            value={editData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            placeholder="姓氏"
                            className="border-2 border-gray-400 rounded p-2 flex-1"
                          />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="showName"
                            checked={privacySettings.showName}
                            onChange={(e) =>
                              setPrivacySettings({ ...privacySettings, showName: e.target.checked })
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor="showName"
                            className="text-sm text-gray-600 cursor-pointer"
                          >
                            在個人公開頁面顯示
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-700">{`${profile.user.firstName || ''} ${
                        profile.user.lastName || ''
                      }`}</div>
                    )}
                  </div>

                  {/* Role - Read Only */}
                  <div className="profile-field">
                    <div className="font-bold text-lg mb-2">角色</div>
                    <div className="text-gray-700">
                      {profile.user.permissions?.[0] === 'hacker'
                        ? '黑客'
                        : profile.user.permissions?.[0] || '未設置'}
                    </div>
                    {isEditing && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showRole"
                          checked={privacySettings.showRole}
                          onChange={(e) =>
                            setPrivacySettings({ ...privacySettings, showRole: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="showRole" className="text-sm text-gray-600 cursor-pointer">
                          在個人公開頁面顯示
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Email - Read Only */}
                  <div className="profile-field">
                    <div className="font-bold text-lg mb-2">電子郵件</div>
                    <div className="text-gray-700">{profile.user.preferredEmail || '未設置'}</div>
                    {isEditing && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showEmail"
                          checked={privacySettings.showEmail}
                          onChange={(e) =>
                            setPrivacySettings({ ...privacySettings, showEmail: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="showEmail" className="text-sm text-gray-600 cursor-pointer">
                          在個人公開頁面顯示
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Nickname - Editable */}
                  <div className="profile-field">
                    <div className="font-bold text-lg mb-2">稱呼 / 暱稱</div>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editData.nickname}
                          onChange={(e) => handleInputChange('nickname', e.target.value)}
                          placeholder="例如：小明、Alex、阿福"
                          className="border-2 border-gray-400 rounded p-2 w-full"
                        />
                        <div className="mt-2 text-sm text-gray-500 italic">
                          ✓ 暱稱將始終在個人公開頁面顯示
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-700">{profile.nickname || '未設置'}</div>
                    )}
                  </div>

                  {/* Team Status - Editable */}
                  <div className="profile-field">
                    <div className="font-bold text-lg mb-2">組隊狀態</div>
                    {isEditing ? (
                      <>
                        <select
                          value={editData.teamStatus}
                          onChange={(e) => handleInputChange('teamStatus', e.target.value)}
                          className="border-2 border-gray-400 rounded p-2 w-full"
                        >
                          <option value="">請選擇</option>
                          <option value="individual">個人</option>
                          <option value="needTeammates">有隊伍但缺隊友</option>
                          <option value="fullTeam">有完整隊伍</option>
                        </select>
                        <div className="mt-2 text-sm text-gray-500 italic">
                          ✓ 組隊狀態將始終在個人公開頁面顯示
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-700">
                        {profile.teamStatus === 'individual' && '個人'}
                        {profile.teamStatus === 'needTeammates' && '有隊伍但缺隊友'}
                        {profile.teamStatus === 'fullTeam' && '有完整隊伍'}
                        {!profile.teamStatus && '未設置'}
                      </div>
                    )}
                  </div>

                  {/* GitHub - Editable */}
                  {(isEditing || profile.github) && (
                    <div className="profile-field">
                      <div className="font-bold text-lg mb-2">Github</div>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editData.github}
                            onChange={(e) => handleInputChange('github', e.target.value)}
                            placeholder="GitHub 使用者名稱或網址"
                            className="border-2 border-gray-400 rounded p-2 w-full"
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="showGithub"
                              checked={privacySettings.showGithub}
                              onChange={(e) =>
                                setPrivacySettings({
                                  ...privacySettings,
                                  showGithub: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label
                              htmlFor="showGithub"
                              className="text-sm text-gray-600 cursor-pointer"
                            >
                              在個人公開頁面顯示
                            </label>
                          </div>
                        </>
                      ) : (
                        <a
                          href={
                            profile.github.startsWith('http')
                              ? profile.github
                              : `https://github.com/${profile.github}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline break-all"
                          style={{ color: '#1a3a6e' }}
                        >
                          {profile.github}
                        </a>
                      )}
                    </div>
                  )}

                  {/* LinkedIn - Editable */}
                  {(isEditing || profile.linkedin) && (
                    <div className="profile-field">
                      <div className="font-bold text-lg mb-2">LinkedIn</div>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editData.linkedin}
                            onChange={(e) => handleInputChange('linkedin', e.target.value)}
                            placeholder="LinkedIn 使用者名稱或網址"
                            className="border-2 border-gray-400 rounded p-2 w-full"
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="showLinkedin"
                              checked={privacySettings.showLinkedin}
                              onChange={(e) =>
                                setPrivacySettings({
                                  ...privacySettings,
                                  showLinkedin: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label
                              htmlFor="showLinkedin"
                              className="text-sm text-gray-600 cursor-pointer"
                            >
                              在個人公開頁面顯示
                            </label>
                          </div>
                        </>
                      ) : (
                        <a
                          href={
                            profile.linkedin.startsWith('http')
                              ? profile.linkedin
                              : `https://linkedin.com/in/${profile.linkedin}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline break-all"
                          style={{ color: '#1a3a6e' }}
                        >
                          {profile.linkedin}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Website - Editable */}
                  {(isEditing || profile.website) && (
                    <div className="profile-field">
                      <div className="font-bold text-lg mb-2">個人網站</div>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            placeholder="個人網站網址"
                            className="border-2 border-gray-400 rounded p-2 w-full"
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="showWebsite"
                              checked={privacySettings.showWebsite}
                              onChange={(e) =>
                                setPrivacySettings({
                                  ...privacySettings,
                                  showWebsite: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label
                              htmlFor="showWebsite"
                              className="text-sm text-gray-600 cursor-pointer"
                            >
                              在個人公開頁面顯示
                            </label>
                          </div>
                        </>
                      ) : (
                        <a
                          href={
                            profile.website.startsWith('http')
                              ? profile.website
                              : `https://${profile.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline break-all"
                          style={{ color: '#1a3a6e' }}
                        >
                          {profile.website}
                        </a>
                      )}
                    </div>
                  )}

                  {/* EVM Wallet Address - Editable */}
                  {(isEditing || profile.evmAddress) && (
                    <div className="profile-field">
                      <div className="font-bold text-lg mb-2">EVM 錢包地址</div>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editData.evmAddress}
                            onChange={(e) => handleInputChange('evmAddress', e.target.value)}
                            placeholder="0x..."
                            className="border-2 border-gray-400 rounded p-2 w-full font-mono text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            支援 Ethereum、Arbitrum 等 EVM 兼容鏈
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="showEvmAddress"
                              checked={privacySettings.showEvmAddress}
                              onChange={(e) =>
                                setPrivacySettings({
                                  ...privacySettings,
                                  showEvmAddress: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label
                              htmlFor="showEvmAddress"
                              className="text-sm text-gray-600 cursor-pointer"
                            >
                              在個人公開頁面顯示
                            </label>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-700 font-mono text-sm break-all">
                          {profile.evmAddress}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Other Wallet Addresses - Multiple Chains */}
                  {(isEditing ||
                    (profile.walletAddresses && profile.walletAddresses.length > 0)) && (
                    <div className="profile-field">
                      <div className="font-bold text-lg mb-2">其他錢包地址</div>
                      {isEditing ? (
                        <>
                          <div className="space-y-3">
                            {editData.walletAddresses.map((wallet, index) => (
                              <div key={index} className="flex gap-2 items-start">
                                <input
                                  type="text"
                                  value={wallet.chainName}
                                  onChange={(e) => {
                                    const newWallets = [...editData.walletAddresses];
                                    newWallets[index].chainName = e.target.value;
                                    setEditData({ ...editData, walletAddresses: newWallets });
                                  }}
                                  placeholder="鏈名（例如：BTC、Solana、Sui...）"
                                  className="border-2 border-gray-400 rounded p-2 w-1/3"
                                />
                                <input
                                  type="text"
                                  value={wallet.address}
                                  onChange={(e) => {
                                    const newWallets = [...editData.walletAddresses];
                                    newWallets[index].address = e.target.value;
                                    setEditData({ ...editData, walletAddresses: newWallets });
                                  }}
                                  placeholder="錢包地址"
                                  className="border-2 border-gray-400 rounded p-2 flex-1 font-mono text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newWallets = editData.walletAddresses.filter(
                                      (_, i) => i !== index,
                                    );
                                    setEditData({ ...editData, walletAddresses: newWallets });
                                  }}
                                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                  刪除
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setEditData({
                                  ...editData,
                                  walletAddresses: [
                                    ...editData.walletAddresses,
                                    { chainName: '', address: '' },
                                  ],
                                });
                              }}
                              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              + 新增錢包地址
                            </button>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="showWalletAddresses"
                              checked={privacySettings.showWalletAddresses}
                              onChange={(e) =>
                                setPrivacySettings({
                                  ...privacySettings,
                                  showWalletAddresses: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label
                              htmlFor="showWalletAddresses"
                              className="text-sm text-gray-600 cursor-pointer"
                            >
                              在個人公開頁面顯示
                            </label>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          {profile.walletAddresses &&
                            profile.walletAddresses.map((wallet, index) => (
                              <div key={index} className="flex gap-2">
                                <span className="text-gray-700 font-semibold min-w-[100px]">
                                  {wallet.chainName}:
                                </span>
                                <span className="text-gray-700 font-mono text-sm break-all">
                                  {wallet.address}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resume Files - Multiple Files Support */}
                  <div className="profile-field">
                    <div className="font-bold text-lg mb-2">履歷文件</div>

                    {isLoadingResumes ? (
                      <div className="text-gray-500">載入中...</div>
                    ) : (
                      <div className="space-y-4">
                        {/* 已上传的文件列表 */}
                        {resumeFiles.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600 font-medium mb-2">
                              已上傳的文件（{resumeFiles.length}）
                            </div>
                            {resumeFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <svg
                                    className={`w-5 h-5 flex-shrink-0 ${
                                      file.exists ? 'text-blue-500' : 'text-red-500'
                                    }`}
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
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {file.fileName}
                                    </div>
                                    {file.exists ? (
                                      <div className="text-xs text-gray-500">
                                        {file.size
                                          ? `${(file.size / 1024).toFixed(2)} KB`
                                          : '檔案存在'}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-red-500">文件不存在</div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteResume(file.fileName)}
                                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors flex-shrink-0 ml-2"
                                >
                                  刪除
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm bg-gray-50 p-3 rounded">
                            尚未上傳履歷
                          </div>
                        )}

                        {/* 上传新文件 */}
                        <div className="border-t border-gray-200 pt-4">
                          <label className="block mb-2 text-sm font-medium text-gray-700">
                            上傳新履歷
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleUploadResume(file);
                                e.target.value = ''; // 重置 input
                              }
                            }}
                            disabled={uploadingFile}
                            className="border-2 border-gray-400 rounded p-2 text-sm w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          {uploadingFile && (
                            <div className="text-blue-500 text-sm mt-2 flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                              <span>上傳中...</span>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            接受 PDF、DOC、DOCX 格式，檔案大小限制 5MB
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Privacy Setting for Resume */}
                    {isEditing && (
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showResume"
                          checked={privacySettings.showResume}
                          onChange={(e) =>
                            setPrivacySettings({ ...privacySettings, showResume: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor="showResume"
                          className="text-sm text-gray-600 cursor-pointer"
                        >
                          在個人公開頁面顯示
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LINE Community Section */}
              <div
                className="w-full bg-white rounded-xl border-2 p-8"
                style={{ borderColor: '#e5e7eb' }}
              >
                <h2
                  className="text-2xl font-bold mb-6 pb-3 border-b-2"
                  style={{ color: '#1a3a6e', borderColor: '#e5e7eb' }}
                >
                  加入 Line 社群
                </h2>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* QR Code */}
                  <div className="flex-shrink-0">
                    <Image
                      src="/assets/rwa-hackathon-2025-line.jpg"
                      alt="RWA黑客松2025 LINE 社群 QR Code"
                      width={200}
                      height={200}
                      className="rounded-lg border-2 border-gray-300"
                    />
                  </div>

                  {/* Information */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <a
                        href="https://line.me/ti/g2/Ae5RbTZMqVF4lE8U8b0FOfs6M5uyiyQMAvu6aQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-bold hover:underline inline-flex items-center gap-2"
                        style={{ color: '#1a3a6e' }}
                      >
                        RWA黑客松2025
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
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>

                    <div className="space-y-4 text-gray-700">
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                        <div className="font-bold text-lg mb-2 text-blue-800">名稱命名規則：</div>
                        <div className="text-gray-800 mb-2">「稱呼/團隊名」或「稱呼/角色」</div>
                        <div className="text-sm space-y-1 text-gray-600">
                          <div>例如：</div>
                          <div>• 「阿福/南方四濺剋」</div>
                          <div>• 「小健/找隊友」</div>
                          <div>• 「Reyer/協辦方」</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 我的找隊友需求 Tab */}
        {activeTab === 'teamup-needs' && (
          <section className="w-full">
            {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">我的需求</p>
                    <p className="text-3xl font-bold text-gray-900">{myNeeds.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
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
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">開放中</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {myNeeds.filter((n) => n.isOpen).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
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
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">總瀏覽數</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {myNeeds.reduce((sum, n) => sum + (n.viewCount || 0), 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 發布按鈕 */}
            <div className="mb-6">
              <button
                onClick={() => router.push('/team-up/create')}
                className="border-2 px-6 py-2 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300"
                style={{
                  borderColor: '#1a3a6e',
                  color: '#1a3a6e',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1a3a6e';
                }}
              >
                ＋ 發布新需求
              </button>
            </div>

            {/* 需求列表 */}
            {isLoadingNeeds ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">載入中...</p>
              </div>
            ) : (
              <MyNeedsList
                needs={myNeeds}
                onRefresh={fetchMyNeeds}
                onToggleNeed={handleToggleNeed}
                toggleLoading={toggleLoading}
              />
            )}
          </section>
        )}

        {/* 我的找隊友申請 Tab */}
        {activeTab === 'teamup-applications' && (
          <section className="w-full">
            {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">我的申請</p>
                    <p className="text-3xl font-bold text-gray-900">{myApplications.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">待審核</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.pending || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">已接受</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.accepted || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 瀏覽更多需求按鈕 */}
            <div className="mb-6">
              <button
                onClick={() => router.push('/team-up')}
                className="border-2 px-6 py-2 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300"
                style={{
                  borderColor: '#1a3a6e',
                  color: '#1a3a6e',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1a3a6e';
                }}
              >
                瀏覽更多找隊友需求
              </button>
            </div>

            {/* 申請列表 */}
            {isLoadingApplications ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">載入中...</p>
              </div>
            ) : (
              <MyApplicationsList applications={myApplications} onRefresh={fetchMyApplications} />
            )}
          </section>
        )}

        {/* 我的團隊 Tab */}
        {activeTab === 'my-teams' && (
          <section className="w-full py-5">
            <div
              className="mb-6 bg-white rounded-lg border-2 p-6"
              style={{ borderColor: '#e5e7eb' }}
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                我的團隊
              </h2>
              <p className="text-gray-600 mb-6">
                查看您參與的所有黑客松團隊。您可以查看團隊詳情，如果您擁有編輯權限，還可以更新團隊資料。
              </p>

              {/* Team Management Component */}
              <TeamManagement />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
