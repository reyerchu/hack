import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AdminHeader from '../../../components/adminComponents/AdminHeader';
import { useAuthContext } from '../../../lib/user/AuthContext';

interface NFTCampaign {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  network: string;
  contractAddress?: string;
  merkleRoot?: string;
  eligibleEmails: string[];
  startDate: Date;
  endDate: Date;
  maxSupply: number;
  currentSupply: number;
  status: string;
  symbol?: string;
  mintingEnabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MintRecord {
  id: string;
  userEmail: string;
  tokenId: number;
  transactionHash: string;
  mintedAt: Date;
}

export default function NFTCampaignDetail() {
  const router = useRouter();
  const { campaignId } = router.query;
  const { user, isSignedIn, loading: authLoading } = useAuthContext();
  const [campaign, setCampaign] = useState<NFTCampaign | null>(null);
  const [mints, setMints] = useState<MintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [mintLoading, setMintLoading] = useState(true);

  // Check admin permissions
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const isAdmin = user?.permissions?.includes('super_admin');
      if (!isAdmin) {
        alert('此頁面僅限管理員訪問');
        router.push('/');
        return;
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (campaignId && user?.permissions?.includes('super_admin')) {
      fetchCampaign();
      fetchMints();
    }
  }, [campaignId, user]);

  const fetchCampaign = async () => {
    try {
      const auth = (await import('firebase/app')).default.auth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken(true);
      const response = await fetch(`/api/admin/nft/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch campaign');

      const data = await response.json();
      setCampaign(data.campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      alert('載入活動失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchMints = async () => {
    try {
      const auth = (await import('firebase/app')).default.auth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken(true);
      const response = await fetch(`/api/admin/nft/campaigns/${campaignId}/mints`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch mints');

      const data = await response.json();
      setMints(data.mints || []);
    } catch (error) {
      console.error('Error fetching mints:', error);
    } finally {
      setMintLoading(false);
    }
  };

  const getNetworkExplorer = (network: string) => {
    const explorers: Record<string, string> = {
      mainnet: 'https://etherscan.io',
      sepolia: 'https://sepolia.etherscan.io',
      arbitrum: 'https://arbiscan.io',
      'arbitrum-sepolia': 'https://sepolia.arbiscan.io',
    };
    return explorers[network] || 'https://etherscan.io';
  };

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>載入中... - NFT 管理</title>
        </Head>
        <AdminHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
      </>
    );
  }

  if (!campaign) {
    return (
      <>
        <Head>
          <title>找不到活動 - NFT 管理</title>
        </Head>
        <AdminHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">找不到此 NFT 活動</h1>
            <Link href="/admin/nft/campaigns">
              <a className="text-blue-600 hover:underline">← 返回列表</a>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const explorerUrl = getNetworkExplorer(campaign.network);
  const mintProgress =
    campaign.maxSupply > 0 ? (campaign.currentSupply / campaign.maxSupply) * 100 : 0;

  return (
    <>
      <Head>
        <title>{campaign.name} - NFT 管理</title>
      </Head>
      <AdminHeader />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href="/admin/nft/campaigns">
            <a className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回活動列表
            </a>
          </Link>

          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
                <p className="text-gray-600 mb-4">{campaign.description}</p>

                <div className="flex items-center gap-4 flex-wrap">
                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      campaign.status === 'active'
                        ? 'bg-green-900 bg-opacity-10 text-green-900'
                        : campaign.status === 'completed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {campaign.status === 'active'
                      ? '✅ Active'
                      : campaign.status === 'completed'
                      ? '✓ Completed'
                      : '📝 Draft'}
                  </span>

                  {/* Minting Status */}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      campaign.mintingEnabled
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {campaign.mintingEnabled ? '🔓 Minting Enabled' : '🔒 Minting Disabled'}
                  </span>

                  {/* Network Badge */}
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {campaign.network.charAt(0).toUpperCase() + campaign.network.slice(1)}
                  </span>
                </div>
              </div>

              {/* Image */}
              {campaign.imageUrl && (
                <div className="ml-6 flex-shrink-0">
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.name}
                    className="w-32 h-32 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Supply Progress */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">鑄造進度</h2>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>已鑄造</span>
                    <span className="font-semibold">
                      {campaign.currentSupply} / {campaign.maxSupply} ({mintProgress.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(mintProgress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                      {campaign.currentSupply}
                    </div>
                    <div className="text-xs text-gray-600">已鑄造</div>
                  </div>
                  <div className="text-center p-3 bg-green-900 bg-opacity-10 border border-green-900 border-opacity-20 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">
                      {campaign.maxSupply - campaign.currentSupply}
                    </div>
                    <div className="text-xs text-gray-600">剩餘</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                      {campaign.maxSupply}
                    </div>
                    <div className="text-xs text-gray-600">總供應量</div>
                  </div>
                </div>
              </div>

              {/* Contract Information */}
              {campaign.contractAddress && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">合約資訊</h2>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">合約地址</label>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-gray-50 rounded text-sm font-mono break-all">
                          {campaign.contractAddress}
                        </code>
                        <a
                          href={`${explorerUrl}/address/${campaign.contractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                        >
                          查看 →
                        </a>
                      </div>
                    </div>

                    {campaign.merkleRoot && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Merkle Root</label>
                        <code className="mt-1 block px-3 py-2 bg-gray-50 rounded text-sm font-mono break-all">
                          {campaign.merkleRoot}
                        </code>
                      </div>
                    )}

                    {campaign.symbol && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">符號</label>
                        <div className="mt-1 px-3 py-2 bg-gray-50 rounded text-sm">
                          {campaign.symbol}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mint Records */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">鑄造記錄 ({mints.length})</h2>

                {mintLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : mints.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p>尚無鑄造記錄</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Token ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            交易 Hash
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            鑄造時間
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {mints.map((mint) => (
                          <tr key={mint.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">
                                #{mint.tokenId}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-600">{mint.userEmail}</span>
                            </td>
                            <td className="px-4 py-3">
                              <a
                                href={`${explorerUrl}/tx/${mint.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline font-mono"
                              >
                                {mint.transactionHash.substring(0, 10)}...
                                {mint.transactionHash.substring(56)}
                              </a>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {new Date(mint.mintedAt).toLocaleString('zh-TW')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-6">
              {/* Time Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">時間資訊</h2>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">開始日期</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {new Date(campaign.startDate).toLocaleString('zh-TW')}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">結束日期</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {new Date(campaign.endDate).toLocaleString('zh-TW')}
                    </div>
                  </div>

                  {campaign.createdAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">創建時間</label>
                      <div className="mt-1 text-sm text-gray-600">
                        {new Date(campaign.createdAt).toLocaleString('zh-TW')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Whitelist */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  白名單 ({campaign.eligibleEmails?.length || 0})
                </h2>

                {campaign.eligibleEmails && campaign.eligibleEmails.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {campaign.eligibleEmails.map((email, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 bg-gray-50 rounded text-sm font-mono break-all"
                        >
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">無白名單</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">快速操作</h2>

                <div className="space-y-2">
                  {campaign.contractAddress && (
                    <a
                      href={`${explorerUrl}/address/${campaign.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center text-sm"
                    >
                      在 Explorer 查看
                    </a>
                  )}

                  {campaign.imageUrl && (
                    <a
                      href={campaign.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-center text-sm"
                    >
                      查看原始圖片
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
