import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import AppHeader from '../components/AppHeader';

interface Person {
  name: string;
  title: string;
  bio: string;
  photo?: string; // 照片文件名
}

const mentors: Person[] = [
  {
    name: 'Aaron 顏培祐',
    title: '閎旺科技創辦人',
    bio: '區塊鏈顧問，專注於協助企業開發區塊鏈產品與設計產品架構，五年 DeFi 研究與開發經驗，同時是 SUI on - chain incentive system Liquidlink 的 Co-founder。',
    photo: '顏培祐.jpg',
  },
  {
    name: 'Albert 鄭鈞元',
    title: 'Oasis Ambassodor',
    bio: '熱愛 AI × Blockchain 的技術落地，多次參與 ETHGlobal 黑客松並與 XueDAO 合辦多場技術工作坊，累積從原型到產品化的紮實經驗。近期聚焦 Agent Payment：讓 AI 代理安全發起、授權與完成鏈上支付與結算，降低使用者與開發者的整合成本。',
    photo: 'Albert.jpg',
  },
  {
    name: 'Hsuanting 朱軒廷',
    title: 'Dinngo 創辦人暨執行長',
    bio: '團隊打造了兩款創新的 DeFi 產品：Furucombo.app—革命性的 DeFi 聚合平台，讓用戶無需寫程式就能在單一交易中串聯 Uniswap、Aave 等多個協議，開創「DeFi 樂高」新玩法。Portus.xyz—專業的 Intent-based Solver，在 CoWSwap 和 Uniswap 上競爭最優交易執行方案，提供更好的價格發現與 MEV 保護。他致力於讓複雜金融機制「看得懂、用得起」，讓更多人能直覺進入 DeFi 世界。',
    photo: '朱軒廷.png',
  },
  {
    name: 'Jennifer Hsu 許芮甄',
    title: 'XueDAO Co-founder',
    bio: '',
    photo: 'JenniferHsu.jpg',
  },
  {
    name: 'Jerry Ho',
    title: 'IOTA Foundation Asia Devrel',
    bio: '勉強算是有些密碼學與資安背景，興趣是看穿業界中的妖魔鬼怪。職涯跨度巨大，Chainlink智庫研究員 -> Ethereum L2協議工程師 -> Move L1 開發者關係，研究實務社群全都沾。唯一不變的初心是 - 想讓臺灣工程師看見世界的願望。',
    photo: 'JerryHo.png',
  },
  {
    name: 'Kevin Lin 林柏呈',
    title: 'Self Integration Engineer',
    bio: '',
    photo: 'KevinLin.jpg',
  },
  {
    name: 'Nathan 余哲安',
    title: 'Macro in DeFi 研究者',
    bio: '專注研究 DeFi 金融制度與美元穩定幣架構，關注主權金融、RWA（真實世界資產代幣化）及利率市場的連結。長期撰寫分析文章，從制度與市場結構的角度探討加密金融的運作邏輯。在黑客松期間可協助團隊進行「協議設計邏輯」、「收益模型與制度可行性分析」等相關討論。',
    photo: '余哲安.jpg',
  },
  {
    name: 'Ping 陳品',
    title: 'Pelith 創辦人',
    bio: '一位由興趣使然的區塊鏈開發者，也是 AppWorks School Blockchain Program 的導師，更是多個開源專案和區塊鏈應用的創造者，迄今已開發多項成熟區塊鏈應用產品，曾榮獲以太坊基金會開發補助與 Kyber Network DeFi 黑客松等獎項。',
    photo: '陳品.jpg',
  },
  {
    name: 'Reyer 瞿孝洋',
    title: 'RWA Nexus 創辦人，CFP',
    bio: '致力於孵化 DeFi 及 Fintech 團隊並提供解決方案，現任 RWA Nexus CEO、區塊鏈顧問及清大創業車庫業師。曾在聯發科技服務近十年，並擔任過物聯網 IC 設計新創總經理及區塊鏈資安新創 CYBAVO（已被 Circle 收購）策略長。專精 DeFi、RWA、軟體開發及 AI 應用整合等。',
    photo: '瞿孝洋.jpg',
  },
  {
    name: 'Ryan',
    title: 'ETHTaipei 主辦',
    bio: '',
    photo: '',
  },
];

