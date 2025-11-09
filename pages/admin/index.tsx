/**
 * Super Admin Dashboard
 *
 * 統一的管理界面，與 Home 頁面風格一致
 */

import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import AdminHeader from '../../components/adminComponents/AdminHeader';
import { useAuthContext } from '../../lib/user/AuthContext';

export function isAuthorized(user): boolean {
  if (!user || !user.permissions) return false;
  const permissions = user.permissions;
  return (
    permissions.includes('admin') ||
    permissions.includes('organizer') ||
    permissions.includes('super_admin') ||
    permissions[0] === 'admin' ||
    permissions[0] === 'super_admin'
  );
}

export default function Admin() {
  const { user, isSignedIn } = useAuthContext();

  if (!isSignedIn || !isAuthorized(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-5xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
            未授權
          </h1>
          <p className="text-base text-gray-600 mb-8">您沒有權限訪問此頁面</p>
          <Link href="/">
            <a
              className="inline-block border-2 px-8 py-3 text-sm font-medium uppercase tracking-wider transition-colors duration-300"
              style={{
                borderColor: '#1a3a6e',
                color: '#1a3a6e',
                backgroundColor: 'transparent',
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
              返回首頁
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow">
      <Head>
        <title>HackPortal - Admin</title>
        <meta name="description" content="HackPortal's Admin Page" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2 text-left" style={{ color: '#1a3a6e' }}>
              管理儀表板
            </h1>
          </div>

          {/* Admin Tabs */}
          <AdminHeader />

          {/* Quick Links Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a3a6e' }}>
              快速連結
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/admin/users">
                <a
                  className="block bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#1a3a6e' }}>
                    👥 使用者管理
                  </h3>
                  <p className="text-sm text-gray-600">管理所有註冊用戶</p>
                </a>
              </Link>
              <Link href="/admin/sponsors">
                <a
                  className="block bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#1a3a6e' }}>
                    🏢 贊助商管理
                  </h3>
                  <p className="text-sm text-gray-600">管理贊助商與新增贊助商</p>
                </a>
              </Link>
              <Link href="/admin/announcements">
                <a
                  className="block bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#1a3a6e' }}>
                    📢 公告與問題
                  </h3>
                  <p className="text-sm text-gray-600">發布公告與回覆問題</p>
                </a>
              </Link>
              {user.permissions[0] === 'super_admin' && (
                <>
                  <Link href="/admin/stats">
                    <a
                      className="block bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2"
                      style={{ borderColor: '#e5e7eb' }}
                    >
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#1a3a6e' }}>
                        📊 統計報表
                      </h3>
                      <p className="text-sm text-gray-600">查看統計數據</p>
                    </a>
                  </Link>
                  <Link href="/admin/nft/campaigns">
                    <a
                      className="block bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2"
                      style={{ borderColor: '#e5e7eb' }}
                    >
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#1a3a6e' }}>
                        🎨 NFT 管理
                      </h3>
                      <p className="text-sm text-gray-600">管理 NFT 活動與發行</p>
                    </a>
                  </Link>
                </>
              )}
              <Link href="/admin/scan">
                <a
                  className="block bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#1a3a6e' }}>
                    📱 掃描功能
                  </h3>
                  <p className="text-sm text-gray-600">掃描 QR Code</p>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
