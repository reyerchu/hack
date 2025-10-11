import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/solid';
import FaqDisclosure from './FaqDisclosure';

export default function HomeFaqSection() {
  const faqs = [
    {
      question: 'RWA 黑客松的時間與地點？',
      answer:
        '2025/10/31（五）10:00~22:00 及 11/1（六）8:00~12:00 最後衝刺\n• 地點：政大公企中心 A747\n\n2025/11/1（六）13:30~16:30 Demo Day\n• 地點：政大公企中心 A645',
    },
    {
      question: '活動日程怎麼安排？',
      answer:
        '• 即日起 → 開放報名（加入 Line 群獲取最新資訊）\n• 10/15 → Workshop 開跑\n• 10/20 → 公布規章與題庫\n• 10/27 → 報名截止\n• 10/31 - 11/1 → 黑客松正式舉行\n• 11/1 下午 → Demo Day 發表\n• 11/8 → 評審結束，獲獎隊伍公告',
    },
    {
      question: '題目何時公布？何時可以開始動工？',
      answer: '預計 10/20 陸續公布各賽道題目，團隊隨時可以開始動工。',
    },
    {
      question: '誰可以報名參加？',
      answer: '任何人都可以，沒有身份限制，無論是學生、上班族、新創或區塊鏈愛好者，都能報名。',
    },
    {
      question: '報名需要提供什麼資料？',
      answer:
        '• 個人預報名時，流程簡單，不會要求填寫過多個資。\n• 如果您願意提供完整的履歷與資料，能幫助主辦方更好媒合贊助商、協辦單位的需求（例如人才招募或職缺配對）。\n• 上傳履歷是選填、非強制。',
    },
    {
      question: '報名截止日？',
      answer: '2025/10/27（一）23:59',
    },
    {
      question: '團隊報名要怎麼進行？',
      answer:
        '目前開放的是「個人預報名」，之後會隨著贊助商題目與挑戰公布，才會正式開放「黑客松團隊報名」。屆時：\n• 每位隊員都需要個別用 Email 註冊。\n• 團隊再由代表進行組隊填寫。\n詳細方式會在官方網站與社群公告。',
    },
    {
      question: '需要自己準備隊伍嗎？',
      answer:
        '不一定，您可以自己組隊報名，也可以先個人報名，主辦方會舉辦工作坊等活動協助媒合，找到志同道合的夥伴。',
    },
    {
      question: '人在國外或無法出席黑客松活動日，可以參加嗎？',
      answer:
        '可以。只要最後組隊的團隊中至少有一位成員會在 11/1 下午現場參加活動即可。如果您一開始是個人報名但人在海外，仍然可以透過線上方式參與工作坊等活動，最後只要找到能現場出席的隊友即可（參考 7 組隊方式）。',
    },
    {
      question: '有什麼獎項？',
      answer:
        '總獎項價值超過 40 萬新台幣，分布於 RWA 六大主題，並由各贊助單位提供專屬獎項。詳細獎項將於 10/20 陸續公布。',
    },
  ];

  const [disclosuresStatus, setDisclosureStatus] = useState<boolean[]>(
    new Array(faqs.length).fill(false),
  );

  const expandAll = () => {
    setDisclosureStatus(new Array(faqs.length).fill(true));
  };

  const closeAll = () => {
    setDisclosureStatus(new Array(faqs.length).fill(false));
  };

  return (
    <section id="faq" className="relative w-full py-16 md:py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-8 md:px-12">
        {/* Section Header - TSMC Style */}
        <div className="flex flex-row justify-between items-start mb-12">
          <div>
            <h2 className="text-[28px] md:text-[36px] font-normal text-black mb-2">FAQ</h2>
            <div className="w-16 h-[2px]" style={{ backgroundColor: '#1a3a6e' }}></div>
            <p className="text-[18px] mt-4 font-normal" style={{ color: '#1a3a6e' }}>
              常見問題
            </p>
          </div>
          <div className="flex flex-row items-center gap-x-2 mt-2">
            <button
              onClick={() => {
                if (disclosuresStatus.every((status) => status)) {
                  closeAll();
                } else {
                  expandAll();
                }
              }}
              className="font-medium transition-colors text-sm md:text-base"
              style={{ color: '#1a3a6e' }}
            >
              {disclosuresStatus.every((status) => status) ? '全部收起' : '全部展開'}
            </button>
            <ChevronDownIcon
              className={`${
                disclosuresStatus.every((status) => status)
                  ? 'transform rotate-180 transition duration-500 ease-in-out'
                  : 'transition duration-500 ease-in-out'
              } w-5 h-5`}
              style={{ color: '#1a3a6e' }}
            />
          </div>
        </div>

        {/* FAQ for desktop - 2 columns */}
        <div className="md:flex hidden justify-between gap-8">
          <div className="w-[49%] space-y-6">
            {faqs.map(
              ({ question, answer }, idx) =>
                idx % 2 === 0 && (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300"
                  >
                    <FaqDisclosure
                      question={question}
                      answer={answer}
                      isOpen={disclosuresStatus[idx]}
                      toggleDisclosure={() => {
                        const currDisclosure = [...disclosuresStatus];
                        currDisclosure[idx] = !currDisclosure[idx];
                        setDisclosureStatus(currDisclosure);
                      }}
                    />
                  </div>
                ),
            )}
          </div>
          <div className="w-[49%] space-y-6">
            {faqs.map(
              ({ question, answer }, idx) =>
                idx % 2 !== 0 && (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300"
                  >
                    <FaqDisclosure
                      question={question}
                      answer={answer}
                      isOpen={disclosuresStatus[idx]}
                      toggleDisclosure={() => {
                        const currDisclosure = [...disclosuresStatus];
                        currDisclosure[idx] = !currDisclosure[idx];
                        setDisclosureStatus(currDisclosure);
                      }}
                    />
                  </div>
                ),
            )}
          </div>
        </div>

        {/* FAQ for mobile - single column */}
        <div className="md:hidden">
          <div className="w-full space-y-6">
            {faqs.map(({ question, answer }, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300"
              >
                <FaqDisclosure
                  question={question}
                  answer={answer}
                  isOpen={disclosuresStatus[idx]}
                  toggleDisclosure={() => {
                    const currDisclosure = [...disclosuresStatus];
                    currDisclosure[idx] = !currDisclosure[idx];
                    setDisclosureStatus(currDisclosure);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
