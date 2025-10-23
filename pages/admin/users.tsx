import Head from 'next/head';
import { useEffect, useState } from 'react';
import AdminHeader from '../../components/adminComponents/AdminHeader';
import { RequestHelper } from '../../lib/request-helper';
import { UserData } from '../api/users';
import { useAuthContext } from '../../lib/user/AuthContext';
import UserAdminView from '../../components/adminComponents/UserAdminView';
import { isAuthorized } from '.';

type UserIdentifier = Omit<UserData, 'scans'>;

/**
 *
 * The User Dashboard of Admin Console. Shows all users that are registered in the system.
 *
 * Route: /admin/users
 *
 */
export default function UserPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserIdentifier[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserIdentifier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<
    'all' | 'email' | 'name' | 'nickname' | 'gender' | 'teamStatus'
  >('all');
  const [currentUser, setCurrentUser] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  const { user } = useAuthContext();

  let timer: NodeJS.Timeout;

  const [filter, setFilter] = useState({
    hacker: true,
    judge: false,
    sponsor: false,
    organizer: false,
    admin: false,
    super_admin: false,
  });

  async function fetchAllUsers() {
    setLoading(true);
    if (!user) return;

    const { data } = await RequestHelper.get<UserIdentifier[]>('/api/users', {
      headers: {
        Authorization: user.token,
      },
    });

    // Apply default filter (hackers only) and sort by registration date (descending)
    const hackersOnly = data.filter(({ user }) => user.permissions.includes('hacker'));
    const sortedByDate = hackersOnly.sort((a, b) => {
      // Support both old (timestamp) and new (createdAt) formats
      const timeA = a.timestamp || ((a as any).createdAt?._seconds ? (a as any).createdAt._seconds * 1000 : 0);
      const timeB = b.timestamp || ((b as any).createdAt?._seconds ? (b as any).createdAt._seconds * 1000 : 0);
      return timeB - timeA; // Descending order (newest first)
    });

    setUsers(data);
    setFilteredUsers(sortedByDate);
    setLoading(false);
  }

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (loading) return;
    timer = setTimeout(() => {
      if (searchQuery !== '') {
        const query = searchQuery.toLowerCase();
        const newFiltered = users.filter((userData) => {
          const u = userData.user;

          switch (searchField) {
            case 'email':
              return u.preferredEmail?.toLowerCase().includes(query);
            case 'name':
              return `${u.firstName} ${u.lastName}`.toLowerCase().includes(query);
            case 'nickname':
              return u.nickname?.toLowerCase().includes(query);
            case 'gender':
              return u.gender?.toLowerCase().includes(query);
            case 'teamStatus':
              return u.teamStatus?.toLowerCase().includes(query);
            case 'all':
            default:
              return (
                u.preferredEmail?.toLowerCase().includes(query) ||
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(query) ||
                u.nickname?.toLowerCase().includes(query) ||
                u.gender?.toLowerCase().includes(query) ||
                u.teamStatus?.toLowerCase().includes(query) ||
                u.github?.toLowerCase().includes(query) ||
                u.linkedin?.toLowerCase().includes(query) ||
                u.website?.toLowerCase().includes(query)
              );
          }
        });

        // Sort by registration date (descending - newest first)
        const sortedFiltered = newFiltered.sort((a, b) => {
          const timeA = a.timestamp || 0;
          const timeB = b.timestamp || 0;
          return timeB - timeA;
        });

        setFilteredUsers(sortedFiltered);
      } else {
        // Sort by registration date (descending - newest first)
        const sortedUsers = [...users].sort((a, b) => {
          const timeA = a.timestamp || 0;
          const timeB = b.timestamp || 0;
          return timeB - timeA;
        });
        setFilteredUsers(sortedUsers);
      }
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery, searchField, loading, users]);

  const updateFilter = (name: string) => {
    const filterCriteria = {
      ...filter,
      [name]: !filter[name],
    };
    const newFilteredUser = users.filter(({ user }) => {
      for (let category of Object.keys(filterCriteria)) {
        if (filterCriteria[category] && user.permissions.includes(category)) {
          return true;
        }
      }
      return false;
    });

    // Sort by registration date (descending - newest first)
    const sortedUsers = newFilteredUser.sort((a, b) => {
      // Support both old (timestamp) and new (createdAt) formats
      const timeA = a.timestamp || ((a as any).createdAt?._seconds ? (a as any).createdAt._seconds * 1000 : 0);
      const timeB = b.timestamp || ((b as any).createdAt?._seconds ? (b as any).createdAt._seconds * 1000 : 0);
      return timeB - timeA;
    });

    setFilteredUsers(sortedUsers);
    setFilter(filterCriteria);
    setCurrentPage(1);
  };

  const sortBy = (
    field: 'name' | 'email' | 'nickname' | 'gender' | 'teamStatus' | 'registeredDate',
  ) => {
    setFilteredUsers((prev) =>
      [...prev].sort((a, b) => {
        // Special handling for timestamp/date field
        if (field === 'registeredDate') {
          // Support both old (timestamp) and new (createdAt) formats
          const timeA = a.timestamp || ((a as any).createdAt?._seconds ? (a as any).createdAt._seconds * 1000 : 0);
          const timeB = b.timestamp || ((b as any).createdAt?._seconds ? (b as any).createdAt._seconds * 1000 : 0);
          return timeB - timeA; // Descending order (newest first)
        }

        let valueA = '';
        let valueB = '';

        switch (field) {
          case 'name':
            valueA = a.user.firstName + ' ' + a.user.lastName;
            valueB = b.user.firstName + ' ' + b.user.lastName;
            break;
          case 'email':
            valueA = a.user.preferredEmail || '';
            valueB = b.user.preferredEmail || '';
            break;
          case 'nickname':
            valueA = a.user.nickname || '';
            valueB = b.user.nickname || '';
            break;
          case 'gender':
            valueA = a.user.gender || '';
            valueB = b.user.gender || '';
            break;
          case 'teamStatus':
            valueA = a.user.teamStatus || '';
            valueB = b.user.teamStatus || '';
            break;
        }

        return valueA.localeCompare(valueB);
      }),
    );
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      '暱稱',
      '姓名',
      '註冊日期',
      '電子郵件',
      '性別',
      '組隊狀態',
      'Github',
      'LinkedIn',
      '個人網站',
      '權限',
    ];
    const rows = filteredUsers.map((userData) => {
      const u = userData.user;

      // Format registration date - support both old (timestamp) and new (createdAt) formats
      let registeredDate = '';
      if (userData.timestamp) {
        registeredDate = new Date(userData.timestamp).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      } else if ((userData as any).createdAt?._seconds) {
        registeredDate = new Date((userData as any).createdAt._seconds * 1000).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      }

      return [
        userData.id || '',
        u.nickname || '',
        `${u.firstName} ${u.lastName}`,
        registeredDate,
        u.preferredEmail || '',
        (u.gender || '').toLowerCase() === 'male'
          ? '男'
          : (u.gender || '').toLowerCase() === 'female'
          ? '女'
          : (u.gender || '').toLowerCase() === 'other'
          ? '其他'
          : (u.gender || '').toLowerCase() === 'notsay'
          ? '不願透露'
          : '',
        u.teamStatus === 'individual'
          ? '個人'
          : u.teamStatus === 'needTeammates'
          ? '缺隊友'
          : u.teamStatus === 'fullTeam'
          ? '完整隊伍'
          : '',
        u.github || '',
        u.linkedin || '',
        u.website || '',
        u.permissions?.join(', ') || '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  if (!user || !isAuthorized(user))
    return <div className="text-2xl font-black text-center pt-24">未授權</div>;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow min-h-screen bg-gray-50">
      <Head>
        <title>用戶管理 - 管理員儀表板</title>
        <meta name="description" content="管理所有註冊用戶" />
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-left" style={{ color: '#1a3a6e' }}>
            管理儀表板
          </h1>
        </div>
        <AdminHeader />

        {currentUser === '' ? (
          <div>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">用戶管理</h1>
              <p className="text-gray-600">總共 {filteredUsers.length} 位用戶</p>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              {/* Search Bar */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">搜索用戶</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="輸入搜索關鍵字..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">搜索欄位</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value as any)}
                  >
                    <option value="all">所有欄位</option>
                    <option value="email">電子郵件</option>
                    <option value="name">姓名</option>
                    <option value="nickname">暱稱</option>
                    <option value="gender">性別</option>
                    <option value="teamStatus">組隊狀態</option>
                  </select>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <span className="text-sm font-medium text-gray-700">權限篩選：</span>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filter.hacker}
                    onChange={() => updateFilter('hacker')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Hacker</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filter.judge}
                    onChange={() => updateFilter('judge')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Judge</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filter.sponsor}
                    onChange={() => updateFilter('sponsor')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Sponsor</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filter.organizer}
                    onChange={() => updateFilter('organizer')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Organizer</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filter.admin}
                    onChange={() => updateFilter('admin')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Admin</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filter.super_admin}
                    onChange={() => updateFilter('super_admin')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Super-Admin</span>
                </label>

                <div className="ml-auto">
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 text-white rounded-lg transition-colors text-sm"
                    style={{
                      backgroundColor: '#1a3a6e',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a4a7e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a3a6e';
                    }}
                  >
                    匯出 CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => sortBy('nickname')}
                      >
                        暱稱 ↕
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => sortBy('name')}
                      >
                        姓名 ↕
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => sortBy('registeredDate')}
                      >
                        註冊日期 ↕
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => sortBy('email')}
                      >
                        電子郵件 ↕
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => sortBy('teamStatus')}
                      >
                        組隊狀態 ↕
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        權限
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          沒有找到用戶
                        </td>
                      </tr>
                    ) : (
                      currentUsers.map((userData, idx) => {
                        const u = userData.user;

                        // Format registration date - support both old (timestamp) and new (createdAt) formats
                        let registeredDate = '-';
                        if (userData.timestamp) {
                          registeredDate = new Date(userData.timestamp).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          });
                        } else if ((userData as any).createdAt?._seconds) {
                          registeredDate = new Date((userData as any).createdAt._seconds * 1000).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          });
                        }

                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{u.nickname || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {u.firstName} {u.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{registeredDate}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{u.preferredEmail || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {u.teamStatus === 'individual'
                                  ? '個人'
                                  : u.teamStatus === 'needTeammates'
                                  ? '缺隊友'
                                  : u.teamStatus === 'fullTeam'
                                  ? '完整隊伍'
                                  : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                {u.permissions?.map((perm, i) => (
                                  <span
                                    key={i}
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      perm === 'super_admin'
                                        ? 'bg-red-100 text-red-800'
                                        : perm === 'admin'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {perm}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {(user.permissions.includes('super_admin') ||
                                user.permissions.includes('admin')) && (
                                <button
                                  onClick={() => setCurrentUser(userData.id)}
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                  查看詳情
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      上一頁
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      下一頁
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-700">
                        顯示 <span className="font-medium">{startIndex + 1}</span> 到{' '}
                        <span className="font-medium">
                          {Math.min(endIndex, filteredUsers.length)}
                        </span>
                        ， 共 <span className="font-medium">{filteredUsers.length}</span> 位用戶
                      </p>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        <option value={10}>10 / 頁</option>
                        <option value={20}>20 / 頁</option>
                        <option value={50}>50 / 頁</option>
                        <option value={100}>100 / 頁</option>
                      </select>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          ←
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            if (totalPages <= 7) return true;
                            if (page === 1 || page === totalPages) return true;
                            if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                            return false;
                          })
                          .map((page, idx, arr) => {
                            if (idx > 0 && page - arr[idx - 1] > 1) {
                              return (
                                <span key={`ellipsis-${page}`}>
                                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                  </span>
                                  <button
                                    onClick={() => setCurrentPage(page)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                                      currentPage === page
                                        ? 'z-10 border-gray-300'
                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                                    style={
                                      currentPage === page
                                        ? { backgroundColor: '#1a3a6e', color: '#ffffff' }
                                        : {}
                                    }
                                  >
                                    {page}
                                  </button>
                                </span>
                              );
                            }
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'z-10 border-gray-300'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                                style={
                                  currentPage === page
                                    ? { backgroundColor: '#1a3a6e', color: '#ffffff' }
                                    : {}
                                }
                              >
                                {page}
                              </button>
                            );
                          })}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          →
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <UserAdminView
              currentUserId={currentUser}
              goBack={() => {
                setCurrentUser('');
              }}
              updateCurrentUser={(value) => {
                setUsers((prev) => prev.map((obj) => (obj.id === value.id ? { ...value } : obj)));
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
