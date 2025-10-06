import Link from 'next/link';

export default function TSMCChallenges(props: { challenges: Challenge[] }) {
  const challengeTopics = [
    {
      title: 'RegTech 監管科技',
      description: '以合規自動化、監控與報告為核心，建立可審計、可追溯的鏈上合規框架。',
    },
    {
      title: 'On-Chain Finance 鏈上金融',
      description: '設計代幣化清算與結算流程、收益分配機制與風險參數。',
    },
    {
      title: 'Security Audit 資安審計',
      description: '針對合約與基礎設施建立威脅模型與自動化檢測規則。',
    },
    {
      title: 'KYC 身份驗證',
      description: '兼顧隱私與合規，探索可驗證憑證（VC）、ZK KYC 等方案。',
    },
    {
      title: 'Privacy 隱私',
      description: '以 ZKP／MPC 等技術確保資料最小揭露，符合法規要求。',
    },
    {
      title: 'UIUX 友善錢包',
      description: '友善錢包與新型態交互設計，降低使用門檻與風險。',
    },
  ];

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-8 md:px-12">
        {/* Section Header - TSMC Style */}
        <div className="mb-12">
          <h2 className="text-[28px] md:text-[36px] font-normal text-black mb-2">CHALLENGES</h2>
          <div className="w-16 h-[2px] bg-black"></div>
          <p className="text-[18px] text-gray-700 mt-4">競賽題目</p>
        </div>

        {/* Description */}
        <div className="mb-12">
          <p className="text-[16px] leading-relaxed text-gray-800">
            圍繞 RWA 賽道六大熱門技術挑戰，題目將於 10/20 公布題庫：
          </p>
        </div>

        {/* Challenge Topics - TSMC Style */}
        <div className="space-y-0">
          {challengeTopics.map((topic, index) => (
            <div
              key={index}
              className="py-8 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 text-[16px] font-semibold text-black w-8">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="flex-1">
                  <h3 className="text-[20px] font-semibold text-black mb-2">{topic.title}</h3>
                  <p className="text-[16px] leading-relaxed text-gray-700">{topic.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button - TSMC Style */}
        <div className="mt-16">
          <Link href="/register">
            <a className="inline-block border-2 border-black text-black px-8 py-3 text-[14px] font-medium uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-300">
              立即報名 Apply Now
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
}
