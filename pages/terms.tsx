import Head from 'next/head';
import Link from 'next/link';

/**
 * 服務條款頁面
 * Terms of Service Page
 *
 * Landing: /terms
 */
export default function Terms() {
  return (
    <>
      <Head>
        <title>服務條款 | 台灣首屆 RWA 黑客松</title>
        <meta
          name="description"
          content="台灣首屆 RWA 黑客松服務條款 - 參與規則、權利義務和注意事項"
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
            <h1 className="text-[36px] md:text-[48px] font-bold mb-4">服務條款</h1>
            <p className="text-[18px] text-white/90">最後更新日期：2025 年 10 月 14 日</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1200px] mx-auto px-8 md:px-12 py-16 md:py-20">
          <div className="prose prose-lg max-w-none">
            {/* 前言 */}
            <section className="mb-12">
              <p className="text-[16px] leading-relaxed text-gray-700">
                歡迎參加台灣首屆 RWA
                黑客松（以下簡稱「本活動」）。這些服務條款（以下簡稱「本條款」）構成您與主辦單位之間具有法律約束力的協議。在註冊參加本活動之前，請仔細閱讀本條款。
              </p>
            </section>

            {/* 1. 接受條款 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                1. 接受條款
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                透過註冊、訪問或使用本活動網站和服務（以下簡稱「本服務」），您同意受本條款的約束。如果您不同意本條款，請勿使用本服務。
              </p>
            </section>

            {/* 2. 活動說明 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                2. 活動說明
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                本活動是一個黑客松比賽，旨在促進
                RWA（真實世界資產）領域的創新和技術發展。活動包括但不限於：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>論壇和研討會</li>
                <li>黑客松競賽</li>
                <li>工作坊和培訓</li>
                <li>網絡交流活動</li>
                <li>專案展示和評審</li>
              </ul>
            </section>

            {/* 3. 參加資格 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                3. 參加資格
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                參加者須符合以下資格：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>年滿 18 歲，或在家長/監護人同意下參加</li>
                <li>提供真實、準確和完整的註冊資訊</li>
                <li>遵守本條款和活動規則</li>
                <li>符合特定賽道的額外要求（如有）</li>
              </ul>
            </section>

            {/* 4. 註冊和帳號 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                4. 註冊和帳號
              </h2>

              <h3 className="text-[18px] font-semibold mb-4 text-gray-800">4.1 帳號建立</h3>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                您需要建立帳號以參加本活動。您同意：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>提供真實、準確的個人資訊</li>
                <li>及時更新您的資訊</li>
                <li>對您的帳號活動負責</li>
                <li>不與他人分享您的帳號</li>
                <li>立即通知我們任何未經授權的使用</li>
              </ul>

              <h3 className="text-[18px] font-semibold mb-4 text-gray-800">4.2 帳號安全</h3>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                您有責任維護帳號的安全性。主辦單位對未經授權使用您帳號的行為不承擔責任。
              </p>
            </section>

            {/* 5. 參賽規則 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                5. 參賽規則
              </h2>

              <h3 className="text-[18px] font-semibold mb-4 text-gray-800">5.1 專案提交</h3>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>專案必須在活動期間內開發</li>
                <li>必須符合賽道主題和要求</li>
                <li>提交的程式碼和內容必須是原創的</li>
                <li>不得侵犯第三方的智慧財產權</li>
                <li>遵守所有適用的法律法規</li>
              </ul>

              <h3 className="text-[18px] font-semibold mb-4 text-gray-800">5.2 團隊組成</h3>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>每個團隊最多 5 人</li>
                <li>參加者可以加入現有團隊或自行組隊</li>
                <li>團隊成員變更需在指定期限前完成</li>
              </ul>

              <h3 className="text-[18px] font-semibold mb-4 text-gray-800">5.3 評審標準</h3>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                專案將根據以下標準評審：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>創新性和原創性</li>
                <li>技術實現和完成度</li>
                <li>實用性和市場潛力</li>
                <li>展示和簡報品質</li>
                <li>團隊協作</li>
              </ul>
            </section>

            {/* 6. 智慧財產權 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                6. 智慧財產權
              </h2>

              <h3 className="text-[18px] font-semibold mb-4 text-gray-800">6.1 您的專案</h3>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                您保留對您的專案的所有權利。透過參加本活動，您授予主辦單位：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>展示和宣傳您的專案的非獨占性授權</li>
                <li>在活動相關的媒體和出版物中使用的權利</li>
                <li>為推廣目的製作衍生作品的權利</li>
              </ul>

              <h3 className="text-[18px] font-semibold mb-4 text-gray-800">6.2 主辦單位內容</h3>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                本服務的所有內容、設計、標誌、商標等均為主辦單位或其授權方所有。未經授權，您不得使用、複製或修改。
              </p>
            </section>

            {/* 7. 獎品和獎勵 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                7. 獎品和獎勵
              </h2>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>獎品將根據公告的規則和評審結果頒發</li>
                <li>獲獎者需提供必要的身份證明和稅務文件</li>
                <li>獎品不可轉讓，除非主辦單位同意</li>
                <li>獲獎者可能需要配合宣傳活動</li>
                <li>主辦單位保留修改獎品的權利，恕不另行通知</li>
              </ul>
            </section>

            {/* 8. 行為準則 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                8. 行為準則
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">參加者必須：</p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>尊重其他參加者、工作人員和評審</li>
                <li>遵守活動場地的規則</li>
                <li>不從事騷擾、歧視或攻擊性行為</li>
                <li>不干擾活動的正常進行</li>
                <li>不從事任何非法活動</li>
              </ul>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                違反行為準則的參加者可能會被取消資格並驅逐出場。
              </p>
            </section>

            {/* 9. 禁止事項 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                9. 禁止事項
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">您不得：</p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>提交他人的作品或抄襲</li>
                <li>使用機器人、腳本或自動化工具作弊</li>
                <li>破壞、干擾或濫用本服務</li>
                <li>未經授權存取他人帳號或系統</li>
                <li>散布惡意軟體或病毒</li>
                <li>收集其他參加者的個人資訊</li>
                <li>從事任何違法或不道德的行為</li>
              </ul>
            </section>

            {/* 10. 隱私和資料保護 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                10. 隱私和資料保護
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                您的個人資料將根據我們的
                <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline mx-1">
                  隱私權政策
                </Link>
                處理。使用本服務即表示您同意我們按照隱私權政策收集、使用和揭露您的資訊。
              </p>
            </section>

            {/* 11. 免責聲明 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                11. 免責聲明
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                本服務按「現狀」提供，不提供任何明示或暗示的保證。主辦單位不保證：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>服務不會中斷或無錯誤</li>
                <li>內容的準確性或可靠性</li>
                <li>服務將符合您的特定需求</li>
                <li>任何錯誤將被修正</li>
              </ul>
            </section>

            {/* 12. 責任限制 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                12. 責任限制
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                在法律允許的最大範圍內，主辦單位不對以下情況承擔責任：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>因使用或無法使用本服務而產生的任何損失</li>
                <li>資料遺失或損壞</li>
                <li>第三方的行為</li>
                <li>活動期間的人身傷害或財產損失</li>
                <li>間接、附帶、特殊或懲罰性損害</li>
              </ul>
            </section>

            {/* 13. 賠償 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                13. 賠償
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                您同意賠償並使主辦單位、其關聯公司、員工和代理人免受因以下原因產生的任何索賠、損失、損害、責任和費用（包括律師費）：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>您違反本條款</li>
                <li>您侵犯第三方權利</li>
                <li>您使用或濫用本服務</li>
              </ul>
            </section>

            {/* 14. 服務變更和終止 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                14. 服務變更和終止
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                主辦單位保留以下權利：
              </p>
              <ul className="list-disc list-inside text-[16px] leading-relaxed text-gray-700 mb-6 space-y-2">
                <li>隨時修改、暫停或終止本服務</li>
                <li>更改活動規則和時程</li>
                <li>取消或推遲活動</li>
                <li>終止違反本條款的參加者的帳號</li>
              </ul>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                主辦單位將盡力提前通知重大變更，但不承擔義務。
              </p>
            </section>

            {/* 15. 適用法律 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                15. 適用法律和管轄權
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                本條款受中華民國法律管轄並依其解釋。因本條款產生的任何爭議應由臺灣臺北地方法院作為第一審管轄法院。
              </p>
            </section>

            {/* 16. 爭議解決 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                16. 爭議解決
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                如發生爭議，雙方應首先嘗試通過友好協商解決。如協商失敗，任何一方可訴諸法律程序。
              </p>
            </section>

            {/* 17. 可分割性 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                17. 可分割性
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                如本條款的任何條款被判定為無效或無法執行，該條款將在最小必要範圍內修改，其他條款仍保持完全效力。
              </p>
            </section>

            {/* 18. 聯絡方式 */}
            <section className="mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                18. 聯絡方式
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-700 mb-4">
                如對本條款有任何疑問，請聯絡我們：
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
                  <strong className="text-blue-900">重要提醒：</strong>{' '}
                  註冊參加本活動即表示您已閱讀、理解並同意受本服務條款的約束。請確保您在註冊前仔細閱讀本條款。
                </p>
              </div>
            </section>
          </div>

          {/* 返回按鈕 */}
          <div className="mt-16 flex justify-center gap-4">
            <Link href="/commitment">
              <a
                className="inline-flex items-center px-8 py-3 border-2 font-semibold rounded-lg transition-colors cursor-pointer"
                style={{ borderColor: '#1a3a6e', color: '#1a3a6e' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1a3a6e';
                }}
              >
                參賽者承諾書
              </a>
            </Link>
            <Link href="/privacy">
              <a
                className="inline-flex items-center px-8 py-3 border-2 font-semibold rounded-lg transition-colors cursor-pointer"
                style={{ borderColor: '#1a3a6e', color: '#1a3a6e' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1a3a6e';
                }}
              >
                隱私權政策
              </a>
            </Link>
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

        {/* Footer */}
        <div className="bg-gray-50 py-8">
          <div className="max-w-[1200px] mx-auto px-8 md:px-12 text-center text-gray-600">
            <p>© 2025 RWA Hackathon Taiwan | RWA Nexus. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
}
