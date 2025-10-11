import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuthContext } from '../lib/user/AuthContext';
import AppHeader from '../components/AppHeader';

/**
 * 测试认证状态页面
 */
export default function TestAuthPage() {
  const { user, isSignedIn } = useAuthContext();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [apiTestResult, setApiTestResult] = useState<any>(null);

  useEffect(() => {
    if (user?.token) {
      try {
        // 解码 JWT token（不验证签名）
        const parts = user.token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setTokenInfo({
            uid: payload.uid || payload.user_id,
            email: payload.email,
            exp: payload.exp,
            expiresAt: new Date(payload.exp * 1000).toLocaleString('zh-TW'),
            isExpired: payload.exp * 1000 < Date.now(),
          });
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setTokenInfo({ error: 'Token 格式无效' });
      }
    }
  }, [user]);

  const testApi = async () => {
    if (!user?.token) {
      setApiTestResult({ error: '没有 token' });
      return;
    }

    setApiTestResult({ loading: true });

    try {
      const response = await fetch('/api/team-up/needs', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await response.json();

      setApiTestResult({
        status: response.status,
        ok: response.ok,
        data,
      });
    } catch (error: any) {
      setApiTestResult({
        error: error.message,
      });
    }
  };

  const refreshToken = async () => {
    try {
      const firebase = await import('firebase/app');
      await import('firebase/auth');

      const currentUser = firebase.default.auth().currentUser;
      if (currentUser) {
        alert('正在刷新 token...');
        const newToken = await currentUser.getIdToken(true); // force refresh
        alert('Token 已刷新！请重新加载页面。');
        window.location.reload();
      } else {
        alert('未找到 Firebase 用户，请重新登录');
      }
    } catch (error: any) {
      alert('刷新失败: ' + error.message);
    }
  };

  return (
    <>
      <Head>
        <title>测试认证状态 | RWA Hackathon Taiwan</title>
      </Head>

      <AppHeader />

      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 认证状态测试</h1>

          {/* 登录状态 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">登录状态</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">登录状态:</span>{' '}
                <span className={isSignedIn ? 'text-green-600' : 'text-red-600'}>
                  {isSignedIn ? '✅ 已登录' : '❌ 未登录'}
                </span>
              </p>
              {user && (
                <>
                  <p>
                    <span className="font-medium">用户 ID:</span> {user.id}
                  </p>
                  <p>
                    <span className="font-medium">邮箱:</span> {user.preferredEmail}
                  </p>
                  <p>
                    <span className="font-medium">名字:</span> {user.firstName} {user.lastName}
                  </p>
                  <p>
                    <span className="font-medium">Token 长度:</span>{' '}
                    {user.token ? `${user.token.length} 字符` : '❌ 无 token'}
                  </p>
                  {user.token && (
                    <p className="break-all">
                      <span className="font-medium">Token (前50字符):</span>{' '}
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {user.token.substring(0, 50)}...
                      </code>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Token 信息 */}
          {tokenInfo && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Token 信息</h2>
              {tokenInfo.error ? (
                <p className="text-red-600">{tokenInfo.error}</p>
              ) : (
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">UID:</span> {tokenInfo.uid}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {tokenInfo.email}
                  </p>
                  <p>
                    <span className="font-medium">过期时间:</span> {tokenInfo.expiresAt}
                  </p>
                  <p>
                    <span className="font-medium">是否过期:</span>{' '}
                    <span className={tokenInfo.isExpired ? 'text-red-600' : 'text-green-600'}>
                      {tokenInfo.isExpired ? '❌ 已过期' : '✅ 有效'}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* API 测试 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">API 测试</h2>
            <button
              onClick={testApi}
              disabled={!user?.token}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed mb-4"
            >
              测试 API 调用
            </button>

            {apiTestResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {apiTestResult.loading ? (
                  <p>测试中...</p>
                ) : (
                  <>
                    {apiTestResult.error && (
                      <p className="text-red-600">错误: {apiTestResult.error}</p>
                    )}
                    {apiTestResult.status && (
                      <>
                        <p>
                          <span className="font-medium">HTTP 状态:</span>{' '}
                          <span className={apiTestResult.ok ? 'text-green-600' : 'text-red-600'}>
                            {apiTestResult.status}
                          </span>
                        </p>
                        <p className="mt-2">
                          <span className="font-medium">响应数据:</span>
                        </p>
                        <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-auto max-h-64">
                          {JSON.stringify(apiTestResult.data, null, 2)}
                        </pre>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">操作</h2>
            <div className="space-x-4">
              <button
                onClick={refreshToken}
                disabled={!isSignedIn}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                刷新 Token
              </button>
              <button
                onClick={() => (window.location.href = '/auth')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                重新登录
              </button>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 使用说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. 检查登录状态和 Token 信息</li>
              <li>2. 如果 Token 已过期，点击&quot;刷新 Token&quot;</li>
              <li>3. 点击&quot;测试 API 调用&quot;检查后端认证是否正常</li>
              <li>4. 如果仍有问题，尝试&quot;重新登录&quot;</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
