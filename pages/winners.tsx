/**
 * 得獎名單頁面
 * 
 * 顯示各賽道的獲獎團隊 - 使用首頁風格
 */

import Head from 'next/head';
import AppHeader from '../components/AppHeader';
import HomeFooter from '../components/homeComponents/HomeFooter';

interface Award {
  title: string;
  winners: string[];
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
          winners: ['blygccrryryy'],
        },
        {
          title: 'Demo Day 最佳簡報獎',
          winners: ['twin3'],
        },
        {
          title: 'Demo Day 最佳人氣獎',
          winners: ['Solasui'],
        },
        {
          title: 'Demo Day 佳作',
          winners: [
            'RBJJH',
            '估值1B的獨角獸',
            '就愛觀光組',
            'Cryptonite',
            'StatelessGuard',
            'Recode Health重編醫鏈',
            'VoucherFi',
            'Zzyzx Labs',
            '幣流徵信社',
            'Foundry Trust',
            'GreenFi Labs',
            'TaxCoin',
            '我先上鏈的!',
            'RWACE',
            '王者清華大學區塊鏈研究社',
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
          {/* Page Header */}
          <div className="mb-16 text-center">
            <h1 className="text-[36px] md:text-[48px] font-bold mb-4" style={{ color: '#1a3a6e' }}>
              得獎名單
            </h1>
            <div className="w-24 h-1 mx-auto mb-6" style={{ backgroundColor: '#8B4049' }}></div>
            <p className="text-[16px] md:text-[18px] text-gray-700 leading-relaxed max-w-3xl mx-auto">
              感謝所有參賽團隊的投入與熱情，經過激烈的競爭與評審團的仔細評選，以下團隊脫穎而出，展現了卓越的創新能力與技術實力
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
                          // Single winner - elegant display
                          <div 
                            className="bg-white py-8 px-8 md:px-12 border-l-4 rounded-lg shadow-sm" 
                            style={{ 
                              borderLeftColor: awardIndex === 0 ? '#8B4049' : '#1a3a6e',
                            }}
                          >
                            <p className="text-[24px] md:text-[32px] font-bold" style={{ color: '#1a3a6e' }}>
                              {award.winners[0]}
                            </p>
                          </div>
                        ) : (
                          // Multiple winners - clean list
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {award.winners.map((winner, winnerIndex) => (
                              <div
                                key={winnerIndex}
                                className="bg-white py-4 px-6 border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                style={{ borderLeftColor: '#94a3b8' }}
                              >
                                <p className="text-[14px] md:text-[16px] text-gray-800 font-medium">
                                  {winner}
                                </p>
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
          <div className="mt-20 pt-12 border-t border-gray-300">
            <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 border-l-4" style={{ borderLeftColor: '#1a3a6e' }}>
              <h3 className="text-[24px] md:text-[32px] font-bold mb-6 text-center" style={{ color: '#1a3a6e' }}>
                感謝所有參賽團隊
              </h3>
              <div className="max-w-3xl mx-auto space-y-4 text-[15px] md:text-[16px] text-gray-700 leading-relaxed">
                <p>
                  感謝每一位參賽者的投入與熱情，你們的創新思維與技術實力，讓台灣首屆 RWA 黑客松成為一場精彩的盛會。
                </p>
                <p>
                  無論是否獲獎，每一個團隊都是這次活動的重要貢獻者。期待未來在 RWA 領域看到更多來自你們的創新與突破。
                </p>
                <p className="pt-4 text-center text-gray-600 italic">
                  其他賽道獎項將陸續公布
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
    </>
  );
}

