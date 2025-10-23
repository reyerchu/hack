/**
 * Admin Challenge Management 頁面
 *
 * 此頁面已廢棄，自動重定向到 Track Management
 * 原因：新架構中，challenges 從屬於 tracks，應該在 track management 中管理
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ChallengeManagementPage() {
  const router = useRouter();

  // 自動重定向到 track-management
  useEffect(() => {
    console.log('[ChallengeManagement] 此頁面已廢棄，重定向到 /admin/track-management');
    router.replace('/admin/track-management');
  }, [router]);

  return (
    <div className="flex flex-col flex-grow">
      <Head>
        <title>重定向中... - 管理員儀表板</title>
        <meta name="description" content="Redirecting to Track Management" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: '#1a3a6e' }}
          ></div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
            重定向中...
          </h1>
          <p className="text-base text-gray-600">此頁面已移至 Track 管理</p>
        </div>
      </div>
    </div>
  );
}
