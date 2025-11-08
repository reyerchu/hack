import { useState, useEffect } from 'react';
import { useAuthContext } from '../../../lib/user/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminHeader from '../../../components/adminComponents/AdminHeader';

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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    network: 'sepolia',
    eligibleEmails: '',
    startDate: '',
    endDate: '',
    maxSupply: '100',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/nft/campaigns/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      alert('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = await user?.getIdToken();
      
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
          eligibleEmails: emailList,
        }),
      });

      if (!response.ok) throw new Error('Failed to create campaign');

      alert('Campaign created successfully!');
      setShowCreateForm(false);
      fetchCampaigns();
      
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
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>NFT Campaigns - Admin</title>
        </Head>
        <AdminHeader />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>NFT Campaigns Management - Admin</title>
      </Head>
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">NFT Campaigns Management</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : 'Create New Campaign'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Create NFT Campaign</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., Hackathon Taiwan 2025 NFT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Describe the NFT campaign..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="https://example.com/nft-image.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Network</label>
                <select
                  value={formData.network}
                  onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="sepolia">Sepolia (Testnet)</option>
                  <option value="ethereum">Ethereum Mainnet</option>
                  <option value="goerli">Goerli (Testnet)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Eligible Emails (one per line or comma-separated)
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
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
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
                <label className="block text-sm font-medium mb-1">Max Supply</label>
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
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Create Campaign
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Existing Campaigns</h2>
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No campaigns yet. Create your first NFT campaign!
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex gap-6">
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">{campaign.name}</h3>
                        <p className="text-gray-600 mt-1">{campaign.description}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          campaign.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : campaign.status === 'ended'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Network</div>
                        <div className="font-medium">{campaign.network}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Supply</div>
                        <div className="font-medium">
                          {campaign.currentSupply} / {campaign.maxSupply}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Eligible Users</div>
                        <div className="font-medium">{campaign.eligibleEmails.length}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">End Date</div>
                        <div className="font-medium">
                          {new Date(campaign.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
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

