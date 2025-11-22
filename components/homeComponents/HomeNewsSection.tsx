import React from 'react';
import Link from 'next/link';

/**
 * 首页新闻/公告区块
 * 用于展示重要活动和工作坊消息
 * 样式与其他 section 保持一致
 */
export default function HomeNewsSection() {
  return (
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-8 md:px-12">
        {/* Section Header - TSMC Style */}
        <div className="mb-12">
          <h2 className="text-[28px] md:text-[36px] font-normal text-black mb-2">NEWS</h2>
          <div className="w-16 h-[2px]" style={{ backgroundColor: '#1a3a6e' }}></div>
          <p className="text-[18px] mt-4 font-normal" style={{ color: '#1a3a6e' }}>
            最新消息
          </p>
        </div>

        {/* Content */}
        <div className="max-w-[900px]">
          {/* Hackathon Completion Announcement */}
          <div>
            <p className="text-[18px] leading-relaxed text-gray-800 mb-4">
              「<span className="font-semibold">RWA 黑客松 Taiwan</span>」的活動已於{' '}
              <span className="font-semibold">2025/11/1 圓滿落幕</span>
              ！感謝所有參與者、贊助商和合作夥伴的熱情支持。活動共吸引{' '}
              <span className="font-semibold">40 多個團隊報名</span>、超過{' '}
              <span className="font-semibold">100 位黑客參賽</span>
              ，其中共有 <span className="font-semibold">30 個團隊</span>於 Demo Day
              登台展示成果。讓我們一起見證優秀團隊的創新成果！
            </p>
            <Link href="/winners">
              <a
                className="inline-block border-2 px-8 py-3 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300"
                style={{
                  borderColor: '#1a3a6e',
                  color: '#1a3a6e',
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
                得獎名單 Winners
              </a>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
