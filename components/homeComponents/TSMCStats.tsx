import { useEffect, useState } from 'react';

export default function TSMCStats() {
  const [stats, setStats] = useState([
    { number: '500+', label: '參與者', icon: '👥' },
    { number: '48', label: '小時', icon: '⏰' },
    { number: '10+', label: '挑戰題目', icon: '🎯' },
    { number: '100萬', label: '總獎金', icon: '💰' },
  ]);

  const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0));

  useEffect(() => {
    const animateNumbers = () => {
      stats.forEach((stat, index) => {
        const targetNumber = parseInt(stat.number.replace(/[^\d]/g, '')) || 0;
        const duration = 2000;
        const increment = targetNumber / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= targetNumber) {
            current = targetNumber;
            clearInterval(timer);
          }
          setAnimatedStats((prev) => {
            const newStats = [...prev];
            newStats[index] = Math.floor(current);
            return newStats;
          });
        }, 16);
      });
    };

    const timer = setTimeout(animateNumbers, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">活動數據</h2>
            <div className="w-24 h-1 bg-white mx-auto mb-8"></div>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              黑客松台灣匯聚了來自全台的頂尖人才，創造了令人矚目的成果
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {stat.icon}
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {stat.number.includes('+')
                      ? `${animatedStats[index]}+`
                      : stat.number.includes('萬')
                      ? `${Math.floor(animatedStats[index] / 10000)}萬`
                      : stat.number}
                  </div>
                  <div className="text-blue-200 text-lg font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">專業評審</h3>
              <p className="text-blue-200">來自業界的頂尖專家擔任評審</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">導師指導</h3>
              <p className="text-blue-200">經驗豐富的導師全程陪伴</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">創新平台</h3>
              <p className="text-blue-200">提供最新的技術平台和工具</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
