/**
 * 找隊友 - 詳情頁
 */

import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppHeader from '../../components/AppHeader';
import ApplicationModal from '../../components/teamUp/ApplicationModal';
import { TeamNeed } from '../../lib/teamUp/types';
import { TRACK_COLORS, STAGE_ICONS } from '../../lib/teamUp/constants';
import { useAuthContext } from '../../lib/user/AuthContext';

interface TeamUpDetailProps {
  need: TeamNeed | null;
  isOwner: boolean;
  error?: string;
}

export default function TeamUpDetail({ need, isOwner: ssrIsOwner, error }: TeamUpDetailProps) {
  const router = useRouter();
  const { user, isSignedIn } = useAuthContext();
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  // 客戶端重新計算 isOwner（SSR 階段可能沒有用戶認證信息）
  const isOwner = React.useMemo(() => {
    if (!user || !need) return false;
    return need.ownerUserId === user.id;
  }, [user, need]);

  // 記錄瀏覽
  useEffect(() => {
    if (need) {
      fetch(`/api/team-up/needs/${need.id}/view`, { method: 'POST' }).catch(console.error);
    }
  }, [need]);

  // 提交應徵
  const handleApply = async (data: { message: string; contactForOwner: string }) => {
    if (!user) {
      alert('請先登入');
      router.push(`/auth?redirect=/team-up/${need!.id}`);
      return;
    }

    try {
      const response = await fetch('/api/team-up/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          needId: need!.id,
          message: data.message,
          contactInfo: data.contactForOwner,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || '應徵失敗');
      }

      // 成功
      alert('應徵成功！需求發布者會收到通知，並透過您提供的聯繫方式與您聯繫。');
      // 可選：重新加載頁面以更新應徵數量
      router.reload();
    } catch (error: any) {
      console.error('Application error:', error);
      throw error;
    }
  };

  if (error || !need) {
    return (
      <>
        <Head>
          <title>找隊友 | RWA Hackathon Taiwan</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen bg-white pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
              {error || '找不到此需求'}
            </h1>
            <p className="text-gray-600 mb-8">此需求可能已被刪除或不存在</p>
            <Link href="/team-up">
              <a
                className="inline-block border-2 px-6 py-3 text-sm font-medium uppercase tracking-wider transition-colors duration-300"
                style={{
                  borderColor: '#1a3a6e',
                  color: '#1a3a6e',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1a3a6e';
                }}
              >
                返回列表
              </a>
            </Link>
          </div>
        </div>
      </>
    );
  }

  // 格式化時間
  const formatDate = (timestamp: any): string => {
    try {
      let date: Date;

      // 處理 Firestore Timestamp 對象
      if (timestamp?.toDate) {
        date = timestamp.toDate();
      }
      // 處理從 API 返回的序列化 Timestamp ({_seconds, _nanoseconds})
      else if (timestamp?._seconds) {
        date = new Date(timestamp._seconds * 1000);
      }
      // 處理其他日期格式
      else {
        date = new Date(timestamp);
      }

      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return '';
    }
  };

  return (
    <>
      <Head>
        <title>{need.title} | 找隊友 | RWA Hackathon Taiwan</title>
        <meta name="description" content={need.brief} />
      </Head>

      <AppHeader />

      <div className="min-h-screen bg-white pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {/* 返回按鈕和編輯按鈕 */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回列表
            </button>

            {isOwner && (
              <button
                onClick={() => router.push(`/team-up/edit/${need.id}`)}
                className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
                style={{ backgroundColor: '#1a3a6e' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                編輯需求
              </button>
            )}
          </div>

          {/* 主內容卡片 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* 頭部 */}
            <div className="p-6 md:p-8 border-b border-gray-200">
              {/* 狀態標籤 */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 text-sm rounded ${TRACK_COLORS[need.projectTrack]}`}>
                  {need.projectTrack}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded flex items-center gap-1">
                  <span>{STAGE_ICONS[need.projectStage]}</span>
                  <span>{need.projectStage}</span>
                </span>
                {!need.isOpen && (
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded">
                    已結束
                  </span>
                )}
                {isOwner && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                    您的需求
                  </span>
                )}
              </div>

              {/* 標題 */}
              <h1 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                {need.title}
              </h1>

              {/* 元數據 */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="text-gray-800 font-medium">
                  👤 發布人：{need.ownerNickname || need.ownerName || '匿名用戶'}
                </span>
                <span>👀 {need.viewCount} 瀏覽</span>
                <span>✉️ {need.applicationCount} 應徵</span>
                <span>📅 {formatDate(need.createdAt)}</span>
              </div>

              {/* Owner 操作按鈕 */}
              {isOwner && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/team-up/edit/${need.id}`}>
                    <a className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      編輯需求
                    </a>
                  </Link>
                  <button
                    onClick={() => {
                      // TODO: 實現關閉/開放功能
                      alert(need.isOpen ? '關閉需求功能將在 M5 實現' : '重新開放功能將在 M5 實現');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    {need.isOpen ? '關閉需求' : '重新開放'}
                  </button>
                </div>
              )}
            </div>

            {/* 內容區域 */}
            <div className="p-6 md:p-8 space-y-6">
              {/* 專案簡介 */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">專案簡介</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{need.brief}</p>
              </section>

              {/* 需要角色 */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  需要角色 ({need.rolesNeeded.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {need.rolesNeeded.map((role, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-blue-50 text-blue-800 rounded-lg font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </section>

              {/* 現有成員 */}
              {need.haveRoles.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    現有成員 ({need.haveRoles.length})
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {need.haveRoles.map((role, index) => (
                      <span key={index} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg">
                        {role}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* 其他需求 */}
              {need.otherNeeds && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">其他需求</h2>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {need.otherNeeds}
                  </p>
                </section>
              )}

              {/* 應徵按鈕（非 Owner） */}
              {!isOwner && need.isOpen && (
                <section className="pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      if (!isSignedIn) {
                        alert('請先登入才能應徵');
                        router.push(`/auth?redirect=/team-up/${need.id}`);
                        return;
                      }
                      setIsApplicationModalOpen(true);
                    }}
                    className="w-full py-4 text-white text-lg font-semibold rounded-lg transition-colors"
                    style={{ backgroundColor: '#1a3a6e' }}
                  >
                    立即應徵
                  </button>
                  <p className="mt-3 text-sm text-gray-600 text-center">
                    應徵後，您的聯繫方式會私下提供給需求發布者
                  </p>
                </section>
              )}

              {/* Owner 查看應徵列表按鈕 */}
              {isOwner && (
                <section className="pt-6 border-t border-gray-200">
                  <Link href={`/dashboard/team-up?needId=${need.id}`}>
                    <a className="block w-full py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors text-center">
                      查看應徵列表 ({need.applicationCount})
                    </a>
                  </Link>
                </section>
              )}

              {/* 已關閉提示 */}
              {!need.isOpen && !isOwner && (
                <section className="pt-6 border-t border-gray-200">
                  <div className="bg-gray-100 rounded-lg p-6 text-center">
                    <p className="text-gray-700 font-medium">此需求已關閉，無法應徵</p>
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* 相關需求 */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">其他找隊友需求</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <p className="text-gray-600">相關需求推薦功能將在後續版本實現</p>
              <Link href="/team-up">
                <a className="mt-4 inline-block text-blue-600 hover:underline">瀏覽所有需求 →</a>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 應徵對話框 */}
      <ApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        onSubmit={handleApply}
        needTitle={need.title}
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  const { req } = context;

  try {
    // 構建 API URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:3008`;

    // 獲取認證 token（如果有）
    const headers: Record<string, string> = {};
    const authHeader = req.headers.authorization;
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const response = await fetch(`${baseUrl}/api/team-up/needs/${id}`, { headers });
    const data = await response.json();

    if (data.success) {
      return {
        props: {
          need: data.data,
          isOwner: data.data.isOwner || false,
        },
      };
    }

    return {
      props: {
        need: null,
        isOwner: false,
        error: data.error?.message || '找不到此需求',
      },
    };
  } catch (error) {
    console.error('Error fetching need in SSR:', error);
    return {
      props: {
        need: null,
        isOwner: false,
        error: '載入需求時發生錯誤',
      },
    };
  }
};
