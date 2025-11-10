import React, { useState, useEffect, useMemo } from 'react';
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
  whitelistedEmails?: string[];
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

interface WhitelistStatus {
  email: string;
  status: 'minted' | 'not_minted';
  tokenId?: number;
  transactionHash?: string;
  mintedAt?: string;
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

  // Calculate whitelist status for admin view
  const whitelistStatus: WhitelistStatus[] = useMemo(() => {
    if (!campaign?.whitelistedEmails || !isAdmin) return [];

    return campaign.whitelistedEmails.map((email) => {
      const mintRecord = mintRecords.find(
        (record) => record.userEmail.toLowerCase() === email.toLowerCase(),
      );

      if (mintRecord) {
        return {
          email,
          status: 'minted' as const,
          tokenId: mintRecord.tokenId,
          transactionHash: mintRecord.transactionHash,
          mintedAt: mintRecord.mintedAt,
        };
      }

      return {
        email,
        status: 'not_minted' as const,
      };
    });
  }, [campaign, mintRecords, isAdmin]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      setError('');

      // Prepare headers with auth token if available
      const headers: HeadersInit = {};
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      // Fetch campaign details
      const campaignRes = await fetch(`/api/nft/campaigns/${campaignId}`, { headers });
      if (!campaignRes.ok) {
        throw new Error('無法載入 NFT 活動資訊');
      }
      const campaignData = await campaignRes.json();
      console.log('[NFT Page] Campaign data received:', {
        id: campaignData.campaign?.id,
        name: campaignData.campaign?.name,
        imageUrl: campaignData.campaign?.imageUrl,
        hasImage: !!campaignData.campaign?.imageUrl,
      });
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

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, user]); // Re-fetch when user changes (e.g., after login)

  const getNetworkExplorerUrl = (network: string, address: string) => {
    // Handle Arbitrum network
    if (network.toLowerCase() === 'arbitrum') {
      return `https://arbiscan.io/address/${address}`;
    }
    // Handle Ethereum networks
    const prefix = network === 'mainnet' ? '' : `${network}.`;
    return `https://${prefix}etherscan.io/address/${address}`;
  };

  const getTxExplorerUrl = (network: string, txHash: string) => {
    // Handle Arbitrum network
    if (network.toLowerCase() === 'arbitrum') {
      return `https://arbiscan.io/tx/${txHash}`;
    }
    // Handle Ethereum networks
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
      <div className="bg-white">
        <div className="max-w-[1200px] mx-auto px-8 md:px-12 py-16 md:py-24">
          {/* Main Content */}
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden mb-12">
            <div className="md:flex">
              {/* Image Section */}
              <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-8">
                {campaign.imageUrl ? (
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.name}
                    className="max-w-full max-h-96 object-contain rounded-lg"
                    onError={(e) => {
                      console.error('Image load error:', campaign.imageUrl);
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('.image-error')) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'image-error text-center text-gray-500';
                        errorDiv.innerHTML = `
                          <svg class="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p class="text-sm">圖片載入失敗</p>
                          <p class="text-xs text-gray-400 mt-1 break-all px-4">${campaign.imageUrl}</p>
                        `;
                        parent.appendChild(errorDiv);
                      }
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <svg
                      className="w-24 h-24 mx-auto mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm">無圖片</p>
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="md:w-1/2 p-8">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-[32px] md:text-[40px] font-bold" style={{ color: '#1a3a6e' }}>
                    {campaign.name}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      campaign.status === 'active'
                        ? 'bg-green-900 bg-opacity-10 text-green-900'
                        : campaign.status === 'ended'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {campaign.status === 'active'
                      ? '進行中'
                      : campaign.status === 'ended'
                      ? '已結束'
                      : campaign.status}
                  </span>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">{campaign.description}</p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">區塊鏈網路</div>
                    <div className="text-lg font-semibold capitalize" style={{ color: '#1a3a6e' }}>
                      {campaign.network}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">已鑄造 / 總供應量</div>
                    <div className="text-lg font-semibold" style={{ color: '#1a3a6e' }}>
                      {campaign.currentSupply} / {campaign.maxSupply}
                    </div>
                  </div>
                  {campaign.endDate && (
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg col-span-2">
                      <div className="text-sm text-gray-600 mb-1">截止日期</div>
                      <div className="text-lg font-semibold" style={{ color: '#1a3a6e' }}>
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
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6">
                    <div className="text-sm font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                      智能合約地址
                    </div>
                    <div className="font-mono text-xs break-all text-gray-700 mb-3">
                      {campaign.contractAddress}
                    </div>
                    <a
                      href={getNetworkExplorerUrl(campaign.network, campaign.contractAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium transition-colors"
                      style={{ color: '#1a3a6e' }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
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
                    <span>{((campaign.currentSupply / campaign.maxSupply) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        backgroundColor: '#1a3a6e',
                        width: `${(campaign.currentSupply / campaign.maxSupply) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mint Records / Whitelist Status */}
          {(mintRecords.length > 0 || (isAdmin && whitelistStatus.length > 0)) && (
            <div className="bg-white border border-gray-300 rounded-lg p-8">
              <h2
                className="text-[24px] md:text-[32px] font-bold mb-8"
                style={{ color: '#1a3a6e' }}
              >
                鑄造記錄 (
                {isAdmin && whitelistStatus.length > 0
                  ? whitelistStatus.length
                  : mintRecords.length}
                )
              </h2>

              {isAdmin && whitelistStatus.length > 0 ? (
                /* Admin View - Whitelist Status Table */
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            狀態
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Token ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            交易
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {whitelistStatus.map((item, index) => (
                          <tr key={item.email} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm text-gray-500">{index + 1}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Link href={`/user/${emailToHash(item.email)}`}>
                                <a
                                  className="text-sm font-mono hover:underline transition-colors"
                                  style={{ color: '#1a3a6e' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                                >
                                  {item.email}
                                </a>
                              </Link>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {item.status === 'minted' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 bg-opacity-10 text-green-900">
                                  ✓ 已鑄造
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  ⏳ 未鑄造
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {item.tokenId !== undefined ? (
                                <span className="text-sm font-medium text-gray-900">
                                  #{item.tokenId}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {item.transactionHash ? (
                                <a
                                  href={getTxExplorerUrl(campaign.network, item.transactionHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm transition-colors"
                                  style={{ color: '#1a3a6e' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                                >
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono">
                                      {item.transactionHash.substring(0, 6)}...
                                      {item.transactionHash.substring(
                                        item.transactionHash.length - 4,
                                      )}
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
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="mt-4 flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 bg-opacity-10 text-green-900">
                        ✓ 已鑄造
                      </span>
                      <span className="text-gray-600">
                        {whitelistStatus.filter((item) => item.status === 'minted').length} 人
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        ⏳ 未鑄造
                      </span>
                      <span className="text-gray-600">
                        {whitelistStatus.filter((item) => item.status === 'not_minted').length} 人
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* Public View - User Tags */
                <div className="flex flex-wrap gap-3">
                  {mintRecords.map((record) => (
                    <React.Fragment key={record.id}>
                      {record.userEmail ? (
                        <Link href={`/user/${emailToHash(record.userEmail)}`}>
                          <a
                            className="inline-flex items-center px-4 py-2 rounded-full border-2 transition-colors"
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
                            <span className="text-sm font-medium">{record.displayName}</span>
                          </a>
                        </Link>
                      ) : (
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                          <span className="text-sm font-medium">{record.displayName}</span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <HomeFooter />
    </>
  );
}