const bestPresentationJudges: Person[] = [
  {
    name: 'Brian Lin',
    title: '亞洲志遠科技 執行長',
    bio: '深耕 FinTech 與企業級系統整合 25 年，實戰版圖橫跨銀行、投信與保險等領域。專長於將商業策略精準轉譯為可落地的技術方案，兼顧效能、可用性與法遵要求。職涯至今主導之專案達成 100% 上線且穩定運行，持續以高可靠度與交付品質贏得客戶長期信任。',
    photo: 'BrianLin.jpg',
  },
  {
    name: 'Daniel 王心平',
    title: 'Spark Lands CEO',
    bio: '具科技背景，曾擔任全智科北美及歐洲業務經理及美商 Amkor 大中華區業務經理，返台後專注於不動產及整合開發之投資事業，經歷高科技產業、商業經驗、不動產投資相關經驗，並在 2023 年開始進行研擬不動產在 RWA 賽道之趨勢及在台灣落地之法遵及應用可行性，並在隔年 2024 年創立 Spark Lands 星域數位地產，將資產配置、資產管理、資產上鏈應用等整合，成為台灣首發進入 RWA 賽道之項目。',
    photo: '王心平.jpg',
  },
  {
    name: 'Stella Hsu',
    title: '股感媒體科技 執行長',
    bio: '',
    photo: 'Stella.jpg',
  },
];

const firstPrizeJudges: Person[] = [
  {
    name: 'Eric 林政憲',
    title: '國泰金控',
    bio: '',
    photo: '',
  },
  {
    name: 'Martinet Lee 李嵩聲',
    title: 'Zircuit Cofounder',
    bio: '',
    photo: '李嵩聲.jpg',
  },
  {
    name: 'Ping 陳品',
    title: 'Pelith 創辦人',
    bio: '',
    photo: '陳品.jpg',
  },
  {
    name: 'Randy',
    title: 'imToken',
    bio: '',
    photo: '',
  },
];

function PersonCard({ person }: { person: Person }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* 照片 */}
      <div className="mb-4 flex justify-center">
        {person.photo ? (
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200">
            <Image
              src={`/photo/${person.photo}`}
              alt={person.name}
              layout="fill"
              objectFit="cover"
            />
          </div>
        ) : (
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center text-white text-3xl font-bold"
            style={{ backgroundColor: '#1a3a6e' }}
          >
            {person.name.charAt(0)}
          </div>
        )}
      </div>

      {/* 名字 */}
      <h3
        className="text-xl font-bold text-center mb-2"
        style={{ color: '#1a3a6e' }}
      >
        {person.name}
      </h3>

      {/* 職稱 */}
      {person.title && (
        <p
          className="text-sm text-center mb-3"
          style={{ color: '#8B4049' }}
        >
          {person.title}
        </p>
      )}

      {/* 簡介 */}
      {person.bio && (
        <p
          className="text-sm leading-relaxed"
          style={{
            color: '#374151',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.75',
          }}
        >
          {person.bio}
        </p>
      )}
    </div>
  );
}

