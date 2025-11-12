import React from 'react';
import Head from 'next/head';
import AppHeader from '../components/AppHeader';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthContext } from '../lib/user/AuthContext';

/**
 * 團隊報名說明頁面 - 針對未登入或未註冊的用戶
 * 說明團隊報名的步驟和要求
 */
export default function TeamRegisterInfo() {
  const router = useRouter();
  const { isSignedIn, loading } = useAuthContext();

  return (
    <>
      <Head>
        <title>團隊報名說明 | Hackathon</title>
        <meta name="description" content="了解如何進行團隊報名，包括註冊流程和報名步驟" />
      </Head>
      <AppHeader />
      <div
        className="min-h-screen"
        style={{
          backgroundColor: '#f9fafb',
          paddingTop: '80px',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* 標題區塊 */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
              團隊報名流程
            </h1>
            <p className="text-xl" style={{ color: '#6b7280' }}>
              加入黑客松，開啟創新之旅
            </p>
          </div>

          {/* 流程步驟卡片 */}
          <div className="space-y-8">
            {/* 步驟 1 */}
            <div
              className="bg-white rounded-xl p-8 shadow-lg border-l-8"
              style={{ borderColor: '#1a3a6e' }}
            >
              <div className="flex items-start gap-6">
                <div
                  className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ backgroundColor: '#1a3a6e' }}
                >
                  1
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                    所有團隊成員先完成個人註冊
                  </h2>
                  <div className="text-lg mb-4" style={{ color: '#4b5563' }}>
                    <p className="mb-3">
                      參加黑客松的每位成員都必須先完成個人註冊（個人報名），建立自己的帳號。
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>填寫個人基本資料（姓名、Email、學校/公司等）</li>
                      <li>完成 Email 驗證</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {loading ? (
                      // Loading state - show a placeholder
                      <div className="h-12 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
                    ) : !isSignedIn ? (
                      // Not signed in - show registration button
                      <Link href="/register">
                        <a
                          className="inline-block px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 hover:shadow-lg"
                          style={{ backgroundColor: '#1a3a6e' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2a4a7e';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#1a3a6e';
                          }}
                        >
                          前往註冊｜登入
                        </a>
                      </Link>
                    ) : (
                      // Signed in - show team registration button
                      <Link href="/team-register">
                        <a
                          className="inline-block px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 hover:shadow-lg"
                          style={{ backgroundColor: '#1a3a6e' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2a4a7e';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#1a3a6e';
                          }}
                        >
                          前往團隊報名
                        </a>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 步驟 2 */}
            <div
              className="bg-white rounded-xl p-8 shadow-lg border-l-8"
              style={{ borderColor: '#047857' }}
            >
              <div className="flex items-start gap-6">
                <div
                  className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ backgroundColor: '#047857' }}
                >
                  2
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4" style={{ color: '#047857' }}>
                    由團隊報名者進行團隊報名
                  </h2>
                  <div className="text-lg mb-4" style={{ color: '#4b5563' }}>
                    <p className="mb-3">當所有成員都完成個人註冊後，由其中一人進行團隊報名：</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>登入個人帳號</li>
                      <li>填寫團隊名稱</li>
                      <li>填寫團隊成員的 Email（必須是已註冊的帳號）</li>
                      <li>設定團隊成員的角色和權限</li>
                      <li>選擇要參加的賽道（可複選）</li>
                      <li>確認同意「參賽者承諾書」內容</li>
                      <li>提交報名</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm" style={{ color: '#1e40af' }}>
                      <strong>💡 提示：</strong>團隊報名需要登入後才能進行。報名截止時間為{' '}
                      <strong>2025/10/29 23:59</strong>，在截止前都可以編輯報名資料。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 步驟 3 */}
            <div
              className="bg-white rounded-xl p-8 shadow-lg border-l-8"
              style={{ borderColor: '#d97706' }}
            >
              <div className="flex items-start gap-6">
                <div
                  className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ backgroundColor: '#d97706' }}
                >
                  3
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4" style={{ color: '#d97706' }}>
                    團隊成員收到通知
                  </h2>
                  <div className="text-lg mb-4" style={{ color: '#4b5563' }}>
                    <p className="mb-3">
                      團隊報名提交後，系統會自動發送通知 Email 給所有團隊成員。
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>每位成員都會收到團隊報名確認信</li>
                      <li>成員可以在個人中心頁面查看團隊資訊</li>
                      <li>有編輯權限的成員可以修改團隊報名資料</li>
                      <li>每位成員可以參與多個團隊（用不同團隊名稱報名）</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 重要提醒 */}
          <div
            className="mt-12 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-8 border-2"
            style={{ borderColor: '#b91c1c' }}
          >
            <h3
              className="text-2xl font-bold mb-4 flex items-center gap-3"
              style={{ color: '#b91c1c' }}
            >
              <span className="text-3xl">⚠️</span>
              重要提醒
            </h3>
            <ul className="space-y-3 text-lg" style={{ color: '#4b5563' }}>
              <li className="flex items-start gap-3">
                <span style={{ color: '#b91c1c' }} className="font-bold">
                  •
                </span>
                <span>
                  團隊規模：<strong>1~5 人</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span style={{ color: '#b91c1c' }} className="font-bold">
                  •
                </span>
                <span>
                  報名截止時間：<strong>2025年10月29日 23:59</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span style={{ color: '#b91c1c' }} className="font-bold">
                  •
                </span>
                <span>所有團隊成員的 Email 必須已完成個人註冊</span>
              </li>
              <li className="flex items-start gap-3">
                <span style={{ color: '#b91c1c' }} className="font-bold">
                  •
                </span>
                <span>報名後可以在截止前進行編輯</span>
              </li>
              <li className="flex items-start gap-3">
                <span style={{ color: '#b91c1c' }} className="font-bold">
                  •
                </span>
                <span>每位成員可以參與多個團隊</span>
              </li>
            </ul>
          </div>

          {/* 查看賽道資訊 */}
          <div className="mt-12 text-center">
            <p className="text-lg mb-6" style={{ color: '#6b7280' }}>
              想了解更多賽道和挑戰資訊？
            </p>
            <Link href="/tracks-challenges">
              <a
                className="inline-block px-8 py-4 rounded-lg font-medium text-white text-lg transition-all duration-300 hover:shadow-xl"
                style={{ backgroundColor: '#1a3a6e' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a4a7e';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                查看所有賽道與挑戰 →
              </a>
            </Link>
          </div>

          {/* FAQ 鏈接 */}
          <div className="mt-12 text-center">
            <p className="text-lg mb-4" style={{ color: '#6b7280' }}>
              還有其他問題？
            </p>
            <Link href="/#faq">
              <a
                className="inline-block text-lg font-medium underline transition-colors duration-300"
                style={{ color: '#1a3a6e' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#2a4a7e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#1a3a6e';
                }}
              >
                查看常見問題 FAQ
              </a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
