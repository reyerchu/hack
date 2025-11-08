import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppHeader from '../../components/AppHeader';
import HomeFooter from '../../components/homeComponents/HomeFooter';
import { useAuthContext } from '../../lib/user/AuthContext';

interface NFTCampaign {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  network: string;
  contractAddress?: string;
  maxSupply: number;
  currentSupply: number;
  endDate: Date;
}

interface MintStatus {
  eligible: boolean;
  alreadyMinted: boolean;
  reason?: string;
  campaign?: NFTCampaign;
  mintRecord?: {
    mintedAt: Date;
    transactionHash: string;
  };
}

export default function NFTMintPage() {
  const router = useRouter();
  const { user, isSignedIn, loading: authLoading } = useAuthContext();
  const [mintStatus, setMintStatus] = useState<MintStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/login');
    }
  }, [authLoading, isSignedIn, router]);

  useEffect(() => {
    if (user?.preferredEmail) {
      checkEligibility();
    }
  }, [user]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/nft/check-eligibility?email=${encodeURIComponent(user?.preferredEmail || '')}`
      );

      if (!response.ok) {
        throw new Error('檢查資格失敗');
      }

      const data = await response.json();
      setMintStatus(data);
    } catch (err: any) {
      console.error('Error checking eligibility:', err);
      setError(err.message || '檢查資格時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('請安裝 MetaMask 錢包');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      setWalletAddress(accounts[0]);
      setWalletConnected(true);
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      alert('連接錢包失敗：' + err.message);
    }
  };

  const handleMint = async () => {
    if (!walletConnected || !walletAddress) {
      alert('請先連接錢包');
      return;
    }

    if (!mintStatus?.campaign) {
      alert('無法找到 NFT 活動資訊');
      return;
    }

    try {
      setMinting(true);
      setError('');

      // TODO: Implement actual minting logic with smart contract
      // For now, just simulate the minting process
      
      alert('NFT 鑄造功能正在開發中，請稍後再試。');

      // After successful minting, record it in the database
      // const response = await fetch('/api/nft/record-mint', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     campaignId: mintStatus.campaign.id,
      //     userEmail: user?.preferredEmail,
      //     userId: user?.id,
      //     walletAddress,
      //     transactionHash: 'tx_hash_here',
      //   }),
      // });

      // if (!response.ok) {
      //   throw new Error('記錄鑄造失敗');
      // }

      // router.push(`/user/${user?.id}`);
    } catch (err: any) {
      console.error('Error minting NFT:', err);
      setError(err.message || '鑄造失敗');
    } finally {
      setMinting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>鑄造 NFT - RWA Hackathon Taiwan</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ paddingTop: '80px' }}>
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: '#1a3a6e' }}
            ></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
        <HomeFooter />
      </>
    );
  }

  if (!mintStatus?.eligible) {
    return (
      <>
        <Head>
          <title>鑄造 NFT - RWA Hackathon Taiwan</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ paddingTop: '80px' }}>
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h1 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                不符合鑄造資格
              </h1>
              <p className="text-gray-600 mb-6">
                {mintStatus?.reason || '您目前不符合 NFT 鑄造資格'}
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: '#1a3a6e',
                  color: '#ffffff',
                }}
              >
                返回首頁
              </button>
            </div>
          </div>
        </div>
        <HomeFooter />
      </>
    );
  }

  if (mintStatus.alreadyMinted) {
    return (
      <>
        <Head>
          <title>已鑄造 NFT - RWA Hackathon Taiwan</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ paddingTop: '80px' }}>
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <h1 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                您已經鑄造過此 NFT
              </h1>
              {mintStatus.mintRecord && (
                <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">鑄造時間：</span>
                    {new Date(mintStatus.mintRecord.mintedAt).toLocaleString('zh-TW')}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">交易雜湊：</span>
                    <a
                      href={`https://etherscan.io/tx/${mintStatus.mintRecord.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {mintStatus.mintRecord.transactionHash}
                    </a>
                  </p>
                </div>
              )}
              <button
                onClick={() => router.push(`/user/${user?.id}`)}
                className="px-6 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: '#1a3a6e',
                  color: '#ffffff',
                }}
              >
                返回個人頁面
              </button>
            </div>
          </div>
        </div>
        <HomeFooter />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>鑄造 NFT - {mintStatus.campaign?.name}</title>
      </Head>
      <AppHeader />

      <section className="bg-gray-50 py-16 md:py-24" style={{ paddingTop: '100px' }}>
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* NFT Preview */}
            {mintStatus.campaign && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                    {mintStatus.campaign.name}
                  </h1>
                  <p className="text-gray-600 mb-6">{mintStatus.campaign.description}</p>
                  
                  <img
                    src={mintStatus.campaign.imageUrl}
                    alt={mintStatus.campaign.name}
                    className="w-full max-w-md mx-auto rounded-lg shadow-md mb-6"
                  />

                  <div className="flex justify-center gap-8 text-sm text-gray-600 mb-8">
                    <div>
                      <span className="font-semibold">網路：</span>
                      <span className="ml-1">{mintStatus.campaign.network}</span>
                    </div>
                    <div>
                      <span className="font-semibold">供應量：</span>
                      <span className="ml-1">
                        {mintStatus.campaign.currentSupply} / {mintStatus.campaign.maxSupply}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Minting Steps */}
                <div className="space-y-4 mb-8">
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                    鑄造步驟
                  </h2>

                  {/* Step 1: Connect Wallet */}
                  <div
                    className={`border-2 rounded-lg p-4 ${
                      walletConnected ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            walletConnected ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span className="text-white font-bold">1</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">連接錢包</h3>
                          {walletConnected && (
                            <p className="text-sm text-gray-600">
                              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                            </p>
                          )}
                        </div>
                      </div>
                      {!walletConnected && (
                        <button
                          onClick={connectWallet}
                          className="px-4 py-2 rounded-lg font-medium transition-colors"
                          style={{
                            backgroundColor: '#1a3a6e',
                            color: '#ffffff',
                          }}
                        >
                          連接 MetaMask
                        </button>
                      )}
                      {walletConnected && (
                        <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Mint NFT */}
                  <div
                    className={`border-2 rounded-lg p-4 ${
                      walletConnected ? 'border-gray-300' : 'border-gray-200 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-white font-bold">2</span>
                      </div>
                      <h3 className="font-semibold">鑄造 NFT</h3>
                    </div>
                    <p className="text-sm text-gray-600 ml-11 mb-4">
                      確認交易並鑄造您的專屬 NFT
                    </p>
                    {error && (
                      <div className="ml-11 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}
                    <div className="ml-11">
                      <button
                        onClick={handleMint}
                        disabled={!walletConnected || minting}
                        className="w-full px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: walletConnected ? '#8B4049' : '#cccccc',
                          color: '#ffffff',
                        }}
                      >
                        {minting ? '鑄造中...' : '立即鑄造'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">注意事項</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 每個地址只能鑄造一次</li>
                    <li>• 鑄造需要支付 Gas 費用</li>
                    <li>• 鑄造後 NFT 將發送到您的錢包地址</li>
                    <li>• 請確保您的錢包連接到正確的網路</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <HomeFooter />
    </>
  );
}

