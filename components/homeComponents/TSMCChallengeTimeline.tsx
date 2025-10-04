export default function TSMCChallengeTimeline() {
  const timelineEvents = [
    {
      phase: 'RWA 黑客松開場',
      time: '10/31 (五) - 09:00',
      duration: '2小時',
      description: '開場/工作坊/題庫說明/組隊，RWA 代幣化技術介紹',
      icon: '🎯',
      color: 'blue',
    },
    {
      phase: '36小時開發',
      time: '10/31-11/1 - 11:00',
      duration: '32小時',
      description: '全日開發 RWA 應用原型，導師指導，技術支援',
      icon: '💻',
      color: 'green',
    },
    {
      phase: 'Demo & 評審',
      time: '11/1 (六) - 12:00',
      duration: '4小時',
      description: 'Demo (5-7分+Q&A)、評審議分、頒獎/閉幕',
      icon: '🏆',
      color: 'purple',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-8">挑戰時間軸</h2>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mb-8"></div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
              48小時的密集競賽，從概念到實現，體驗完整的創新開發流程
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 via-green-500 to-purple-500 rounded-full"></div>

            {/* Timeline Events */}
            <div className="space-y-16">
              {timelineEvents.map((event, index) => (
                <div
                  key={index}
                  className={`flex items-center ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12 text-left'}`}
                  >
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                      <div className="flex items-center mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl bg-${event.color}-100 flex items-center justify-center mr-4`}
                        >
                          <span className="text-2xl">{event.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">{event.phase}</h3>
                          <p className="text-slate-600 font-medium">{event.time}</p>
                        </div>
                      </div>
                      <p className="text-slate-700 leading-relaxed mb-4">{event.description}</p>
                      <div
                        className={`inline-flex items-center px-4 py-2 rounded-full bg-${event.color}-100 text-${event.color}-800 font-medium`}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {event.duration}
                      </div>
                    </div>
                  </div>

                  {/* Timeline Dot */}
                  <div className="relative z-10">
                    <div
                      className={`w-16 h-16 rounded-full bg-${event.color}-500 flex items-center justify-center shadow-lg border-4 border-white`}
                    >
                      <span className="text-white font-bold text-lg">{index + 1}</span>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-20">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-12 border border-blue-100">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">準備好接受挑戰了嗎？</h3>
              <p className="text-xl text-slate-600 mb-8">立即報名，與頂尖工程師一起創造未來</p>
              <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                立即報名參加
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
