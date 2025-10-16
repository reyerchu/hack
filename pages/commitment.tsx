import Head from 'next/head';
import Link from 'next/link';

/**
 * 參賽者承諾書頁面
 * Participant Commitment Page
 *
 * Landing: /commitment
 */
export default function Commitment() {
  return (
    <>
      <Head>
        <title>參賽者承諾書 | 台灣首屆 RWA 黑客松</title>
        <meta
          name="description"
          content="台灣首屆 RWA 黑客松參賽者承諾書 - 參賽資格、行為準則與權利義務"
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
            <h1 className="text-[36px] md:text-[48px] font-bold mb-4">
              台灣RWA黑客松活動參賽者承諾書
            </h1>
            <p className="text-[18px] text-white/90">最後更新日期：2025 年 10 月 15 日</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1200px] mx-auto px-8 md:px-12 py-16 md:py-20">
          <div className="prose prose-lg max-w-none">
            {/* 前言 */}
            <section className="mb-12">
              <p className="text-[16px] leading-relaxed text-gray-700 mb-6">
                請詳細閱讀下列條款，送出即表示您已明確理解並同意以下所有內容：
              </p>
            </section>

            {/* 一、參賽資格與行為準則 */}
            <section className="mb-12">
              <h2 className="text-[28px] font-bold text-[#1a3a6e] mb-6">一、參賽資格與行為準則</h2>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">1.1 基本資格</h3>
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>本人具備合法參賽資格，所提供的報名資料皆為真實、正確且最新</li>
                  <li>
                    若本人未滿十八歲（即尚未成年），本人聲明已取得法定代理人（父母或監護人）之同意。主辦單位得要求本人提供法定代理人同意書，若無法提供或經查證未取得同意，本人理解主辦方得取消參賽資格，且不負任何賠償責任
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">1.2 團隊參賽規範</h3>
                <p className="text-gray-700 mb-3">若以團隊形式參賽：</p>
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>應指定一名代表人負責對外聯繫與領獎</li>
                  <li>團隊所有成員均應個別簽署本承諾書</li>
                  <li>
                    團隊內部權利義務、獎金分配、作品歸屬等事項或爭議，應由成員自行協議解決，與主辦方無涉
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">
                  1.3 主辦方保留權利
                </h3>
                <p className="text-gray-700 mb-3">本人理解且接受：</p>

                <div className="mb-4">
                  <h4 className="text-[18px] font-semibold text-gray-800 mb-2">
                    （一）報名審查與活動調整
                  </h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>主辦方保有審查報名資格、修改活動內容、調整活動時程及相關規則之權力</li>
                    <li>
                      主辦方得基於維護活動品質、公平性或其他正當理由，拒絕或取消任何人之報名或參賽資格
                    </li>
                    <li>如有重大變更，主辦方應提前通知參賽者</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-[18px] font-semibold text-gray-800 mb-2">
                    （二）獎項設置變更權
                  </h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>主辦方保留調整獎項設置、獎金金額、獎品內容或得獎名額之權利</li>
                    <li>如有變更，應於評審前公告</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-[18px] font-semibold text-gray-800 mb-2">
                    （三）評審結果最終解釋權
                  </h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>評審結果由評審團獨立決定，主辦方保有最終解釋權</li>
                    <li>參賽者不得對評審結果提出異議或要求重新評審</li>
                    <li>主辦方得視情況增設特別獎項或調整得獎名單</li>
                  </ul>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">1.4 參賽義務</h3>
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>本人將遵守活動規則、流程及主辦方公告事項</li>
                  <li>如未依規定出席簡報、評審或展示活動，本人同意主辦單位得取消本人的參賽資格</li>
                  <li>
                    本人不從事舞弊、抄襲、侵害他人智慧財產權、冒用身份或其他違反誠信與公平原則之行為
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">1.5 行為準則</h3>
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>
                    本人將尊重所有參與者與工作人員，不進行任何騷擾、歧視、辱罵、恐嚇、性騷擾、跟蹤或其他不當行為
                  </li>
                  <li>本人不會未經同意散布他人資訊或私密內容，亦不使用未授權之資料或資源</li>
                  <li>本人不會惡意破壞他人成果或未經同意錄音錄影</li>
                  <li>本人將遵循活動規則安排，並於遇困難時主動向導師或工作人員尋求協助</li>
                  <li>如發生爭議，本人將以成熟、建設性的方式處理，避免衝突升高</li>
                </ul>
              </div>
            </section>

            {/* 二、智慧財產權與授權條款 */}
            <section className="mb-12">
              <h2 className="text-[28px] font-bold text-[#1a3a6e] mb-6">
                二、智慧財產權與授權條款
              </h2>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">
                  2.1 活動提供素材之使用
                </h3>
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>
                    本活動中所提供之題目、資料集、API、工具或其他素材（如有），其智慧財產權均屬原出題單位或提供方所有。本人僅得於本活動期間內，為參賽目的合理使用前述素材。
                  </li>
                  <li>
                    若素材屬第三方授權資源（如開放資料、外部 API、SDK 等），本人應：
                    <ul className="list-disc pl-6 mt-2 space-y-2">
                      <li>依該資源原有之授權條款使用</li>
                      <li>
                        於成果之 README 檔案或說明文件中清楚標示：
                        <ul className="list-circle pl-6 mt-2 space-y-1">
                          <li>資源名稱</li>
                          <li>原授權條款（如 MIT、Apache 2.0、GPL 等）</li>
                          <li>來源網址或出處</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">
                  2.2 參賽成果之著作權歸屬
                </h3>
                <p className="text-gray-700">
                  本人保有於本活動中所創作之成果（包括但不限於程式碼、設計、簡報、文件、影像等）之著作權。
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">
                  2.3 AI 工具使用聲明
                </h3>
                <p className="text-gray-700 mb-3">
                  若本人使用人工智慧工具（例如 ChatGPT、GitHub Copilot、Claude
                  等）協助生成部分成果，本人聲明：
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>已對 AI 生成內容進行實質性的人工編輯、選擇或安排</li>
                  <li>已確認該 AI 工具的使用條款允許用於本活動</li>
                  <li>願就該成果之合法性、原創性及不侵權性負完全法律責任</li>
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">
                  2.4 軟體成果授權條款
                </h3>
                <p className="text-gray-700 mb-3">關於活動中產出之軟體成果，本人同意：</p>

                <div className="mb-4">
                  <h4 className="text-[18px] font-semibold text-gray-800 mb-2">（一）開源授權</h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>本人以開源授權（如 MIT License、Apache 2.0 等）方式公開軟體成果</li>
                    <li>程式碼應於活動結束後30日內公開於 GitHub 或 GitLab，並維持公開</li>
                    <li>若有特殊原因無法公開，應於期限前向主辦方提出說明並取得同意</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-[18px] font-semibold text-gray-800 mb-2">
                    （二）若經主辦方同意不公開
                  </h4>
                  <p className="text-gray-700 mb-2">本人仍授予主辦方、協辦方與贊助方：</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>非專屬、全球、免權利金、不可撤銷之永久使用權</li>
                    <li>
                      使用目的包括：
                      <ul className="list-circle pl-6 mt-2 space-y-1">
                        <li>活動展示與評審</li>
                        <li>教育訓練與案例分享</li>
                        <li>主辦方自行撰寫之活動成果報告（不包括以參賽者為主要作者之學術論文）</li>
                        <li>非商業性推廣與行銷</li>
                      </ul>
                    </li>
                    <li>商業化權利（包括商業販售、授權營利等）仍歸本人所有</li>
                    <li>主辦方、協辦方與贊助方得再授權予合作單位、媒體、研究機構用於非商業目的</li>
                  </ul>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">
                  2.5 非軟體成果授權
                </h3>
                <p className="text-gray-700">
                  對於非軟體成果（如簡報、設計稿、說明文件、影片等），本人授權主辦方、協辦方與贊助方於全球範圍內永久免費使用，用途包含但不限於：行銷、推廣、公開展示、媒體報導等。
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">
                  2.6 權利保證與責任承擔
                </h3>
                <p className="text-gray-700 mb-3">
                  本人保證所提交的成果不侵害第三人之智慧財產權、營業秘密或其他權利。若因本人之成果導致主辦方、協辦方或贊助方遭第三人主張權利或提起訴訟，本人應：
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>立即通知主辦方並協助處理</li>
                  <li>
                    負擔因此所生之一切費用（包括訴訟費用、律師費、和解金、賠償金等），使主辦方、協辦方及贊助方免受損害
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">2.7 RWA特別聲明</h3>
                <p className="text-gray-700 mb-3">
                  若成果涉及金融資產代幣化、證券型代幣或其他受金融監管之應用：
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>本人理解該成果僅為概念驗證（Proof of Concept），不構成實際金融服務</li>
                  <li>未經主管機關許可不得實際營運</li>
                  <li>
                    本人承諾不利用本活動成果進行違反證券交易法、銀行法、洗錢防制法或其他金融法規之行為
                  </li>
                </ul>
              </div>
            </section>

            {/* 三、個人資料與肖像授權 */}
            <section className="mb-12">
              <h2 className="text-[28px] font-bold text-[#1a3a6e] mb-6">三、個人資料與肖像授權</h2>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">
                  3.1 個人資料蒐集、處理及利用
                </h3>
                <p className="text-gray-700 mb-3">
                  本人同意主辦方、協辦方及贊助方依據《個人資料保護法》蒐集、處理及利用本人所提供的個人資料，並僅用於以下目的：
                </p>
                <ul className="list-circle pl-6 space-y-2 text-gray-700">
                  <li>活動報名及聯繫</li>
                  <li>評審作業與成果展示</li>
                  <li>活動行銷與推廣</li>
                  <li>媒體採訪與報導</li>
                  <li>獎勵寄送與稅務申報</li>
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">
                  3.2 個人資料權利行使
                </h3>
                <p className="text-gray-700">
                  本人了解依法得向主辦單位行使查詢、更正、停止利用及刪除等個資權利。
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-[22px] font-semibold text-[#1a3a6e] mb-4">
                  3.3 肖像權與姓名使用
                </h3>
                <p className="text-gray-700">
                  本人同意授權主辦方、協辦方及贊助方於活動期間及結束後，於公開平台上使用本人之姓名、肖像、照片、聲音、影片、隊伍名稱與簡介，作為本活動及未來相關活動推廣用途。
                </p>
              </div>
            </section>

            {/* 四、社群評論授權 */}
            <section className="mb-12">
              <h2 className="text-[28px] font-bold text-[#1a3a6e] mb-6">四、社群評論授權</h2>
              <p className="text-gray-700">
                本人於社群平台（如
                Facebook、Instagram、X/Twitter、LinkedIn、Medium、YouTube、部落格等）公開發表與本活動相關之評論或心得時，主辦方、協辦方與贊助方得擷取、引用、轉載該內容，並得為排版調整、摘要節錄或加註說明，用於活動網站、簡報、社群媒體、媒體報導、成果發表等宣傳用途。但不得以斷章取義、移花接木或其他方式扭曲原意，並應註明本人姓名或社群帳號（除本人明確要求匿名者外）。
              </p>
            </section>

            {/* 五、獎金與稅務配合 */}
            <section className="mb-12">
              <h2 className="text-[28px] font-bold text-[#1a3a6e] mb-6">五、獎金與稅務配合</h2>
              <ul className="list-disc pl-6 space-y-3 text-gray-700">
                <li>
                  若本人或本人所屬團隊獲得獎金或獎品，本人將依規定主動提供身分資訊、配合稅務申報及扣繳作業。
                </li>
                <li>團隊獎金分配由團隊成員自行協議處理，與主辦方、協辦方及贊助方無涉。</li>
              </ul>
            </section>

            {/* 六、主辦方免責條款 */}
            <section className="mb-12">
              <h2 className="text-[28px] font-bold text-[#1a3a6e] mb-6">六、主辦方免責條款</h2>
              <ul className="list-disc pl-6 space-y-3 text-gray-700">
                <li>
                  若活動因不可抗力（如地震、颱風、疫情、政府命令、網路故障等）而需取消、延期或調整內容，本人理解主辦方、協辦方與贊助方不負任何賠償責任。
                </li>
                <li>
                  除主辦方、協辦方或贊助方有故意或重大過失外，本人理解並同意主辦方、協辦方或贊助方對於本人因參加活動所受之間接損害、所失利益、機會成本或其他財務損失(若有)，不負賠償責任。
                </li>
                <li>本人將自行負責保管個人財物，並宜自行投保意外或其他保險。</li>
              </ul>
            </section>

            {/* 七、違規處置與法律責任 */}
            <section className="mb-12">
              <h2 className="text-[28px] font-bold text-[#1a3a6e] mb-6">七、違規處置與法律責任</h2>
              <p className="text-gray-700 mb-3">
                若本人違反本承諾書或活動相關規範，本人同意主辦方得：
              </p>
              <ul className="list-disc pl-6 space-y-3 text-gray-700">
                <li>取消參賽資格</li>
                <li>撤銷已獲獎勵（獎金、獎品、證書等）</li>
                <li>公開違規事實（如有必要時，得於活動網站或其他管道公告）</li>
                <li>保留法律追訴權</li>
              </ul>
            </section>

            {/* 八、法律效力與爭議處理 */}
            <section className="mb-12">
              <h2 className="text-[28px] font-bold text-[#1a3a6e] mb-6">八、法律效力與爭議處理</h2>
              <ul className="list-disc pl-6 space-y-3 text-gray-700">
                <li>本承諾書以中華民國法律為準據法。</li>
                <li>
                  凡因本承諾書或本活動所生之爭議，本人同意以臺灣臺北地方法院為第一審管轄法院。
                </li>
              </ul>
            </section>

            {/* Navigation Links */}
            <div className="mt-16 pt-8 border-t border-gray-200">
              <div className="flex flex-wrap gap-4">
                <Link href="/terms">
                  <a className="inline-flex items-center px-6 py-3 bg-[#1a3a6e] text-white rounded-lg hover:bg-[#2a4a7e] transition-colors">
                    查看服務條款
                  </a>
                </Link>
                <Link href="/privacy">
                  <a className="inline-flex items-center px-6 py-3 bg-[#1a3a6e] text-white rounded-lg hover:bg-[#2a4a7e] transition-colors">
                    查看隱私權政策
                  </a>
                </Link>
                <Link href="/">
                  <a className="inline-flex items-center px-6 py-3 border-2 border-[#1a3a6e] text-[#1a3a6e] rounded-lg hover:bg-[#1a3a6e] hover:text-white transition-colors">
                    返回首頁
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 py-8">
          <div className="max-w-[1200px] mx-auto px-8 md:px-12 text-center text-gray-600">
            <p>© 2025 台灣首屆 RWA 黑客松. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
}
