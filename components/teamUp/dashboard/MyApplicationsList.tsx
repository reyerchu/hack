/**
 * 我的申请记录组件
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { TeamApplication, TeamNeed } from '../../../lib/teamUp/types';
import { TRACK_COLORS, STAGE_ICONS } from '../../../lib/teamUp/constants';
import { useAuthContext } from '../../../lib/user/AuthContext';

interface MyApplicationsListProps {
  applications: (TeamApplication & { need: TeamNeed | null })[];
  onRefresh?: () => void;
}

export default function MyApplicationsList({ applications, onRefresh }: MyApplicationsListProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [withdrawing, setWithdrawing] = useState<{ [key: string]: boolean }>({});

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
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
        return '未通過';
      case 'withdrawn':
        return '已撤回';
      default:
        return status;
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('確定要撤回此申請嗎？撤回後將無法復原。')) return;

    if (!user?.token) {
      alert('請先登入');
      return;
    }

    setWithdrawing({ ...withdrawing, [applicationId]: true });

    try {
      const response = await fetch(`/api/team-up/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          status: 'withdrawn',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || '撤回失敗');
      }

      alert('已成功撤回申請');

      // 刷新列表
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('撤回申請失败:', error);
      alert(error.message || '撤回失敗，請稍後再試');
    } finally {
      setWithdrawing({ ...withdrawing, [applicationId]: false });
    }
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-6xl mb-4">🤝</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">還沒有申請記錄</h3>
        <p className="text-gray-600 mb-6">瀏覽找隊友列表，申請加入感興趣的專案</p>
        <button
          onClick={() => router.push('/team-up')}
          className="px-6 py-3 text-white rounded-lg transition-colors"
          style={{ backgroundColor: '#1a3a6e' }}
        >
          瀏覽需求
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => {
        const { need } = application;

        if (!need) {
          return (
            <div key={application.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-500 text-center">需求已被刪除</p>
            </div>
          );
        }

        return (
          <div
            key={application.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* 狀態和標題 */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`px-3 py-1 text-sm rounded ${getStatusStyle(application.status)}`}
                  >
                    {getStatusText(application.status)}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{need.title}</h3>
                </div>

                {/* 專案標籤 */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-3 py-1 text-sm rounded ${TRACK_COLORS[need.projectTrack]}`}>
                    {need.projectTrack}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded flex items-center gap-1">
                    <span>{STAGE_ICONS[need.projectStage]}</span>
                    <span>{need.projectStage}</span>
                  </span>
                </div>

                {/* 我的留言 */}
                {application.message && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium mb-1">我的留言：</p>
                    <p className="text-sm text-gray-700">{application.message}</p>
                  </div>
                )}

                {/* 我的聯繫方式 */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">我的聯繫方式：</span>
                    <span className="ml-2 text-gray-700">{application.contactForOwner}</span>
                  </p>
                </div>

                {/* 申請時間 */}
                <p className="text-xs text-gray-500">
                  申請時間：
                  {application.createdAt
                    ? new Date((application.createdAt as any).seconds * 1000).toLocaleString(
                        'zh-TW',
                      )
                    : '未知'}
                </p>

                {/* 接受提示 */}
                {application.status === 'accepted' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium mb-1">
                      ✅ 恭喜！您的申請已被接受
                    </p>
                    <p className="text-sm text-green-700">
                      對方的聯繫提示：<span className="font-medium">{need.contactHint}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* 操作按鈕 */}
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => router.push(`/team-up/${need.id}`)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  查看需求
                </button>
                {application.status === 'pending' && (
                  <button
                    onClick={() => handleWithdraw(application.id)}
                    disabled={withdrawing[application.id]}
                    className={`px-4 py-2 text-sm whitespace-nowrap rounded-lg transition-colors ${
                      withdrawing[application.id]
                        ? 'text-gray-400 border border-gray-300 cursor-not-allowed'
                        : 'text-red-600 border border-red-600 hover:bg-red-50'
                    }`}
                  >
                    {withdrawing[application.id] ? '撤回中...' : '撤回申請'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
