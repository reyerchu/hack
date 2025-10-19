import React from 'react';
import Link from 'next/link';

/**
 * 首页新闻/公告区块
 * 用于展示重要活动和工作坊消息
 * 样式与其他 section 保持一致
 */
export default function HomeNewsSection() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-8 md:px-12">
        {/* Section Header - TSMC Style */}
        <div className="mb-12">
          <h2 className="text-[28px] md:text-[36px] font-normal text-black mb-2">
            NEWS
          </h2>
          <div className="w-16 h-[2px]" style={{ backgroundColor: '#1a3a6e' }}></div>
          <p className="text-[18px] mt-4 font-normal" style={{ color: '#1a3a6e' }}>
            最新消息
          </p>
        </div>

        {/* Content */}
        <div className="max-w-[900px]">
          {/* Message 1: Workshops */}
          <div className="mb-6 pb-6 border-b-2 border-gray-200">
            <p className="text-[18px] leading-relaxed text-gray-800 mb-4">
              🎓 <span className="font-semibold">黑客松工作坊已經開跑！</span>從 2025/10/20 起，每晚都有賽道介紹、獎項說明及活動 QA 的工作坊，歡迎一起來了解挑戰、補充技能、找到隊友、腦力激盪。
            </p>
            <Link href="/schedule">
              <a 
                className="inline-flex items-center gap-2 px-6 py-3 text-[16px] font-semibold transition-all duration-300 rounded"
                style={{ 
                  backgroundColor: '#1a3a6e',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a4a7e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                }}
              >
                <span>📅</span>
                <span>查看時程表</span>
              </a>
            </Link>
          </div>

          {/* Message 2: Solidity Course */}
          <div>
            <p className="text-[18px] leading-relaxed text-gray-800 mb-4">
              💡 <span className="font-semibold">零基礎也能挑戰 40 萬獎金的 RWA 黑客松！</span>
              <Link href="/schedule/Elyt7SvclfTp43LPKmaq">
                <a 
                  className="font-semibold underline transition-colors"
                  style={{ color: '#1a3a6e' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#2a4a7e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#1a3a6e';
                  }}
                >
                  Solidity 智能合約免費線上課程
                </a>
              </Link>
              （5 小時完整教學 + 10/27 賽前線下實作 QA），讓你從零到一，成為黑客松最佳利器！
            </p>
            <Link href="/schedule/Elyt7SvclfTp43LPKmaq">
              <a 
                className="inline-flex items-center gap-2 px-6 py-3 text-[16px] font-semibold transition-all duration-300 rounded"
                style={{ 
                  backgroundColor: '#1a3a6e',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a4a7e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                }}
              >
                <span>📝</span>
                <span>申請參加課程</span>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

