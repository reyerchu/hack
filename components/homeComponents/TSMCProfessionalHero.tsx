import { useRouter } from 'next/router';
import { buttonDatas } from '../../lib/data';

export default function TSMCProfessionalHero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 overflow-hidden">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M50 0L60 40L100 50L60 60L50 100L40 60L0 50L40 40L50 0Z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      {/* Main Content */}
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
          </div>

          {/* Professional Action Buttons */}
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-20">
            {buttonDatas.map((button) => (
              <button
                key={button.text}
                onClick={() => router.push(button.path)}
                className="group relative w-full md:w-auto min-w-[240px] bg-white text-slate-900 font-bold py-5 px-10 rounded-xl hover:bg-slate-50 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl border border-white border-opacity-20"
              >
                <span className="relative z-10 text-lg">{button.text}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>
            ))}
          </div>

          {/* Professional Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">創新思維</h3>
              <p className="text-slate-300 leading-relaxed">培養解決複雜問題的能力，激發創意思維</p>
            </div>

            <div className="text-center bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
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
              <h3 className="text-xl font-bold text-white mb-4">團隊協作</h3>
              <p className="text-slate-300 leading-relaxed">與優秀人才組隊，建立專業網絡</p>
            </div>

            <div className="text-center bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-10">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
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
              <h3 className="text-xl font-bold text-white mb-4">快速迭代</h3>
              <p className="text-slate-300 leading-relaxed">48小時內從概念到原型，提升執行力</p>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2 tracking-wider">SCROLL</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
