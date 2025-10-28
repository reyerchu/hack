/**
 * Sponsor Track Teams Page
 *
 * Route: /sponsor/tracks/[trackId]/teams
 *
 * Shows all teams registered for a specific track
 */

import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import firebase from 'firebase/app';
import 'firebase/auth';
import { useAuthContext } from '../../../../lib/user/AuthContext';
import { useIsSponsor } from '../../../../lib/sponsor/hooks';

interface TeamMember {
  email: string;
  role: string;
  hasEditRight: boolean;
  name?: string;
  firstName?: string;
  lastName?: string;
}

interface TeamLeader {
  userId: string;
  email: string;
  role: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  preferredEmail?: string;
}

interface Team {
  id: string;
  teamName: string;
  teamLeader: TeamLeader;
  teamMembers: TeamMember[];
  tracks: Array<{ id: string; name: string }>;
  trackIds: string[];
  createdAt: any;
  updatedAt: any;
}

export default function SponsorTrackTeamsPage() {
  const router = useRouter();
  const { trackId } = router.query;
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackName, setTrackName] = useState('');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Selected team for detail view
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Check authorization
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/dashboard');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  // Fetch track name
  useEffect(() => {
    const fetchTrackName = async () => {
      if (!trackId || typeof trackId !== 'string') return;

      try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/sponsor/tracks/${trackId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTrackName(data.data?.name || '');
        }
      } catch (err) {
        console.error('[Teams] Error fetching track name:', err);
      }
    };

    fetchTrackName();
  }, [trackId]);

  // Fetch teams
  const fetchTeams = async () => {
    if (!trackId || typeof trackId !== 'string') return;

    setLoading(true);
    setError('');

    try {
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('未登入');
      }

      const token = await currentUser.getIdToken();
      console.log('[Teams] Fetching teams for track:', trackId);

      const response = await fetch(`/api/sponsor/tracks/${trackId}/teams`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '獲取團隊列表失敗');
      }

      const responseData = await response.json();
      console.log('[Teams] Fetched teams:', responseData);

      const teamsData = responseData.data || responseData || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setFilteredTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (err: any) {
      console.error('[Teams] Error fetching teams:', err);
      setError(err.message || '獲取團隊列表失敗');
      setTeams([]);
      setFilteredTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trackId && isSignedIn && !authLoading) {
      fetchTeams();
    }
  }, [trackId, isSignedIn, authLoading]);

  // Search and filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTeams(teams);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = teams.filter((team) => {
      const teamNameMatch = team.teamName.toLowerCase().includes(query);
      const leaderNameMatch = `${team.teamLeader.firstName || ''} ${team.teamLeader.lastName || ''}`
        .toLowerCase()
        .includes(query);
      const leaderEmailMatch = (team.teamLeader.preferredEmail || team.teamLeader.email || '')
        .toLowerCase()
        .includes(query);
      const membersMatch = team.teamMembers.some((member) => {
        const memberName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
        const memberEmail = (member.email || '').toLowerCase();
        return memberName.includes(query) || memberEmail.includes(query);
      });

      return teamNameMatch || leaderNameMatch || leaderEmailMatch || membersMatch;
    });

    setFilteredTeams(filtered);
    setCurrentPage(1);
  }, [searchQuery, teams]);

  // Pagination
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTeams = filteredTeams.slice(startIndex, endIndex);

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '-';

    try {
      let date: Date;

      if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp);
      }

      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>載入中... | 賽道團隊</title>
        </Head>
        <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
          <div className="container mx-auto px-4 py-12">
            <div className="text-center py-20">
              <div className="inline-block animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-6 text-lg text-gray-600">載入團隊資訊中...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>錯誤 | 賽道團隊</title>
        </Head>
        <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto text-center py-20">
              <h1 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                載入失敗
              </h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#1a3a6e', color: '#ffffff' }}
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{trackName ? `${trackName} - 參賽團隊` : '參賽團隊'} | Hackathon</title>
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-sm font-medium hover:underline"
              style={{ color: '#1a3a6e' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回儀表板
            </button>

            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
              {trackName || '賽道'}參賽團隊
            </h1>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              共 {teams.length} 個團隊報名此賽道
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋團隊名稱、報名者或成員..."
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: '#d1d5db' }}
            />
          </div>

          {/* Teams Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead style={{ backgroundColor: '#f3f4f6' }}>
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: '#1a3a6e' }}
                    >
                      團隊名稱
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: '#1a3a6e' }}
                    >
                      報名者
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: '#1a3a6e' }}
                    >
                      成員數
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: '#1a3a6e' }}
                    >
                      報名日期
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: '#1a3a6e' }}
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTeams.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                        {searchQuery ? '未找到符合條件的團隊' : '目前沒有團隊報名'}
                      </td>
                    </tr>
                  ) : (
                    currentTeams.map((team) => (
                      <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
                            {team.teamName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {team.teamLeader.name || '-'}
                          </div>
                          <div className="text-xs" style={{ color: '#6b7280' }}>
                            {team.teamLeader.preferredEmail || team.teamLeader.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {team.teamMembers.length + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: '#6b7280' }}>
                            {formatDate(team.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              setSelectedTeam(team);
                              setShowDetailModal(true);
                            }}
                            className="font-medium hover:underline"
                            style={{ color: '#1a3a6e' }}
                          >
                            查看詳情
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm" style={{ color: '#6b7280' }}>
                  顯示 {startIndex + 1} - {Math.min(endIndex, filteredTeams.length)} / 共{' '}
                  {filteredTeams.length} 個團隊
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: '#d1d5db',
                      color: '#1a3a6e',
                    }}
                  >
                    上一頁
                  </button>
                  <span className="px-4 py-2 text-sm" style={{ color: '#6b7280' }}>
                    第 {currentPage} / {totalPages} 頁
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: '#d1d5db',
                      color: '#1a3a6e',
                    }}
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Detail Modal */}
      {showDetailModal && selectedTeam && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                {selectedTeam.teamName}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
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

            {/* Team Leader */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#1a3a6e' }}>
                報名者
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium" style={{ color: '#374151' }}>
                  {selectedTeam.teamLeader.name || '-'}
                </p>
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  {selectedTeam.teamLeader.preferredEmail || selectedTeam.teamLeader.email}
                </p>
              </div>
            </div>

            {/* Team Members */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#1a3a6e' }}>
                團隊成員 ({selectedTeam.teamMembers.length})
              </h4>
              {selectedTeam.teamMembers.length === 0 ? (
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  目前無其他成員
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedTeam.teamMembers.map((member, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium" style={{ color: '#374151' }}>
                        {member.name || '-'}
                      </p>
                      <p className="text-sm" style={{ color: '#6b7280' }}>
                        {member.email}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                        {member.hasEditRight ? '可編輯' : '僅查看'} • {member.role}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Other Tracks */}
            {selectedTeam.tracks && selectedTeam.tracks.length > 1 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3" style={{ color: '#1a3a6e' }}>
                  同時報名的其他賽道
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTeam.tracks
                    .filter((track) => track.id !== trackId)
                    .map((track, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: '#e0e7ff', color: '#1a3a6e' }}
                      >
                        {track.name}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span style={{ color: '#6b7280' }}>報名日期：</span>
                  <span style={{ color: '#374151' }}>{formatDate(selectedTeam.createdAt)}</span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>最後更新：</span>
                  <span style={{ color: '#374151' }}>{formatDate(selectedTeam.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
