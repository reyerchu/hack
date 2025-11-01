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

      {/* Hero Section - Dark Background like Home */}
      <section className="bg-white py-16 md:py-24 mt-14">
        <div className="max-w-[1200px] mx-auto px-8 md:px-12">
          {/* Title */}
          <div className="mb-16">
            <h1
              className="text-[36px] md:text-[48px] leading-tight font-bold mb-4"
              style={{ color: '#1a3a6e' }}
            >
              得獎名單
            </h1>
            <p className="text-[18px] md:text-[20px] font-light text-gray-700">
              Winners Announcement
            </p>
            <div className="border-t border-gray-300 mt-6"></div>
          </div>

          {/* Tracks Awards */}
          <div className="space-y-16">
            {tracksAwards.map((track, trackIndex) => (
              <div key={trackIndex}>
                {/* Track Title */}
                <h2
                  className="text-[24px] md:text-[32px] font-bold mb-8 pb-4 border-b border-gray-300"
                  style={{ color: '#1a3a6e' }}
                >
                  {track.trackName}
                </h2>

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
                          <div className="py-6 px-8 border-l-4 bg-gray-50" style={{ borderLeftColor: '#1a3a6e' }}>
                            <p className="text-[20px] md:text-[24px] font-bold" style={{ color: '#1a3a6e' }}>
                              {award.winners[0]}
                            </p>
                          </div>
                        ) : (
                          // Multiple winners - clean list
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {award.winners.map((winner, winnerIndex) => (
                              <div
                                key={winnerIndex}
                                className="py-4 px-6 border-l-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                style={{ borderLeftWidth: '3px', borderLeftColor: '#94a3b8' }}
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
                  <div className="py-12 text-center border border-gray-200 bg-gray-50">
                    <p className="text-[16px] md:text-[18px] text-gray-600">
                      獎項將陸續公布，敬請期待
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Announcement Note */}
          <div className="mt-16 pt-8 border-t border-gray-300">
            <div className="bg-gray-50 py-6 px-8 border-l-4" style={{ borderLeftColor: '#1a3a6e' }}>
              <p className="text-[14px] md:text-[16px] text-gray-700">
                <span className="font-semibold text-gray-900">提示：</span>
                其他賽道獎項將陸續公布
              </p>
            </div>
          </div>

          {/* Congratulations Section */}
          <div className="mt-16 text-center py-12 bg-gradient-to-r from-gray-50 to-gray-100">
            <h3
              className="text-[24px] md:text-[32px] font-bold mb-3"
              style={{ color: '#1a3a6e' }}
            >
              恭喜所有參賽團隊
            </h3>
            <p className="text-[16px] md:text-[18px] text-gray-700">
              感謝你們的精彩表現與創新精神
            </p>
          </div>
        </div>
      </section>

      <HomeFooter />
    </>
  );
}

