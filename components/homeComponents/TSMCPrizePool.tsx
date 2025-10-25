import Link from 'next/link';
import Image from 'next/image';

export default function TSMCPrizePool() {
  const sponsors = [
    {
      name: '錢包',
      track: '平等 × 自由 × 有意義的數位生活',
      prize: '總獎項價值 4000 美元',
      logo: '/sponsor-media/imToken-logo.svg',
      url: 'https://token.im/',
    },
    {
      name: '',
      track: 'RWA 與金融實務的落地應用',
      prize: '總獎項價值 2000 美元',
      logo: '/sponsor-media/Cathay-logo.png',
      url: 'https://www.cathayholdings.com/',
    },
    {
      name: 'ROFL（Run-time Offchain Logic）框架',
      track: '鏈下隱私保護，鏈上結果驗證',
      prize: '總獎項價值 2000 美元',
      logo: '/sponsor-media/Oasis-logo.svg',
      url: 'https://oasis.net/',
    },
    {
      name: '協議',
      track: '隱私保護下的自我主權金融',
      prize: '總獎項價值 2000 美元',
      logo: '/sponsor-media/Self-logo.svg',
      url: 'https://self.xyz/',
    },
    {
      name: '主鏈',
      track: '安全即信任，保護一切 DeFi 流動',
      prize: '總獎項價值 1000 美元',
      logo: '/sponsor-media/Zircuit-logo.svg',
      url: 'https://www.zircuit.com/',
    },
    {
      name: '主鏈',
      track: '高速體驗，重新定義資產上鏈',
      prize: '總獎項價值 1000 美元',
      logo: '/sponsor-media/Sui-logo.svg',
      url: 'https://sui.io/',
    },
    {
      name: 'RWA 黑客松大會',
      track: '最佳 RWA 應用獎項',
      prize: '總獎項價值 2200 美元',
      logo: '/sponsor-media/RWA-logo.svg',
      url: '#',
    },
    {
      name: 'AWS',
      track: '雲端技術與創新應用',
      prize: '總獎項價值 4500 美元的 Credits',
      logo: '/sponsor-media/AWS-logo.svg',
      url: 'https://aws.amazon.com/',
    },
  ];

  return (
    <section id="prize" className="bg-white py-16 md:py-24">
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
            RWA 相關八大主題全面佈局，總獎項價值超過新台幣{' '}
            <span className="font-bold" style={{ color: '#1a3a6e' }}>
              40 萬
            </span>
          </p>
        </div>

        {/* TSMC Layout: Image Left, Content Right */}
        <div className="grid md:grid-cols-2 gap-12 items-start mb-12">
          {/* Left: Image */}
          <div className="flex justify-center md:justify-start">
            <Image
              src="/assets/4.prize.png"
              alt="Prize Pool"
              width={360}
              height={360}
              className="w-[280px] h-[280px] md:w-[360px] md:h-[360px]"
            />
          </div>

          {/* Right: Sponsor Tracks - TSMC Style */}
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
                    <div className="flex items-center gap-4 mb-3">
                      {/* Sponsor Logo with Link */}
                      <div className="flex-shrink-0">
                        <a
                          href={sponsor.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block hover:opacity-80 transition-opacity duration-200"
                        >
                          <Image
                            src={sponsor.logo}
                            alt={`${sponsor.name} logo`}
                            width={sponsor.logo.includes('Cathay') ? 220 : 120}
                            height={sponsor.logo.includes('Cathay') ? 50 : 40}
                            className={
                              sponsor.logo.includes('Cathay')
                                ? 'h-10 w-auto object-contain max-w-[220px]'
                                : 'h-8 w-auto object-contain max-w-[120px]'
                            }
                          />
                        </a>
                      </div>
                      <h3 className="text-[20px] font-semibold text-black">{sponsor.name}</h3>
                    </div>
                    <p className="text-[16px] leading-relaxed text-gray-700 mb-2">
                      {sponsor.track}
                    </p>
                    <p className="text-[15px] font-semibold" style={{ color: '#1a3a6e' }}>
                      {sponsor.prize}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button - TSMC Style */}
        <div className="mt-16">
          <Link href="/team-register-info">
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
