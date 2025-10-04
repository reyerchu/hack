import { useEffect, useState } from 'react';

export default function TSMCChallenges(props: { challenges: Challenge[] }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    const sortedChallenges = props.challenges.sort((a, b) => (a.rank > b.rank ? 1 : -1));
    setChallenges(sortedChallenges);
    if (sortedChallenges.length > 0) {
      setSelectedChallenge(sortedChallenges[0]);
    }
  }, [props.challenges]);

  if (challenges.length === 0) {
    return (
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-8">挑戰題目</h2>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mb-8"></div>
            <p className="text-xl text-slate-600 mb-12">挑戰題目即將發布，敬請期待</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-8">挑戰題目</h2>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mb-8"></div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
              專注於 RWA 代幣化主題，與團隊一起創造監管可行且技術可行的解決方案
            </p>
          </div>

          {/* Challenge Categories */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {challenges.map((challenge, index) => (
              <button
                key={index}
                onClick={() => setSelectedChallenge(challenge)}
                className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                  selectedChallenge === challenge
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xl'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {challenge.organization}
              </button>
            ))}
          </div>

          {/* Challenge Details */}
          {selectedChallenge && (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-12">
                {/* Challenge Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                  <div className="mb-6 md:mb-0">
                    <h3 className="text-4xl font-black text-slate-900 mb-4">
                      {selectedChallenge.title}
                    </h3>
                    <div className="flex items-center">
                      <div className="bg-blue-100 text-blue-800 px-6 py-3 rounded-full font-bold text-lg">
                        {selectedChallenge.organization}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-600 mb-2">挑戰難度</div>
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full ${
                            i < 3 ? 'bg-yellow-400' : 'bg-slate-200'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Challenge Description */}
                <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed mb-12">
                  {selectedChallenge.description.split('\\n').map((paragraph, index) => (
                    <p key={index} className="mb-6 text-lg">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Prizes Section */}
                {selectedChallenge.prizes && selectedChallenge.prizes.length > 0 && (
                  <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
                    <h4 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                      <svg
                        className="w-8 h-8 text-yellow-500 mr-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      獎項設置
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {selectedChallenge.prizes.map((prize, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200"
                        >
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mr-4">
                              <span className="text-white font-bold text-lg">{index + 1}</span>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-slate-900">
                                第 {index + 1} 名
                              </div>
                              <div className="text-2xl font-black text-yellow-600">{prize}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Requirements */}
                <div className="bg-slate-900 rounded-2xl p-8 text-white">
                  <h4 className="text-2xl font-bold mb-6 flex items-center">
                    <svg
                      className="w-8 h-8 text-blue-400 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                    技術要求
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-lg font-bold text-blue-400 mb-3">RWA 技術棧</h5>
                      <ul className="space-y-2 text-slate-300">
                        <li>• 區塊鏈：Ethereum, Polygon, Sui</li>
                        <li>• 智能合約：Solidity, Move</li>
                        <li>• 代幣標準：ERC-20, ERC-721, ERC-1155</li>
                        <li>• 監管合規：KYC/AML 整合</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-lg font-bold text-green-400 mb-3">開發工具</h5>
                      <ul className="space-y-2 text-slate-300">
                        <li>• 開發框架：Hardhat, Truffle</li>
                        <li>• 測試工具：Chai, Mocha</li>
                        <li>• 部署：IPFS, Arweave</li>
                        <li>• 監控：The Graph, Moralis</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 text-white">
              <h3 className="text-3xl font-bold mb-4">準備好接受 RWA 挑戰了嗎？</h3>
              <p className="text-xl text-blue-100 mb-8">
                選擇您的 RWA 挑戰題目，開始您的代幣化創新之旅
              </p>
              <button className="bg-white text-blue-600 px-12 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                立即報名參加
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
