/**
 * 找隊友 - 個人儀表板
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppHeader from '../../components/AppHeader';
import MyNeedsList from '../../components/teamUp/dashboard/MyNeedsList';
import MyApplicationsList from '../../components/teamUp/dashboard/MyApplicationsList';
import { useAuthContext } from '../../lib/user/AuthContext';

type TabType = 'needs' | 'applications';

export default function TeamUpDashboard() {
  const router = useRouter();
  const { user, isSignedIn } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabType>('needs');
  const [myNeeds, setMyNeeds] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 獲取我的需求
  const fetchMyNeeds = async () => {
    if (!user) return;

    try {
      const token = user.token;
      const response = await fetch('/api/team-up/my-needs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setMyNeeds(result.data.needs || []);
      }
    } catch (error) {
      console.error('Error fetching my needs:', error);
    }
  };

  // 獲取我的申請
  const fetchMyApplications = async () => {
    if (!user) return;

    try {
      const token = user.token;
      const response = await fetch('/api/team-up/my-applications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setMyApplications(result.data.applications || []);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Error fetching my applications:', error);
    }
  };

  // 初始加載
  useEffect(() => {
    if (!isSignedIn) {
      router.push('/auth?redirect=/dashboard/team-up');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMyNeeds(), fetchMyApplications()]);
      setIsLoading(false);
    };

    loadData();
  }, [isSignedIn, user]);

  // 未登入
  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>找隊友儀表板 | RWA Hackathon Taiwan</title>
        </Head>

        <AppHeader />

        <div className="min-h-screen bg-white pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">需要登入才能查看儀表板</h1>
              <p className="text-gray-600 mb-8">請先登入您的帳號</p>
              <button
                onClick={() => router.push('/auth?redirect=/dashboard/team-up')}
                className="px-8 py-3 text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#1a3a6e' }}
              >
                前往登入
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
        <title>找隊友儀表板 | RWA Hackathon Taiwan</title>
        <meta name="description" content="管理您的找隊友需求和申請記錄" />
      </Head>

      <AppHeader />

      <div className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          {/* 頁面標題 */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
              找隊友儀表板
            </h1>
            <p className="text-gray-600 text-lg">管理您的需求和申請記錄</p>
          </div>

          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                  <p className="text-gray-600 text-sm mb-1">待處理申請</p>
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
          </div>

          {/* 標籤切換 */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('needs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'needs'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                我的需求 ({myNeeds.length})
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'applications'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                我的申請 ({myApplications.length})
              </button>
            </nav>
          </div>

          {/* 內容區域 */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">載入中...</p>
            </div>
          ) : (
            <>
              {activeTab === 'needs' && <MyNeedsList needs={myNeeds} onRefresh={fetchMyNeeds} />}
              {activeTab === 'applications' && (
                <MyApplicationsList applications={myApplications} onRefresh={fetchMyApplications} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
