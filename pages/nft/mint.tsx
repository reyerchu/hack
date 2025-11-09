import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppHeader from '../../components/AppHeader';
import HomeFooter from '../../components/homeComponents/HomeFooter';
import { useAuthContext } from '../../lib/user/AuthContext';
import { useNFTContractMerkle } from '../../lib/hooks/useNFTContractMerkle';

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
  const [transactionHash, setTransactionHash] = useState('');
  const [merkleProof, setMerkleProof] = useState<string[] | null>(null);
  const [emailHash, setEmailHash] = useState<string>('');

  // Use NFT contract hook with Merkle support
  const nftContract = useNFTContractMerkle(
    mintStatus?.campaign?.contractAddress,
    walletAddress,
    emailHash
  );

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

      // If eligible, get Merkle proof
      if (data.eligible && data.campaign?.id) {
        await getMerkleProof(user?.preferredEmail || '', data.campaign.id);
      }
    } catch (err: any) {
      console.error('Error checking eligibility:', err);
      setError(err.message || '檢查資格時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const getMerkleProof = async (email: string, campaignId: string) => {
    try {
      const response = await fetch(
        `/api/nft/get-merkle-proof?email=${encodeURIComponent(email)}&campaignId=${campaignId}`
      );

      if (!response.ok) {
        throw new Error('獲取 Merkle Proof 失敗');
      }

      const data = await response.json();
      
      if (data.eligible && data.proof && data.emailHash) {
        setMerkleProof(data.proof);
        setEmailHash(data.emailHash);
        console.log('[Mint] Got Merkle Proof:', {
          emailHash: data.emailHash,
          proofLength: data.proof.length,
        });
      }
    } catch (err: any) {
      console.error('Error getting Merkle proof:', err);
      setError('無法獲取鑄造憑證');
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

    if (!mintStatus.campaign.contractAddress) {
      alert('合約地址尚未設定，請聯繫管理員');
      return;
    }

    if (!merkleProof || !emailHash) {
      alert('無法獲取鑄造憑證，請重新整理頁面');
      return;
    }

    try {
      setMinting(true);
      setError('');

      console.log('[Mint] Starting mint with:', {
        emailHash,
        proofLength: merkleProof.length,
      });

      // Call smart contract mint function with Merkle proof
      const result = await nftContract.mint(emailHash, merkleProof);

      if (!result.success) {
        throw new Error(result.error || '鑄造失敗');
      }

      // Record mint in database
      const response = await fetch('/api/nft/record-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: mintStatus.campaign.id,
          userEmail: user?.preferredEmail,
          userId: user?.id,
          walletAddress,
          tokenId: result.tokenId || 0,
          transactionHash: result.txHash,
        }),
      });

      if (!response.ok) {
        console.error('Failed to record mint in database');
        // Don't fail the whole process if recording fails
      }

      // Success!
      setTransactionHash(result.txHash || '');
      alert(`NFT 鑄造成功！\n交易哈希：${result.txHash}`);
      
      // Redirect to user page after a short delay
      setTimeout(() => {
        router.push(`/user/${user?.id}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error minting NFT:', err);
      setError(err.message || '鑄造失敗');
      alert('鑄造失敗：' + (err.message || '未知錯誤'));
    } finally {
      setMinting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>載入中...</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen flex items-center justify-center pt-16">載入中...</div>
        <HomeFooter />
      </>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>請登入</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen flex items-center justify-center pt-16">請登入以查看 NFT 鑄造頁面。</div>
        <HomeFooter />
      </>
    );
  }

  if (!mintStatus?.eligible) {
    return (
      <>
        <Head>
          <title>不符合資格 - RWA Hackathon Taiwan</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ paddingTop: '80px' }}>
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <h1 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                您不符合此 NFT 活動的鑄造資格
              </h1>
              <p className="text-gray-600 mb-6">
                {mintStatus?.reason || '請確認您的電子郵件是否在白名單中，或活動是否已開始/結束。'}
              </p>
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

                  <div className="flex justify-center gap-8 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-semibold">網路：</span>
                      <span className="ml-1 capitalize">{mintStatus.campaign.network}</span>
                    </div>
                    <div>
                      <span className="font-semibold">供應量：</span>
                      <span className="ml-1">
                        {nftContract.loading ? '載入中...' : `${nftContract.totalSupply} / ${nftContract.maxSupply}`}
                      </span>
                    </div>
                  </div>

                  {/* Contract Status */}
                  {mintStatus.campaign.contractAddress && walletConnected && (
                    <div className="mb-8 p-4 bg-blue-50 rounded-lg text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600">合約狀態：</span>
                          <span className={`ml-2 font-semibold ${nftContract.mintingEnabled ? 'text-green-600' : 'text-orange-600'}`}>
                            {nftContract.loading ? '檢查中...' : nftContract.mintingEnabled ? '✓ 開放鑄造' : '✗ 未開放'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">您的狀態：</span>
                          <span className={`ml-2 font-semibold ${nftContract.canMint ? 'text-green-600' : nftContract.hasMinted ? 'text-gray-600' : 'text-orange-600'}`}>
                            {nftContract.loading ? '檢查中...' : nftContract.hasMinted ? '已鑄造' : nftContract.canMint ? '✓ 可鑄造' : '不可鑄造'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Minting Steps */}
                <div className="space-y-4 mb-8">
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                    鑄造步驟
                  </h2>

                  {/* Step 1: Connect Wallet */}
                  <div className="flex items-center p-4 border rounded-lg bg-gray-50">
                    <span className="text-2xl font-bold mr-4 text-gray-600">1.</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">連接錢包</h4>
                      {!walletConnected ? (
                        <button
                          onClick={connectWallet}
                          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          連接 MetaMask
                        </button>
                      ) : (
                        <p className="text-green-600 font-medium">
                          錢包已連接！
                          <span className="ml-2 text-gray-600 text-sm font-mono break-all">
                            {walletAddress}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Mint NFT */}
                  <div className={`flex items-center p-4 border rounded-lg ${!walletConnected || !nftContract.canMint || !merkleProof ? 'bg-gray-100 text-gray-400' : 'bg-gray-50'}`}>
                    <span className="text-2xl font-bold mr-4 text-gray-600">2.</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">鑄造 NFT</h4>
                      {merkleProof && (
                        <p className="text-xs text-green-600 mb-2">
                          ✓ 已驗證白名單資格（使用 email: {user?.preferredEmail}）
                        </p>
                      )}
                      <button
                        onClick={handleMint}
                        disabled={!walletConnected || minting || !nftContract.canMint || !merkleProof}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          !walletConnected || minting || !nftContract.canMint || !merkleProof
                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {minting ? '鑄造中...' : '立即鑄造'}
                      </button>
                      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>
                  </div>
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
