import { useRouter } from 'next/router';
import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../lib/user/AuthContext';
import QRCode from '../components/dashboardComponents/QRCode';
import { RequestHelper } from '../lib/request-helper';
import type { TeamNeed } from '../lib/teamUp/types';
import MyNeedsList from '../components/teamUp/dashboard/MyNeedsList';
import MyApplicationsList from '../components/teamUp/dashboard/MyApplicationsList';

/**
 * A page that allows a user to modify app or profile settings and see their data.
 *
 * Route: /profile
 */
type TabType = 'profile' | 'teamup-needs' | 'teamup-applications';

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
  });
  const [myNeeds, setMyNeeds] = useState<TeamNeed[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [isLoadingNeeds, setIsLoadingNeeds] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<{ [key: string]: boolean }>({});
  const [stats, setStats] = useState<any>(null);

  const handleEditClick = () => {
    setEditData({
      firstName: profile.user.firstName || '',
      lastName: profile.user.lastName || '',
      nickname: profile.nickname || '',
      teamStatus: profile.teamStatus || '',
      github: profile.github || '',
      linkedin: profile.linkedin || '',
      website: profile.website || '',
    });
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
        resume: resumeFileName,
      };

      await RequestHelper.put<any, any>(
        `/api/applications/${user.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
        updatedProfile,
      );

      // 保存成功後，重新從服務器獲取最新資料
      try {
        const response = await fetch(`/api/applications/${user.id}`, {
          headers: {
            Authorization: user.token,
          },
        });
        if (response.ok) {
          const latestProfile = await response.json();
          updateProfile(latestProfile);
          console.log('✅ Profile updated with latest data:', latestProfile);
        } else {
          // 如果獲取失敗，仍使用本地更新的資料
          updateProfile(updatedProfile);
        }
      } catch (fetchError) {
        console.error('Failed to fetch latest profile:', fetchError);
        // 回退到本地更新
        updateProfile(updatedProfile);
      }

      setIsEditing(false);
      setResumeFile(null);
      alert('個人資料更新成功！');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('更新失敗，請稍後再試。');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value });
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

    setIsLoadingApplications(true);
    try {
      const response = await fetch('/api/team-up/my-applications', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setMyApplications(result.data?.applications || []);
        setStats(result.data?.stats);
      } else {
        console.error('Failed to fetch my applications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching my applications:', error);
    } finally {
      setIsLoadingApplications(false);
    }
  }, [user?.token]);

  // 組件掛載時獲取需求列表和申請記錄
  useEffect(() => {
    if (isSignedIn && hasProfile && user?.token) {
      fetchMyNeeds();
      fetchMyApplications();
    }
  }, [isSignedIn, hasProfile, user?.token, fetchMyNeeds, fetchMyApplications]);

  if (!isSignedIn) {
    return <div className="p-4 flex-grow text-center">請登入以查看您的個人檔案！</div>;
  }

  if (!hasProfile) {
    router.push('/register');
    return <div></div>;
  }

  return (
    <div className="px-8 pt-20 pb-8 w-full">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-3xl font-bold">個人中心</h1>
          {activeTab === 'profile' && (
            <>
              {!isEditing ? (
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  編輯個人資料
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    儲存
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    取消
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tab 切換 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              個人資料
            </button>
            <button
              onClick={() => setActiveTab('teamup-needs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'teamup-needs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              我的找隊友需求 ({myNeeds.length})
            </button>
            <button
              onClick={() => setActiveTab('teamup-applications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'teamup-applications'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              我的找隊友申請 ({myApplications.length})
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
                  <h1 className="font-bold text-xl">{`${profile.user.firstName} ${profile.user.lastName}`}</h1>
                  <p className="text-gray-700">
                    {profile.user.permissions[0] === 'hacker'
                      ? '黑客'
                      : profile.user.permissions[0]}
                  </p>
                </div>
              </div>

              {/* Profile Information */}
              <div className="w-full bg-white rounded-xl border-2 border-gray-200 p-6">
                <h2 className="text-2xl font-bold mb-6 pb-2 border-b-2 border-gray-300">
                  個人資料
                </h2>
                <div className="flex flex-col gap-y-6">
                  {/* Name - Editable */}
                  <div className="profile-field">
                    <div className="font-bold text-lg mb-2">姓名</div>
                    {isEditing ? (
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
                    ) : (
                      <div className="text-gray-700">{`${profile.user.firstName} ${profile.user.lastName}`}</div>
                    )}
                  </div>

                  {/* Role - Read Only */}
                  <div className="profile-field">
                    <div className="font-bold text-lg mb-2">角色</div>
                    <div className="text-gray-700">
                      {profile.user.permissions[0] === 'hacker'
                        ? '黑客'
                        : profile.user.permissions[0]}
                    </div>
                  </div>

                  {/* Email - Read Only */}
                  <div className="profile-field">
                    <div className="font-bold text-lg mb-2">電子郵件</div>
                    <div className="text-gray-700">{profile.user.preferredEmail}</div>
                  </div>

                  {/* Nickname - Editable */}
                  <div className="profile-field">
                    <div className="font-bold text-lg mb-2">稱呼 / 暱稱</div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.nickname}
                        onChange={(e) => handleInputChange('nickname', e.target.value)}
                        placeholder="例如：小明、Alex、阿福"
                        className="border-2 border-gray-400 rounded p-2 w-full"
                      />
                    ) : (
                      <div className="text-gray-700">{profile.nickname || '未設置'}</div>
                    )}
                  </div>

                  {/* Team Status - Editable */}
                  <div className="profile-field">
                    <div className="font-bold text-lg mb-2">組隊狀態</div>
                    {isEditing ? (
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
                        <input
                          type="text"
                          value={editData.github}
                          onChange={(e) => handleInputChange('github', e.target.value)}
                          placeholder="GitHub 使用者名稱或網址"
                          className="border-2 border-gray-400 rounded p-2 w-full"
                        />
                      ) : (
                        <a
                          href={
                            profile.github.startsWith('http')
                              ? profile.github
                              : `https://github.com/${profile.github}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
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
                        <input
                          type="text"
                          value={editData.linkedin}
                          onChange={(e) => handleInputChange('linkedin', e.target.value)}
                          placeholder="LinkedIn 使用者名稱或網址"
                          className="border-2 border-gray-400 rounded p-2 w-full"
                        />
                      ) : (
                        <a
                          href={
                            profile.linkedin.startsWith('http')
                              ? profile.linkedin
                              : `https://linkedin.com/in/${profile.linkedin}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
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
                        <input
                          type="text"
                          value={editData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="個人網站網址"
                          className="border-2 border-gray-400 rounded p-2 w-full"
                        />
                      ) : (
                        <a
                          href={
                            profile.website.startsWith('http')
                              ? profile.website
                              : `https://${profile.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {profile.website}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Resume File - Editable */}
                  {(isEditing || profile.resume) && (
                    <div className="profile-field">
                      <div className="font-bold text-lg mb-2">履歷</div>
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          {profile.resume && (
                            <div className="text-gray-700 flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
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
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <span>目前檔案：{profile.resume}</span>
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            <label
                              htmlFor="resume-upload"
                              className="text-sm text-gray-600 font-medium"
                            >
                              {profile.resume ? '上傳新履歷（可選）' : '上傳履歷'}
                            </label>
                            <input
                              id="resume-upload"
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileChange}
                              className="border-2 border-gray-400 rounded p-2 text-sm w-full"
                            />
                            {resumeFile && (
                              <div className="text-green-600 text-sm flex items-center gap-2 bg-green-50 p-2 rounded">
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                <span>已選擇：{resumeFile.name}</span>
                              </div>
                            )}
                            <p className="text-xs text-gray-500">
                              接受 PDF、DOC、DOCX 格式，檔案大小限制 5MB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-700 flex items-center gap-2">
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>{profile.resume}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* My Team-Up Needs Section */}
              <div className="w-full bg-white rounded-xl border-2 border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-300">
                  <h2 className="text-2xl font-bold">我發布的找隊友需求</h2>
                  <button
                    onClick={() => router.push('/team-up/create')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    + 發布新需求
                  </button>
                </div>

                {isLoadingNeeds ? (
                  <div className="text-center py-8 text-gray-500">載入中...</div>
                ) : myNeeds.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">您還沒有發布任何找隊友需求</p>
                    <button
                      onClick={() => router.push('/team-up/create')}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      立即發布需求
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myNeeds.map((need) => (
                      <div
                        key={need.id}
                        className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            {/* 標題和狀態 */}
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-800">{need.title}</h3>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  need.isOpen
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {need.isOpen ? '✓ 開放中' : '✕ 已關閉'}
                              </span>
                            </div>

                            {/* 描述 */}
                            <p className="text-gray-600 mb-3 line-clamp-2">{need.brief}</p>

                            {/* 元數據 */}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <span>👀 {need.viewCount || 0} 瀏覽</span>
                              <span>
                                ✉️{' '}
                                {(need as any).stats?.totalApplications ||
                                  need.applicationCount ||
                                  0}{' '}
                                應徵
                              </span>
                              <span>
                                📅 發布於{' '}
                                {(() => {
                                  const timestamp = need.createdAt;
                                  if (!timestamp) return '未知';

                                  let date: Date;
                                  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
                                    date = new Date(timestamp.seconds * 1000);
                                  } else if (typeof timestamp === 'number') {
                                    date = new Date(timestamp);
                                  } else {
                                    date = new Date(timestamp as any);
                                  }

                                  return date.toLocaleDateString('zh-TW');
                                })()}
                              </span>
                            </div>
                          </div>

                          {/* 操作按鈕 */}
                          <div className="flex flex-col gap-2">
                            {/* Toggle 開關 */}
                            <button
                              onClick={() => handleToggleNeed(need.id, need.isOpen)}
                              disabled={toggleLoading[need.id]}
                              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                need.isOpen ? 'bg-green-500' : 'bg-gray-300'
                              } ${toggleLoading[need.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={need.isOpen ? '關閉應徵' : '開放應徵'}
                            >
                              <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                  need.isOpen ? 'translate-x-7' : 'translate-x-1'
                                }`}
                              />
                            </button>

                            {/* 查看詳情按鈕 */}
                            <button
                              onClick={() => router.push(`/team-up/${need.id}`)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              查看詳情
                            </button>

                            {/* 編輯按鈕 */}
                            <button
                              onClick={() => router.push(`/team-up/edit/${need.id}`)}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              編輯需求
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LINE Community Section */}
              <div className="w-full bg-white rounded-xl border-2 border-gray-200 p-6">
                <h2 className="text-2xl font-bold mb-6 pb-2 border-b-2 border-gray-300">
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
                        className="text-xl font-bold text-blue-600 hover:underline inline-flex items-center gap-2"
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
              <MyNeedsList needs={myNeeds} onRefresh={fetchMyNeeds} />
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
      </div>
    </div>
  );
}
