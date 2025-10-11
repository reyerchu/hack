/**
 * 找隊友 - 編輯需求頁
 */

import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppHeader from '../../../components/AppHeader';
import NeedForm from '../../../components/teamUp/NeedForm';
import { TeamNeed, TeamNeedFormData } from '../../../lib/teamUp/types';
import { useAuthContext } from '../../../lib/user/AuthContext';

interface EditTeamNeedProps {
  needId: string;
}

export default function EditTeamNeed({ needId }: EditTeamNeedProps) {
  const router = useRouter();
  const { user, isSignedIn } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [need, setNeed] = useState<TeamNeed | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 加載現有數據
  useEffect(() => {
    const fetchNeed = async () => {
      if (!isSignedIn || !user) {
        return;
      }

      try {
        const token = user.token;
        const response = await fetch(`/api/team-up/needs/${needId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error?.message || '載入失敗');
        }

        const result = await response.json();

        // 檢查是否有編輯權限
        if (result.data.ownerUserId !== user.id) {
          throw new Error('您沒有權限編輯此需求');
        }

        setNeed(result.data);
      } catch (error: any) {
        console.error('Error fetching need:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNeed();
  }, [needId, isSignedIn, user]);

  const handleSubmit = async (data: TeamNeedFormData) => {
    if (!isSignedIn || !user) {
      alert('請先登入');
      router.push('/auth?redirect=/team-up/edit/' + needId);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = user.token;

      const response = await fetch(`/api/team-up/needs/${needId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || '更新失敗');
      }

      alert('需求更新成功！');
      router.push(`/team-up/${needId}`);
    } catch (error: any) {
      console.error('Error updating need:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 未登入
  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>編輯找隊友需求 | RWA Hackathon Taiwan</title>
        </Head>

        <AppHeader />

        <div className="min-h-screen bg-gray-50 pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">需要登入才能編輯需求</h1>
              <p className="text-gray-600 mb-8">請先登入您的帳號</p>
              <button
                onClick={() => router.push(`/auth?redirect=/team-up/edit/${needId}`)}
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

  // 載入中
  if (isLoading) {
    return (
      <>
        <Head>
          <title>編輯找隊友需求 | RWA Hackathon Taiwan</title>
        </Head>

        <AppHeader />

        <div className="min-h-screen bg-gray-50 pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">載入中...</p>
          </div>
        </div>
      </>
    );
  }

  // 錯誤
  if (error || !need) {
    return (
      <>
        <Head>
          <title>編輯找隊友需求 | RWA Hackathon Taiwan</title>
        </Head>

        <AppHeader />

        <div className="min-h-screen bg-gray-50 pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-6xl mb-4">😕</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{error || '找不到此需求'}</h1>
              <p className="text-gray-600 mb-8">請確認連結是否正確，或您是否有權限編輯此需求</p>
              <button
                onClick={() => router.push('/team-up')}
                className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                返回列表
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 準備初始數據
  const initialData: TeamNeedFormData = {
    title: need.title,
    projectTrack: need.projectTrack,
    projectStage: need.projectStage,
    brief: need.brief,
    rolesNeeded: need.rolesNeeded,
    haveRoles: need.haveRoles,
    otherNeeds: need.otherNeeds,
    contactHint: need.contactHint,
    isOpen: need.isOpen,
  };

  return (
    <>
      <Head>
        <title>編輯需求：{need.title} | RWA Hackathon Taiwan</title>
        <meta name="description" content={`編輯找隊友需求：${need.title}`} />
      </Head>

      <AppHeader />

      <div className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {/* 頁面標題 */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
              編輯找隊友需求
            </h1>
            <p className="text-gray-600 text-lg">更新您的專案資訊和需要的隊友角色</p>
          </div>

          {/* 表單卡片 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            <NeedForm
              initialData={initialData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isEdit={true}
            />
          </div>

          {/* 關閉需求按鈕 */}
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">⚠️ 關閉需求</h3>
            <p className="text-sm text-orange-800 mb-4">
              如果您已找到隊友或不再需要找隊友，可以關閉此需求。關閉後將不再接受新的應徵，但已有的應徵記錄會保留。您隨時可以重新開啟。
            </p>
            <button
              onClick={async () => {
                if (!confirm('確定要關閉此需求嗎？關閉後將不再接受新的應徵。')) {
                  return;
                }

                try {
                  const token = user!.token;
                  const response = await fetch(`/api/team-up/needs/${needId}`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      isOpen: false,
                    }),
                  });

                  if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error?.message || '關閉失敗');
                  }

                  alert('需求已關閉');
                  router.push(`/team-up/${needId}`);
                } catch (error: any) {
                  alert('關閉失敗：' + error.message);
                }
              }}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              關閉此需求
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};

  if (!id || typeof id !== 'string') {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      needId: id,
    },
  };
};
