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
          {/* Celebration Banner */}
          <div className="mb-12 p-8 md:p-12 rounded-lg" style={{ 
            background: 'linear-gradient(135deg, #1a3a6e 0%, #2a5a9e 100%)',
            boxShadow: '0 4px 6px rgba(26, 58, 110, 0.1)'
          }}>
            <div className="text-center">
              <div className="text-[48px] md:text-[64px] mb-4">🏆</div>
              <h1 className="text-[32px] md:text-[48px] leading-tight font-bold text-white mb-4">
                恭喜所有獲獎團隊！
              </h1>
              <p className="text-[18px] md:text-[22px] text-white/90 mb-6 leading-relaxed">
                感謝你們用創新與熱情，為台灣首屆 RWA 黑客松寫下精彩的篇章
              </p>
              <div className="inline-block px-6 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                <p className="text-white text-[14px] md:text-[16px] font-medium">
                  Winners Announcement
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="mb-16">
            <h2
              className="text-[28px] md:text-[36px] leading-tight font-bold mb-4"
              style={{ color: '#1a3a6e' }}
            >
              獲獎名單
            </h2>
            <p className="text-[16px] md:text-[18px] text-gray-700 leading-relaxed">
              經過激烈的競爭與評審團的仔細評選，以下團隊脫穎而出，展現了卓越的創新能力與技術實力。
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
                          // Single winner - elegant display with celebration
                          <div className="relative">
                            <div 
                              className="py-8 px-8 md:px-12 border-l-4 rounded-r-lg" 
                              style={{ 
                                background: awardIndex === 0 
                                  ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' 
                                  : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                borderLeftColor: awardIndex === 0 ? '#f59e0b' : '#3b82f6',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="text-[32px] md:text-[40px]">
                                  {awardIndex === 0 ? '👑' : '⭐'}
                                </div>
                                <div>
                                  <p className="text-[24px] md:text-[32px] font-bold" style={{ color: '#1a3a6e' }}>
                                    {award.winners[0]}
                                  </p>
                                  <p className="text-[14px] md:text-[16px] mt-1" style={{ color: '#6b7280' }}>
                                    {awardIndex === 0 ? '實至名歸！恭喜奪得首獎！' : '表現出色！恭喜獲獎！'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Multiple winners - warm list with encouragement
                          <>
                            <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border-l-3" style={{ borderLeftColor: '#f59e0b' }}>
                              <p className="text-[14px] md:text-[15px] text-gray-700">
                                🎉 以下 <span className="font-bold text-amber-600">{award.winners.length}</span> 支團隊憑藉優秀的表現獲得佳作，恭喜你們！
                              </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {award.winners.map((winner, winnerIndex) => (
                                <div
                                  key={winnerIndex}
                                  className="py-4 px-6 border-l-3 bg-gradient-to-r from-gray-50 to-white hover:from-amber-50 hover:to-white transition-all duration-300 rounded-r"
                                  style={{ borderLeftWidth: '3px', borderLeftColor: '#d97706' }}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="text-amber-500 text-[16px] flex-shrink-0">✨</span>
                                    <p className="text-[14px] md:text-[16px] text-gray-800 font-medium">
                                      {winner}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
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
            <div className="bg-blue-50 py-6 px-8 border-l-4 rounded-r-lg" style={{ borderLeftColor: '#3b82f6' }}>
              <p className="text-[14px] md:text-[16px] text-gray-700">
                <span className="font-semibold text-blue-900">📢 敬請期待：</span>
                其他賽道獎項將陸續公布，感謝所有參賽團隊的耐心等待
              </p>
            </div>
          </div>

          {/* Gratitude Section */}
          <div className="mt-16 space-y-8">
            {/* Main Thank You */}
            <div className="text-center py-12 px-8 rounded-xl" style={{
              background: 'linear-gradient(135deg, #1a3a6e 0%, #2a5a9e 50%, #1a3a6e 100%)',
              boxShadow: '0 8px 16px rgba(26, 58, 110, 0.15)'
            }}>
              <div className="text-[40px] md:text-[48px] mb-4">🎊</div>
              <h3 className="text-[28px] md:text-[40px] font-bold mb-4 text-white">
                感謝所有參賽團隊
              </h3>
              <p className="text-[16px] md:text-[20px] text-white/90 leading-relaxed max-w-3xl mx-auto mb-6">
                感謝每一位參賽者的投入與熱情，你們的創新思維與技術實力，讓台灣首屆 RWA 黑客松成為一場精彩的盛會。
              </p>
              <p className="text-[14px] md:text-[16px] text-white/80 leading-relaxed max-w-2xl mx-auto">
                無論是否獲獎，每一個團隊都是這次活動的重要貢獻者。期待未來在 RWA 領域看到更多來自你們的創新與突破！
              </p>
            </div>

            {/* Special Thanks Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-100">
                <div className="text-[32px] mb-3">💡</div>
                <h4 className="text-[18px] font-bold mb-2" style={{ color: '#1a3a6e' }}>
                  創新精神
                </h4>
                <p className="text-[14px] text-gray-700">
                  感謝各團隊帶來的創新想法，推動 RWA 技術的應用與發展
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-lg border border-amber-100">
                <div className="text-[32px] mb-3">🤝</div>
                <h4 className="text-[18px] font-bold mb-2" style={{ color: '#1a3a6e' }}>
                  團隊合作
                </h4>
                <p className="text-[14px] text-gray-700">
                  感謝各團隊成員之間的密切協作，展現了卓越的團隊精神
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-100">
                <div className="text-[32px] mb-3">🚀</div>
                <h4 className="text-[18px] font-bold mb-2" style={{ color: '#1a3a6e' }}>
                  持續前行
                </h4>
                <p className="text-[14px] text-gray-700">
                  期待各團隊繼續深耕 RWA 領域，創造更多可能性
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

