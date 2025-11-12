/**
 * Team Delete Requests Component
 * Displays pending team delete requests for admin review
 */

import React, { useEffect, useState } from 'react';
import { RequestHelper } from '../../lib/request-helper';
import { useAuthContext } from '../../lib/user/AuthContext';

interface DeleteRequest {
  id: string;
  teamId: string;
  teamName: string;
  requestedBy: {
    userId: string;
    email: string;
    name: string;
    role: string;
  };
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function TeamDeleteRequests() {
  const { user } = useAuthContext();
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user?.token) {
      fetchRequests();
    }
  }, [user?.token]);

  const fetchRequests = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const response = await RequestHelper.get<{ success: boolean; requests: DeleteRequest[] }>(
        '/api/admin/team-delete-requests',
        {
          headers: { Authorization: user.token },
        },
      );

      if (response.success) {
        setRequests(response.requests);
      }
    } catch (error) {
      console.error('[TeamDeleteRequests] Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, teamName: string) => {
    if (!user?.token) return;

    const confirmed = window.confirm(`確定要批准刪除「${teamName}」嗎？此操作無法復原。`);
    if (!confirmed) return;

    try {
      setProcessing(requestId);
      await RequestHelper.post(
        `/api/admin/team-delete-requests/${requestId}/approve`,
        {},
        {
          headers: { Authorization: user.token },
        },
      );

      alert('團隊已刪除');
      await fetchRequests(); // Refresh list
    } catch (error: any) {
      console.error('[TeamDeleteRequests] Error approving request:', error);
      alert(`批准失敗：${error.message || '未知錯誤'}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string, teamName: string) => {
    if (!user?.token) return;

    const confirmed = window.confirm(`確定要拒絕刪除「${teamName}」的請求嗎？`);
    if (!confirmed) return;

    try {
      setProcessing(requestId);
      await RequestHelper.post(
        `/api/admin/team-delete-requests/${requestId}/reject`,
        {},
        {
          headers: { Authorization: user.token },
        },
      );

      alert('刪除請求已拒絕');
      await fetchRequests(); // Refresh list
    } catch (error: any) {
      console.error('[TeamDeleteRequests] Error rejecting request:', error);
      alert(`拒絕失敗：${error.message || '未知錯誤'}`);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
          團隊刪除請求
        </h2>
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
          團隊刪除請求
        </h2>
        <p className="text-gray-600">目前沒有待處理的刪除請求</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
        團隊刪除請求
      </h2>
      <p className="text-gray-600 mb-6">共 {requests.length} 個待處理的刪除請求</p>

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                  {request.teamName}
                </h3>

                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">請求者：</span>
                    {request.requestedBy.name} ({request.requestedBy.email})
                  </p>
                  <p>
                    <span className="font-medium">身份：</span>
                    {request.requestedBy.role}
                  </p>
                  <p>
                    <span className="font-medium">請求時間：</span>
                    {new Date(request.requestedAt).toLocaleString('zh-TW', {
                      timeZone: 'Asia/Taipei',
                    })}
                  </p>
                  <p>
                    <span className="font-medium">團隊 ID：</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{request.teamId}</code>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => handleApprove(request.id, request.teamName)}
                  disabled={processing === request.id}
                  className="px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#064e3b',
                    opacity: processing === request.id ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (processing !== request.id) {
                      e.currentTarget.style.backgroundColor = '#065f46';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#064e3b';
                  }}
                >
                  {processing === request.id ? '處理中...' : '✓ 批准刪除'}
                </button>

                <button
                  onClick={() => handleReject(request.id, request.teamName)}
                  disabled={processing === request.id}
                  className="px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#7f1d1d',
                    opacity: processing === request.id ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (processing !== request.id) {
                      e.currentTarget.style.backgroundColor = '#991b1b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#7f1d1d';
                  }}
                >
                  {processing === request.id ? '處理中...' : '✗ 拒絕請求'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
