/**
 * 得獎名單頁面
 *
 * 顯示各賽道的獲獎團隊 - 使用首頁風格
 */

import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import AppHeader from '../components/AppHeader';
import HomeFooter from '../components/homeComponents/HomeFooter';
import initializeApi from '../lib/admin/init';
import admin from 'firebase-admin';

interface Winner {
  name: string;
  project?: string;
  teamId?: string; // 可選的團隊 ID，用於連結到團隊頁面
  icon?: string; // 可選的圖標路徑
  iconLink?: string; // 可選的圖標連結
}

interface Award {
  title: string;
  winners: Winner[];
}

interface TrackAwards {
  trackName: string;
  trackId?: string; // 賽道 ID，用於連結
  awards: Award[];
  announced: boolean;
}

interface WinnersPageProps {
  tracksAwards: TrackAwards[];
  allTeams: { name: string; project: string; teamId?: string }[];
}

export default function WinnersPage({ tracksAwards, allTeams }: WinnersPageProps) {
  return (
    <>
      <Head>
        <title>得獎名單 - RWA Hackathon Taiwan</title>
        <meta name="description" content="RWA 黑客松台灣得獎名單" />
      </Head>
      <AppHeader />

      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24" style={{ paddingTop: '80px' }}>
        <div className="max-w-[1200px] mx-auto px-8 md:px-12">
          {/* Celebration Banner */}
          <div
            className="mb-10 bg-white rounded-lg shadow-md p-6 md:p-8 border-l-4"
            style={{ borderLeftColor: '#8B4049' }}
          >
            <h1
              className="text-[28px] md:text-[40px] font-bold mb-3 text-center"
              style={{ color: '#1a3a6e' }}
            >
              第一屆「RWA 黑客松台灣」得獎名單
            </h1>
            <div className="w-20 h-1 mx-auto mb-4" style={{ backgroundColor: '#8B4049' }}></div>
            <p className="text-[14px] md:text-[16px] text-gray-700 leading-relaxed text-center max-w-2xl mx-auto">
              感謝你們用創新與熱情，為台灣首屆 RWA
              黑客松寫下精彩的篇章。經過激烈的競爭與評審團的仔細評選，以下團隊脫穎而出。
            </p>
          </div>

          {/* Tracks Awards */}
          <div className="space-y-12">
            {tracksAwards.map((track, trackIndex) => (
              <div key={trackIndex}>
                {/* Track Title */}
                <div className="mb-8">
                  <div className="flex items-center gap-4">
                    {/* Render sponsor logo (with link) OR track name text */}
                    {track.trackName === 'imToken 賽道' ? (
                      <Link href={`/tracks/${track.trackId}`}>
                        <a className="hover:opacity-80 transition-opacity">
                          <img
                            src="/sponsor-media/imToken-logo.svg"
                            alt="imToken"
                            className="h-10 md:h-12 w-auto object-contain"
                          />
                        </a>
                      </Link>
                    ) : track.trackName === '國泰金控賽道' ? (
                      <Link href={`/tracks/${track.trackId}`}>
                        <a className="hover:opacity-80 transition-opacity">
                          <img
                            src="/sponsor-media/Cathay-logo.png"
                            alt="國泰金控"
                            className="h-10 md:h-12 w-auto object-contain"
                          />
                        </a>
                      </Link>
                    ) : track.trackName === 'Self Protocol 賽道' ? (
                      <Link href={`/tracks/${track.trackId}`}>
                        <a className="hover:opacity-80 transition-opacity">
                          <img
                            src="/sponsor-media/Self-logo.svg"
                            alt="Self Protocol"
                            className="h-10 md:h-12 w-auto object-contain"
                          />
                        </a>
                      </Link>
                    ) : track.trackName === 'Sui 賽道' ? (
                      <Link href={`/tracks/${track.trackId}`}>
                        <a className="hover:opacity-80 transition-opacity">
                          <img
                            src="/sponsor-media/Sui-logo.svg"
                            alt="Sui"
                            className="h-10 md:h-12 w-auto object-contain"
                          />
                        </a>
                      </Link>
                    ) : track.trackName === 'Zircuit 賽道' ? (
                      <Link href={`/tracks/${track.trackId}`}>
                        <a className="hover:opacity-80 transition-opacity">
                          <img
                            src="/sponsor-media/Zircuit-logo.svg"
                            alt="Zircuit"
                            className="h-10 md:h-12 w-auto object-contain"
                          />
                        </a>
                      </Link>
                    ) : track.trackName === 'Oasis 賽道' ? (
                      <Link href={`/tracks/${track.trackId}`}>
                        <a className="hover:opacity-80 transition-opacity">
                          <img
                            src="/sponsor-media/Oasis-logo.svg"
                            alt="Oasis"
                            className="h-10 md:h-12 w-auto object-contain"
                          />
                        </a>
                      </Link>
                    ) : track.trackId ? (
                      <Link href={`/tracks/${track.trackId}`}>
                        <a
                          className="text-[22px] md:text-[28px] font-bold mb-2 hover:underline inline-block"
                          style={{ color: '#1a3a6e' }}
                        >
                          {track.trackName}
                        </a>
                      </Link>
                    ) : (
                      <h2
                        className="text-[22px] md:text-[28px] font-bold mb-2"
                        style={{ color: '#1a3a6e' }}
                      >
                        {track.trackName}
                      </h2>
                    )}
                  </div>
                  {/* 只在沒有 logo 的賽道顯示深紅色下劃線 */}
                  {track.trackName !== 'imToken 賽道' &&
                    track.trackName !== '國泰金控賽道' &&
                    track.trackName !== 'Self Protocol 賽道' &&
                    track.trackName !== 'Sui 賽道' &&
                    track.trackName !== 'Zircuit 賽道' &&
                    track.trackName !== 'Oasis 賽道' && (
                      <div className="w-14 h-1" style={{ backgroundColor: '#8B4049' }}></div>
                    )}
                </div>

                {track.announced ? (
                  <div className="space-y-8">
                    {/* Major Prizes - responsive layout with dark background */}
                    {/* Skip this section for Demo Day 佳作 and 遺珠之憾獎 */}
                    {track.trackName !== 'Demo Day 佳作' && track.trackName !== '遺珠之憾獎' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {track.awards.slice(0, 3).map((award, awardIndex) => (
                          <div key={awardIndex}>
                            {/* Award Title */}
                            <h3
                              className="text-[14px] md:text-[16px] font-semibold mb-3"
                              style={{ color: '#1a3a6e' }}
                            >
                              {award.title}
                            </h3>
                            {/* Check if multiple winners */}
                            {award.winners.length > 1 ? (
                              /* Multiple Winners - Stack vertically */
                              <div className="space-y-3">
                                {award.winners.map((winner, winnerIndex) => (
                                  <div
                                    key={winnerIndex}
                                    className="py-3 px-4 rounded-lg shadow-md border-l-4"
                                    style={{
                                      backgroundColor: '#1a3a6e',
                                      borderLeftColor: '#2a5a9e',
                                      minHeight: '70px',
                                    }}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex-1">
                                        {winner.teamId ? (
                                          <Link href={`/teams/${winner.teamId}/public`}>
                                            <a className="text-[14px] md:text-[15px] font-bold mb-1 text-white hover:underline block">
                                              {winner.name}
                                            </a>
                                          </Link>
                                        ) : (
                                          <p className="text-[14px] md:text-[15px] font-bold mb-1 text-white">
                                            {winner.name}
                                          </p>
                                        )}
                                        {winner.project && (
                                          <p
                                            className="text-[11px] md:text-[12px] leading-relaxed"
                                            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                                          >
                                            {winner.project}
                                          </p>
                                        )}
                                      </div>
                                      {winner.icon && (
                                        <a
                                          href={winner.iconLink || '#'}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-shrink-0 hover:opacity-80 transition-opacity"
                                        >
                                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-md overflow-hidden">
                                            <img
                                              src={winner.icon}
                                              alt={`${winner.name} icon`}
                                              className="w-full h-full object-cover"
                                              style={
                                                winner.name === 'RWACE'
                                                  ? {
                                                      transform: 'scale(1.5)',
                                                      transformOrigin: 'center',
                                                    }
                                                  : undefined
                                              }
                                            />
                                          </div>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Single Winner - Dark background with light text */
                              <div
                                className="py-4 px-5 rounded-lg shadow-md border-l-4"
                                style={{
                                  backgroundColor: awardIndex === 0 ? '#8B4049' : '#1a3a6e',
                                  borderLeftColor: awardIndex === 0 ? '#a85a63' : '#2a5a9e',
                                  minHeight: '80px',
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-1">
                                    {award.winners[0].teamId ? (
                                      <Link href={`/teams/${award.winners[0].teamId}/public`}>
                                        <a className="text-[15px] md:text-[16px] font-bold mb-1.5 text-white hover:underline block">
                                          {award.winners[0].name}
                                        </a>
                                      </Link>
                                    ) : (
                                      <p className="text-[15px] md:text-[16px] font-bold mb-1.5 text-white">
                                        {award.winners[0].name}
                                      </p>
                                    )}
                                    {award.winners[0].project && (
                                      <p
                                        className="text-[12px] md:text-[13px] leading-relaxed"
                                        style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                                      >
                                        {award.winners[0].project}
                                      </p>
                                    )}
                                  </div>
                                  {award.winners[0].icon && (
                                    <a
                                      href={award.winners[0].iconLink || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-shrink-0 hover:opacity-80 transition-opacity"
                                    >
                                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white shadow-md overflow-hidden">
                                        <img
                                          src={award.winners[0].icon}
                                          alt={`${award.winners[0].name} icon`}
                                          className="w-full h-full object-cover"
                                          style={
                                            award.winners[0].name === 'RWACE'
                                              ? {
                                                  transform: 'scale(1.5)',
                                                  transformOrigin: 'center',
                                                }
                                              : undefined
                                          }
                                        />
                                      </div>
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Other Awards (佳作 etc.) */}
                    {(track.trackName === 'Demo Day 佳作' || track.trackName === '遺珠之憾獎'
                      ? track.awards
                      : track.awards.slice(3)
                    ).map((award, awardIndex) => (
                      <div key={awardIndex + 3}>
                        {/* Award Title */}
                        <h3
                          className="text-[16px] md:text-[18px] font-semibold mb-4"
                          style={{ color: '#1a3a6e' }}
                        >
                          {award.title}
                        </h3>
                        {/* Multiple winners - compact 3-column grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {award.winners.map((winner, winnerIndex) => (
                            <div
                              key={winnerIndex}
                              className={`py-3 px-4 border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                                track.trackName === '遺珠之憾獎' ? 'text-white' : 'bg-white'
                              }`}
                              style={{
                                backgroundColor:
                                  track.trackName === '遺珠之憾獎' ? '#1a3a6e' : undefined,
                                borderLeftColor:
                                  track.trackName === '遺珠之憾獎' ? '#2a5a9e' : '#94a3b8',
                              }}
                            >
                              {winner.teamId ? (
                                <Link href={`/teams/${winner.teamId}/public`}>
                                  <a
                                    className={`text-[14px] md:text-[15px] font-semibold mb-1.5 hover:underline block ${
                                      track.trackName === '遺珠之憾獎'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                    }`}
                                    style={{
                                      color: track.trackName === '遺珠之憾獎' ? 'white' : '#1a3a6e',
                                    }}
                                  >
                                    {winner.name}
                                  </a>
                                </Link>
                              ) : (
                                <p
                                  className={`text-[14px] md:text-[15px] font-semibold mb-1.5 ${
                                    track.trackName === '遺珠之憾獎'
                                      ? 'text-white'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {winner.name}
                                </p>
                              )}
                              {winner.project && (
                                <p
                                  className={`text-[12px] md:text-[13px] leading-relaxed ${
                                    track.trackName === '遺珠之憾獎'
                                      ? 'text-white opacity-85'
                                      : 'text-gray-600'
                                  }`}
                                >
                                  {winner.project}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Not announced yet
                  <div className="bg-white py-12 px-8 text-center border border-gray-200 rounded-lg shadow-sm">
                    <p className="text-[16px] md:text-[18px] text-gray-600">獎項將陸續公布</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Closing Thank You Message */}
          <div className="mt-16 pt-10 border-t-2" style={{ borderColor: '#8B4049' }}>
            <div
              className="bg-white rounded-lg shadow-md p-6 md:p-8 border-l-4"
              style={{ borderLeftColor: '#1a3a6e' }}
            >
              <h3
                className="text-[20px] md:text-[26px] font-bold mb-4 text-center"
                style={{ color: '#1a3a6e' }}
              >
                感謝所有參賽團隊
              </h3>
              <div className="max-w-2xl mx-auto space-y-3 text-[14px] md:text-[15px] leading-relaxed">
                <p className="text-gray-700">
                  感謝每一位參賽者的投入與熱情，讓台灣首屆 RWA
                  黑客松成為一場精彩的盛會。從資產代幣化、隱私保護、碳權交易，到醫療數據、能源管理、金融創新，你們展現了
                  RWA 技術的無限可能。
                </p>
                <p className="text-gray-700">期待未來在 RWA 領域看到更多來自你們的創新與突破。</p>
              </div>
            </div>
          </div>

          {/* All Participating Teams - No Title */}
          <div className="mt-16">
            <div className="space-y-8">
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allTeams.map((team, index) => (
                    <div
                      key={index}
                      className="bg-white py-3 px-4 border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      style={{ borderLeftColor: '#94a3b8' }}
                    >
                      {team.teamId ? (
                        <Link href={`/teams/${team.teamId}/public`}>
                          <a
                            className="text-[14px] md:text-[15px] text-gray-900 font-semibold mb-1.5 hover:underline block"
                            style={{ color: '#1a3a6e' }}
                          >
                            {team.name}
                          </a>
                        </Link>
                      ) : (
                        <p className="text-[14px] md:text-[15px] text-gray-900 font-semibold mb-1.5">
                          {team.name}
                        </p>
                      )}
                      <p className="text-[12px] md:text-[13px] text-gray-600 leading-relaxed">
                        {team.project}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
    </>
  );
}

// 服務端獲取數據 - 動態獲取團隊 ID
export const getServerSideProps: GetServerSideProps<WinnersPageProps> = async () => {
  try {
    initializeApi();
    const db = admin.firestore();

    // 查詢賽道 ID
    const trackIds: { [key: string]: string } = {};
    const trackNames = [
      'Demo Day 賽道',
      'imToken 賽道',
      'AWS 賽道',
      '國泰金控賽道',
      'Oasis 賽道',
      'Self Protocol 賽道',
      'Sui 賽道',
      'Zircuit 賽道',
    ];

    for (const trackName of trackNames) {
      const trackSnapshot = await db
        .collection('tracks')
        .where('name', '==', trackName)
        .limit(1)
        .get();

      if (!trackSnapshot.empty) {
        trackIds[trackName] = trackSnapshot.docs[0].id;
      }
    }

    // 得獎團隊數據（含獎金資訊）
    const winnersData: TrackAwards[] = [
      {
        trackName: 'Demo Day 賽道',
        trackId: trackIds['Demo Day 賽道'],
        announced: true,
        awards: [
          {
            title: 'Demo Day 首獎（$1200）',
            winners: [{ name: 'blygccrryryy', project: '企業級多鏈支付解決方案' }],
          },
          {
            title: 'Demo Day 最佳簡報獎（$1000）',
            winners: [
              {
                name: 'twin3',
                project: '人類體驗就是你的資產',
                icon: '/team-media/2025/twin3-icon.jpg',
                iconLink: 'mailto:wen@twin3.ai',
              },
            ],
          },
          {
            title: 'Demo Day 最佳人氣獎（$800）',
            winners: [
              {
                name: 'Solasui',
                project: 'RWA 股權抽籤平台',
                teamId: 'FMBB4wssidPfWotgNWRK',
                icon: '/team-media/2025/Solasui-icon.png',
                iconLink: '/teams/FMBB4wssidPfWotgNWRK/public',
              },
            ],
          },
        ],
      },
      {
        trackName: 'imToken 賽道',
        trackId: trackIds['imToken 賽道'],
        announced: true,
        awards: [
          {
            title: 'imToken 錢包 RWA 創新應用獎 第一名（$1000）',
            winners: [{ name: 'blygccrryryy', project: '企業級多鏈支付解決方案' }],
          },
          {
            title: 'imToken 錢包 RWA 創新應用獎 第二名（$600）',
            winners: [{ name: 'TaxCoin', project: '退稅不只是補貼，而是金融資產+消費能力' }],
          },
          {
            title: 'imToken 錢包 RWA 創新應用獎 第三名（$400）',
            winners: [{ name: 'Zzyzx Labs', project: 'SEAWALLET' }],
          },
        ],
      },
      {
        trackName: '國泰金控賽道',
        trackId: trackIds['國泰金控賽道'],
        announced: true,
        awards: [
          {
            title: '國泰 RWA 應用創新獎 第一名（$1500）',
            winners: [
              {
                name: 'GreenFi Labs',
                project: '解決小農困境',
                teamId: 'uWma0bBqYGUnEts5WZVM',
              },
            ],
          },
          {
            title: '國泰 RWA 應用創新獎 第二名（$500）',
            winners: [
              {
                name: 'RWACE',
                project: 'RWA 綠能資產代幣化平台',
                teamId: 'SgJVf7mKYgNsJYsoXuEn',
                icon: '/team-media/2025/RWACE-icon.png',
                iconLink: '/teams/SgJVf7mKYgNsJYsoXuEn/public',
              },
            ],
          },
        ],
      },
      {
        trackName: 'Self Protocol 賽道',
        trackId: trackIds['Self Protocol 賽道'],
        announced: true,
        awards: [
          {
            title: '最佳 Self Onchain SDK 整合 第一名（$1200）',
            winners: [{ name: '（從缺）' }],
          },
          {
            title: '最佳 Self Onchain SDK 整合 第二名（$800）',
            winners: [{ name: '五告Sui', project: 'OnChain Bank' }],
          },
        ],
      },
      {
        trackName: 'Sui 賽道',
        trackId: trackIds['Sui 賽道'],
        announced: true,
        awards: [
          {
            title: 'Sui 最佳 RWA 應用 第一名（$500）',
            winners: [{ name: 'TaxCoin', project: '退稅不只是補貼，而是金融資產+消費能力' }],
          },
          {
            title: 'Sui 最佳 RWA 應用 第二名（$300）',
            winners: [
              {
                name: 'twin3',
                project: '人類體驗就是你的資產',
                icon: '/team-media/2025/twin3-icon.jpg',
                iconLink: 'mailto:wen@twin3.ai',
              },
            ],
          },
          {
            title: 'Sui 最佳 RWA 應用 第三名（$200）',
            winners: [{ name: 'Zzyzx Labs', project: 'SEAWALLET' }],
          },
        ],
      },
      {
        trackName: 'Zircuit 賽道',
        trackId: trackIds['Zircuit 賽道'],
        announced: true,
        awards: [
          {
            title: 'Zircuit Defi Chiampion（$500）',
            winners: [{ name: '（從缺）' }],
          },
          {
            title: 'Zircuit L2 Prize Pool（$500 共享）',
            winners: [
              { name: 'NomadFi 遊牧星球', project: '數位遊牧村 全球建村計劃' },
              { name: 'ReadFi 知識星球', project: '讓閱讀成為可增值的數位資產' },
              { name: 'RWACE', project: 'RWA 綠能資產代幣化平台' },
              { name: '我先上鏈的!', project: '發票載具綁定公益機構之 web3 pool' },
            ],
          },
        ],
      },
      {
        trackName: 'Oasis 賽道',
        trackId: trackIds['Oasis 賽道'],
        announced: true,
        awards: [
          {
            title: '最佳 Oasis ROFL 框架應用 一等獎（$750）',
            winners: [
              {
                name: '我先上鏈的!',
                project: '發票載具綁定公益機構之 web3 pool',
                teamId: 'Y75ytJqfX8YV50U03DXB',
              },
            ],
          },
        ],
      },
      {
        trackName: 'AWS 賽道',
        trackId: trackIds['AWS 賽道'],
        announced: true,
        awards: [
          {
            title: 'AWS 創新創業獎（$4500 Credits）',
            winners: [
              {
                name: 'RWACE',
                project: 'RWA 綠能資產代幣化平台',
                teamId: 'SgJVf7mKYgNsJYsoXuEn',
                icon: '/team-media/2025/RWACE-icon.png',
                iconLink: '/teams/SgJVf7mKYgNsJYsoXuEn/public',
              },
            ],
          },
        ],
      },
      {
        trackName: '遺珠之憾獎',
        announced: true,
        awards: [
          {
            title: '遺珠之憾獎（$150）',
            winners: [
              { name: 'RBJJH', project: '基於ERC-3643個人股票代幣化之抵押借貸' },
              { name: '估值1B的獨角獸', project: '房地產 RWA 借貸平台' },
              { name: '就愛觀光組', project: 'Real Estate RWA Proof Gateway' },
              {
                name: '可以不要用這種讓人誤會的名字嗎',
                project: '彌合高價值鏈上資產（RWA）與現實世界即時消費之間的鴻溝',
              },
              { name: 'Cryptonite', project: '基於 TEE 與 PQC 的 RWA 隱私身份驗證基礎設施' },
              { name: 'StatelessGuard', project: 'Modular Trust Framework for Humans & Agents' },
              {
                name: 'ReCode Health重編醫鏈',
                project: 'Unlock Your Genome, Own Your Data, Power Global Health Research',
              },
              { name: 'ReadFi 知識星球', project: '讓閱讀成為可增值的數位資產' },
            ],
          },
        ],
      },
      {
        trackName: 'Demo Day 佳作',
        announced: true,
        awards: [
          {
            title: 'Demo Day 佳作（imKey 冷錢包，價值 $99.99）',
            winners: [
              { name: 'RBJJH', project: '基於ERC-3643個人股票代幣化之抵押借貸' },
              { name: '估值1B的獨角獸', project: '房地產 RWA 借貸平台' },
              { name: '就愛觀光組', project: 'Real Estate RWA Proof Gateway' },
              { name: 'Cryptonite', project: '基於 TEE 與 PQC 的 RWA 隱私身份驗證基礎設施' },
              { name: 'StatelessGuard', project: 'Modular Trust Framework for Humans & Agents' },
              {
                name: 'ReCode Health重編醫鏈',
                project: 'Unlock Your Genome, Own Your Data, Power Global Health Research',
              },
              { name: 'VoucherFi', project: 'RWA Wallet Experience' },
              { name: 'Zzyzx Labs', project: 'SEAWALLET' },
              { name: '幣流徵信社', project: '鏈上資產追蹤' },
              { name: 'Foundry Trust', project: '碳積點永續信用卡計畫' },
              { name: 'GreenFi Labs', project: '解決小農困境' },
              { name: 'TaxCoin', project: '退稅不只是補貼，而是金融資產+消費能力' },
              { name: '我先上鏈的!', project: '發票載具綁定公益機構之 web3 pool' },
              { name: 'RWACE', project: 'RWA 綠能資產代幣化平台' },
              { name: '王者清華大學區塊鏈研究社', project: '基於區塊鏈與IoT的P2P潔淨能源交易平台' },
            ],
          },
        ],
      },
    ];

    // 收集所有團隊名稱
    const allTeamNames: string[] = [];
    winnersData.forEach((track) => {
      track.awards.forEach((award) => {
        award.winners.forEach((winner) => {
          allTeamNames.push(winner.name);
        });
      });
    });

    // 從 Firestore 批量查詢團隊 ID
    const teamIdMapping: { [key: string]: string } = {};

    // 批量查詢（每次最多 10 個）
    const batchSize = 10;
    for (let i = 0; i < allTeamNames.length; i += batchSize) {
      const batch = allTeamNames.slice(i, i + batchSize);

      const snapshot = await db
        .collection('team-registrations')
        .where('teamName', 'in', batch)
        .get();

      snapshot.forEach((doc) => {
        const teamName = doc.data().teamName;
        teamIdMapping[teamName] = doc.id;
      });
    }

    // 為每個 winner 添加 teamId（只有在找到時才添加，避免 undefined）
    const tracksAwardsWithIds = winnersData.map((track) => ({
      ...track,
      awards: track.awards.map((award) => ({
        ...award,
        winners: award.winners.map((winner) => {
          const mappedTeamId = teamIdMapping[winner.name];
          return mappedTeamId ? { ...winner, teamId: mappedTeamId } : winner;
        }),
      })),
    }));

    console.log('[Winners] Found team IDs:', Object.keys(teamIdMapping).length);

    // 創建所有參賽團隊列表（30 個團隊）- 直接使用確認的 teamId
    const allTeamsWithIds = [
      {
        name: 'Star Vaults',
        project: '讓白銀成為可驗證、可隱私的數位資產',
        teamId: '15nmZjgDHVOXfHMoYd3z',
      },
      {
        name: 'RBJJH',
        project: '基於ERC-3643個人股票代幣化之抵押借貸',
        teamId: 'rRr2jHNmZPg2OvHnrNTs',
      },
      { name: 'Solasui', project: 'RWA 股權抽籤平台', teamId: 'FMBB4wssidPfWotgNWRK' },
      {
        name: '長按以編輯',
        project: '讓「住宿權」成為可交易的真實資產',
        teamId: 'zK0k1VQLbJEvGpd6HqYA',
      },
      { name: '估值1B的獨角獸', project: '房地產 RWA 借貸平台', teamId: 'MXvM3Yb3itYsrccYyqA7' },
      {
        name: '就愛觀光組',
        project: 'Real Estate RWA Proof Gateway',
        teamId: 'TbFI6SM6IxYrPqI8XyZj',
      },
      {
        name: '可以不要用這種讓人誤會的名字嗎',
        project: '彌合高價值鏈上資產（RWA）與現實世界即時消費之間的鴻溝',
        teamId: 'ayzxADu2oBd6gesaIXNb',
      },
      {
        name: '力力歪力艾克斯',
        project: '專為RWA而生的鏈上外匯市場',
        teamId: 'nAVtPScOg60SUETCYaaV',
      },
      { name: 'blygccrryryy', project: '企業級多鏈支付解決方案', teamId: 'zah8GeA4iJ21Kk1Gw8HY' },
      { name: '塊點會點', project: '企業虛擬資產會計準則', teamId: 'hhlcz6AkcqSAakuokgCi' },
      {
        name: 'Cryptonite',
        project: '基於 TEE 與 PQC 的 RWA 隱私身份驗證基礎設施',
        teamId: 'A26AS9DJsdlKSdGrwrlM',
      },
      {
        name: 'StatelessGuard',
        project: 'Modular Trust Framework for Humans & Agents',
        teamId: '5xBn6ejCgyDX5kbDNYQg',
      },
      {
        name: '好藝術家',
        project: '可監管的 Tornado Cash — RWA 隱私交易',
        teamId: 'qsEc9jaXv3dKdMBIs3oj',
      },
      {
        name: 'ReCode Health重編醫鏈',
        project: 'Unlock Your Genome, Own Your Data, Power Global Health Research',
        teamId: 'BX4zmUyHbvrpDwkVeWYz',
      },
      { name: 'twin3', project: '人類體驗就是你的資產', teamId: 'CK31HdDK77648HIjt2Lp' },
      { name: '五告Sui', project: 'OnChain Bank', teamId: '4Dz3PhOaR5tXpYH3wfVR' },
      { name: 'VoucherFi', project: 'RWA Wallet Experience', teamId: 'fqY07QecjJC0rrHYpkei' },
      { name: 'Zzyzx Labs', project: 'SEAWALLET', teamId: 'sFhTwh81W0fuZBFm9Kap' },
      {
        name: '艾米佳的FVM',
        project: 'Financial Virtual Machine for Real World Assets',
        teamId: '8Uls2lFQXDtgYF0TKzGg',
      },
      { name: '幣流徵信社', project: '鏈上資產追蹤', teamId: 'UikXUS1FmyYaWJYKZcwr' },
      { name: 'Foundry Trust', project: '碳積點永續信用卡計畫', teamId: 'acj7rISPiO991qvpnOki' },
      { name: 'GreenFi Labs', project: '解決小農困境', teamId: 'uWma0bBqYGUnEts5WZVM' },
      {
        name: 'NomadFi 遊牧星球',
        project: '數位遊牧村 全球建村計劃',
        teamId: 'pHuBsWLR4quTAwjK12qf',
      },
      { name: 'BlueLink', project: '永續發展趨勢與問題', teamId: 'CsEQMMuEBpA8m5imyVMv' },
      { name: '上鏈夢想家', project: '捐款要上鏈 愛心不斷鏈', teamId: 'vkGg7S5iyugWqQwRsxvh' },
      {
        name: 'TaxCoin',
        project: '退稅不只是補貼，而是金融資產+消費能力',
        teamId: 'XCQjnSoOKJpBEfrBjum8',
      },
      {
        name: '我先上鏈的!',
        project: '發票載具綁定公益機構之 web3 pool',
        teamId: 'Y75ytJqfX8YV50U03DXB',
      },
      {
        name: 'ReadFi 知識星球',
        project: '讓閱讀成為可增值的數位資產',
        teamId: 'gO4709k3RwRgHM5ODFiB',
      },
      { name: 'RWACE', project: 'RWA 綠能資產代幣化平台', teamId: 'SgJVf7mKYgNsJYsoXuEn' },
      {
        name: '王者清華大學區塊鏈研究社',
        project: '基於區塊鏈與IoT的P2P潔淨能源交易平台',
        teamId: 'qaHnUNhZ2BBNjT9fdJms',
      },
    ];

    return {
      props: {
        tracksAwards: tracksAwardsWithIds,
        allTeams: allTeamsWithIds,
      },
    };
  } catch (error) {
    console.error('[Winners] Error fetching team IDs:', error);

    // 發生錯誤時返回不含 teamId 的數據（含獎金資訊）
    return {
      props: {
        tracksAwards: [
          {
            trackName: 'Demo Day 賽道',
            announced: true,
            awards: [
              {
                title: 'Demo Day 首獎（$1200）',
                winners: [{ name: 'blygccrryryy', project: '企業級多鏈支付解決方案' }],
              },
              {
                title: 'Demo Day 最佳簡報獎（$1000）',
                winners: [
                  {
                    name: 'twin3',
                    project: '人類體驗就是你的資產',
                    icon: '/team-media/2025/twin3-icon.jpg',
                    iconLink: 'mailto:wen@twin3.ai',
                  },
                ],
              },
              {
                title: 'Demo Day 最佳人氣獎（$800）',
                winners: [
                  {
                    name: 'Solasui',
                    project: 'RWA 股權抽籤平台',
                    teamId: 'FMBB4wssidPfWotgNWRK',
                    icon: '/team-media/2025/Solasui-icon.png',
                    iconLink: '/teams/FMBB4wssidPfWotgNWRK/public',
                  },
                ],
              },
            ],
          },
          {
            trackName: 'imToken 賽道',
            announced: true,
            awards: [
              {
                title: 'imToken 錢包 RWA 創新應用獎 第一名（$1000）',
                winners: [{ name: 'blygccrryryy', project: '企業級多鏈支付解決方案' }],
              },
              {
                title: 'imToken 錢包 RWA 創新應用獎 第二名（$600）',
                winners: [{ name: 'TaxCoin', project: '退稅不只是補貼，而是金融資產+消費能力' }],
              },
              {
                title: 'imToken 錢包 RWA 創新應用獎 第三名（$400）',
                winners: [{ name: 'Zzyzx Labs', project: 'SEAWALLET' }],
              },
              {
                title: 'Demo Day 佳作（imKey 冷錢包，價值 $99.99）',
                winners: [
                  { name: 'RBJJH', project: '基於ERC-3643個人股票代幣化之抵押借貸' },
                  { name: '估值1B的獨角獸', project: '房地產 RWA 借貸平台' },
                  { name: '就愛觀光組', project: 'Real Estate RWA Proof Gateway' },
                  { name: 'Cryptonite', project: '基於 TEE 與 PQC 的 RWA 隱私身份驗證基礎設施' },
                  {
                    name: 'StatelessGuard',
                    project: 'Modular Trust Framework for Humans & Agents',
                  },
                  {
                    name: 'ReCode Health重編醫鏈',
                    project: 'Unlock Your Genome, Own Your Data, Power Global Health Research',
                  },
                  { name: 'VoucherFi', project: 'RWA Wallet Experience' },
                  { name: 'Zzyzx Labs', project: 'SEAWALLET' },
                  { name: '幣流徵信社', project: '鏈上資產追蹤' },
                  { name: 'Foundry Trust', project: '碳積點永續信用卡計畫' },
                  { name: 'GreenFi Labs', project: '解決小農困境' },
                  { name: 'TaxCoin', project: '退稅不只是補貼，而是金融資產+消費能力' },
                  { name: '我先上鏈的!', project: '發票載具綁定公益機構之 web3 pool' },
                  { name: 'RWACE', project: 'RWA 綠能資產代幣化平台' },
                  {
                    name: '王者清華大學區塊鏈研究社',
                    project: '基於區塊鏈與IoT的P2P潔淨能源交易平台',
                  },
                ],
              },
            ],
          },
          {
            trackName: 'AWS 賽道',
            announced: true,
            awards: [
              {
                title: 'AWS 創新創業獎（$4500 Credits）',
                winners: [
                  {
                    name: 'RWACE',
                    project: 'RWA 綠能資產代幣化平台',
                    teamId: 'SgJVf7mKYgNsJYsoXuEn',
                    icon: '/team-media/2025/RWACE-icon.png',
                    iconLink: '/teams/SgJVf7mKYgNsJYsoXuEn/public',
                  },
                ],
              },
            ],
          },
          {
            trackName: '國泰金控 賽道',
            announced: true,
            awards: [
              {
                title: '國泰 RWA 應用創新獎 第一名（$1500）',
                winners: [
                  {
                    name: 'GreenFi Labs',
                    project: '解決小農困境',
                    teamId: 'uWma0bBqYGUnEts5WZVM',
                  },
                ],
              },
              {
                title: '國泰 RWA 應用創新獎 第二名（$500）',
                winners: [
                  {
                    name: 'RWACE',
                    project: 'RWA 綠能資產代幣化平台',
                    teamId: 'SgJVf7mKYgNsJYsoXuEn',
                    icon: '/team-media/2025/RWACE-icon.png',
                    iconLink: '/teams/SgJVf7mKYgNsJYsoXuEn/public',
                  },
                ],
              },
            ],
          },
          {
            trackName: 'Oasis 賽道',
            announced: true,
            awards: [
              {
                title: '最佳 Oasis ROFL 框架應用 一等獎（$750）',
                winners: [
                  {
                    name: '我先上鏈的!',
                    project: '發票載具綁定公益機構之 web3 pool',
                    teamId: 'Y75ytJqfX8YV50U03DXB',
                  },
                ],
              },
            ],
          },
        ],
        allTeams: [],
      },
    };
  }
};
