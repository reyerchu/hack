import { useState } from 'react';

export default function HeroVisualSelector() {
  const [selectedVisual, setSelectedVisual] = useState(1);

  const visuals = [
    {
      id: 1,
      title: '代幣化未來',
      subtitle: '主視覺海報',
      description: '展現RWA代幣化的核心價值',
      component: 'TokenizationFuture',
    },
    {
      id: 2,
      title: 'RWA生態系統',
      subtitle: '技術架構圖',
      description: '完整的代幣化架構體系',
      component: 'RWAEcosystem',
    },
    {
      id: 3,
      title: '36小時創新之旅',
      subtitle: '時間軸視覺',
      description: '黑客松的完整流程',
      component: 'InnovationJourney',
    },
    {
      id: 4,
      title: 'RWA創新獎盃',
      subtitle: '獎項視覺',
      description: '象徵最高榮譽的獎項',
      component: 'RWAAward',
    },
    {
      id: 5,
      title: '跨域合作',
      subtitle: '參與者視覺',
      description: '金融與技術的完美結合',
      component: 'CrossDomainCooperation',
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Visual Selector */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-4 border border-white border-opacity-20">
          <h3 className="text-white text-lg font-bold mb-4">選擇視覺設計</h3>
          <div className="space-y-2">
            {visuals.map((visual) => (
              <button
                key={visual.id}
                onClick={() => setSelectedVisual(visual.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                  selectedVisual === visual.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
                }`}
              >
                <div className="font-bold text-sm">{visual.title}</div>
                <div className="text-xs opacity-80">{visual.subtitle}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-6 py-24">
        <div className="max-w-7xl mx-auto">
          {/* Professional Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-white bg-opacity-10 backdrop-blur-md rounded-full px-8 py-4 mb-12 border border-white border-opacity-20">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              <span className="text-white text-lg font-medium tracking-wide">
                台灣首屆 RWA 黑客松
              </span>
            </div>

            <h1 className="text-7xl md:text-9xl font-black text-white mb-8 leading-none tracking-tight">
              RWA 黑客松
            </h1>

            <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto mb-12"></div>

            <p className="text-2xl md:text-3xl text-slate-200 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
              促成監理與金融機構、技術社群的跨域對話與 PoC 連結
              <br />
              打造「監管可行 × 技術可行」的 RWA 代幣化落地路徑
            </p>
          </div>

          {/* Visual Display Area */}
          <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-3xl p-12 border border-white border-opacity-10 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-4">
                {visuals[selectedVisual - 1].title}
              </h2>
              <p className="text-xl text-slate-300 mb-2">{visuals[selectedVisual - 1].subtitle}</p>
              <p className="text-slate-400">{visuals[selectedVisual - 1].description}</p>
            </div>

            {/* Visual Content */}
            <div className="min-h-[400px] flex items-center justify-center">
              {selectedVisual === 1 && <TokenizationFuture />}
              {selectedVisual === 2 && <RWAEcosystem />}
              {selectedVisual === 3 && <InnovationJourney />}
              {selectedVisual === 4 && <RWAAward />}
              {selectedVisual === 5 && <CrossDomainCooperation />}
            </div>
          </div>

          {/* Professional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">36</div>
              <div className="text-slate-300 text-sm uppercase tracking-wider">小時競賽</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">2-5</div>
              <div className="text-slate-300 text-sm uppercase tracking-wider">人隊伍</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">RWA</div>
              <div className="text-slate-300 text-sm uppercase tracking-wider">代幣化</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">10/31</div>
              <div className="text-slate-300 text-sm uppercase tracking-wider">開始日期</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">
              立即報名參加
            </button>
            <button className="bg-white bg-opacity-10 backdrop-blur-md text-white px-12 py-4 rounded-2xl font-bold text-lg border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
              了解更多
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Visual Components
function TokenizationFuture() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-blue-900 to-slate-800 rounded-3xl p-8 border border-blue-400 border-opacity-30">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🪙</div>
          <h3 className="text-3xl font-bold text-white mb-2">代幣化未來</h3>
          <p className="text-blue-200">RWA代幣化的核心價值</p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="text-4xl mb-2">🏠</div>
            <p className="text-white text-sm">房屋</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-white text-sm">股票</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">💰</div>
            <p className="text-white text-sm">債券</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-2xl mb-1">🏦</div>
            <p className="text-blue-200 text-xs">銀行</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">💻</div>
            <p className="text-blue-200 text-xs">區塊鏈</p>
          </div>
        </div>

        <div className="text-center mt-4">
          <div className="text-2xl">🇹🇼</div>
          <p className="text-blue-200 text-sm">台灣地圖輪廓</p>
        </div>
      </div>
    </div>
  );
}

function RWAEcosystem() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-green-900 to-slate-800 rounded-3xl p-8 border border-green-400 border-opacity-30">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🪙</div>
          <h3 className="text-3xl font-bold text-white mb-2">RWA生態系統</h3>
          <p className="text-green-200">完整的代幣化架構體系</p>
        </div>

        <div className="space-y-4">
          <div className="bg-green-800 bg-opacity-50 rounded-xl p-4">
            <h4 className="text-white font-bold mb-2">內層：智能合約、代幣標準、監管合規</h4>
            <div className="flex justify-center space-x-4">
              <span className="text-2xl">🔧</span>
              <span className="text-2xl">📋</span>
              <span className="text-2xl">⚖️</span>
              <span className="text-2xl">🔒</span>
            </div>
          </div>

          <div className="bg-blue-800 bg-opacity-50 rounded-xl p-4">
            <h4 className="text-white font-bold mb-2">中層：託管服務、KYC/AML、交易平台</h4>
            <div className="flex justify-center space-x-4">
              <span className="text-2xl">🏦</span>
              <span className="text-2xl">🔐</span>
              <span className="text-2xl">💳</span>
              <span className="text-2xl">📱</span>
            </div>
          </div>

          <div className="bg-purple-800 bg-opacity-50 rounded-xl p-4">
            <h4 className="text-white font-bold mb-2">外層：金融機構、監管部門、技術社群</h4>
            <div className="flex justify-center space-x-4">
              <span className="text-2xl">🏛️</span>
              <span className="text-2xl">🏢</span>
              <span className="text-2xl">👥</span>
              <span className="text-2xl">💻</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InnovationJourney() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-yellow-900 to-slate-800 rounded-3xl p-8 border border-yellow-400 border-opacity-30">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-white mb-2">36小時創新之旅</h3>
          <p className="text-yellow-200">黑客松的完整流程</p>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h4 className="text-white font-bold mb-2">RWA技術工作坊</h4>
            <p className="text-blue-200 text-sm">10/31 09:00</p>
            <p className="text-blue-200 text-xs">開場/工作坊/題庫說明/組隊</p>
          </div>

          <div className="flex-1 mx-4">
            <div className="h-2 bg-gradient-to-r from-blue-600 via-green-600 to-yellow-600 rounded-full"></div>
            <div className="text-center mt-2">
              <span className="text-white font-bold">36小時開發</span>
              <p className="text-green-200 text-sm">導師指導，技術支援</p>
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h4 className="text-white font-bold mb-2">Demo & 評審</h4>
            <p className="text-yellow-200 text-sm">11/1 12:00-16:00</p>
            <p className="text-yellow-200 text-xs">5-7分演示 + Q&A，評審議分，頒獎</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RWAAward() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-yellow-900 to-slate-800 rounded-3xl p-8 border border-yellow-400 border-opacity-30">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-3xl font-bold text-white mb-2">RWA創新獎盃</h3>
          <p className="text-yellow-200">象徵最高榮譽的獎項</p>
        </div>

        <div className="text-center">
          <div className="text-8xl mb-4">🏆</div>
          <div className="text-4xl mb-2">🪙</div>
          <h4 className="text-2xl font-bold text-white mb-4">RWA 創新獎</h4>
          <p className="text-yellow-200 mb-4">監管合規 × 技術創新</p>
          <p className="text-white text-sm mb-4">最佳 RWA 代幣化解決方案</p>

          <div className="text-2xl mb-2">🇹🇼</div>
          <p className="text-yellow-200 text-sm">台灣地圖底座</p>

          <div className="mt-4">
            <div className="text-2xl">✨</div>
            <p className="text-yellow-200 text-sm">金色光芒四射</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CrossDomainCooperation() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-purple-900 to-slate-800 rounded-3xl p-8 border border-purple-400 border-opacity-30">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🤝</div>
          <h3 className="text-3xl font-bold text-white mb-2">跨域合作</h3>
          <p className="text-purple-200">金融與技術的完美結合</p>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="text-center">
            <div className="text-4xl mb-2">👔</div>
            <h4 className="text-white font-bold mb-2">金融專業人士</h4>
            <div className="space-y-1">
              <p className="text-purple-200 text-sm">🏦 銀行</p>
              <p className="text-purple-200 text-sm">📊 證券</p>
              <p className="text-purple-200 text-sm">🏛️ 監管</p>
              <p className="text-purple-200 text-sm">💼 投信</p>
            </div>
          </div>

          <div className="text-center">
            <div className="text-6xl mb-2">🤝</div>
            <p className="text-white font-bold">合作握手</p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-2">👨‍💻</div>
            <h4 className="text-white font-bold mb-2">技術開發者</h4>
            <div className="space-y-1">
              <p className="text-purple-200 text-sm">💻 代碼</p>
              <p className="text-purple-200 text-sm">🔗 區塊鏈</p>
              <p className="text-purple-200 text-sm">🤖 智能合約</p>
              <p className="text-purple-200 text-sm">🌐 Web3</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl mb-2">🇹🇼</div>
          <p className="text-white font-bold mb-2">台灣地圖 - 跨域合作</p>
          <p className="text-purple-200 text-sm">● 台北 ● 新竹 ● 台中 ● 高雄</p>
          <p className="text-purple-200 text-xs mt-2">
            促成監理與金融機構、技術社群的跨域對話與 PoC 連結
          </p>
        </div>
      </div>
    </div>
  );
}
