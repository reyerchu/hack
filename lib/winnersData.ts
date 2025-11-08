/**
 * 得獎團隊資料 - 共享資料源
 */

export interface Winner {
  name: string;
  project?: string;
  teamId?: string;
  icon?: string;
  iconLink?: string;
}

export interface Award {
  title: string;
  winners: Winner[];
}

export interface TrackAwards {
  trackName: string;
  trackId?: string;
  awards: Award[];
  announced: boolean;
}

// 得獎團隊資料
export const winnersData: TrackAwards[] = [
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
    trackName: 'Self 賽道',
    announced: false,
    awards: [],
  },
  {
    trackName: 'Sui 賽道',
    announced: false,
    awards: [],
  },
  {
    trackName: 'Zircuit 賽道',
    announced: false,
    awards: [],
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

/**
 * 根據團隊名稱查找得獎紀錄
 */
export function getTeamAwards(
  teamName: string,
): Array<{ trackName: string; awardTitle: string; project?: string }> {
  const awards: Array<{ trackName: string; awardTitle: string; project?: string }> = [];

  for (const track of winnersData) {
    if (!track.announced) continue;

    for (const award of track.awards) {
      for (const winner of award.winners) {
        if (winner.name === teamName) {
          awards.push({
            trackName: track.trackName,
            awardTitle: award.title,
            project: winner.project,
          });
        }
      }
    }
  }

  return awards;
}
