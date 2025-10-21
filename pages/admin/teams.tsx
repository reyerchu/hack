import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminHeader from '../../components/adminComponents/AdminHeader';
import { RequestHelper } from '../../lib/request-helper';
import { useAuthContext } from '../../lib/user/AuthContext';
import { isAuthorized } from '.';

interface TeamMember {
  email: string;
  role: string;
  hasEditRight: boolean;
  name?: string;
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
  tracks: string[];
  trackIds: string[];
  createdAt: any;
  updatedAt: any;
}

/**
 * Team Management Page for Admin
 * 
 * Route: /admin/teams
 * 
 * Features:
 * - View all team registrations
 * - Search and filter teams
 * - View team details (members, tracks)
 * - Export team data
 */
export default function AdminTeamsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isSignedIn, profile } = useAuthContext();

  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'teamName' | 'leader' | 'track'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Selected team for detail view
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Check authorization
  useEffect(() => {
    if (!authLoading && (!isSignedIn || !isAuthorized(profile))) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, profile, router]);

  // Fetch teams
  const fetchTeams = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!user?.token) {
        throw new Error('未登入');
      }

      console.log('[AdminTeams] Fetching teams...');
      const response = await RequestHelper.get<Team[]>('/api/admin/teams', {
        headers: {
          Authorization: user.token,
        },
      });

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('[AdminTeams] Fetched teams:', response.data);
      setTeams(response.data || []);
      setFilteredTeams(response.data || []);
    } catch (err: any) {
      console.error('[AdminTeams] Error fetching teams:', err);
      setError(err.message || '獲取團隊列表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token && !authLoading) {
      fetchTeams();
    }
  }, [user?.token, authLoading]);

  // Search and filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTeams(teams);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = teams.filter((team) => {
      switch (searchField) {
        case 'teamName':
          return team.teamName.toLowerCase().includes(query);
        
        case 'leader':
          const leaderName = `${team.teamLeader.firstName || ''} ${team.teamLeader.lastName || ''}`.toLowerCase();
          const leaderEmail = team.teamLeader.preferredEmail?.toLowerCase() || team.teamLeader.email?.toLowerCase() || '';
          return leaderName.includes(query) || leaderEmail.includes(query);
        
        case 'track':
          return team.tracks.some(track => track.toLowerCase().includes(query));
        
        case 'all':
        default:
          const teamNameMatch = team.teamName.toLowerCase().includes(query);
          const leaderNameMatch = `${team.teamLeader.firstName || ''} ${team.teamLeader.lastName || ''}`.toLowerCase().includes(query);
          const leaderEmailMatch = (team.teamLeader.preferredEmail?.toLowerCase() || team.teamLeader.email?.toLowerCase() || '').includes(query);
          const trackMatch = team.tracks.some(track => track.toLowerCase().includes(query));
          return teamNameMatch || leaderNameMatch || leaderEmailMatch || trackMatch;
      }
    });

    setFilteredTeams(filtered);
    setCurrentPage(1);
  }, [searchQuery, searchField, teams]);

  // Pagination
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTeams = filteredTeams.slice(startIndex, endIndex);

  // View team detail
  const viewTeamDetail = (team: Team) => {
    setSelectedTeam(team);
    setShowDetailModal(true);
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp._seconds ? new Date(timestamp._seconds * 1000) : new Date(timestamp);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>團隊管理 | Admin</title>
        </Head>
        <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-20">
              <div className="inline-block animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-6 text-lg text-gray-600">載入中...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>團隊管理 | Admin</title>
      </Head>
      
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb', paddingTop: '80px' }}>
        <div className="container mx-auto px-4 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-left" style={{ color: '#1a3a6e' }}>
              管理儀表板
            </h1>
          </div>

          {/* Admin Header (Tabs) */}
          <AdminHeader />

          {/* Team Management Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Header with stats and search */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                    團隊報名管理
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    總共 {teams.length} 個團隊
                    {searchQuery && ` / 搜尋結果: ${filteredTeams.length} 個團隊`}
                  </p>
                </div>
                
                <button
                  onClick={fetchTeams}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: '#1a3a6e',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2d5a8e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a3a6e';
                  }}
                >
                  🔄 重新整理
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Search and Filter */}
              <div className="flex gap-4 items-center">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部</option>
                  <option value="teamName">團隊名稱</option>
                  <option value="leader">領導者</option>
                  <option value="track">賽道</option>
                </select>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋團隊..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>

            {/* Teams Table */}
            {currentTeams.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery ? '沒有符合條件的團隊' : '尚無團隊報名'}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          團隊名稱
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          領導者
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          成員數
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          參賽賽道
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          報名時間
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentTeams.map((team) => (
                        <tr key={team.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {team.teamName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {team.teamLeader.firstName} {team.teamLeader.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {team.teamLeader.preferredEmail || team.teamLeader.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {team.teamMembers.length + 1} 人
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {team.tracks.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {team.tracks.slice(0, 2).map((track, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                                    >
                                      {track}
                                    </span>
                                  ))}
                                  {team.tracks.length > 2 && (
                                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                      +{team.tracks.length - 2}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">未選擇</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(team.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => viewTeamDetail(team)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              查看詳情
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      顯示 {startIndex + 1} - {Math.min(endIndex, filteredTeams.length)} / 共 {filteredTeams.length} 個團隊
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        上一頁
                      </button>
                      
                      <span className="px-4 py-2">
                        {currentPage} / {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        下一頁
                      </button>
                    </div>
                  </div>
                )}
              </>
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
            className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                團隊詳情
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Team Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                  團隊名稱
                </h3>
                <p className="text-gray-700">{selectedTeam.teamName}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                  團隊領導者
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">
                    {selectedTeam.teamLeader.firstName} {selectedTeam.teamLeader.lastName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Email: {selectedTeam.teamLeader.preferredEmail || selectedTeam.teamLeader.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    角色: {selectedTeam.teamLeader.role}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                  團隊成員 ({selectedTeam.teamMembers.length} 人)
                </h3>
                {selectedTeam.teamMembers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTeam.teamMembers.map((member, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium">{member.name || member.email}</p>
                        <p className="text-sm text-gray-600">Email: {member.email}</p>
                        <p className="text-sm text-gray-600">角色: {member.role}</p>
                        <p className="text-sm text-gray-600">
                          編輯權限: {member.hasEditRight ? '是' : '否'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">無其他成員</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                  參賽賽道
                </h3>
                {selectedTeam.tracks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTeam.tracks.map((track, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800"
                      >
                        {track}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">未選擇賽道</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                  時間記錄
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>報名時間: {formatDate(selectedTeam.createdAt)}</p>
                  {selectedTeam.updatedAt && (
                    <p>最後更新: {formatDate(selectedTeam.updatedAt)}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: '#1a3a6e',
                  color: 'white',
                }}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

