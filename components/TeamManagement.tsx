import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../lib/user/AuthContext';
import { RequestHelper } from '../lib/request-helper';
import { linkifyText } from '../lib/utils/linkify';

/**
 * Team Management Component
 *
 * Displays all teams the user is part of
 * Allows viewing and editing team details (if user has permission)
 */

interface TeamMember {
  email: string;
  name?: string;
  role: string;
  hasEditRight: boolean;
}

interface Track {
  id: string;
  trackId?: string;
  name: string;
  description?: string;
  sponsorName?: string;
}

interface Team {
  id: string;
  teamName: string;
  teamLeader: {
    userId: string;
    email: string;
    name: string;
    role: string;
    hasEditRight: boolean;
  };
  teamMembers: TeamMember[];
  tracks: Track[];
  challenges: any[];
  status: string;
  myRole: string;
  canEdit: boolean;
  isLeader: boolean;
  createdAt: any;
  updatedAt: any;
}

const TeamManagement: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthContext();

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // View/Edit modal states
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form states
  const [editFormData, setEditFormData] = useState({
    teamName: '',
    teamMembers: [] as TeamMember[],
    tracks: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Delete states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch teams
  useEffect(() => {
    if (user?.token) {
      fetchTeams();
    }
  }, [user]);

  const fetchTeams = async () => {
    if (!user?.token) return;

    try {
      setIsLoading(true);
      setError('');

      const response = await RequestHelper.get<{ data: Team[] }>('/api/team-register/my-teams', {
        headers: { Authorization: user.token },
      });

      if (!response.data || !response.data.data) {
        setError('載入團隊失敗');
        setTeams([]);
        return;
      }

      const teamsData = response.data.data || [];
      console.log(
        '[TeamManagement] Fetched teams:',
        teamsData.map((t) => ({
          id: t.id,
          name: t.teamName,
          leader: t.teamLeader.name,
        })),
      );
      setTeams(teamsData);
    } catch (err: any) {
      console.error('[TeamManagement] Error:', err);
      setError('載入團隊失敗');
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditTeam = (team: Team) => {
    console.log('[TeamManagement] Edit clicked for team:', {
      id: team.id,
      name: team.teamName,
      leader: team.teamLeader.name,
    });
    setSelectedTeam(team);
    setIsEditing(true);
    setShowModal(true);

    // Initialize form data
    setEditFormData({
      teamName: team.teamName,
      teamMembers: team.teamMembers,
      tracks: team.tracks.map((t) => t.id),
    });
    setSaveMessage('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTeam(null);
    setIsEditing(false);
    setSaveMessage('');
  };

  // Handle delete team
  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete || !user?.token) return;

    try {
      setIsDeleting(true);
      console.log('[TeamManagement] Deleting team:', teamToDelete.id);

      const response = await RequestHelper.delete(`/api/team-register/${teamToDelete.id}`, {
        headers: { Authorization: user.token },
      });

      console.log('[TeamManagement] Delete response:', response);

      // Check if this is a delete request (not actual deletion)
      if (response.isRequest) {
        // Team member sent delete request to admin
        alert(response.message || '刪除請求已發送給管理員，請等待審核');

        // Close modal (no need to refresh since team is not deleted)
        setShowDeleteConfirm(false);
        setTeamToDelete(null);
      } else {
        // Admin actually deleted the team
        alert(response.message || '團隊已刪除');

        // Refresh teams list
        await fetchTeams();

        // Close modal
        setShowDeleteConfirm(false);
        setTeamToDelete(null);
      }
    } catch (error: any) {
      console.error('[TeamManagement] Error deleting team:', error);
      alert(`刪除失敗：${error.message || '未知錯誤'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setTeamToDelete(null);
  };

  const handleSaveTeam = async () => {
    if (!user?.token || !selectedTeam) return;

    try {
      setIsSaving(true);
      setSaveMessage('');

      console.log('[TeamManagement] Saving team:', {
        teamId: selectedTeam.id,
        formData: editFormData,
      });

      const response = await RequestHelper.put(
        `/api/team-register/${selectedTeam.id}`,
        { headers: { Authorization: user.token } },
        editFormData,
      );

      if (!response.data || (response.data as any)?.error) {
        setSaveMessage((response.data as any)?.error || '保存失敗');
        return;
      }

      setSaveMessage('保存成功！');

      // Refresh teams list
      await fetchTeams();

      // Close modal after a short delay
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      console.error('[TeamManagement] Save error:', err);
      setSaveMessage('保存失敗：' + (err.message || '未知錯誤'));
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '未知';
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleDateString('zh-TW');
    }
    return new Date(timestamp).toLocaleDateString('zh-TW');
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="mt-4 text-gray-600">載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">您還沒有報名任何團隊</p>
        <button
          onClick={() => router.push('/team-register')}
          className="px-6 py-3 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: '#1a3a6e', color: 'white' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2a4a7e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1a3a6e';
          }}
        >
          立即報名
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teams.map((team) => (
        <div
          key={team.id}
          className="bg-white rounded-lg p-6 shadow-sm border-2"
          style={{ borderColor: '#e5e7eb' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-grow">
              <h3 className="text-xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
                {team.teamName}
                {team.isLeader && (
                  <span
                    className="ml-2 text-sm font-normal px-2 py-1 rounded"
                    style={{ backgroundColor: '#dbeafe', color: '#1a3a6e' }}
                  >
                    隊長
                  </span>
                )}
              </h3>
              <div className="text-xs text-gray-400 mb-2">團隊 ID: {team.id}</div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>我的角色：{team.myRole}</div>
                <div>成員數：{team.teamMembers.length + 1} 人</div>
                <div>賽道數：{team.tracks.length} 個</div>
                <div>報名時間：{formatDate(team.createdAt)}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/teams/${team.id}/public`)}
                className="px-4 py-2 rounded-lg border-2 font-medium transition-colors"
                style={{ borderColor: '#1a3a6e', color: '#1a3a6e' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f4ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                查看
              </button>

              {team.canEdit && (
                <>
                  <button
                    onClick={() => {
                      console.log('[TeamManagement] Navigate to edit page:', {
                        teamId: team.id,
                        teamName: team.teamName,
                        url: `/team-register?edit=${team.id}`,
                      });
                      router.push(`/team-register?edit=${team.id}`);
                    }}
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: '#1a3a6e', color: 'white' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a4a7e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a3a6e';
                    }}
                  >
                    編輯
                  </button>

                  <button
                    onClick={() => handleDeleteTeam(team)}
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: '#dc2626', color: 'white' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#b91c1c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                    }}
                  >
                    刪除請求
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Detailed view of tracks and challenges */}
          {team.tracks.length > 0 && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
              <div className="text-sm font-semibold mb-3" style={{ color: '#1a3a6e' }}>
                參賽賽道與挑戰：
              </div>
              <div className="space-y-4">
                {team.tracks.map((track) => (
                  <div
                    key={track.id}
                    className="rounded-lg p-4"
                    style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                  >
                    {/* Track Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => router.push(`/tracks/${track.id}`)}
                            className="text-base font-semibold hover:underline transition-all"
                            style={{ color: '#1a3a6e' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#2a4a7e';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#1a3a6e';
                            }}
                          >
                            {track.name}
                          </button>
                        </div>

                        {/* Track Description */}
                        {track.description && (
                          <div
                            className="text-xs mb-2"
                            style={{
                              color: '#374151',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              lineHeight: '1.5',
                            }}
                          >
                            {linkifyText(track.description, '#1a3a6e')}
                          </div>
                        )}

                        {track.sponsorName && (
                          <p className="text-xs" style={{ color: '#6b7280' }}>
                            贊助商：{track.sponsorName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Track Challenges */}
                    {team.challenges &&
                      team.challenges.filter(
                        (c: any) => c.trackId === track.trackId || c.trackId === track.id,
                      ).length > 0 && (
                        <div className="mt-3 space-y-2">
                          <h5 className="text-xs font-semibold" style={{ color: '#1a3a6e' }}>
                            挑戰列表：
                          </h5>
                          <div className="space-y-2">
                            {team.challenges
                              .filter(
                                (c: any) => c.trackId === track.trackId || c.trackId === track.id,
                              )
                              .map((challenge: any) => (
                                <div
                                  key={challenge.id}
                                  className="rounded-lg p-3"
                                  style={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                  }}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <button
                                        onClick={() => router.push(`/challenges/${challenge.id}`)}
                                        className="text-sm font-medium hover:underline transition-all"
                                        style={{ color: '#1a3a6e' }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = '#2a4a7e';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = '#1a3a6e';
                                        }}
                                      >
                                        {challenge.title}
                                      </button>

                                      {/* Submission Status */}
                                      {challenge.submissionStatus && (
                                        <span
                                          className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                                          style={{
                                            backgroundColor:
                                              challenge.submissionStatus === '提交完成'
                                                ? '#dcfce7'
                                                : '#fee2e2',
                                            color:
                                              challenge.submissionStatus === '提交完成'
                                                ? '#166534'
                                                : '#991b1b',
                                          }}
                                        >
                                          {challenge.submissionStatus}
                                        </span>
                                      )}
                                    </div>

                                    {/* Submit button for challenge */}
                                    <button
                                      onClick={() =>
                                        router.push(
                                          `/team/${team.id}/submit-challenge/${challenge.id}`,
                                        )
                                      }
                                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
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
                                      <svg
                                        className="w-3 h-3"
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
                                      提交
                                    </button>
                                  </div>

                                  {/* Challenge Description */}
                                  {challenge.description && (
                                    <div
                                      className="text-xs mb-2"
                                      style={{
                                        color: '#374151',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        lineHeight: '1.5',
                                      }}
                                    >
                                      {linkifyText(challenge.description, '#1a3a6e')}
                                    </div>
                                  )}

                                  {/* Submission Requirements */}
                                  {challenge.submissionRequirements &&
                                    Array.isArray(challenge.submissionRequirements) &&
                                    challenge.submissionRequirements.length > 0 && (
                                      <div className="mt-2">
                                        <div
                                          className="text-xs font-semibold mb-1"
                                          style={{ color: '#1a3a6e' }}
                                        >
                                          提交要求：
                                        </div>
                                        <div className="space-y-1">
                                          {challenge.submissionRequirements.map(
                                            (req: any, idx: number) => {
                                              let icon = '•';
                                              if (req.type === 'file') icon = '📎';
                                              if (req.type === 'link') icon = '🔗';
                                              if (req.type === 'checkbox') icon = '☑️';
                                              if (req.type === 'text') icon = '✍️';

                                              return (
                                                <div
                                                  key={idx}
                                                  className="text-xs flex items-start gap-2"
                                                  style={{ color: '#6b7280' }}
                                                >
                                                  <span>{icon}</span>
                                                  <span>{req.description}</span>
                                                </div>
                                              );
                                            },
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Prizes */}
                                  {challenge.prizes &&
                                    Array.isArray(challenge.prizes) &&
                                    challenge.prizes.length > 0 && (
                                      <div className="mt-2">
                                        <div
                                          className="text-xs font-semibold mb-1"
                                          style={{ color: '#1a3a6e' }}
                                        >
                                          獎金：
                                        </div>
                                        <div className="space-y-1">
                                          {challenge.prizes.map((prize: any, idx: number) => (
                                            <div
                                              key={idx}
                                              className="text-xs"
                                              style={{ color: '#059669' }}
                                            >
                                              💰 {prize.currency} {prize.amount.toLocaleString()} -{' '}
                                              {prize.description}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Modal for viewing/editing team details */}
      {showModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                    {isEditing ? '編輯團隊' : '團隊詳情'}
                  </h2>
                  <div className="text-xs text-gray-400 mt-1">團隊 ID: {selectedTeam.id}</div>
                </div>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Team Name */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    團隊名稱
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editFormData.teamName}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, teamName: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      style={{ borderColor: '#d1d5db' }}
                      placeholder="請輸入團隊名稱"
                    />
                  ) : (
                    <div className="text-lg font-semibold">{selectedTeam.teamName}</div>
                  )}
                </div>

                {/* Team Leader */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    隊長
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-medium">{selectedTeam.teamLeader.name}</div>
                    <div className="text-sm text-gray-600">{selectedTeam.teamLeader.email}</div>
                    <div className="text-sm text-gray-600">
                      角色：{selectedTeam.teamLeader.role}
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    團隊成員 (
                    {isEditing ? editFormData.teamMembers.length : selectedTeam.teamMembers.length})
                  </label>
                  <div className="space-y-2">
                    {(isEditing ? editFormData.teamMembers : selectedTeam.teamMembers).map(
                      (member, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="email"
                                  value={member.email}
                                  onChange={(e) => {
                                    const updated = [...editFormData.teamMembers];
                                    updated[index].email = e.target.value;
                                    setEditFormData({ ...editFormData, teamMembers: updated });
                                  }}
                                  className="flex-1 px-3 py-2 border rounded text-sm"
                                  style={{ borderColor: '#d1d5db' }}
                                  placeholder="成員 Email"
                                />
                                <button
                                  onClick={() => {
                                    const updated = editFormData.teamMembers.filter(
                                      (_, i) => i !== index,
                                    );
                                    setEditFormData({ ...editFormData, teamMembers: updated });
                                  }}
                                  className="px-3 py-2 text-sm rounded hover:bg-red-100"
                                  style={{ color: '#dc2626' }}
                                >
                                  刪除
                                </button>
                              </div>
                              <input
                                type="text"
                                value={member.role}
                                onChange={(e) => {
                                  const updated = [...editFormData.teamMembers];
                                  updated[index].role = e.target.value;
                                  setEditFormData({ ...editFormData, teamMembers: updated });
                                }}
                                className="w-full px-3 py-2 border rounded text-sm"
                                style={{ borderColor: '#d1d5db' }}
                                placeholder="角色"
                              />
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={member.hasEditRight}
                                  onChange={(e) => {
                                    const updated = [...editFormData.teamMembers];
                                    updated[index].hasEditRight = e.target.checked;
                                    setEditFormData({ ...editFormData, teamMembers: updated });
                                  }}
                                  className="rounded"
                                />
                                <span style={{ color: '#374151' }}>擁有編輯權限</span>
                              </label>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium">{member.name || member.email}</div>
                              <div className="text-sm text-gray-600">{member.email}</div>
                              <div className="text-sm text-gray-600">角色：{member.role}</div>
                              {member.hasEditRight && (
                                <div className="text-sm text-blue-600 mt-1">✓ 擁有編輯權限</div>
                              )}
                            </>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => {
                        setEditFormData({
                          ...editFormData,
                          teamMembers: [
                            ...editFormData.teamMembers,
                            { email: '', name: '', role: '', hasEditRight: false },
                          ],
                        });
                      }}
                      className="mt-2 px-4 py-2 text-sm rounded-lg border-2 font-medium transition-colors"
                      style={{ borderColor: '#1a3a6e', color: '#1a3a6e' }}
                    >
                      + 新增成員
                    </button>
                  )}
                </div>

                {/* Tracks */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    參賽賽道 ({selectedTeam.tracks.length})
                  </label>
                  <div className="space-y-2">
                    {selectedTeam.tracks.map((track) => (
                      <div key={track.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="font-medium">{track.name}</div>
                        {track.description && (
                          <div className="text-sm text-gray-600 mt-1">{track.description}</div>
                        )}
                        {track.sponsorName && (
                          <div className="text-sm text-gray-500 mt-1">
                            贊助商：{track.sponsorName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Message */}
                {saveMessage && (
                  <div
                    className="p-3 rounded-lg text-sm text-center"
                    style={{
                      backgroundColor: saveMessage.includes('成功') ? '#d1fae5' : '#fee2e2',
                      color: saveMessage.includes('成功') ? '#065f46' : '#991b1b',
                    }}
                  >
                    {saveMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <div
                  className="flex justify-end gap-3 pt-4 border-t"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCloseModal}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-lg border-2 font-medium transition-colors"
                        style={{ borderColor: '#d1d5db', color: '#374151' }}
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSaveTeam}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: isSaving ? '#9ca3af' : '#1a3a6e',
                          color: 'white',
                          cursor: isSaving ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSaving) e.currentTarget.style.backgroundColor = '#2a4a7e';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSaving) e.currentTarget.style.backgroundColor = '#1a3a6e';
                        }}
                      >
                        {isSaving ? '保存中...' : '保存'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-2 rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: '#1a3a6e', color: 'white' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2a4a7e';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a3a6e';
                      }}
                    >
                      關閉
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && teamToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#dc2626' }}>
              發送刪除請求
            </h3>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                此請求將發送給管理員審核。管理員會在評估後決定是否刪除團隊。
              </p>
              <div className="p-4 bg-gray-50 rounded-lg mt-4">
                <div className="font-semibold text-lg" style={{ color: '#1a3a6e' }}>
                  {teamToDelete.teamName}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  <div>成員數：{teamToDelete.teamMembers.length + 1} 人</div>
                  <div>賽道數：{teamToDelete.tracks.length} 個</div>
                  <div>團隊 ID：{teamToDelete.id}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-6 py-2 rounded-lg border-2 font-medium transition-colors"
                style={{ borderColor: '#d1d5db', color: '#374151' }}
              >
                取消
              </button>
              <button
                onClick={confirmDeleteTeam}
                disabled={isDeleting}
                className="px-6 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: isDeleting ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) e.currentTarget.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) e.currentTarget.style.backgroundColor = '#dc2626';
                }}
              >
                {isDeleting ? '發送中...' : '發送請求'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
