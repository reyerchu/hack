/**
 * 找隊友 - 個人儀表板（重定向到個人中心）
 * 此頁面已合併到 /profile 頁面
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TeamUpDashboard() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到個人中心的找隊友 Tab
    router.replace('/profile?tab=teamup-needs');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">正在跳轉到個人中心...</p>
      </div>
    </div>
  );
}
