/**
 * 得獎名單頁面
 * 
 * 顯示各賽道的獲獎團隊 - 使用首頁風格
 */

import Head from 'next/head';
import AppHeader from '../components/AppHeader';
import HomeFooter from '../components/homeComponents/HomeFooter';

interface Winner {
  name: string;
  project?: string;
}

interface Award {
  title: string;
  winners: Winner[];
}

interface TrackAwards {
  trackName: string;
  awards: Award[];
  announced: boolean;
}

export default function WinnersPage() {
  const tracksAwards: TrackAwards[] = [
    {
      trackName: 'Demo Day 賽道',
      announced: true,
      awards: [
        {
          title: 'Demo Day 首獎',
          winners: [
            { name: 'blygccrryryy', project: '企業級多鏈支付解決方案' },
          ],
        },
        {
          title: 'Demo Day 最佳簡報獎',
          winners: [
            { name: 'twin3', project: '人類體驗就是你的資產' },
          ],
        },
        {
          title: 'Demo Day 最佳人氣獎',
          winners: [
            { name: 'Solasui', project: 'RWA 股權抽籤平台' },
          ],
        },
        {
          title: 'Demo Day 佳作',
          winners: [
            { name: 'RBJJH', project: '基於ERC-3643個人股票代幣化之抵押借貸' },
            { name: '估值1B的獨角獸', project: '房地產 RWA 借貸平台' },
            { name: '就愛觀光組', project: 'Real Estate RWA Proof Gateway' },
            { name: 'Cryptonite', project: '基於 TEE 與 PQC 的 RWA 隱私身份驗證基礎設施' },
            { name: 'StatelessGuard', project: 'Modular Trust Framework for Humans & Agents' },
            { name: 'Recode Health重編醫鏈', project: 'Unlock Your Genome, Own Your Data, Power Global Health Research' },
            { name: 'VoucherFi', project: 'RWA Wallet Experience' },
            { name: 'Zzyzx Labs', project: 'SEAWALLET' },
            { name: '幣流徵信社', project: '鏈上資產追蹤' },
            { name: 'Foundry Trust', project: '碳積點永續信用卡計畫' },
            { name: 'GreenFi Labs', project: '解決小農困境' },
            { name: 'TaxCoin', project: '退稅不只是補貼，而是金融資產+消費能力' },
            { name: '我先上鏈的!', project: '發票載具綁定公益機構之 web3 pool' },
            { name: 'RWACE', project: 'RWA 綠能資產代幣化平台' },
            { name: '王者清華大學區塊鏈研究社', project: '基於區塊鏈與IoT的P2P潔淨能源交易平台' },
          ],
        },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>得獎名單 - RWA Hackathon Taiwan</title>
        <meta name="description" content="RWA 黑客松台灣得獎名單" />
      </Head>
      <AppHeader />

      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24" style={{ paddingTop: '80px' }}>
        <div className="max-w-[1200px] mx-auto px-8 md:px-12">
          {/* Celebration Banner */}
          <div className="mb-12 bg-white rounded-lg shadow-md p-8 md:p-12 border-l-4" style={{ borderLeftColor: '#8B4049' }}>
            <h1 className="text-[32px] md:text-[48px] font-bold mb-4 text-center" style={{ color: '#1a3a6e' }}>
              恭喜所有獲獎團隊
            </h1>
            <div className="w-24 h-1 mx-auto mb-6" style={{ backgroundColor: '#8B4049' }}></div>
            <p className="text-[16px] md:text-[18px] text-gray-700 leading-relaxed text-center max-w-3xl mx-auto">
              感謝你們用創新與熱情，為台灣首屆 RWA 黑客松寫下精彩的篇章。經過激烈的競爭與評審團的仔細評選，以下團隊脫穎而出，展現了卓越的創新能力與技術實力。
            </p>
          </div>

          {/* Tracks Awards */}
          <div className="space-y-16">
            {tracksAwards.map((track, trackIndex) => (
              <div key={trackIndex}>
                {/* Track Title */}
                <div className="mb-10">
                  <h2 className="text-[24px] md:text-[32px] font-bold mb-3" style={{ color: '#1a3a6e' }}>
                    {track.trackName}
                  </h2>
                  <div className="w-16 h-1" style={{ backgroundColor: '#8B4049' }}></div>
                </div>

                {track.announced ? (
                  <div className="space-y-12">
                    {track.awards.map((award, awardIndex) => (
                      <div key={awardIndex}>
                        {/* Award Title */}
                        <h3
                          className="text-[18px] md:text-[20px] font-semibold mb-6"
                          style={{ color: '#1a3a6e' }}
                        >
                          {award.title}
                        </h3>

                        {/* Winners List */}
                        {award.winners.length === 1 ? (
                          // Single winner - elegant display with project
                          <div 
                            className="bg-white py-8 px-8 md:px-12 border-l-4 rounded-lg shadow-sm" 
                            style={{ 
                              borderLeftColor: awardIndex === 0 ? '#8B4049' : '#1a3a6e',
                            }}
                          >
                            <p className="text-[24px] md:text-[32px] font-bold mb-3" style={{ color: '#1a3a6e' }}>
                              {award.winners[0].name}
                            </p>
                            {award.winners[0].project && (
                              <p className="text-[14px] md:text-[16px] text-gray-600">
                                {award.winners[0].project}
                              </p>
                            )}
                          </div>
                        ) : (
                          // Multiple winners - clean list with projects
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {award.winners.map((winner, winnerIndex) => (
                              <div
                                key={winnerIndex}
                                className="bg-white py-5 px-6 border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                style={{ borderLeftColor: '#94a3b8' }}
                              >
                                <p className="text-[15px] md:text-[17px] text-gray-900 font-semibold mb-2">
                                  {winner.name}
                                </p>
                                {winner.project && (
                                  <p className="text-[13px] md:text-[14px] text-gray-600 leading-relaxed">
                                    {winner.project}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Not announced yet
                  <div className="bg-white py-12 px-8 text-center border border-gray-200 rounded-lg shadow-sm">
                    <p className="text-[16px] md:text-[18px] text-gray-600">
                      獎項將陸續公布
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Closing Message */}
          <div className="mt-20 pt-12 border-t-2" style={{ borderColor: '#8B4049' }}>
            <div className="bg-white rounded-lg shadow-md p-8 md:p-12 border-l-4" style={{ borderLeftColor: '#1a3a6e' }}>
              <h3 className="text-[24px] md:text-[32px] font-bold mb-6 text-center" style={{ color: '#1a3a6e' }}>
                感謝所有參賽團隊
              </h3>
              <div className="max-w-3xl mx-auto space-y-5 text-[15px] md:text-[16px] leading-relaxed">
                <p className="text-gray-700">
                  感謝每一位參賽者的投入與熱情，你們的創新思維與技術實力，讓台灣首屆 RWA 黑客松成為一場精彩的盛會。
                </p>
                <p className="text-gray-700">
                  無論是否獲獎，每一個團隊都是這次活動的重要貢獻者。從真實世界資產代幣化、隱私保護、碳權交易，到醫療數據、能源管理、金融創新，你們展現了 RWA 技術的無限可能。
                </p>
                <p className="text-gray-700">
                  期待未來在 RWA 領域看到更多來自你們的創新與突破，讓區塊鏈技術真正落地，為社會創造實質價值。
                </p>
                <div className="pt-6 mt-6 border-t border-gray-200">
                  <p className="text-center text-gray-600 italic">
                    其他賽道獎項將陸續公布
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
    </>
  );
}

