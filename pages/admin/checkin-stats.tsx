import { useState, useEffect } from 'react';
import { useAuthContext } from '../../lib/user/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface CheckinRecord {
  userId: string;
  userName: string;
  userEmail: string;
  teamName?: string;
  checkedInAt: any;
  checkedInBy: string;
}

export default function CheckinStatsPage() {
  const { user, isSignedIn } = useAuthContext();
  const authLoading = !isSignedIn;
  const router = useRouter();
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.permissions) {
      const isAdmin = user.permissions.includes('admin') || 
                      user.permissions.includes('super_admin') ||
                      user.permissions.includes('organizer');
      if (!isAdmin) {
        router.push('/');
        return;
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      if (!user?.token) return;
      
      // Load check-ins via API
      const checkinsRes = await fetch('/api/checkins/list', {
        headers: {
          Authorization: user.token,
        },
      });
      
      if (checkinsRes.ok) {
        const checkinsData = await checkinsRes.json();
        setCheckins(checkinsData.checkins || []);
        setTotalUsers(checkinsData.totalUsers || 0);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const filteredCheckins = checkins.filter(checkin =>
    checkin.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    checkin.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (checkin.teamName && checkin.teamName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const checkinRate = totalUsers > 0 ? (checkins.length / totalUsers * 100).toFixed(1) : 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                報到統計
              </h1>
              <p className="text-gray-600">
                RWA 黑客松 2025 - 參賽者報到記錄
              </p>
            </div>
            <Link href="/admin/checkin" passHref>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition duration-200">
                📱 掃描報到
              </button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">已報到人數</p>
                <p className="text-4xl font-bold text-green-600">{checkins.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">總參賽人數</p>
                <p className="text-4xl font-bold text-blue-600">{totalUsers}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">報到率</p>
                <p className="text-4xl font-bold text-purple-600">{checkinRate}%</p>
              </div>
              <div className="bg-purple-100 rounded-full p-4">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <input
            type="text"
            placeholder="搜尋姓名、郵箱或團隊名稱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Check-ins List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              報到記錄 ({filteredCheckins.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    郵箱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    團隊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    報到時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    處理人員
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCheckins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {searchQuery ? '沒有符合的記錄' : '尚無報到記錄'}
                    </td>
                  </tr>
                ) : (
                  filteredCheckins.map((checkin, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {checkin.userName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {checkin.userEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {checkin.teamName || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {checkin.checkedInAt?.toDate 
                            ? new Date(checkin.checkedInAt.toDate()).toLocaleString('zh-TW')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {checkin.checkedInBy}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadData}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg shadow transition duration-200"
          >
            🔄 重新整理
          </button>
        </div>
      </div>
    </div>
  );
}

