import Link from 'next/link';
import Image from 'next/image';

export default function TSMCChallengeTimeline() {
  const timelineEvents = [
    {
      date: '即日起',
      title: '開放個人預報名',
      description: '完成註冊並進入 Line 社群「RWA黑客松2025」',
      icon: '📝',
    },
    {
      date: '10/15',
      title: '工作坊時程公告/開跑',
      description: '工作坊開始，技術交流與學習',
      icon: '🎓',
    },
    {
      date: '10/20',
      title: '競賽規章/題庫公告',
      description: '公布競賽詳細規則與挑戰題目',
      icon: '📋',
    },
    {
      date: '10/27',
      title: '報名截止',
      description: '最後報名期限',
      icon: '⏰',
    },
    {
      date: '10/31 - 11/1 上午',
      title: '黑客松',
      description: '2 天最後衝刺與創新',
      icon: '💻',
    },
    {
      date: '11/1 下午',
      title: 'Demo Day 決選與頒獎',
      description: '專案展示、評審與獎項頒發',
      icon: '🏆',
    },
    {
      date: '11/8',
      title: '評審結束/公布所有獎項',
      description: '最終結果公布',
      icon: '🎉',
    },
  ];

  return (
    <section id="schedule" className="bg-white py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-8 md:px-12">
        {/* Section Header - TSMC Style */}
        <div className="mb-12">
          <h2 className="text-[28px] md:text-[36px] font-normal text-black mb-2">
            CHALLENGE TIMELINE
          </h2>
          <div className="w-16 h-[2px]" style={{ backgroundColor: '#1a3a6e' }}></div>
          <p className="text-[18px] mt-4 font-normal" style={{ color: '#1a3a6e' }}>
            活動日程
          </p>
        </div>

        {/* TSMC Layout: Image Left, Content Right */}
        <div className="grid md:grid-cols-2 gap-12 items-start mb-12">
          {/* Left: Image */}
          <div className="flex justify-center md:justify-start">
            <Image
              src="/assets/3.schedule.png"
              alt="Schedule Timeline"
              width={360}
              height={360}
              className="w-[280px] h-[280px] md:w-[360px] md:h-[360px]"
            />
          </div>

          {/* Right: Timeline List - TSMC Style */}
          <div className="space-y-0 border-l-2 border-gray-300 ml-4">
            {timelineEvents.map((event, index) => (
              <div key={index} className="relative pl-8 pb-12 last:pb-0">
                {/* Timeline Dot */}
                <div className="absolute left-[-9px] top-0 w-4 h-4 bg-black rounded-full"></div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="text-[14px] font-medium text-gray-600 uppercase tracking-wide">
                    {event.date}
                  </div>
                  <h3 className="text-[20px] font-semibold text-black">{event.title}</h3>
                  <p className="text-[16px] leading-relaxed text-gray-700">{event.description}</p>
                </div>
              </div>
            ))}
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
