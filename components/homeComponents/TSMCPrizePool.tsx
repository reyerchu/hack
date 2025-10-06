import Link from 'next/link';

export default function TSMCPrizePool() {
  const sponsors = [
    {
      name: '國泰金控',
      track: 'RWA 與金融實務的落地應用',
    },
    {
      name: 'Zircuit',
      track: '安全即信任，保護一切 DeFi 流動',
    },
    {
      name: 'Sui',
      track: '高速體驗，重新定義資產上鏈',
    },
    {
      name: 'Self Protocol',
      track: '隱私保護下的自我主權金融',
    },
    {
      name: 'Oasis ROFL 框架',
      track: '鏈下隱私保護，鏈上結果驗證',
    },
  ];

  return (
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-8 md:px-12">
        {/* Section Header - TSMC Style */}
        <div className="mb-12">
          <h2 className="text-[28px] md:text-[36px] font-normal text-black mb-2">PRIZE POOL</h2>
          <div className="w-16 h-[2px]" style={{ backgroundColor: '#1a3a6e' }}></div>
          <p className="text-[18px] mt-4 font-normal" style={{ color: '#1a3a6e' }}>
            活動獎項
          </p>
        </div>

        {/* Description */}
        <div className="mb-12">
          <p className="text-[16px] leading-relaxed text-gray-800">
            RWA 相關六大主題全面佈局，總獎項價值超過新台幣{' '}
            <span className="font-bold" style={{ color: '#1a3a6e' }}>
              40 萬
            </span>
          </p>
        </div>

        {/* Sponsor Tracks - TSMC Style */}
        <div className="space-y-0">
          {sponsors.map((sponsor, index) => (
            <div
              key={index}
              className="py-8 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 text-[16px] font-semibold text-black w-8">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="flex-1">
                  <h3 className="text-[20px] font-semibold text-black mb-2">{sponsor.name}</h3>
                  <p className="text-[16px] leading-relaxed text-gray-700">{sponsor.track}</p>
                </div>
              </div>
            </div>
          ))}
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
