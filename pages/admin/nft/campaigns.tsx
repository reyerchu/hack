import { useState, useEffect } from 'react';
import { useAuthContext } from '../../../lib/user/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import AdminHeader from '../../../components/adminComponents/AdminHeader';
import NFTAutoSetup from '../../../components/admin/NFTAutoSetup';

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
  const [campaigns, setCampaigns] = useState<NFTCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [campaignImageFiles, setCampaignImageFiles] = useState<Record<string, File>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    network: 'sepolia',
    eligibleEmails: '',
    startDate: '',
    endDate: '',
    maxSupply: '100',
  });

  // Check authentication and admin permissions
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Check if user has admin permissions
      const isAdmin = user?.permissions?.includes('super_admin');
      if (!isAdmin) {
        console.log('[NFT Admin] Access denied - user is not admin:', user?.preferredEmail);
        alert('此頁面僅限管理員訪問');
        router.push('/');
        return;
      }
    }
  }, [user, authLoading, router]);

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
        alert('請重新登入。');
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
      alert(`載入活動失敗：${error.message}`);
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
        alert('請重新登入。');
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
          alert('圖片上傳失敗，請重試');
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      if (!imageUrl) {
        alert('請上傳 NFT 圖片');
        return;
      }

      // Force refresh token to get latest claims
      const token = await currentUser.getIdToken(true);
      
      // Parse emails (comma or newline separated)
      const emailList = formData.eligibleEmails
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email.length > 0);

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
        setCampaignImageFiles(prev => ({
          ...prev,
          [campaignId]: selectedImage
        }));
      }

      alert('活動建立成功！請點擊「一鍵自動設置」部署合約。');
      setShowCreateForm(false);
      await fetchCampaigns();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        network: 'sepolia',
        eligibleEmails: '',
        startDate: '',
        endDate: '',
        maxSupply: '100',
      });
      setSelectedImage(null);
      setImagePreview('');
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('建立活動失敗');
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
      <Head>
        <title>NFT 活動管理 - 管理員</title>
      </Head>
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">NFT 活動管理</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 text-white rounded-lg font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: '#8B4049' }}
          >
            {showCreateForm ? '取消' : '建立新活動'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">建立 NFT 活動</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">活動名稱</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="例如：RWA 黑客松台灣 2025 NFT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">NFT 符號</label>
                <input
                  type="text"
                  required
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="例如：RWANFT"
                  maxLength={10}
                />
                <p className="mt-1 text-sm text-gray-500">NFT 的代碼符號，將顯示在區塊鏈瀏覽器（最多 10 個字元，自動轉為大寫）</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">活動描述</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  placeholder="描述此 NFT 活動..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">NFT 圖片</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  required={!formData.imageUrl}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
                {uploadingImage && (
                  <p className="mt-2 text-sm text-blue-900">上傳中...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">區塊鏈網路</label>
                <select
                  value={formData.network}
                  onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="sepolia">Sepolia（測試網）</option>
                  <option value="ethereum">Ethereum 主網</option>
                  <option value="arbitrum">Arbitrum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  符合資格的電子郵件（每行一個或用逗號分隔）
                </label>
                <textarea
                  required
                  value={formData.eligibleEmails}
                  onChange={(e) => setFormData({ ...formData, eligibleEmails: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                  rows={6}
                  placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">開始日期</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">結束日期</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">最大供應量</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.maxSupply}
                  onChange={(e) => setFormData({ ...formData, maxSupply: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 text-white rounded-lg font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#8B4049' }}
              >
                建立活動
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">現有活動</h2>
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              目前尚無活動。建立您的第一個 NFT 活動！
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex gap-6">
                  <Link href={`/nft/${campaign.id}`}>
                    <a>
                      <img
                        src={campaign.imageUrl}
                        alt={campaign.name}
                        className="w-32 h-32 object-cover rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </a>
                  </Link>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/nft/${campaign.id}`}>
                          <a className="transition-colors" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = '#8B4049'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                            <h3 className="text-xl font-bold">{campaign.name}</h3>
                          </a>
                        </Link>
                        <p className="text-gray-600 mt-1">{campaign.description}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          campaign.status === 'active'
                            ? 'bg-green-100 text-green-900'
                            : campaign.status === 'ended'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-900'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">區塊鏈網路</div>
                        <div className="font-medium capitalize">{campaign.network}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">供應量</div>
                        <div className="font-medium">
                          {campaign.currentSupply} / {campaign.maxSupply}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">符合資格用戶數</div>
                        <div className="font-medium">{campaign.eligibleEmails.length}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">結束日期</div>
                        <div className="font-medium">
                          {new Date(campaign.endDate).toLocaleDateString('zh-TW')}
                        </div>
                      </div>
                    </div>

                    {campaign.contractAddress ? (
                      <div className="mt-4 bg-green-50 border border-green-300 rounded p-3">
                        <div className="text-sm text-green-900">
                          <div className="font-semibold mb-1">✅ 合約已部署</div>
                          <div className="font-mono text-xs break-all">{campaign.contractAddress}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <NFTAutoSetup
                          campaignId={campaign.id}
                          campaignName={campaign.name}
                          network={campaign.network}
                          campaign={{
                            ...campaign,
                            imageFile: campaignImageFiles[campaign.id]
                          }}
                          onSuccess={() => fetchCampaigns()}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

