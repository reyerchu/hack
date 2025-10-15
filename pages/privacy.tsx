import Head from 'next/head';
import Link from 'next/link';

/**
 * 隱私權政策頁面
 * Privacy Policy Page
 *
 * Landing: /privacy
 */
export default function Privacy() {
  return (
    <>
      <Head>
        <title>隱私權政策 | 台灣首屆 RWA 黑客松</title>
        <meta
          name="description"
          content="台灣首屆 RWA 黑客松隱私權政策 - 我們如何收集、使用和保護您的個人資料"
        />
        <link rel="icon" href="/favicon.ico?v=2.0" />
      </Head>

      <div className="bg-white min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a3a6e] to-[#2a4a7e] text-white py-16 md:py-20">
          <div className="max-w-[1200px] mx-auto px-8 md:px-12">
            <Link href="/">
              <a className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors cursor-pointer">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                返回首頁
              </a>
            </Link>
            <h1 className="text-[36px] md:text-[48px] font-bold mb-4">隱私權政策</h1>
            <p className="text-[18px] text-white/90">最後更新日期：2025 年 10 月 14 日</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1200px] mx-auto px-8 md:px-12 py-16 md:py-20">
          <div className="prose prose-lg max-w-none">
            {/* 前言 */}
            <section className="mb-12">
              <p className="text-[16px] leading-relaxed text-gray-700">
                歡迎使用台灣首屆 RWA
                黑客松（以下簡稱「本活動」）。我們重視您的隱私權，並致力於保護您的個人資料。本隱私權政策說明我們如何收集、使用、揭露和保護您的個人資訊。
              </p>
            </section>

            {/* 1. 資料收集 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                1. 我們收集的資料
              </h2>

              <h3 className="text-[18px] font-semibold mb-4 text-gray-800">1.1 註冊資料</h3>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                當您註冊參加本活動時，我們會收集：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>姓名</li>
                <li>電子郵件地址</li>
                <li>學校/公司名稱</li>
                <li>聯絡電話</li>
                <li>個人簡歷或履歷（如提供）</li>
                <li>專業背景和技能</li>
              </ul>

              <h3 className="text-[18px] font-semibold mb-4 text-gray-800">
                1.2 Google Calendar 整合資料
              </h3>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                當您選擇使用 Google Calendar 整合功能時，我們會：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>透過 OAuth 2.0 獲得您的授權</li>
                <li>僅訪問您的日曆讀取和新增事件的權限</li>
                <li>僅添加活動相關的日曆事件</li>
                <li>不會讀取、修改或刪除您的其他日曆事件</li>
              </ul>

              <h3 className="text-[18px] font-semibold mb-4 text-gray-800">1.3 自動收集的資料</h3>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>IP 位址</li>
                <li>瀏覽器類型和版本</li>
                <li>裝置資訊</li>
                <li>網站使用情況（透過 cookies）</li>
              </ul>
            </section>

            {/* 2. 資料使用 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                2. 資料使用目的
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                我們使用您的個人資料用於：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>處理和管理您的活動註冊</li>
                <li>提供活動相關通知和更新</li>
                <li>組織黑客松活動和管理團隊配對</li>
                <li>提供 Google Calendar 整合服務</li>
                <li>改善我們的服務和用戶體驗</li>
                <li>統計分析和活動報告（匿名化處理）</li>
                <li>遵守法律義務</li>
              </ul>
            </section>

            {/* 3. 資料分享 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                3. 資料分享和揭露
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                我們不會出售您的個人資料。我們僅在以下情況下分享您的資料：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>
                  <strong>活動協辦單位：</strong>與主辦單位和贊助商分享必要的資訊以執行活動
                </li>
                <li>
                  <strong>服務提供商：</strong>Firebase、Google Cloud 等技術服務提供商
                </li>
                <li>
                  <strong>法律要求：</strong>遵守法律、法規或政府要求
                </li>
                <li>
                  <strong>您的同意：</strong>在獲得您明確同意的情況下
                </li>
              </ul>
            </section>

            {/* 4. Google OAuth */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                4. Google Calendar 整合和 OAuth
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                我們的 Google Calendar 整合功能：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>使用 Google OAuth 2.0 進行安全授權</li>
                <li>僅請求最小必要權限（讀取和新增日曆事件）</li>
                <li>您可以隨時在 Google 帳號設定中撤銷授權</li>
                <li>我們不會儲存您的 Google 帳號密碼</li>
                <li>存取權限僅用於添加活動相關的日曆事件</li>
              </ul>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                撤銷授權方式：前往
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline mx-1"
                >
                  Google 帳號權限設定
                </a>
                移除對本應用程式的存取權。
              </p>
            </section>

            {/* 5. 資料安全 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                5. 資料安全
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                我們採取合理的技術和組織措施來保護您的個人資料：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>使用 HTTPS 加密傳輸</li>
                <li>Firebase Authentication 進行身份驗證</li>
                <li>雲端資料庫的存取控制和加密</li>
                <li>定期安全審查和更新</li>
                <li>限制內部人員存取權限</li>
              </ul>
            </section>

            {/* 6. 資料保存 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                6. 資料保存期限
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                我們將保存您的個人資料直到：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>活動結束後 1 年（用於統計和報告）</li>
                <li>您要求刪除您的資料</li>
                <li>法律要求的保存期限</li>
              </ul>
            </section>

            {/* 7. 您的權利 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                7. 您的權利
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                根據相關隱私法規，您有以下權利：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>
                  <strong>存取權：</strong>要求查看我們持有的您的個人資料
                </li>
                <li>
                  <strong>更正權：</strong>要求更正不正確的資料
                </li>
                <li>
                  <strong>刪除權：</strong>要求刪除您的個人資料
                </li>
                <li>
                  <strong>限制處理權：</strong>要求限制我們處理您的資料
                </li>
                <li>
                  <strong>資料可攜權：</strong>要求以結構化格式接收您的資料
                </li>
                <li>
                  <strong>反對權：</strong>反對我們處理您的資料
                </li>
              </ul>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                如需行使這些權利，請聯絡我們：
                <a
                  href="mailto:reyerchu@defintek.io"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  reyerchu@defintek.io
                </a>
              </p>
            </section>

            {/* 8. Cookies */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                8. Cookies 和追蹤技術
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                我們使用 cookies 和類似技術來：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>維持您的登入狀態</li>
                <li>記住您的偏好設定</li>
                <li>分析網站使用情況</li>
                <li>改善用戶體驗</li>
              </ul>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                您可以通過瀏覽器設定控制 cookies，但這可能影響某些功能的使用。
              </p>
            </section>

            {/* 9. 兒童隱私 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                9. 兒童隱私
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                本活動不針對 13 歲以下兒童。如果您未滿 18
                歲，請在家長或監護人同意下參加活動並提供個人資料。
              </p>
            </section>

            {/* 10. 國際資料傳輸 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                10. 國際資料傳輸
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                您的資料可能會被傳輸至台灣以外的地區（例如 Google Cloud
                伺服器）。我們確保採取適當的保護措施，符合適用的資料保護法規。
              </p>
            </section>

            {/* 11. 政策更新 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                11. 隱私政策更新
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                我們可能會不時更新本隱私權政策。重大變更時，我們會透過電子郵件或網站公告通知您。請定期查看本頁面以了解最新的隱私政策。
              </p>
            </section>

            {/* 12. 聯絡我們 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                12. 聯絡我們
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                如果您對本隱私權政策有任何疑問或意見，請聯絡我們：
              </p>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-[16px] leading-relaxed text-gray-700 mb-2">
                  <a
                    href="mailto:reyerchu@defintek.io"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    reyerchu@defintek.io
                  </a>
                </p>
                <p className="text-[16px] leading-relaxed text-gray-700 mb-2">
                  <a
                    href="https://defintek.io"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    https://defintek.io
                  </a>
                  <span> deFintek Inc.</span>
                </p>
                <p className="text-[16px] leading-relaxed text-gray-700">
                  <a
                    href="https://rwa.nexus"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    https://rwa.nexus
                  </a>
                  <span> RWA Nexus Ltd.</span>
                </p>
              </div>
            </section>

            {/* 確認 */}
            <section className="mb-12">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
                <p className="text-[16px] leading-relaxed text-gray-700">
                  <strong className="text-blue-900">注意：</strong>{' '}
                  使用本網站即表示您同意本隱私權政策的條款。如果您不同意本政策，請勿使用本網站或提供任何個人資料。
                </p>
              </div>
            </section>
          </div>

          {/* 返回按鈕 */}
          <div className="mt-16 flex justify-center">
            <Link href="/">
              <a
                className="inline-flex items-center px-8 py-3 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                style={{ backgroundColor: '#1a3a6e' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a4a7e')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1a3a6e')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                返回首頁
              </a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
