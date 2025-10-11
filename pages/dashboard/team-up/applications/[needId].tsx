/**
 * 申請管理頁 - 查看和管理某個需求收到的所有申請
 */

import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppHeader from '../../../../components/AppHeader';
import { useAuthContext } from '../../../../lib/user/AuthContext';
import { TeamApplication, TeamNeed } from '../../../../lib/teamUp/types';
import { timestampToDate } from '../../../../lib/teamUp/dateUtils';

interface ApplicationsManagerProps {
  needId: string;
}

export default function ApplicationsManager({ needId }: ApplicationsManagerProps) {
  const router = useRouter();
  const { user, isSignedIn } = useAuthContext();
  const [need, setNeed] = useState<TeamNeed | null>(null);
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // 獲取需求和申請數據
  const fetchData = async () => {
    if (!user) return;

    try {
      const token = user.token;

      // 獲取需求詳情
      const needResponse = await fetch(`/api/team-up/needs/${needId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (needResponse.ok) {
        const needResult = await needResponse.json();
        setNeed(needResult.data);
      }

      // 獲取申請列表
      console.log('[Applications Manager] Fetching applications for needId:', needId);
      const appsResponse = await fetch(`/api/team-up/needs/${needId}/applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[Applications Manager] Response status:', appsResponse.status);

      if (appsResponse.ok) {
        const appsResult = await appsResponse.json();
        console.log('[Applications Manager] API result:', appsResult);
        console.log('[Applications Manager] Applications data:', appsResult.data?.applications);
        console.log(
          '[Applications Manager] Applications count:',
          appsResult.data?.applications?.length || 0,
        );

        const apps = appsResult.data?.applications || [];
        setApplications(apps);
        console.log('[Applications Manager] Set applications state with', apps.length, 'items');
      } else {
        const errorData = await appsResponse.json();
        console.error('[Applications Manager] API error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新申請狀態
  const updateApplicationStatus = async (appId: string, status: 'accepted' | 'rejected') => {
    if (!user) return;

    try {
      const token = user.token;
      const response = await fetch(`/api/team-up/applications/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        alert(status === 'accepted' ? '已接受此申請' : '已拒絕此申請');
        fetchData(); // 重新加載數據
      } else {
        throw new Error('更新失敗');
      }
    } catch (error) {
      alert('操作失敗，請稍後再試');
    }
  };

  // 標記為已讀
  const markAsRead = async (appId: string) => {
    if (!user) return;

    try {
      const token = user.token;
      await fetch(`/api/team-up/applications/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ markAsRead: true }),
      });

      fetchData(); // 重新加載數據
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/auth?redirect=/dashboard/team-up/applications/' + needId);
      return;
    }

    fetchData();
  }, [isSignedIn, user, needId]);

  // 過濾申請
  const filteredApplications =
    filterStatus === 'all'
      ? applications
      : applications.filter((app) => app.status === filterStatus);

  // 狀態樣式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待處理';
      case 'accepted':
        return '已接受';
      case 'rejected':
        return '已拒絕';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>管理申請 | RWA Hackathon Taiwan</title>
        </Head>

        <AppHeader />

        <div className="min-h-screen bg-white pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">載入中...</p>
          </div>
        </div>
      </>
    );
  }

  if (!need) {
    return (
      <>
        <Head>
          <title>管理申請 | RWA Hackathon Taiwan</title>
        </Head>

        <AppHeader />

        <div className="min-h-screen bg-white pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">找不到此需求</h1>
            <button
              onClick={() => router.push('/dashboard/team-up')}
              className="mt-4 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              返回儀表板
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>管理申請：{need.title} | RWA Hackathon Taiwan</title>
      </Head>

      <AppHeader />

      <div className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {/* 返回按鈕 */}
          <button
            onClick={() => router.push('/dashboard/team-up')}
            className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回儀表板
          </button>

          {/* 需求信息 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{need.title}</h1>
            <p className="text-gray-600">{need.brief}</p>
          </div>

          {/* 過濾器 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">篩選：</span>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部 ({applications.length})
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                待處理 ({applications.filter((a) => a.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilterStatus('accepted')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterStatus === 'accepted'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                已接受 ({applications.filter((a) => a.status === 'accepted').length})
              </button>
              <button
                onClick={() => setFilterStatus('rejected')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterStatus === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                已拒絕 ({applications.filter((a) => a.status === 'rejected').length})
              </button>
            </div>
          </div>

          {/* 申請列表 */}
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filterStatus === 'all' ? '還沒有收到申請' : '沒有符合條件的申請'}
              </h3>
              <p className="text-gray-600">
                {filterStatus === 'all' ? '等待其他黑客來申請加入您的專案' : '試試調整篩選條件'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className={`bg-white rounded-lg border p-6 ${
                    !application.isReadByOwner ? 'border-blue-400 shadow-md' : 'border-gray-200'
                  }`}
                >
                  {/* 狀態標籤 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-sm rounded ${getStatusStyle(
                          application.status,
                        )}`}
                      >
                        {getStatusText(application.status)}
                      </span>
                      {!application.isReadByOwner && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                          未讀
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {application.createdAt
                        ? timestampToDate(application.createdAt).toLocaleString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>

                  {/* 申請者信息 */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">申請者：</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {application.applicantName}
                    </p>
                    <p className="text-sm text-gray-600">{application.applicantEmail}</p>
                  </div>

                  {/* 留言 */}
                  {application.message && (
                    <div className="mb-4 p-3 bg-white rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">申請留言：</p>
                      <p className="text-sm text-gray-900">{application.message}</p>
                    </div>
                  )}

                  {/* 聯繫方式 */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">聯繫方式：</p>
                    <p className="text-sm text-blue-800 font-medium">
                      {application.contactForOwner}
                    </p>
                  </div>

                  {/* 操作按鈕 */}
                  {application.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateApplicationStatus(application.id, 'accepted')}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ✓ 接受
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(application.id, 'rejected')}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        ✕ 拒絕
                      </button>
                    </div>
                  )}

                  {!application.isReadByOwner && (
                    <button
                      onClick={() => markAsRead(application.id)}
                      className="mt-2 w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-white transition-colors"
                    >
                      標記為已讀
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { needId } = context.params || {};

  if (!needId || typeof needId !== 'string') {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      needId,
    },
  };
};
