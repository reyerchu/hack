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
}

export default function WinnersPage({ tracksAwards }: WinnersPageProps) {
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
                  {track.trackId ? (
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
                  <div className="w-14 h-1" style={{ backgroundColor: '#8B4049' }}></div>
                </div>

                {track.announced ? (
                  <div className="space-y-8">
                    {/* Major Prizes - responsive layout with dark background */}
                    {/* Skip this section for Demo Day 佳作 */}
                    {track.trackName !== 'Demo Day 佳作' && (
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
                            {/* Single Winner - Dark background with light text */}
                            <div
                              className="py-4 px-5 rounded-lg shadow-md border-l-4"
                              style={{
                                backgroundColor: awardIndex === 0 ? '#8B4049' : '#1a3a6e',
                                borderLeftColor: awardIndex === 0 ? '#a85a63' : '#2a5a9e',
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
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white shadow-md overflow-hidden">
                                      <img
                                        src={award.winners[0].icon}
                                        alt={`${award.winners[0].name} icon`}
                                        className="w-full h-full object-cover"
                                        style={
                                          award.winners[0].name === 'RWACE'
                                            ? { transform: 'scale(1.5)', transformOrigin: 'center' }
                                            : undefined
                                        }
                                      />
                                    </div>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Other Awards (佳作 etc.) */}
                    {(track.trackName === 'Demo Day 佳作'
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
                              className="bg-white py-3 px-4 border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                              style={{ borderLeftColor: '#94a3b8' }}
                            >
                              {winner.teamId ? (
                                <Link href={`/teams/${winner.teamId}/public`}>
                                  <a
                                    className="text-[14px] md:text-[15px] text-gray-900 font-semibold mb-1.5 hover:underline block"
                                    style={{ color: '#1a3a6e' }}
                                  >
                                    {winner.name}
                                  </a>
                                </Link>
                              ) : (
                                <p className="text-[14px] md:text-[15px] text-gray-900 font-semibold mb-1.5">
                                  {winner.name}
                                </p>
                              )}
                              {winner.project && (
                                <p className="text-[12px] md:text-[13px] text-gray-600 leading-relaxed">
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

          {/* Closing Message */}
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
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <p className="text-center text-gray-600 text-[13px] italic">
                    其他賽道獎項將陸續公布
                  </p>
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
      '國泰金控 賽道',
      'Oasis 賽道',
      'Self 賽道',
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
        trackName: '國泰金控 賽道',
        trackId: trackIds['國泰金控 賽道'],
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
        trackName: 'Self 賽道',
        trackId: trackIds['Self 賽道'],
        announced: false,
        awards: [],
      },
      {
        trackName: 'Sui 賽道',
        trackId: trackIds['Sui 賽道'],
        announced: false,
        awards: [],
      },
      {
        trackName: 'Zircuit 賽道',
        trackId: trackIds['Zircuit 賽道'],
        announced: false,
        awards: [],
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
        announced: false,
        awards: [],
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

    // 為每個 winner 添加 teamId
    const tracksAwardsWithIds = winnersData.map((track) => ({
      ...track,
      awards: track.awards.map((award) => ({
        ...award,
        winners: award.winners.map((winner) => ({
          ...winner,
          teamId: teamIdMapping[winner.name] || undefined,
        })),
      })),
    }));

    console.log('[Winners] Found team IDs:', Object.keys(teamIdMapping).length);

    return {
      props: {
        tracksAwards: tracksAwardsWithIds,
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
      },
    };
  }
};
