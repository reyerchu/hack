/**
 * 得獎名單頁面
 * 
 * 顯示各賽道的獲獎團隊
 */

import Head from 'next/head';
import AppHeader from '../components/AppHeader';

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
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>得獎名單 - RWA Hackathon Taiwan</title>
        <meta name="description" content="RWA 黑客松台灣得獎名單" />
      </Head>
      <AppHeader />

      <div className="flex-grow bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-20">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
              🏆 得獎名單
            </h1>
            <p className="text-lg md:text-xl" style={{ color: '#6b7280' }}>
              恭喜所有獲獎團隊！
            </p>
          </div>

          {/* Tracks Awards */}
          <div className="space-y-8">
            {tracksAwards.map((track, trackIndex) => (
              <div
                key={trackIndex}
                className="bg-white rounded-xl shadow-lg p-6 md:p-8 border-l-4"
                style={{ borderLeftColor: '#1a3a6e' }}
              >
                {/* Track Title */}
                <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#1a3a6e' }}>
                  {track.trackName}
                </h2>

                {track.announced ? (
                  <div className="space-y-6">
                    {track.awards.map((award, awardIndex) => (
                      <div key={awardIndex}>
                        {/* Award Title */}
                        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2" style={{ color: '#2563eb' }}>
                          {awardIndex === 0 && '🥇'}
                          {awardIndex === 1 && '🏅'}
                          {awardIndex === 2 && '⭐'}
                          {awardIndex > 2 && '🎖️'}
                          {award.title}
                        </h3>

                        {/* Winners List */}
                        {award.winners.length === 1 ? (
                          // Single winner - large display
                          <div
                            className="p-4 rounded-lg text-center"
                            style={{
                              backgroundColor: '#f0f9ff',
                              border: '2px solid #3b82f6',
                            }}
                          >
                            <p className="text-2xl font-bold" style={{ color: '#1e40af' }}>
                              {award.winners[0]}
                            </p>
                          </div>
                        ) : (
                          // Multiple winners - grid display
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {award.winners.map((winner, winnerIndex) => (
                              <div
                                key={winnerIndex}
                                className="p-3 rounded-lg border-2 transition-all hover:shadow-md"
                                style={{
                                  backgroundColor: '#fefce8',
                                  borderColor: '#fbbf24',
                                }}
                              >
                                <p className="text-sm font-medium" style={{ color: '#92400e' }}>
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
                  <div
                    className="p-6 rounded-lg text-center"
                    style={{
                      backgroundColor: '#f9fafb',
                      border: '2px dashed #d1d5db',
                    }}
                  >
                    <p className="text-lg" style={{ color: '#6b7280' }}>
                      獎項將陸續公布，敬請期待...
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center">
            <div
              className="inline-block px-6 py-3 rounded-lg"
              style={{
                backgroundColor: '#e0e7ff',
                border: '1px solid #c7d2fe',
              }}
            >
              <p className="text-sm font-medium" style={{ color: '#3730a3' }}>
                📢 其他賽道獎項將陸續公布
              </p>
            </div>
          </div>

          {/* Congratulations Section */}
          <div className="mt-12 text-center">
            <div
              className="p-8 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                🎉 恭喜所有參賽團隊！
              </h3>
              <p className="text-white text-lg">
                感謝你們的精彩表現與創新精神
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

