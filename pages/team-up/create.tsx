/**
 * 找隊友 - 創建需求頁
 */

import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppHeader from '../../components/AppHeader';
import NeedForm from '../../components/teamUp/NeedForm';
import { TeamNeedFormData } from '../../lib/teamUp/types';
import { useAuthContext } from '../../lib/user/AuthContext';

export default function CreateTeamNeed() {
  const router = useRouter();
  const { user, isSignedIn } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: TeamNeedFormData) => {
    if (!isSignedIn || !user) {
      alert('請先登入');
      router.push('/auth?redirect=/team-up/create');
      return;
    }

    setIsSubmitting(true);
    try {
      // 使用 AuthContext 中的 token
      const token = user.token;

      const response = await fetch('/api/team-up/needs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || '創建失敗');
      }

      // 成功後跳轉到詳情頁
      alert('需求發布成功！');
      router.push(`/team-up/${result.data.id}`);
    } catch (error: any) {
      console.error('Error creating need:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 如果未登入，顯示提示
  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>發布找隊友需求 | RWA Hackathon Taiwan</title>
        </Head>

        <AppHeader />

        <div className="min-h-screen bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 py-20 text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                需要登入才能發布需求
              </h1>
              <p className="text-gray-600 mb-8">請先登入您的帳號，才能發布找隊友需求</p>
              <button
                onClick={() => router.push('/auth?redirect=/team-up/create')}
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
        <title>發布找隊友需求 | RWA Hackathon Taiwan</title>
        <meta name="description" content="發布您的找隊友需求，尋找志同道合的夥伴" />
      </Head>

      <AppHeader />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          {/* 頁面標題 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
              發布找隊友需求
            </h1>
            <p className="text-gray-600 text-base">
              填寫您的專案或個人資訊和需要的隊友角色，吸引志同道合的夥伴加入
            </p>
          </div>

          {/* 表單卡片 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            <NeedForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>

          {/* 提示卡片 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 發布成功後</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• 您的需求會立即出現在找隊友列表中</li>
              <li>• 其他黑客可以瀏覽並應徵您的需求</li>
              <li>• 收到應徵時，系統會通過 Email 和站內通知您</li>
              <li>• 您可以在「我的儀表板」中管理所有應徵</li>
              <li>• 隨時可以編輯需求或關閉應徵</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // 可以在這裡添加服務器端的權限檢查
  // 但由於需要 Firebase Auth context，所以在客戶端檢查更簡單
  return {
    props: {},
  };
};
