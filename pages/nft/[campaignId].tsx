import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import AppHeader from '../../components/AppHeader';
import HomeFooter from '../../components/homeComponents/HomeFooter';
import { emailToHash } from '../../lib/utils/email-hash';
import { useAuthContext } from '../../lib/user/AuthContext';

interface NFTCampaign {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  network: string;
  contractAddress: string;
  maxSupply: number;
  currentSupply: number;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

interface MintRecord {
  id: string;
  userEmail: string;
  userId: string;
  displayName: string;
  tokenId: number;
  transactionHash: string;
  mintedAt: string;
}

export default function NFTCampaignPage() {
  const router = useRouter();
  const { campaignId } = router.query;
  const { user } = useAuthContext();
  const [campaign, setCampaign] = useState<NFTCampaign | null>(null);
  const [mintRecords, setMintRecords] = useState<MintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is admin
  const isAdmin = user?.permissions?.includes('super_admin') || false;

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData();
    }
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch campaign details
      const campaignRes = await fetch(`/api/nft/campaigns/${campaignId}`);
      if (!campaignRes.ok) {
        throw new Error('無法載入 NFT 活動資訊');
      }
      const campaignData = await campaignRes.json();
      setCampaign(campaignData.campaign);

      // Fetch mint records
      const mintsRes = await fetch(`/api/nft/campaigns/${campaignId}/mints`);
      if (mintsRes.ok) {
        const mintsData = await mintsRes.json();
        setMintRecords(mintsData.mints || []);
      }
    } catch (err: any) {
      console.error('Error fetching campaign data:', err);
      setError(err.message || '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const getNetworkExplorerUrl = (network: string, address: string) => {
    const prefix = network === 'mainnet' ? '' : `${network}.`;
    return `https://${prefix}etherscan.io/address/${address}`;
  };

  const getTxExplorerUrl = (network: string, txHash: string) => {
    const prefix = network === 'mainnet' ? '' : `${network}.`;
    return `https://${prefix}etherscan.io/tx/${txHash}`;
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>載入中... | RWA Hackathon Taiwan</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
        <HomeFooter />
      </>
    );
  }

  if (error || !campaign) {
    return (
      <>
        <Head>
          <title>錯誤 | RWA Hackathon Taiwan</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || '找不到此 NFT 活動'}</p>
            <Link href="/winners">
              <a className="text-blue-600 hover:underline">返回得獎名單</a>
            </Link>
          </div>
        </div>
        <HomeFooter />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{campaign.name} | RWA Hackathon Taiwan</title>
        <meta name="description" content={campaign.description} />
        <meta property="og:title" content={campaign.name} />
        <meta property="og:description" content={campaign.description} />
        <meta property="og:image" content={campaign.imageUrl} />
      </Head>

      <AppHeader />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="md:flex">
            {/* Image Section */}
            <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-8">
              <img
                src={campaign.imageUrl}
                alt={campaign.name}
                className="max-w-full max-h-96 object-contain rounded-lg"
              />
            </div>

            {/* Info Section */}
            <div className="md:w-1/2 p-8">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    campaign.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : campaign.status === 'ended'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {campaign.status === 'active' ? '進行中' : campaign.status === 'ended' ? '已結束' : campaign.status}
                </span>
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">{campaign.description}</p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">區塊鏈網路</div>
                  <div className="text-lg font-semibold capitalize">{campaign.network}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">已鑄造 / 總供應量</div>
                  <div className="text-lg font-semibold">
                    {campaign.currentSupply} / {campaign.maxSupply}
                  </div>
                </div>
                {campaign.endDate && (
                  <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                    <div className="text-sm text-gray-600 mb-1">截止日期</div>
                    <div className="text-lg font-semibold">
                      {new Date(campaign.endDate).toLocaleString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Contract Address */}
              {campaign.contractAddress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="text-sm text-blue-800 font-semibold mb-2">智能合約地址</div>
                  <div className="font-mono text-xs break-all text-blue-900 mb-3">
                    {campaign.contractAddress}
                  </div>
                  <a
                    href={getNetworkExplorerUrl(campaign.network, campaign.contractAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    在區塊鏈瀏覽器查看
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>鑄造進度</span>
                  <span>
                    {((campaign.currentSupply / campaign.maxSupply) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${(campaign.currentSupply / campaign.maxSupply) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mint Records */}
        {mintRecords.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              鑄造記錄 ({mintRecords.length})
            </h2>

            {isAdmin ? (
              /* Admin View - Detailed Table */
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Token ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        用戶
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        鑄造時間
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        交易
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mintRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            #{record.tokenId}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {record.userEmail ? (
                            <Link href={`/user/${emailToHash(record.userEmail)}`}>
                              <a className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                                {record.displayName}
                              </a>
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-900">{record.displayName}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 font-mono">
                            {record.userEmail}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {new Date(record.mintedAt).toLocaleString('zh-TW', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {record.transactionHash && (
                            <a
                              href={getTxExplorerUrl(campaign.network, record.transactionHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              <div className="flex items-center gap-1">
                                <span className="font-mono">
                                  {record.transactionHash.substring(0, 6)}...
                                  {record.transactionHash.substring(record.transactionHash.length - 4)}
                                </span>
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </div>
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Public View - User Tags */
              <div className="flex flex-wrap gap-3">
                {mintRecords.map((record) => (
                  record.userEmail ? (
                    <Link key={record.id} href={`/user/${emailToHash(record.userEmail)}`}>
                      <a className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                        <span className="text-sm font-medium">{record.displayName}</span>
                      </a>
                    </Link>
                  ) : (
                    <div key={record.id} className="inline-flex items-center px-4 py-2 rounded-full bg-gray-50 text-gray-700">
                      <span className="text-sm font-medium">{record.displayName}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <HomeFooter />
    </>
  );
}

