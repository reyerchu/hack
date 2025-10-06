import Link from 'next/link';

export default function TSMCChallengeTimeline() {
  const timelineEvents = [
    {
      date: '即日起',
      title: '開放報名',
      description: '加入 Line 社群完成報名',
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
      description: '2天密集開發與創新',
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
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-8 md:px-12">
        {/* Section Header - TSMC Style */}
        <div className="mb-12">
          <h2 className="text-[28px] md:text-[36px] font-normal text-black mb-2">
            CHALLENGE TIMELINE
          </h2>
          <div className="w-16 h-[2px] bg-black"></div>
          <p className="text-[18px] text-gray-700 mt-4">活動日程</p>
        </div>

        {/* Timeline List - TSMC Style */}
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
