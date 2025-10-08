import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * TSMC-style About/Overview Section
 * 活動概觀 + 參賽資格
 */
export default function TSMCAbout() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-8 md:px-12">
        {/* Title - Slogan with Image on Right (TSMC Style) */}
        <div className="mb-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1
              className="text-[32px] md:text-[48px] leading-tight font-bold mb-3"
              style={{ color: '#1a3a6e' }}
            >
              Tokenize Reality, Create the Future
            </h1>
            <p className="text-[24px] md:text-[32px] leading-tight font-light text-gray-700 mb-8">
              鏈接現實，創造未來
            </p>

            {/* Organizers Info - Directly after slogan */}
            <div className="space-y-4 text-[14px] leading-relaxed text-gray-700">
              <div>
                <span className="font-semibold text-black">主辦單位：</span>
                <span>國立清華大學・</span>
                <span className="font-semibold text-black">指導單位：</span>
                <span>台灣金管會</span>
              </div>
              <div>
                <span className="font-semibold text-black">協辦院校與金融機構：</span>
                <span>政大國際金融學院｜國泰金控｜台灣銀行</span>
              </div>
              <div>
                <span className="font-semibold text-black">協辦團隊：</span>
                <span>
                  ETHTaipei｜XueDAO｜Zircuit｜Sui｜Self Protocol｜Oasis Protocol｜SparkLands｜RWA
                  Nexus｜DeFintek｜AsiaVista｜AWS
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <Image
              src="/assets/1.overview.png"
              alt="Data Flow Earth"
              width={360}
              height={360}
              className="w-[280px] h-[280px] md:w-[360px] md:h-[360px]"
            />
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-x-20 gap-y-12">
          {/* Left Column - 活動概觀 */}
          <div>
            <h2
              className="text-[20px] font-normal mb-6 border-b border-gray-300 pb-3"
              style={{ color: '#1a3a6e' }}
            >
              活動概觀
            </h2>
            <div className="space-y-4 text-[16px] leading-relaxed text-gray-800">
              <p>RWA Hackathon Taiwan 是台灣首屆專注於真實世界資產（RWA）代幣化的黑客松。</p>
              <p>
                我們邀請來自金融、區塊鏈、法遵與新創領域的頂尖人才，透過 2~10
                天的激烈腦力激盪與協作，探索如何將現實資產搬上區塊鏈，創造下一波金融創新的應用場景。
              </p>
            </div>
          </div>

          {/* Right Column - 參賽資格 */}
          <div>
            <h2
              className="text-[20px] font-normal mb-6 border-b border-gray-300 pb-3"
              style={{ color: '#1a3a6e' }}
            >
              參賽資格
            </h2>
            <div className="space-y-4 text-[16px] leading-relaxed text-gray-800">
              <p className="font-medium">誰可以參加？</p>
              <ul className="space-y-3 ml-0">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    對 Web3
                    區塊鏈、DeFi、RWA、穩定幣或金融科技有興趣的學生或社會人士（工程師、設計師、金融或法律專業人士等）皆可
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>團隊需 2 ~ 5 人</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>個人可先報名，主辦方將協助組隊</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>最終 Demo Day 時，團隊需至少一位成員於現場參加活動</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Button - TSMC Style */}
        <div className="mt-16">
          <Link href="/register">
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
              立即報名 Apply Now
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
}
