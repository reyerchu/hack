export default function TSMCParticipationGuidelines() {
  const guidelines = [
    {
      category: '報名資格',
      icon: '👥',
      items: [
        '2-5人隊伍報名',
        '對區塊鏈技術有興趣的開發者',
        '具備程式設計基礎能力',
        '可跨校、跨公司組隊',
      ],
    },
    {
      category: 'RWA 主題',
      icon: '🏦',
      items: [
        '專注於 RWA (Real World Assets) 代幣化',
        '監管可行 × 技術可行的解決方案',
        '金融機構與技術社群跨域合作',
        '可演示的應用原型開發',
      ],
    },
    {
      category: '競賽規則',
      icon: '📋',
      items: [
        '36小時內完成 RWA 應用原型',
        '題庫 × 導師制指導',
        '作品需具備完整功能演示',
        '可公開/私下提交程式碼',
      ],
    },
    {
      category: '評審標準',
      icon: '⚖️',
      items: [
        'RWA 應用創新性 (30%)',
        '監管合規性 (25%)',
        '技術實用性 (20%)',
        '商業可行性 (15%)',
        '演示效果 (10%)',
      ],
    },
  ];

  const requirements = [
    {
      title: '技術要求',
      description: '具備基本程式設計能力，熟悉至少一種程式語言',
      icon: '💻',
    },
    {
      title: '設備要求',
      description: '自備筆記型電腦，建議配備開發環境',
      icon: '🖥️',
    },
    {
      title: '時間要求',
      description: '能夠全程參與48小時活動，不得中途退出',
      icon: '⏰',
    },
    {
      title: '團隊要求',
      description: '願意與他人合作，具備良好的溝通能力',
      icon: '🗣️',
    },
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-8">參與指南</h2>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mb-8"></div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
              了解參與黑客台灣競賽的所有必要資訊，確保您能夠順利參加這場科技盛會
            </p>
          </div>

          {/* Guidelines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {guidelines.map((guideline, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-3xl">{guideline.icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{guideline.category}</h3>
                </div>
                <ul className="space-y-3">
                  {guideline.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-slate-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Requirements Section */}
          <div className="bg-white rounded-3xl shadow-xl p-12">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">參與要求</h3>
              <p className="text-slate-600 text-lg">確保您符合以下要求，以獲得最佳的競賽體驗</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {requirements.map((requirement, index) => (
                <div key={index} className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">{requirement.icon}</span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-4">{requirement.title}</h4>
                  <p className="text-slate-600 leading-relaxed">{requirement.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-16 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">重要提醒</h4>
                <ul className="text-slate-700 space-y-2">
                  <li>• 報名截止日期：活動開始前7天</li>
                  <li>• 活動期間提供餐點和飲料</li>
                  <li>• 建議提前熟悉開發環境和工具</li>
                  <li>• 活動現場提供WiFi和電源插座</li>
                  <li>• 如有特殊需求，請提前聯繫主辦方</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
