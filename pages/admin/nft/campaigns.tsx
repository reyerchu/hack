import { useState, useEffect } from 'react';
import { useAuthContext } from '../../../lib/user/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import AdminHeader from '../../../components/adminComponents/AdminHeader';
import NFTAutoSetup from '../../../components/admin/NFTAutoSetup';
import { useCustomAlert } from '../../../components/CustomAlert';

interface NFTCampaign {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  network: string;
  contractAddress?: string;
  eligibleEmails: string[];
  startDate: Date;
  endDate: Date;
  maxSupply: number;
  currentSupply: number;
  status: string;
  createdAt: Date;
}

export default function NFTCampaignsAdmin() {
  const { user, isSignedIn, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [campaigns, setCampaigns] = useState<NFTCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [campaignImageFiles, setCampaignImageFiles] = useState<Record<string, File>>({});
  const [copiedAddress, setCopiedAddress] = useState<string>('');

  // Helper function to get blockchain explorer URL
  const getNetworkExplorerUrl = (network: string, address: string) => {
    if (network.toLowerCase() === 'arbitrum') {
      return `https://arbiscan.io/address/${address}`;
    }
    if (network.toLowerCase() === 'ethereum' || network.toLowerCase() === 'mainnet') {
      return `https://etherscan.io/address/${address}`;
    }
    // Testnets (sepolia, goerli, etc.)
    return `https://${network}.etherscan.io/address/${address}`;
  };

  // Form state
  const getDefaultDates = () => {
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Format to datetime-local format (YYYY-MM-DDTHH:mm)
    const formatDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return {
      startDate: formatDateTime(now),
      endDate: formatDateTime(oneWeekLater),
    };
  };

  const [formData, setFormData] = useState({
    name: '',
    symbol: 'RWAHACKTW',
    description: '',
    imageUrl: '',
    network: 'sepolia',
    eligibleEmails: '',
    startDate: getDefaultDates().startDate,
    endDate: getDefaultDates().endDate,
    maxSupply: '100',
  });

  // Check authentication and admin permissions
  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading) {
        if (!user) {
          router.push('/login');
          return;
        }

        // Check if user has admin permissions
        const isAdmin = user?.permissions?.includes('super_admin');
        if (!isAdmin) {
          console.log('[NFT Admin] Access denied - user is not admin:', user?.preferredEmail);
          await showAlert('此頁面僅限管理員訪問');
          router.push('/');
          return;
        }
      }
    };
    checkAuth();
  }, [user, authLoading, router, showAlert]);

  useEffect(() => {
    if (user?.permissions?.includes('super_admin')) {
      fetchCampaigns();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      // Get fresh token from Firebase
      const auth = (await import('firebase/app')).default.auth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error('No authenticated user');
        await showAlert('請重新登入。');
        router.push('/login');
        return;
      }

      // Force refresh token to get latest claims
      const freshToken = await currentUser.getIdToken(true);

      console.log('User info:', {
        email: user?.preferredEmail,
        permissions: user?.permissions,
        permissionsDetail: JSON.stringify(user?.permissions),
        hasToken: !!freshToken,
      });

      const response = await fetch('/api/admin/nft/campaigns/list', {
        headers: {
          Authorization: `Bearer ${freshToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      await showAlert(`載入活動失敗：${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('圖片上傳失敗');

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Get fresh token from Firebase
      const auth = (await import('firebase/app')).default.auth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        await showAlert('請重新登入。');
        router.push('/login');
        return;
      }

      // Upload image first if selected
      let imageUrl = formData.imageUrl;
      if (selectedImage) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadImage(selectedImage);
        } catch (error) {
          await showAlert('圖片上傳失敗，請重試');
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      if (!imageUrl) {
        await showAlert('請上傳 NFT 圖片');
        return;
      }

      // Force refresh token to get latest claims
      const token = await currentUser.getIdToken(true);

      // Parse emails (comma or newline separated)
      const emailList = formData.eligibleEmails
        .split(/[,\n]/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      const response = await fetch('/api/admin/nft/campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          imageUrl,
          eligibleEmails: emailList,
        }),
      });

      if (!response.ok) throw new Error('建立活動失敗');

      const result = await response.json();
      const campaignId = result.campaignId;

      // Store image file for this campaign
      if (selectedImage && campaignId) {
        setCampaignImageFiles((prev) => ({
          ...prev,
          [campaignId]: selectedImage,
        }));
      }

      await showAlert('活動建立成功！請點擊「一鍵部署」部署合約。');
      setShowCreateForm(false);
      await fetchCampaigns();

      // Reset form
      const defaultDates = getDefaultDates();
      setFormData({
        name: '',
        symbol: 'RWAHACKTW',
        description: '',
        imageUrl: '',
        network: 'sepolia',
        eligibleEmails: '',
        startDate: defaultDates.startDate,
        endDate: defaultDates.endDate,
        maxSupply: '100',
      });
      setSelectedImage(null);
      setImagePreview('');
    } catch (error) {
      console.error('Error creating campaign:', error);
      await showAlert('建立活動失敗');
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>NFT 活動管理 - 管理員</title>
        </Head>
        <AdminHeader />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">載入中...</div>
        </div>
      </>
    );
  }

  return (
    <>
      {AlertComponent}
      <Head>
        <title>NFT 活動管理 - 管理員</title>
      </Head>
      <div className="flex flex-col flex-grow min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2 text-left" style={{ color: '#1a3a6e' }}>
              管理儀表板
            </h1>
          </div>
          <AdminHeader />

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">NFT 管理</h1>
            <p className="text-gray-600">總共 {campaigns.length} 個 NFT</p>
          </div>

          <div className="flex justify-end items-center mb-6">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
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
              {showCreateForm ? '取消' : '新增 NFT'}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white border border-gray-300 rounded-lg p-8 mb-12">
              <h2 className="text-[24px] font-bold mb-6" style={{ color: '#1a3a6e' }}>
                建立 NFT 活動
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">活動名稱</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="例如：RWA 黑客松台灣 2025 NFT"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">NFT 符號</label>
                  <input
                    type="text"
                    required
                    value={formData.symbol}
                    onChange={(e) =>
                      setFormData({ ...formData, symbol: e.target.value.toUpperCase() })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="例如：RWANFT"
                    maxLength={10}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    NFT 的代碼符號，將顯示在區塊鏈瀏覽器（最多 10 個字元，自動轉為大寫）
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">活動描述</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="描述此 NFT 活動..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">NFT 圖片</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required={!formData.imageUrl}
                  />
                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                    </div>
                  )}
                  {uploadingImage && (
                    <p className="mt-2 text-sm" style={{ color: '#1a3a6e' }}>
                      上傳中...
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">區塊鏈網路</label>
                  <select
                    value={formData.network}
                    onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="sepolia">Sepolia（測試網）</option>
                    <option value="ethereum">Ethereum 主網</option>
                    <option value="arbitrum">Arbitrum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    符合資格的電子郵件（每行一個或用逗號分隔）
                  </label>
                  <textarea
                    required
                    value={formData.eligibleEmails}
                    onChange={(e) => setFormData({ ...formData, eligibleEmails: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={6}
                    placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">開始日期</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">結束日期</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">最大供應量</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxSupply}
                    onChange={(e) => setFormData({ ...formData, maxSupply: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full border-2 px-8 py-3 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300"
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
                  建立活動
                </button>
              </form>
            </div>
          )}

          <div>
            {campaigns.length === 0 ? (
              <div className="bg-white border border-gray-300 rounded-lg p-12 text-center text-gray-500">
                目前尚無活動。建立您的第一個 NFT 活動！
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="bg-white rounded-lg shadow-sm border-l-4 overflow-hidden hover:shadow-md transition-shadow"
                    style={{ borderLeftColor: '#1a3a6e' }}
                  >
                    {/* Image */}
                    <Link href={`/nft/${campaign.id}`}>
                      <a>
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                          <img
                            src={campaign.imageUrl}
                            alt={campaign.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </a>
                    </Link>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/nft/${campaign.id}`}>
                          <a className="hover:opacity-70 transition-colors flex-1">
                            <h3
                              className="text-[16px] md:text-[18px] font-semibold"
                              style={{ color: '#1a3a6e' }}
                            >
                              {campaign.name}
                            </h3>
                          </a>
                        </Link>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                            campaign.status === 'active'
                              ? 'bg-emerald-700 bg-opacity-10 text-emerald-700'
                              : campaign.status === 'ended'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {campaign.description}
                      </p>

                      {/* Network & Supply Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="px-2 py-1 bg-gray-100 rounded capitalize">
                          {campaign.network}
                        </span>
                        <span>
                          {campaign.currentSupply} / {campaign.maxSupply} 已鑄造
                        </span>
                      </div>

                      {/* Eligible Users */}
                      <div className="text-xs text-gray-500 mb-3">
                        符合資格用戶：{campaign.eligibleEmails.length} 人
                      </div>

                      {/* End Date */}
                      <div className="text-xs text-gray-500 mb-4">
                        截止：
                        {new Date(campaign.endDate).toLocaleString('zh-TW', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </div>

                      {/* Contract Status or Setup */}
                      {campaign.contractAddress ? (
                        <div>
                          <div className="px-3 py-2 bg-emerald-700 bg-opacity-10 rounded-lg border border-emerald-700 border-opacity-20 mb-2">
                            <div className="flex items-center justify-center gap-2">
                              <svg
                                className="w-5 h-5 flex-shrink-0 text-emerald-700"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <p className="text-sm font-semibold text-emerald-700">合約已部署</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={getNetworkExplorerUrl(
                                campaign.network,
                                campaign.contractAddress,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 px-2 py-2 hover:bg-indigo-50 rounded transition-colors group"
                              style={{
                                borderLeft: '3px solid #1a3a6e',
                                backgroundColor: '#f8fafc',
                              }}
                              title="在區塊鏈瀏覽器查看"
                            >
                              <p
                                className="text-xs font-mono break-all text-center flex-1"
                                style={{ color: '#1a3a6e' }}
                              >
                                {campaign.contractAddress}
                              </p>
                              <svg
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: '#1a3a6e' }}
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
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(campaign.contractAddress);
                                setCopiedAddress(campaign.contractAddress);
                                setTimeout(() => setCopiedAddress(''), 2000);
                              }}
                              className="p-2 hover:bg-gray-100 rounded transition-colors"
                              title="複製地址"
                            >
                              {copiedAddress === campaign.contractAddress ? (
                                <svg
                                  className="w-4 h-4 text-emerald-700"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4 text-gray-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <NFTAutoSetup
                          campaignId={campaign.id}
                          campaignName={campaign.name}
                          network={campaign.network}
                          campaign={{
                            ...campaign,
                            imageFile: campaignImageFiles[campaign.id],
                          }}
                          onSuccess={() => fetchCampaigns()}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Force server-side rendering to prevent SSR AuthContext errors
export async function getServerSideProps() {
  return { props: {} };
}
