import { useEffect, useState } from 'react';
import { RequestHelper } from '../../lib/request-helper';
import { arrayFields, fieldToName, singleFields } from '../../lib/stats/field';
import { useAuthContext } from '../../lib/user/AuthContext';
import { UserData } from '../../pages/api/users';
import ErrorList from '../ErrorList';
import LoadIcon from '../LoadIcon';
import { TeamNeed } from '../../lib/teamUp/types';

interface UserAdminViewProps {
  goBack: () => void;
  currentUserId: string;
  updateCurrentUser: (value: Omit<UserData, 'scans'>) => void;
}

interface UserProfile extends Omit<Registration, 'user'> {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    permissions: string[];
    preferredEmail: string;
  };
}

// 角色中文映射
const ROLE_LABELS: Record<string, string> = {
  hacker: '黑客 (Hacker)',
  judge: '評審 (Judge)',
  sponsor: '贊助商 (Sponsor)',
  organizer: '組織者 (Organizer)',
  admin: '管理員 (Admin)',
  super_admin: '超級管理員 (Super Admin)',
};

// 所有可用角色
const ALL_ROLES = ['hacker', 'judge', 'sponsor', 'organizer', 'admin', 'super_admin'];

export default function UserAdminView({
  goBack,
  currentUserId,
  updateCurrentUser,
}: UserAdminViewProps) {
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { user } = useAuthContext();
  const [errors, setErrors] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>();
  const [userNeeds, setUserNeeds] = useState<TeamNeed[]>([]);
  const [needsLoading, setNeedsLoading] = useState(false);
  const [resumeExists, setResumeExists] = useState<boolean | null>(null); // null = 未檢查, true = 存在, false = 不存在

  // 多文件履历状态
  const [resumeFiles, setResumeFiles] = useState<any[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);

  useEffect(() => {
    async function getUserData() {
      try {
        const { status, data } = await RequestHelper.get<UserProfile>(
          `/api/userinfo?id=${currentUserId}`,
          {
            headers: {
              Authorization: user.token!,
            },
          },
        );
        console.log('[UserAdminView] 獲取用戶數據:', data);
        console.log(
          '[UserAdminView] 性別:',
          (data as any).gender,
          '用戶性別:',
          (data as any).user?.gender,
        );
        console.log(
          '[UserAdminView] 暱稱:',
          (data as any).nickname,
          '用戶暱稱:',
          (data as any).user?.nickname,
        );
        console.log(
          '[UserAdminView] 組隊狀態:',
          (data as any).teamStatus,
          '用戶組隊狀態:',
          (data as any).user?.teamStatus,
        );
        setCurrentUser(data);
        setSelectedRoles(data.user.permissions || []);

        // 同時獲取用戶的找隊友需求
        fetchUserNeeds();
      } catch (error) {
        console.error('[UserAdminView] 獲取用戶數據錯誤:', error);
        setErrors((prev) => [...prev, '意外錯誤，請稍後再試']);
      } finally {
        setLoading(false);
      }
    }
    getUserData();
  }, [currentUserId]);

  const fetchUserNeeds = async () => {
    setNeedsLoading(true);
    try {
      const { data } = await RequestHelper.get<{ success: boolean; data: TeamNeed[] }>(
        `/api/team-up/user-needs?userId=${currentUserId}`,
        {
          headers: {
            Authorization: user.token!,
          },
        },
      );
      if (data.success) {
        setUserNeeds(data.data);
      }
    } catch (error) {
      console.error('Error fetching user needs:', error);
    } finally {
      setNeedsLoading(false);
    }
  };

  // 获取履历列表
  const fetchResumeList = async () => {
    setIsLoadingResumes(true);
    try {
      const response = await fetch(`/api/resume/list?userId=${currentUserId}`);
      const data = await response.json();
      if (data.success) {
        setResumeFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch resume list:', error);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  // Super-admin 删除用户的履历文件
  const handleAdminDeleteResume = async (fileName: string) => {
    if (!user.permissions.includes('super_admin')) {
      alert('您沒有權限執行此操作');
      return;
    }

    if (!confirm(`確定要刪除用戶的履歷文件 ${fileName}？\n\n⚠️ 此操作無法撤銷！`)) {
      return;
    }

    try {
      const response = await fetch('/api/resume/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          fileName,
          targetUserId: currentUserId, // 指定要删除的用户ID
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('刪除成功');
        fetchResumeList(); // 刷新列表
      } else {
        alert('刪除失敗：' + data.message);
      }
    } catch (error) {
      console.error('Admin delete error:', error);
      alert('刪除失敗');
    }
  };

  // 在组件加载时获取履历列表
  useEffect(() => {
    if (currentUserId) {
      fetchResumeList();
    }
  }, [currentUserId]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const updateRoles = async () => {
    if (!user.permissions.includes('super_admin')) {
      alert('您沒有權限執行此操作');
      return;
    }

    if (selectedRoles.length === 0) {
      alert('請至少選擇一個角色');
      return;
    }

    try {
      const { status, data } = await RequestHelper.post<
        {
          userId: string;
          permissions: string[];
        },
        any
      >(
        '/api/users/roles',
        {
          headers: {
            Authorization: user.token,
          },
        },
        {
          userId: currentUserId,
          permissions: selectedRoles,
        },
      );
      if (!status || data.statusCode >= 400) {
        setErrors([...errors, data.msg]);
      } else {
        alert('角色更新成功！');
        setCurrentUser({
          ...currentUser,
          user: {
            ...currentUser.user,
            permissions: selectedRoles,
          },
        });
        updateCurrentUser({
          ...currentUser,
          user: {
            ...currentUser.user,
            permissions: selectedRoles,
          },
        });
      }
    } catch (error) {
      console.error(error);
      setErrors((prev) => [...prev, '意外錯誤，請稍後再試']);
    }
  };

  const handleResumeAction = async (action: 'open' | 'download') => {
    const resume = currentUser.resume || (currentUser as any).user?.resume;
    console.log('[Resume] 履歷原始值:', resume);

    if (!resume) {
      alert('該用戶沒有上傳履歷');
      return;
    }

    let resumeUrl = resume;

    // 檢查是否是完整的 URL
    if (resume && !resume.startsWith('http://') && !resume.startsWith('https://')) {
      console.log('[Resume] 檢測到非 URL 格式，呼叫 API 獲取正確 URL');

      try {
        // 呼叫 API 獲取正確的履歷 URL
        const response = await fetch(`/api/resume/${currentUserId}`, {
          headers: {
            Authorization: user.token!,
          },
        });

        if (!response.ok) {
          throw new Error(`API 返回錯誤: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Resume] API 返回:', data);

        if (data.success && data.url) {
          resumeUrl = data.url;
          console.log('[Resume] 使用 API 返回的 URL:', resumeUrl);

          if (data.warning) {
            console.warn('[Resume] API 警告:', data.warning);
          }
        } else {
          throw new Error('API 未返回有效的 URL');
        }
      } catch (error) {
        console.error('[Resume] API 呼叫失敗:', error);
        alert(
          '❌ 無法獲取履歷\n\n' +
            '可能的原因：\n' +
            '1. 履歷文件尚未上傳\n' +
            '2. 上傳時發生錯誤\n' +
            '3. Firebase Storage 尚未啟用\n\n' +
            '請通知用戶重新上傳履歷，或檢查 Firebase Storage 配置。\n\n' +
            '錯誤詳情: ' +
            (error as Error).message,
        );
        return; // 不再嘗試打開
      }
    } else {
      console.log('[Resume] 使用完整 URL:', resumeUrl);
    }

    console.log('[Resume] 最終 URL:', resumeUrl);
    console.log('[Resume] 操作:', action);

    try {
      if (action === 'open') {
        const opened = window.open(resumeUrl, '_blank', 'noopener,noreferrer');
        if (!opened || opened.closed || typeof opened.closed == 'undefined') {
          console.error('[Resume] 彈出窗口被阻止');
          alert('無法打開履歷。請檢查瀏覽器是否阻止了彈出窗口，或直接複製 URL：\n' + resumeUrl);
        }
      } else {
        // 下載履歷
        console.log('[Resume] 開始下載履歷');
        const link = document.createElement('a');
        link.href = resumeUrl;
        link.download = `${currentUser.user.firstName}_${currentUser.user.lastName}_resume`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('[Resume] 下載觸發完成');
      }
    } catch (error) {
      console.error('[Resume] 操作失敗:', error);
      alert(
        '操作失敗：' +
          (error as Error).message +
          '\n\n履歷原始值: ' +
          resume +
          '\n\n最終 URL: ' +
          resumeUrl,
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadIcon height={200} width={200} />
      </div>
    );
  }

  const formatDate = (timestamp: number | any) => {
    if (!timestamp) return 'N/A';
    // 处理 Firestore Timestamp
    const dateValue =
      typeof timestamp === 'number' ? timestamp : timestamp.toMillis?.() || timestamp;
    return new Date(dateValue).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        {errors.length > 0 && (
          <ErrorList
            errors={errors}
            onClose={(idx: number) => {
              const newErrorList = [...errors];
              newErrorList.splice(idx, 1);
              setErrors(newErrorList);
            }}
          />
        )}

        {/* 返回按鈕 */}
        <button
          className="mb-6 px-6 py-3 border-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            borderColor: '#1a3a6e',
            color: '#1a3a6e',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1a3a6e';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#1a3a6e';
          }}
          onClick={goBack}
        >
          ← 返回用戶列表
        </button>

        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
            用戶詳情
          </h1>
          <p className="text-gray-600 text-lg">查看和管理用戶的完整資料</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：基本資料 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息卡片 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                基本資料
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">姓名</label>
                  <p className="text-lg font-semibold">
                    {currentUser.user.firstName} {currentUser.user.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">暱稱</label>
                  <p className="text-lg font-semibold">
                    {currentUser.nickname || (currentUser as any).user?.nickname || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">電子郵件</label>
                  <p className="text-lg font-semibold">{currentUser.user.preferredEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">性別</label>
                  <p className="text-lg font-semibold">
                    {(() => {
                      const gender = currentUser.gender || (currentUser as any).user?.gender;
                      const genderLower = (gender || '').toLowerCase();
                      return genderLower === 'male'
                        ? '男'
                        : genderLower === 'female'
                        ? '女'
                        : genderLower === 'other'
                        ? '其他'
                        : genderLower === 'notsay'
                        ? '不願透露'
                        : '-';
                    })()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">組隊狀態</label>
                  <p className="text-lg font-semibold">
                    {(() => {
                      const teamStatus =
                        currentUser.teamStatus || (currentUser as any).user?.teamStatus;
                      return teamStatus === 'individual'
                        ? '個人'
                        : teamStatus === 'fullTeam'
                        ? '完整隊伍'
                        : teamStatus === 'partialTeam'
                        ? '有隊伍但缺隊友'
                        : teamStatus || '-';
                    })()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">註冊日期</label>
                  <p className="text-lg font-semibold">{formatDate(currentUser.timestamp)}</p>
                </div>
              </div>
            </div>

            {/* 社交連結卡片 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                社交連結與資料
              </h2>
              <div className="space-y-3">
                {(() => {
                  const github = currentUser.github || (currentUser as any).user?.github;
                  const linkedin = currentUser.linkedin || (currentUser as any).user?.linkedin;
                  const website = currentUser.website || (currentUser as any).user?.website;
                  const resume = currentUser.resume || (currentUser as any).user?.resume;

                  return (
                    <>
                      {github && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            GitHub
                          </label>
                          <a
                            href={github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {github}
                          </a>
                        </div>
                      )}
                      {linkedin && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            LinkedIn
                          </label>
                          <a
                            href={linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {linkedin}
                          </a>
                        </div>
                      )}
                      {website && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            個人網站
                          </label>
                          <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {website}
                          </a>
                        </div>
                      )}
                      {/* 履历文件列表 - 多文件支持 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          履歷文件
                        </label>

                        {isLoadingResumes ? (
                          <div className="text-gray-500">載入中...</div>
                        ) : resumeFiles.length > 0 ? (
                          <div className="space-y-2">
                            {resumeFiles.map((file, index) => (
                              <div
                                key={index}
                                className="p-3 bg-gray-50 rounded border border-gray-200"
                              >
                                <div className="flex items-start justify-between">
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
                                        <div className="text-xs text-green-600">
                                          ✓ 文件存在{' '}
                                          {file.size ? `(${(file.size / 1024).toFixed(2)} KB)` : ''}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-red-600">✗ 文件不存在</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {file.exists && (
                                      <button
                                        onClick={async () => {
                                          try {
                                            const response = await fetch(
                                              `/api/resume/${currentUserId}`,
                                              {
                                                headers: { Authorization: user.token! },
                                              },
                                            );
                                            const data = await response.json();
                                            if (data.success && data.url) {
                                              window.open(data.url, '_blank');
                                            } else {
                                              alert('無法獲取履歷 URL');
                                            }
                                          } catch (error) {
                                            alert('獲取文件失敗');
                                          }
                                        }}
                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                                      >
                                        下載
                                      </button>
                                    )}
                                    {user.permissions.includes('super_admin') && (
                                      <button
                                        onClick={() => handleAdminDeleteResume(file.fileName)}
                                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex-shrink-0"
                                      >
                                        刪除
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm bg-gray-50 p-3 rounded">
                            無履歷文件
                          </div>
                        )}
                      </div>
                      {!github &&
                        !linkedin &&
                        !website &&
                        resumeFiles.length === 0 &&
                        !isLoadingResumes && (
                          <p className="text-gray-500 text-center py-4">
                            該用戶未提供社交連結或履歷
                          </p>
                        )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 找隊友需求列表 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                找隊友需求 ({userNeeds.length})
              </h2>
              {needsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : userNeeds.length > 0 ? (
                <div className="space-y-3">
                  {userNeeds.map((need) => (
                    <div
                      key={need.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{need.title}</h3>
                          <p className="text-sm text-gray-600">
                            {need.projectTrack} | {need.projectStage}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            need.isOpen
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {need.isOpen ? '開放中' : '已關閉'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{need.brief}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>發布於 {formatDate(need.createdAt)}</span>
                        <a
                          href={`/team-up/${need.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          查看詳情 →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">該用戶尚未創建任何找隊友需求</p>
              )}
            </div>
          </div>

          {/* 右側：角色管理 */}
          <div className="lg:col-span-1">
            {user.permissions.includes('super_admin') && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                  角色管理
                </h2>
                <p className="text-sm text-gray-600 mb-4">選擇該用戶的角色（可多選）</p>

                <div className="space-y-2 mb-6">
                  {ALL_ROLES.map((role) => (
                    <label
                      key={role}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedRoles.includes(role)
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
                    </label>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">當前角色：</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentUser.user.permissions.map((role) => (
                      <span
                        key={role}
                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                      >
                        {ROLE_LABELS[role] || role}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={updateRoles}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  disabled={
                    JSON.stringify(selectedRoles.sort()) ===
                    JSON.stringify(currentUser.user.permissions.sort())
                  }
                >
                  更新角色
                </button>
              </div>
            )}

            {!user.permissions.includes('super_admin') && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                  用戶角色
                </h2>
                <div className="space-y-2">
                  {currentUser.user.permissions.map((role) => (
                    <div
                      key={role}
                      className="px-4 py-2 bg-gray-100 rounded-lg text-center font-medium"
                    >
                      {ROLE_LABELS[role] || role}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
