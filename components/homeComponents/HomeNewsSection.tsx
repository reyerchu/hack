import React from 'react';
import Link from 'next/link';

/**
 * 首页新闻/公告区块
 * 用于展示重要活动和工作坊消息
 */
export default function HomeNewsSection() {
  return (
    <section className="relative py-12 overflow-hidden" style={{ backgroundColor: '#f0f4f8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 新闻标题 */}
        <div className="text-center mb-8 animate-fade-in-down">
          <style jsx>{`
            @keyframes fadeInDown {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            .animate-fade-in-down {
              animation: fadeInDown 0.6s ease-out;
            }
            .animate-fade-in-up {
              animation: fadeInUp 0.6s ease-out 0.2s;
              animation-fill-mode: both;
            }
            .animate-scale-in {
              animation: scaleIn 0.6s ease-out 0.2s;
              animation-fill-mode: both;
            }
          `}</style>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ backgroundColor: '#1a3a6e', color: 'white' }}
          >
            <span className="text-2xl">🎉</span>
            <span className="font-bold text-lg">最新消息</span>
          </div>
          <h2 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
            8場精彩工作坊正式啟動！
          </h2>
          <div className="w-24 h-1 mx-auto rounded" style={{ backgroundColor: '#1a3a6e' }}></div>
        </div>

        {/* 主要内容卡片 */}
        <div className="max-w-5xl mx-auto animate-scale-in">
          <div className="relative rounded-2xl shadow-2xl overflow-hidden border-4"
            style={{ 
              backgroundColor: 'white',
              borderColor: '#1a3a6e',
            }}
          >
            {/* 装饰性背景 */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-5"
              style={{
                background: 'radial-gradient(circle, #1a3a6e 0%, transparent 70%)',
              }}
            ></div>

            <div className="relative p-8 sm:p-12">
              {/* 主标题 */}
              <div className="text-center mb-8">
                <h3 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                  Workshops Start!
                </h3>
                <p className="text-xl text-gray-700 leading-relaxed">
                  黑客松期間，我們精心準備了
                  <span className="font-bold text-2xl mx-2" style={{ color: '#8B0000' }}>8 場</span>
                  專業工作坊，涵蓋區塊鏈、智能合約、DeFi 等核心技術。
                </p>
              </div>

              {/* 亮点数字 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f0f4f8' }}>
                  <div className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>8</div>
                  <div className="text-sm text-gray-600">場工作坊</div>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f0f4f8' }}>
                  <div className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>20+</div>
                  <div className="text-sm text-gray-600">小時課程</div>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f0f4f8' }}>
                  <div className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>免費</div>
                  <div className="text-sm text-gray-600">全部免費</div>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f0f4f8' }}>
                  <div className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>證書</div>
                  <div className="text-sm text-gray-600">完成認證</div>
                </div>
              </div>

              {/* 工作坊类别标签 */}
              <div className="mb-6">
                <h4 className="text-lg font-bold mb-3" style={{ color: '#1a3a6e' }}>📚 涵蓋主題：</h4>
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 rounded-full text-sm font-bold"
                    style={{ backgroundColor: '#1a3a6e', color: 'white' }}
                  >
                    🔗 Solidity 智能合約
                  </span>
                  <span className="px-4 py-2 rounded-full text-sm font-bold"
                    style={{ backgroundColor: '#2a4a7e', color: 'white' }}
                  >
                    💰 DeFi 協議
                  </span>
                  <span className="px-4 py-2 rounded-full text-sm font-bold"
                    style={{ backgroundColor: '#3D6B5C', color: 'white' }}
                  >
                    🏦 RWA 技術
                  </span>
                  <span className="px-4 py-2 rounded-full text-sm font-bold"
                    style={{ backgroundColor: '#5B4B8A', color: 'white' }}
                  >
                    🔐 隱私計算
                  </span>
                  <span className="px-4 py-2 rounded-full text-sm font-bold"
                    style={{ backgroundColor: '#8B6239', color: 'white' }}
                  >
                    🤖 AI & Blockchain
                  </span>
                </div>
              </div>

              {/* 特色工作坊高亮 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-6 border-2"
                style={{ borderColor: '#1a3a6e' }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">⭐</span>
                  <div className="flex-1">
                    <h5 className="font-bold text-lg mb-2" style={{ color: '#1a3a6e' }}>
                      特色推薦：Solidity 智能合約線上工作坊
                    </h5>
                    <p className="text-gray-700 mb-3">
                      由資深工程師 <span className="font-bold">瞿孝洋老師</span> 親授，
                      從基礎到進階（DEX 套利機器人），完整 4.5 小時課程。
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="px-3 py-1 rounded-full bg-white text-gray-700 border border-gray-300">
                        ⏱️ 4.5 小時
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white text-gray-700 border border-gray-300">
                        🎯 中級難度
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white text-gray-700 border border-gray-300">
                        ⭐ 5.0 評分
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white text-gray-700 border border-gray-300">
                        📜 結業證書
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 行动按钮 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/schedule">
                  <a className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-lg text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    style={{ backgroundColor: '#8B0000' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#a00000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#8B0000';
                    }}
                  >
                    <span className="text-2xl">🎯</span>
                    查看所有工作坊
                  </a>
                </Link>
                <Link href="/register">
                  <a className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-lg text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    style={{ backgroundColor: '#1a3a6e' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a4a7e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a3a6e';
                    }}
                  >
                    <span className="text-2xl">🚀</span>
                    立即報名黑客松
                  </a>
                </Link>
              </div>

              {/* 额外信息 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-center text-gray-700">
                  <span className="text-lg">💡</span>
                  <span className="ml-2 font-semibold" style={{ color: '#1a3a6e' }}>
                    報名黑客松即可免費參加所有工作坊！
                  </span>
                  學習最新技術，結識業界專家，提升競賽實力。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="text-center mt-8 animate-fade-in-up">
          <p className="text-lg font-medium" style={{ color: '#1a3a6e' }}>
            📅 工作坊陸續開放報名中，名額有限！
          </p>
        </div>
      </div>
    </section>
  );
}

