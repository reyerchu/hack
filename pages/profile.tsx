import { useRouter } from 'next/router';
import Image from 'next/image';
import React, { useState } from 'react';
import { useAuthContext } from '../lib/user/AuthContext';
import QRCode from '../components/dashboardComponents/QRCode';
import { RequestHelper } from '../lib/request-helper';

/**
 * A page that allows a user to modify app or profile settings and see their data.
 *
 * Route: /profile
 */
export default function ProfilePage() {
  const router = useRouter();
  const { isSignedIn, hasProfile, user, profile, updateProfile } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    github: '',
    linkedin: '',
    website: '',
  });

  const handleEditClick = () => {
    setEditData({
      firstName: profile.user.firstName || '',
      lastName: profile.user.lastName || '',
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

      updateProfile(updatedProfile);
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
          <h1 className="text-3xl font-bold">個人檔案</h1>
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
        </div>
        <section className="w-full py-5">
          <div className="flex flex-col gap-y-6">
            {/* QR Code Card */}
            <div className="bg-gray-300 w-full rounded-xl p-6 flex flex-col items-center gap-4">
              <h1 className="font-bold text-xl text-center">黑客松台灣</h1>
              <QRCode data={'hack:' + user.id} loading={false} width={200} height={200} />
              <div className="text-center">
                <h1 className="font-bold text-xl">{`${profile.user.firstName} ${profile.user.lastName}`}</h1>
                <p className="text-gray-700">
                  {profile.user.permissions[0] === 'hacker' ? '黑客' : profile.user.permissions[0]}
                </p>
              </div>
            </div>

            {/* Profile Information */}
            <div className="w-full bg-white rounded-xl border-2 border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-6 pb-2 border-b-2 border-gray-300">個人資料</h2>
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
      </div>
    </div>
  );
}
