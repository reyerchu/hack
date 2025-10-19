import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

/**
 * 首页新闻/公告区块
 * 用于展示重要活动和工作坊消息
 */
export default function HomeNewsSection() {
  return (
    <section className="relative py-12 overflow-hidden" style={{ backgroundColor: '#f0f4f8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 新闻标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ backgroundColor: '#1a3a6e', color: 'white' }}
          >
            <span className="text-2xl">🎉</span>
            <span className="font-bold text-lg">最新消息</span>
          </div>
          <h2 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
            Workshops Start!
          </h2>
          <div className="w-24 h-1 mx-auto rounded" style={{ backgroundColor: '#1a3a6e' }}></div>
        </motion.div>

        {/* 主要内容卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
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
              {/* 标签 */}
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
                  style={{ backgroundColor: '#8B0000', color: 'white' }}
>
                  <span className="mr-2">🔥</span>
                  熱門活動
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
                  style={{ backgroundColor: '#2a4a7e', color: 'white' }}
                >
                  <span className="mr-2">📚</span>
                  免費報名
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
                  style={{ backgroundColor: '#3D6B5C', color: 'white' }}
                >
                  <span className="mr-2">💻</span>
                  線上課程
                </span>
              </div>

              {/* 主标题 */}
              <h3 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                Solidity 智能合約線上工作坊開課了！
              </h3>

              {/* 描述 */}
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                從零開始學習以太坊智能合約開發！由資深區塊鏈工程師
                <span className="font-bold" style={{ color: '#1a3a6e' }}> 瞿孝洋老師 </span>
                親自授課，涵蓋 Solidity 基礎到進階應用，包括 DEX 搬磚套利機器人實作。
              </p>

              {/* 亮点列表 */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⏱️</span>
                  <div>
                    <div className="font-bold text-gray-900">課程時長</div>
                    <div className="text-gray-600">4 小時 47 分鐘</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <div className="font-bold text-gray-900">課程難度</div>
                    <div className="text-gray-600">中級（適合有基礎者）</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📜</span>
                  <div>
                    <div className="font-bold text-gray-900">課程認證</div>
                    <div className="text-gray-600">完成後獲得結業證書</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <div className="font-bold text-gray-900">學員評價</div>
                    <div className="text-gray-600">5.0 ★★★★★</div>
                  </div>
                </div>
              </div>

              {/* 行动按钮 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/schedule/Elyt7SvclfTp43LPKmaq">
                  <a className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-lg text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    style={{ backgroundColor: '#1a3a6e' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a4a7e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a3a6e';
                    }}
                  >
                    <span className="text-2xl">🚀</span>
                    立即報名參加
                  </a>
                </Link>
                <a 
                  href="https://defintek.io/courses/solidity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-lg border-2 transition-all duration-300"
                  style={{ 
                    borderColor: '#1a3a6e',
                    color: '#1a3a6e',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a3a6e';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#1a3a6e';
                  }}
                >
                  <span className="text-2xl">📚</span>
                  查看課程詳情
                </a>
              </div>

              {/* 额外信息 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <span>
                    提示：完成報名後，您將可以訪問完整的課程內容和投影片資料
                  </span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 底部装饰 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-gray-600">
            更多精彩工作坊即將推出，敬請期待！
          </p>
        </motion.div>
      </div>
    </section>
  );
}

