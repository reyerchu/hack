export default function TSMCPricePool() {
  const prizes = [
    {
      rank: 'RWA 創新獎',
      position: '1st',
      amount: '待公布',
      description: '最佳 RWA 代幣化解決方案',
      color: 'gold',
      icon: '🥇',
    },
    {
      rank: '監管合規獎',
      position: '2nd',
      amount: '待公布',
      description: '最佳監管合規解決方案',
      color: 'silver',
      icon: '🥈',
    },
    {
      rank: '技術實用獎',
      position: '3rd',
      amount: '待公布',
      description: '最佳技術實現方案',
      color: 'bronze',
      icon: '🥉',
    },
  ];

  const specialPrizes = [
    {
      title: 'RWA 技術獎',
      amount: '待公布',
      description: 'RWA 技術實現最優秀的作品',
      icon: '💻',
    },
    {
      title: '監管創新獎',
      amount: '待公布',
      description: '監管合規最具創新性的解決方案',
      icon: '💡',
    },
    {
      title: '金融應用獎',
      amount: '待公布',
      description: '金融機構應用最優秀的作品',
      icon: '🏦',
    },
    {
      title: '跨域合作獎',
      amount: '待公布',
      description: '金融與技術跨域合作最優秀的隊伍',
      icon: '🤝',
    },
  ];

  const totalPrize = '待公布';

  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-8">獎金池</h2>
            <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto mb-8"></div>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
              獎項與規章將於 10/1 公布，獎勵最具 RWA 創新性和監管合規性的優秀作品
            </p>
          </div>

          {/* Total Prize Display */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl px-12 py-8 border border-white border-opacity-20">
              <div className="text-6xl md:text-8xl font-black text-yellow-400 mr-6">
                {totalPrize}
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">總獎金</div>
                <div className="text-slate-300">新台幣</div>
              </div>
            </div>
          </div>

          {/* Main Prizes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {prizes.map((prize, index) => (
              <div
                key={index}
                className={`relative bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 ${
                  index === 0 ? 'md:scale-110 z-10' : ''
                }`}
              >
                {/* Rank Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                      prize.color === 'gold'
                        ? 'bg-yellow-400'
                        : prize.color === 'silver'
                        ? 'bg-gray-300'
                        : 'bg-orange-400'
                    }`}
                  >
                    {prize.icon}
                  </div>
                </div>

                <div className="text-center pt-8">
                  <h3 className="text-3xl font-bold mb-2">{prize.rank}</h3>
                  <div className="text-5xl font-black text-yellow-400 mb-4">{prize.amount}</div>
                  <p className="text-slate-300 text-lg">{prize.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Special Prizes */}
          <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-3xl p-12 border border-white border-opacity-10">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4">特別獎項</h3>
              <p className="text-slate-300 text-lg">除了前三名外，還有其他優秀獎項等待您的挑戰</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {specialPrizes.map((prize, index) => (
                <div
                  key={index}
                  className="bg-white bg-opacity-10 rounded-2xl p-6 text-center hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{prize.icon}</span>
                  </div>
                  <h4 className="text-lg font-bold mb-2">{prize.title}</h4>
                  <div className="text-2xl font-bold text-yellow-400 mb-2">{prize.amount}</div>
                  <p className="text-slate-300 text-sm">{prize.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-4">就業機會</h4>
              <p className="text-slate-300">優秀參賽者將獲得合作企業的面試機會</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-4">創業支持</h4>
              <p className="text-slate-300">獲獎作品可獲得創業孵化器支持</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-4">導師指導</h4>
              <p className="text-slate-300">業界專家提供長期指導和建議</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