export default function MentorsPage() {
  return (
    <>
      <Head>
        <title>黑客松導師及評審 | RWA 黑客松</title>
        <meta name="description" content="認識 RWA 黑客松的導師與評審團隊" />
      </Head>

      <AppHeader />

      <div className="min-h-screen bg-gray-50" style={{ paddingTop: '80px' }}>
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Page Header */}
          <div className="mb-16 text-center">
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: '#1a3a6e' }}
            >
              黑客松導師及評審
            </h1>
            <div
              className="w-24 h-1 mx-auto mb-6"
              style={{ backgroundColor: '#8B4049' }}
            ></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              感謝所有導師與評審的專業指導與支持，讓參賽者能夠在黑客松中獲得最佳的學習體驗
            </p>
          </div>

          {/* 導師時間表 Section */}
          <section className="mb-20">
            <div className="mb-8">
              <h2
                className="text-3xl font-bold mb-2"
                style={{ color: '#1a3a6e' }}
              >
                導師時間表｜Mentor Schedule
              </h2>
              <div
                className="w-16 h-1"
                style={{ backgroundColor: '#8B4049' }}
              ></div>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#1a3a6e' }}>
                    <th className="px-4 py-3 text-left text-white font-semibold border border-gray-300">
                      導師
                    </th>
                    <th className="px-4 py-3 text-center text-white font-semibold border border-gray-300">
                      10/31<br />10:00-12:00
                    </th>
                    <th className="px-4 py-3 text-center text-white font-semibold border border-gray-300">
                      10/31<br />13:00-15:00
                    </th>
                    <th className="px-4 py-3 text-center text-white font-semibold border border-gray-300">
                      10/31<br />15:00-17:00
                    </th>
                    <th className="px-4 py-3 text-center text-white font-semibold border border-gray-300">
                      10/31<br />18:00-22:00
                    </th>
                    <th className="px-4 py-3 text-center text-white font-semibold border border-gray-300">
                      11/1<br />9:00-11:30
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Aaron', slots: [true, true, true, true, true] },
                    { name: 'Albert', slots: [true, false, false, true, true] },
                    { name: 'Hsuanting', slots: [false, true, true, false, false] },
                    { name: 'Jennifer', slots: [false, false, false, false, true] },
                    { name: 'Jerry Ho', slots: [true, true, false, false, false] },
                    { name: 'Kevin', slots: [false, true, true, false, false] },
                    { name: 'Nathan', slots: [false, false, false, false, true] },
                    { name: 'Ping', slots: [false, true, true, true, false] },
                    { name: 'Reyer', slots: [true, true, true, true, true] },
                    { name: 'Ryan', slots: [true, true, true, true, false] },
                  ].map((mentor, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    >
                      <td
                        className="px-4 py-3 font-semibold border border-gray-300"
                        style={{ color: '#1a3a6e' }}
                      >
                        {mentor.name}
                      </td>
                      {mentor.slots.map((available, slotIndex) => (
                        <td
                          key={slotIndex}
                          className="px-4 py-3 text-center border border-gray-300"
                        >
                          {available && (
                            <span
                              className="inline-block w-6 h-6 rounded-full"
                              style={{ backgroundColor: '#4ade80' }}
                              title="可預約"
                            >
                              ✓
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 導師 Section */}
          <section className="mb-20">
            <div className="mb-8">
              <h2
                className="text-3xl font-bold mb-2"
                style={{ color: '#1a3a6e' }}
              >
                導師｜Mentor
              </h2>
              <div
                className="w-16 h-1"
                style={{ backgroundColor: '#8B4049' }}
              ></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mentors.map((mentor, index) => (
                <PersonCard key={index} person={mentor} />
              ))}
            </div>
          </section>

          {/* Demo Day 最佳簡報獎評審 Section */}
          <section className="mb-20">
            <div className="mb-8">
              <h2
                className="text-3xl font-bold mb-2"
                style={{ color: '#1a3a6e' }}
              >
                「Demo Day 最佳簡報獎」評審｜Judge
              </h2>
              <div
                className="w-16 h-1"
                style={{ backgroundColor: '#8B4049' }}
              ></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {bestPresentationJudges.map((judge, index) => (
                <PersonCard key={index} person={judge} />
              ))}
            </div>
          </section>

          {/* Demo Day 首獎評審 Section */}
          <section>
            <div className="mb-8">
              <h2
                className="text-3xl font-bold mb-2"
                style={{ color: '#1a3a6e' }}
              >
                「Demo Day 首獎」評審｜Judge
              </h2>
              <div
                className="w-16 h-1"
                style={{ backgroundColor: '#8B4049' }}
              ></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {firstPrizeJudges.map((judge, index) => (
                <PersonCard key={index} person={judge} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

