import Link from 'next/link';
import Image from 'next/image';

export default function TSMCParticipationGuidelines() {
  const guidelines = [
    '採 2–5 人團隊報名，個人可先報名，主辦方將協助組隊。',
    '參賽團隊需於期限內完成專案開發並提交簡報/原型/代碼（依題目而定）。',
    '評分面向含影響力、可行性、技術深度、法遵與隱私考量及使用者體驗等。',
    '團隊保有作品之智慧財產權，主辦與合作夥伴得於合理範圍內公開展示、媒體露出。程式碼需公開於 GitHub 或 GitLab，授權至少 MIT/Open Source。',
    '參加者需遵守行為守則（尊重、開放、共享、禁止抄襲等）。',
    '主辦單位保有隨時修改及終止本活動之權利，如有任何變更內容或詳細注意事項將公布於本網站或 Line 社群，恕不另行通知。',
  ];

  return (
    <section id="guidelines" className="bg-gray-50 py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-8 md:px-12">
        {/* Section Header - TSMC Style */}
        <div className="mb-12">
          <h2 className="text-[28px] md:text-[36px] font-normal text-black mb-2">
            PARTICIPATION GUIDELINES
          </h2>
          <div className="w-16 h-[2px]" style={{ backgroundColor: '#1a3a6e' }}></div>
          <p className="text-[18px] mt-4 font-normal" style={{ color: '#1a3a6e' }}>
            參賽須知
          </p>
        </div>

        {/* TSMC Layout: Content Left, Image Right */}
        <div className="grid md:grid-cols-2 gap-12 items-start mb-12">
          {/* Left: Guidelines List - TSMC Style */}
          <div className="space-y-6">
            {guidelines.map((guideline, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 pb-6 border-b border-gray-200 last:border-0"
              >
                <div className="flex-shrink-0 text-[16px] font-semibold text-black w-8">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <p className="text-[16px] leading-relaxed text-gray-800 flex-1">{guideline}</p>
              </div>
            ))}
          </div>

          {/* Right: Image */}
          <div className="flex justify-center md:justify-end">
            <Image
              src="/assets/2.hacker.png"
              alt="Hackathon Team"
              width={360}
              height={360}
              className="w-[280px] h-[280px] md:w-[360px] md:h-[360px]"
            />
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
