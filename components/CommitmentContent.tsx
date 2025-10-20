import React from 'react';

/**
 * Shared Commitment Content Component
 * Used in both /commitment page and team registration modal
 */
export default function CommitmentContent() {
  return (
    <div className="prose prose-sm max-w-none">
      {/* 前言 */}
      <section className="mb-8">
        <p className="text-sm leading-relaxed text-gray-700 mb-4">
          參賽者請詳細閱讀下列條款， 報名送出即表示您已明確理解並同意以下所有內容：
        </p>
      </section>

      {/* 1. 參賽資格與行為準則 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1a3a6e' }}>
          1. 參賽資格與行為準則
        </h2>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            1.1 基本資格
          </h3>
          <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 mb-4 space-y-2">
            <li>本人具備合法參賽資格，所提供的報名資料皆為真實、正確且最新</li>
            <li>
              若本人未滿十八歲（即尚未成年），本人聲明已取得法定代理人（父母或監護人）之同意。主辦單位得要求本人提供法定代理人同意書，若無法提供或經查證未取得同意，本人理解主辦方得取消參賽資格，且不負任何賠償責任
            </li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            1.2 團隊參賽規範
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-3">若以團隊形式參賽：</p>
          <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 mb-4 space-y-2">
            <li>應指定一名代表人負責對外聯繫與領獎</li>
            <li>團隊所有成員均應個別簽署本承諾書</li>
            <li>
              團隊內部權利義務、獎金分配、作品歸屬等事項或爭議，應由成員自行協議解決，與主辦方無涉
            </li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            1.3 主辦方保留權利
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-3">本人理解且接受：</p>
          <p className="text-sm leading-relaxed text-gray-700 mb-2 font-semibold">
            （一）報名審查與活動調整
          </p>
          <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 mb-3 space-y-2">
            <li>主辦方保有審查報名資格、修改活動內容、調整活動時程及相關規則之權力</li>
            <li>
              主辦方得基於維護活動品質、公平性或其他正當理由，拒絕或取消任何人之報名或參賽資格
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-gray-700 mb-2 font-semibold">
            （二）違規處置
          </p>
          <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 mb-4 space-y-2">
            <li>
              若本人行為、作品或提交之任何內容違反本承諾書、活動規則、法律規範或有損活動公平性、主辦方聲譽，主辦方得逕行取消參賽或得獎資格，追回獎項或獎金，且不負任何補償責任
            </li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            1.4 行為準則與誠信義務
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-3">本人保證：</p>
          <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 mb-4 space-y-2">
            <li>遵守活動場地一切規定，尊重其他參賽者、工作人員及來賓</li>
            <li>不從事任何違法、騷擾、歧視或危害他人安全之行為</li>
            <li>誠實參賽，不作弊、不抄襲、不使用不正當手段</li>
            <li>遵守智慧財產權相關法令，不侵害他人權利</li>
          </ul>
        </div>
      </section>

      {/* 2. 智慧財產權與授權 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1a3a6e' }}>
          2. 智慧財產權與授權
        </h2>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            2.1 作品原創性聲明
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-3">本人聲明並保證：</p>
          <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 mb-4 space-y-2">
            <li>本人提交之作品（含程式碼、設計、文件、簡報等）均為本人或團隊原創</li>
            <li>作品不侵害第三方之智慧財產權、肖像權、隱私權或其他權利</li>
            <li>使用之第三方資源（開源軟體、API、圖片、音訊等）皆已取得合法授權或符合其使用條款</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            2.2 主辦方使用授權
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-3">
            本人同意授予主辦方及協辦單位以下非專屬、全球性、免權利金之權利：
          </p>
          <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 mb-4 space-y-2">
            <li>
              為活動宣傳、成果展示、教育推廣之目的，使用、重製、改作、公開展示、公開傳輸本人之作品及相關資料（含簡報、Demo影片等）
            </li>
            <li>於活動網站、社群媒體、新聞稿等管道發布與作品相關之文字、圖片或影音內容</li>
          </ul>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            上述授權不影響本人對作品之智慧財產權歸屬，本人仍保有作品之完整權利。
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            2.3 侵權責任
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            若因本人提交之作品或資料侵害第三方權利，導致主辦方或協辦單位遭受損害、索賠或訴訟，本人願負擔一切法律責任及賠償費用，並使主辦方免於遭受任何損失。
          </p>
        </div>
      </section>

      {/* 3. 獎項與獎金 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1a3a6e' }}>
          3. 獎項與獎金
        </h2>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            3.1 評審機制
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            本人理解得獎名單由主辦方及評審團依據公開之評審標準決定，評審結果為最終決定，不接受異議或申訴。
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            3.2 領獎資格與義務
          </h3>
          <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 mb-4 space-y-2">
            <li>得獎者須依主辦方指定方式與期限完成領獎手續，逾期視為放棄</li>
            <li>得獎者應配合提供身分證明文件、稅籍資料或其他主辦方要求之文件</li>
            <li>得獎者應配合活動宣傳，包括但不限於接受訪談、提供照片、出席頒獎典禮</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            3.3 稅務責任
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            獎金或獎品價值若達我國稅法規定之申報門檻，依法應由得獎者自行負擔相關稅負（如所得稅），主辦方將依法代扣代繳或開立扣繳憑單。
          </p>
        </div>
      </section>

      {/* 4. 個人資料保護 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1a3a6e' }}>
          4. 個人資料保護
        </h2>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            4.1 蒐集目的與範圍
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-3">
            本人同意主辦方及協辦單位為辦理本次活動之必要，蒐集、處理及利用本人之個人資料，包括但不限於：
          </p>
          <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 mb-4 space-y-2">
            <li>姓名、聯絡電話、電子郵件、身分證字號（用於領獎）</li>
            <li>學校/公司名稱、科系/職稱</li>
            <li>活動期間拍攝之照片或影片（含本人肖像）</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            4.2 利用期間與地區
          </h3>
          <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 mb-4 space-y-2">
            <li>利用期間：活動期間及結束後五年內</li>
            <li>利用地區：台灣及主辦方協辦單位所在國家/地區</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            4.3 利用方式
          </h3>
          <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 mb-4 space-y-2">
            <li>報名審查、活動通知、聯繫協調、發放獎項</li>
            <li>活動紀錄、成果報告、宣傳推廣</li>
            <li>符合個人資料保護法及相關法令之其他利用</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            4.4 權利告知
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-3">
            本人瞭解依個人資料保護法第3條規定，本人就所提供之個人資料得行使以下權利：
          </p>
          <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 mb-4 space-y-2">
            <li>查詢或請求閱覽</li>
            <li>請求製給複製本</li>
            <li>請求補充或更正</li>
            <li>請求停止蒐集、處理或利用</li>
            <li>請求刪除</li>
          </ul>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            若需行使上述權利，請聯絡主辦方。惟若本人拒絕提供必要資料或要求刪除/停止利用，可能導致無法完成報名或參賽。
          </p>
        </div>
      </section>

      {/* 5. 肖像權與宣傳授權 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1a3a6e' }}>
          5. 肖像權與宣傳授權
        </h2>
        <p className="text-sm leading-relaxed text-gray-700 mb-4">
          本人同意主辦方及協辦單位於活動期間及其後，為宣傳、教育、紀錄等非營利目的，於活動相關網站、社群媒體、新聞稿、影片等管道，無償使用本人之姓名、照片、影音及相關資料。本人放棄對上述使用主張肖像權、隱私權或其他權利。
        </p>
      </section>

      {/* 6. 免責聲明 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1a3a6e' }}>
          6. 免責聲明
        </h2>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            6.1 活動變更或取消
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            因不可抗力（如天災、疫情、政府命令等）或其他正當事由，主辦方得變更、延期或取消活動，對此不負任何賠償或補償責任。
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            6.2 人身安全與財物
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            本人參加活動期間應自行注意人身安全及財物保管。除主辦方有故意或重大過失外，對於本人於活動期間遭受之人身傷害、財物損失或其他損害，主辦方不負賠償責任。
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            6.3 網路與設備
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            主辦方將盡力提供必要之網路及設備，惟不保證其穩定性或可用性。因網路中斷、設備故障、系統異常等技術問題導致之任何損失，主辦方不負責任。
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            6.4 第三方服務與內容
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            活動中可能涉及第三方提供之服務、API、工具或內容。本人理解主辦方對第三方之服務品質、內容正確性、智慧財產權歸屬等不做任何保證，相關爭議應由本人與該第三方自行解決。
          </p>
        </div>
      </section>

      {/* 7. 保密與商業合作 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1a3a6e' }}>
          7. 保密與商業合作
        </h2>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            7.1 保密義務
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            活動期間，本人可能接觸主辦方、協辦單位或其他參賽者之商業機密或敏感資訊。本人同意對所知悉之機密資訊負保密義務，非經權利人書面同意，不得對外揭露或用於活動以外之目的。
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            7.2 商業合作機會
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            主辦方或協辦單位可能向得獎者或參賽者提供後續合作機會（如育成輔導、投資媒合等），惟此非主辦方之義務，相關合作條件應由雙方另行協商。
          </p>
        </div>
      </section>

      {/* 8. 其他約定事項 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1a3a6e' }}>
          8. 其他約定事項
        </h2>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            8.1 準據法與管轄
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            本承諾書之解釋、效力及履行，均以中華民國法律為準據法。因本承諾書或活動產生之爭議，雙方同意以台灣台北地方法院為第一審管轄法院。
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            8.2 承諾書效力
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            本人確認已詳細閱讀並完全理解本承諾書之全部內容，並同意受其拘束。本承諾書自本人完成報名程序時生效，效力持續至活動結束及所有相關事務處理完畢為止。
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1a3a6e' }}>
            8.3 聯絡資訊
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            若對本承諾書或活動有任何疑問，請透過活動官方網站或主辦方公告之聯絡方式洽詢。
          </p>
        </div>
      </section>

      {/* 結語 */}
      <section className="mb-8">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm font-semibold text-blue-900 mb-2">
            ✓ 本人已詳細閱讀並完全理解上述所有條款
          </p>
          <p className="text-sm text-blue-800">
            本人自願報名參加本次活動，並同意遵守本承諾書之一切約定。
          </p>
        </div>
      </section>
    </div>
  );
}

