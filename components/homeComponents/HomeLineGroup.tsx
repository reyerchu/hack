import Image from 'next/image';

export default function HomeLineGroup() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-8 md:px-12">
        {/* Section Header - TSMC Style */}
        <div className="mb-12">
          <h2 className="text-[28px] md:text-[36px] font-normal text-black mb-2">JOIN US</h2>
          <div className="w-16 h-[2px]" style={{ backgroundColor: '#1a3a6e' }}></div>
          <p className="text-[18px] mt-4 font-normal" style={{ color: '#1a3a6e' }}>
            加入 Line 社群
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row gap-12 items-start md:items-center">
          {/* QR Code */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <Image
              src="/assets/rwa-hackathon-2025-line.jpg"
              alt="RWA黑客松2025 LINE 社群 QR Code"
              width={240}
              height={240}
              className="rounded-lg border-2 border-gray-300 shadow-md"
            />
          </div>

          {/* Information */}
          <div className="flex-1">
            <div className="mb-6">
              <a
                href="https://line.me/ti/g2/Ae5RbTZMqVF4lE8U8b0FOfs6M5uyiyQMAvu6aQ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[24px] font-bold hover:underline inline-flex items-center gap-2"
                style={{ color: '#1a3a6e' }}
              >
                RWA黑客松2025
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>

            <div className="space-y-6 text-gray-700 text-[16px]">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded">
                <div className="font-bold text-[18px] mb-3 text-blue-800">名稱命名規則：</div>
                <div className="text-gray-800 mb-3">「稱呼/團隊名」或「稱呼/角色」</div>
                <div className="space-y-2 text-gray-600">
                  <div className="font-medium">例如：</div>
                  <div>• 「阿福/南方四濺剋」</div>
                  <div>• 「小健/找隊友」</div>
                  <div>• 「Reyer/協辦方」</div>
                </div>
              </div>

              <div className="text-gray-600 leading-relaxed">
                <p>加入 LINE 社群與其他參賽者交流、組隊，並獲取最新活動資訊與技術支援。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
