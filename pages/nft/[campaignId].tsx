import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import AppHeader from '../../components/AppHeader';
import HomeFooter from '../../components/homeComponents/HomeFooter';
import { emailToHash } from '../../lib/utils/email-hash';
import { useAuthContext } from '../../lib/user/AuthContext';
import AddWhitelistModal from '../../components/admin/AddWhitelistModal';
import { useNFTContractMerkle } from '../../lib/hooks/useNFTContractMerkle';

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

// Network configuration mapping
const NETWORK_CONFIG: Record<
  string,
  {
    chainId: string;
    chainIdDecimal: number;
    chainName: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: string[];
    blockExplorerUrls: string[];
  }
> = {
  sepolia: {
    chainId: '0xaa36a7', // 11155111 in hex
    chainIdDecimal: 11155111,
    chainName: 'Sepolia Testnet',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  arbitrum: {
    chainId: '0xa4b1', // 42161 in hex
    chainIdDecimal: 42161,
    chainName: 'Arbitrum One',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  ethereum: {
    chainId: '0x1', // 1 in hex
    chainIdDecimal: 1,
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io'],
  },
};

export default function NFTCampaignPage() {
  const router = useRouter();
  const { campaignId } = router.query;
  const { user, isSignedIn } = useAuthContext();
  const [campaign, setCampaign] = useState<NFTCampaign | null>(null);
  const [mintRecords, setMintRecords] = useState<MintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddWhitelistModal, setShowAddWhitelistModal] = useState(false);

  // Minting states
  const [canMintNFT, setCanMintNFT] = useState(false);
  const [alreadyMinted, setAlreadyMinted] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [minting, setMinting] = useState(false);
  const [merkleProof, setMerkleProof] = useState<string[] | null>(null);
  const [emailHash, setEmailHash] = useState<string>('');
  const [currentChainId, setCurrentChainId] = useState<string>('');

  // Check if user is admin
  const isAdmin = user?.permissions?.includes('super_admin') || false;

  // Use NFT contract hook
  const nftContract = useNFTContractMerkle(campaign?.contractAddress, walletAddress, emailHash);

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
        currentSupply: campaignData.campaign?.currentSupply,
        maxSupply: campaignData.campaign?.maxSupply,
        contractAddress: campaignData.campaign?.contractAddress,
      });
      setCampaign(campaignData.campaign);

      // Fetch mint records
      const mintsRes = await fetch(`/api/nft/campaigns/${campaignId}/mints`);
      if (mintsRes.ok) {
        const mintsData = await mintsRes.json();
        setMintRecords(mintsData.mints || []);
      }

      // Check if current user can mint (if signed in) - including admin
      console.log('[NFT Page] Checking conditions for mint eligibility:', {
        isSignedIn,
        hasEmail: !!user?.preferredEmail,
        email: user?.preferredEmail,
        campaignId,
        isAdmin,
      });

      if (isSignedIn && user?.preferredEmail && campaignId) {
        console.log('[NFT Page] Calling checkMintEligibility...');
        await checkMintEligibility();
      } else {
        console.log('[NFT Page] Skipping mint eligibility check - conditions not met');
      }
    } catch (err: any) {
      console.error('Error fetching campaign data:', err);
      setError(err.message || '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const checkMintEligibility = async () => {
    try {
      console.log('[NFT Page] 🔍 Checking mint eligibility');
      console.log('[NFT Page] 👤 User object:', {
        id: user?.id,
        email: (user as any)?.email,
        preferredEmail: user?.preferredEmail,
      });
      console.log('[NFT Page] 📋 Campaign ID:', campaignId);

      const response = await fetch(
        `/api/nft/check-eligibility?email=${encodeURIComponent(
          user?.preferredEmail || '',
        )}&campaignId=${campaignId}`,
      );

      if (!response.ok) {
        console.log('[NFT Page] ❌ Eligibility check failed:', response.status);
        return;
      }

      const data = await response.json();
      console.log('[NFT Page] ✅ Eligibility result:', data);

      const canMint = data.eligible && !data.alreadyMinted;
      console.log('[NFT Page] 🎯 Setting canMintNFT to:', canMint);
      console.log('[NFT Page] 🎯 Setting alreadyMinted to:', data.alreadyMinted);

      setCanMintNFT(canMint);
      setAlreadyMinted(data.alreadyMinted);

      // If eligible and not minted, get Merkle proof
      if (data.eligible && !data.alreadyMinted) {
        await getMerkleProof();
      }
    } catch (err) {
      console.error('[NFT Page] ❌ Error checking mint eligibility:', err);
    }
  };

  const getMerkleProof = async () => {
    try {
      console.log('[NFT Page] 🔐 Getting Merkle proof for:', user?.preferredEmail);
      const response = await fetch(
        `/api/nft/get-merkle-proof?email=${encodeURIComponent(
          user?.preferredEmail || '',
        )}&campaignId=${campaignId}`,
      );

      if (!response.ok) {
        console.error('[NFT Page] ❌ Failed to get Merkle proof:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('[NFT Page] Error data:', errorData);
        return;
      }

      const data = await response.json();
      console.log('[NFT Page] 📋 Merkle proof response:', {
        eligible: data.eligible,
        hasProof: !!data.proof,
        proofLength: data.proof?.length,
        hasEmailHash: !!data.emailHash,
        emailHash: data.emailHash,
      });

      if (data.eligible && data.proof && data.emailHash) {
        setMerkleProof(data.proof);
        setEmailHash(data.emailHash);
        console.log('[NFT Page] ✅ Merkle proof set successfully');
      } else {
        console.warn('[NFT Page] ⚠️ Merkle proof incomplete:', data);
      }
    } catch (err) {
      console.error('[NFT Page] ❌ Error getting Merkle proof:', err);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, user]); // Re-fetch when user changes (e.g., after login)

  // Listen for network changes in MetaMask
  useEffect(() => {
    if (typeof (window as any).ethereum === 'undefined') return;

    const updateChainId = async () => {
      try {
        const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
        setCurrentChainId(chainId);
        console.log('[NetworkMonitor] 📡 Chain ID updated:', chainId);
      } catch (err) {
        console.error('[NetworkMonitor] ❌ Failed to get chain ID:', err);
      }
    };

    // Get initial chain ID
    updateChainId();

    // Listen for chain changes
    const handleChainChanged = (chainId: string) => {
      console.log('[NetworkMonitor] 🔄 Network changed to:', chainId);
      setCurrentChainId(chainId);
      // Reload page on network change to reset contract state
      window.location.reload();
    };

    (window as any).ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if ((window as any).ethereum?.removeListener) {
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Minting Functions
  const connectWallet = async () => {
    try {
      if (typeof (window as any).ethereum === 'undefined') {
        alert('請安裝 MetaMask 錢包');
        return;
      }

      if (!campaign) {
        alert('活動資訊尚未載入，請稍後再試');
        return;
      }

      // Get the required network config for this campaign
      const networkConfig = NETWORK_CONFIG[campaign.network];
      if (!networkConfig) {
        alert(`不支援的網路：${campaign.network}`);
        return;
      }

      console.log('[ConnectWallet] 🌐 Required network:', {
        network: campaign.network,
        chainId: networkConfig.chainId,
        chainName: networkConfig.chainName,
      });

      // Check current network
      const currentChainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      console.log('[ConnectWallet] 📡 Current chain:', currentChainId);

      // If not on correct network, request switch
      if (currentChainId.toLowerCase() !== networkConfig.chainId.toLowerCase()) {
        console.log('[ConnectWallet] ⚠️ Wrong network! Requesting switch...');
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: networkConfig.chainId }],
          });
          console.log('[ConnectWallet] ✅ Network switched successfully');
        } catch (switchError: any) {
          // If network is not added, add it
          if (switchError.code === 4902) {
            console.log('[ConnectWallet] ➕ Network not found, adding...');
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfig],
            });
            console.log('[ConnectWallet] ✅ Network added and switched');
          } else {
            throw switchError;
          }
        }
      } else {
        console.log('[ConnectWallet] ✅ Already on correct network');
      }

      // Now connect wallet
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });

      setWalletAddress(accounts[0]);
      setWalletConnected(true);
      console.log('[ConnectWallet] ✅ Wallet connected:', accounts[0]);
    } catch (err: any) {
      console.error('[ConnectWallet] ❌ Error:', err);
      alert('連接錢包失敗：' + err.message);
    }
  };

  // Helper function to record mint in database
  const recordMint = async (transactionHash: string, tokenId: number) => {
    try {
      const response = await fetch('/api/nft/record-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign?.id,
          userEmail: user?.preferredEmail,
          userId: user?.id,
          walletAddress,
          tokenId: tokenId || 0,
          transactionHash,
        }),
      });

      if (!response.ok) {
        console.error('[RecordMint] ❌ Failed to record mint in database');
      } else {
        console.log('[RecordMint] ✅ Mint recorded in database successfully');
      }
    } catch (err) {
      console.error('[RecordMint] ❌ Error recording mint:', err);
    }
  };

  // Mint function (requires wallet already connected)
  const handleMint = async () => {
    if (!walletConnected) {
      setError('請先連接錢包');
      return;
    }

    // Use the same logic as handleMintWithAutoConnect, but skip wallet connection step
    await handleMintWithAutoConnect();
  };

  // Combined function: Auto-connect wallet and mint in one step
  const handleMintWithAutoConnect = async () => {
    try {
      setMinting(true);
      setError('');

      console.log('[MintWithAutoConnect] 🚀 Starting mint process...');

      // Step 1: Check MetaMask installation
      console.log('[MintWithAutoConnect] 🔍 Step 1: Checking prerequisites...');
      if (typeof (window as any).ethereum === 'undefined') {
        throw new Error('請安裝 MetaMask 錢包');
      }

      if (!campaign) {
        throw new Error('活動資訊尚未載入，請稍後再試');
      }

      if (!campaign.contractAddress) {
        throw new Error('合約地址尚未設定，請聯繫管理員');
      }

      if (!merkleProof || !emailHash) {
        throw new Error('無法獲取鑄造憑證，請重新整理頁面');
      }

      const networkConfig = NETWORK_CONFIG[campaign.network];
      if (!networkConfig) {
        throw new Error(`不支援的網路：${campaign.network}`);
      }

      // Step 2: Connect wallet if not connected with verification loop
      if (!walletConnected) {
        console.log('[MintWithAutoConnect] 🔗 Step 2: Connecting wallet...');

        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });

        console.log('[MintWithAutoConnect] 📝 Setting wallet address:', accounts[0]);
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
        console.log('[MintWithAutoConnect] ✅ Wallet connected:', accounts[0]);

        // Wait and verify wallet connection with retry loop
        let walletVerified = false;
        let retryCount = 0;
        const maxRetries = 5;

        while (!walletVerified && retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          try {
            // Verify wallet is actually connected
            const verifyAccounts = await (window as any).ethereum.request({
              method: 'eth_accounts',
            });

            if (verifyAccounts && verifyAccounts.length > 0 && verifyAccounts[0] === accounts[0]) {
              walletVerified = true;
              console.log('[MintWithAutoConnect] ✅ Wallet connection verified');
            } else {
              retryCount++;
              console.log(
                `[MintWithAutoConnect] ⏳ Waiting for wallet connection... (${retryCount}/${maxRetries})`,
              );
            }
          } catch (verifyError) {
            retryCount++;
            console.log(
              `[MintWithAutoConnect] ⚠️ Wallet verification failed, retrying... (${retryCount}/${maxRetries})`,
            );
          }
        }

        if (!walletVerified) {
          throw new Error('錢包連接驗證超時，請重試');
        }
      } else {
        console.log('[MintWithAutoConnect] ⏭️ Step 2 skipped: Wallet already connected');
      }

      // Step 3: Check and switch network if needed
      console.log('[MintWithAutoConnect] 🔍 Step 3: Checking network...');
      const currentChainId = await (window as any).ethereum.request({ method: 'eth_chainId' });

      console.log('[MintWithAutoConnect] 🔍 Network check:', {
        required: networkConfig.chainId,
        current: currentChainId,
        match: currentChainId.toLowerCase() === networkConfig.chainId.toLowerCase(),
      });

      if (currentChainId.toLowerCase() !== networkConfig.chainId.toLowerCase()) {
        console.log('[MintWithAutoConnect] ⚠️ Wrong network detected, switching...');

        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: networkConfig.chainId }],
          });
          console.log('[MintWithAutoConnect] ✅ Network switch requested');

          // Wait and verify network switch with retry loop
          let networkVerified = false;
          let retryCount = 0;
          const maxRetries = 5;

          while (!networkVerified && retryCount < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 3000));

            try {
              const verifyChainId = await (window as any).ethereum.request({
                method: 'eth_chainId',
              });
              console.log(
                `[MintWithAutoConnect] 🔍 Checking network... (${retryCount + 1}/${maxRetries}):`,
                verifyChainId,
              );

              if (verifyChainId.toLowerCase() === networkConfig.chainId.toLowerCase()) {
                networkVerified = true;
                console.log('[MintWithAutoConnect] ✅ Network verified');
              } else {
                retryCount++;
                console.log(
                  `[MintWithAutoConnect] ⏳ Waiting for network switch... (${retryCount}/${maxRetries})`,
                );
              }
            } catch (verifyError) {
              retryCount++;
              console.log(
                `[MintWithAutoConnect] ⚠️ Network verification failed, retrying... (${retryCount}/${maxRetries})`,
              );
            }
          }

          if (!networkVerified) {
            throw new Error('網路切換驗證超時，請重試');
          }

          // Network switched successfully, reload page to reinitialize contract
          console.log(
            '[MintWithAutoConnect] 🔄 Network switched, reloading page to reinitialize contract...',
          );
          window.location.reload();
          return; // Stop execution, page will reload
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Network not added, add it
            console.log('[MintWithAutoConnect] ➕ Adding network...');

            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfig],
            });
            console.log('[MintWithAutoConnect] ✅ Network add requested');

            // Wait and verify network after adding with retry loop
            let networkVerified = false;
            let retryCount = 0;
            const maxRetries = 5;

            while (!networkVerified && retryCount < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 3000));

              try {
                const verifyChainId = await (window as any).ethereum.request({
                  method: 'eth_chainId',
                });
                console.log(
                  `[MintWithAutoConnect] 🔍 Checking network after add... (${
                    retryCount + 1
                  }/${maxRetries}):`,
                  verifyChainId,
                );

                if (verifyChainId.toLowerCase() === networkConfig.chainId.toLowerCase()) {
                  networkVerified = true;
                  console.log('[MintWithAutoConnect] ✅ Network verified after add');
                } else {
                  retryCount++;
                  console.log(
                    `[MintWithAutoConnect] ⏳ Waiting for network add... (${retryCount}/${maxRetries})`,
                  );
                }
              } catch (verifyError) {
                retryCount++;
                console.log(
                  `[MintWithAutoConnect] ⚠️ Network verification failed after add, retrying... (${retryCount}/${maxRetries})`,
                );
              }
            }

            if (!networkVerified) {
              throw new Error('網路添加後驗證超時，請重試');
            }

            // Network added successfully, reload page to reinitialize contract
            console.log(
              '[MintWithAutoConnect] 🔄 Network added, reloading page to reinitialize contract...',
            );
            window.location.reload();
            return; // Stop execution, page will reload
          } else if (switchError.code === 4001) {
            throw new Error('您拒絕了網路切換請求。請手動切換到 ' + networkConfig.chainName);
          } else {
            throw new Error(`無法切換網路：${switchError.message}`);
          }
        }
      }

      // Extra wait after network verification for provider to stabilize
      console.log('[MintWithAutoConnect] ⏳ Waiting for provider to stabilize...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('[MintWithAutoConnect] ✅ Provider stabilized');

      // Create a fresh contract instance with signer for minting
      console.log('[MintWithAutoConnect] 🔨 Creating contract instance with signer...');
      const ethers = await import('ethers');
      const CONTRACT_ABI = await import(
        '../../contracts/artifacts/contracts/RWAHackathonNFT.sol/RWAHackathonNFT.json'
      );

      const provider = new ethers.ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log('[MintWithAutoConnect] 📝 Signer address:', signerAddress);

      const contractWithSigner = new ethers.ethers.Contract(
        campaign.contractAddress,
        CONTRACT_ABI.default.abi,
        signer,
      );

      console.log('[MintWithAutoConnect] ✅ Contract instance created with signer');

      // Verify we're on the correct network one more time before minting
      const finalChainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      console.log('[MintWithAutoConnect] 🔍 Final network check before mint:', {
        expected: networkConfig.chainId,
        actual: finalChainId,
        match: finalChainId.toLowerCase() === networkConfig.chainId.toLowerCase(),
      });

      if (finalChainId.toLowerCase() !== networkConfig.chainId.toLowerCase()) {
        throw new Error(`網路驗證失敗：預期 ${networkConfig.chainName}，當前為 ${finalChainId}`);
      }

      // Step 4: Mint NFT directly with our contract instance
      console.log('[MintWithAutoConnect] 🎯 Step 4: Starting mint with:', {
        emailHash,
        proofLength: merkleProof.length,
        proof: merkleProof,
        userEmail: user?.preferredEmail,
        campaignId: campaign.id,
        contractAddress: campaign.contractAddress,
        network: campaign.network,
        chainId: finalChainId,
      });

      // Call smart contract mint function directly
      console.log('[MintWithAutoConnect] 📡 Calling contract.mint()...');
      const tx = await contractWithSigner.mint(emailHash, merkleProof);
      console.log('[MintWithAutoConnect] ✅ Transaction sent:', tx.hash);
      console.log('[MintWithAutoConnect] ⏳ Waiting for confirmation...');

      const receipt = await tx.wait();
      console.log('[MintWithAutoConnect] ✅ Transaction confirmed!', receipt);

      // Extract tokenId from Transfer event
      let tokenId: number | undefined;
      if (receipt.events) {
        const transferEvent = receipt.events.find((e: any) => e.event === 'Transfer');
        if (transferEvent && transferEvent.args) {
          tokenId = transferEvent.args.tokenId?.toNumber();
        }
      }

      const result = {
        success: true,
        txHash: tx.hash,
        transactionHash: tx.hash,
        tokenId,
      };

      if (!result.success) {
        throw new Error(result.error || '鑄造失敗');
      }

      console.log('[MintWithAutoConnect] ✅ Mint successful!', result);

      // Step 5: Record mint in database
      await recordMint(result.transactionHash || result.txHash, result.tokenId || 0);

      // Success! Update status
      setAlreadyMinted(true);
      setCanMintNFT(false);
      setError('');

      alert(
        `🎉 NFT 鑄造成功！\n\nToken ID: ${result.tokenId || 'N/A'}\n交易哈希：${
          result.transactionHash || result.txHash
        }\n\n頁面將自動刷新...`,
      );

      // Refresh campaign data
      setTimeout(() => {
        fetchCampaignData();
      }, 2000);
    } catch (err: any) {
      console.error('[MintWithAutoConnect] ❌ Error:', err);
      // Extract user-friendly error message
      let errorMessage = err.message || '鑄造失敗，請稍後再試';

      // Handle common error cases
      if (errorMessage.includes('execution reverted')) {
        if (errorMessage.includes('Invalid Merkle proof')) {
          errorMessage = '❌ 驗證失敗：您不在白名單中或 Merkle 證明無效';
        } else if (errorMessage.includes('Already minted')) {
          errorMessage = '❌ 您已經鑄造過此 NFT';
        } else if (errorMessage.includes('Minting not enabled')) {
          errorMessage = '❌ 鑄造尚未開放';
        } else if (errorMessage.includes('Max supply reached')) {
          errorMessage = '❌ NFT 已售罄';
        } else {
          errorMessage = '❌ 鑄造失敗：合約執行錯誤。請確認您的白名單資格或聯繫管理員';
        }
      } else if (errorMessage.includes('user rejected')) {
        errorMessage = '❌ 您取消了交易';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = '❌ 錢包餘額不足以支付 Gas 費用';
      }

      setError(errorMessage);
    } finally {
      setMinting(false);
    }
  };

  // Admin Functions
  const handleUpdateMaxSupply = async () => {
    if (!campaign) return;

    const newMaxSupply = prompt(
      `請輸入新的總供應量（當前：${campaign.maxSupply}，已鑄造：${campaign.currentSupply}）：`,
    );
    if (!newMaxSupply) return;

    const maxSupply = parseInt(newMaxSupply);
    if (isNaN(maxSupply) || maxSupply <= 0) {
      alert('請輸入有效的數字');
      return;
    }

    if (maxSupply < campaign.currentSupply) {
      alert(`新的總供應量不能小於已鑄造數量（${campaign.currentSupply}）`);
      return;
    }

    try {
      const response = await fetch('/api/admin/nft/campaigns/update-max-supply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          maxSupply,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新失敗');
      }

      alert(`✅ 總供應量已更新：${data.oldMaxSupply} → ${data.newMaxSupply}`);
      fetchCampaignData(); // Reload data
    } catch (err: any) {
      console.error('Error updating max supply:', err);
      alert(`❌ 更新失敗：${err.message}`);
    }
  };

  const handleRemoveFromWhitelist = async (email: string) => {
    if (!campaign) return;

    const confirmRemove = confirm(
      `確定要從白名單中移除以下地址嗎？\n\n${email}\n\n注意：已鑄造的地址無法移除。`,
    );
    if (!confirmRemove) return;

    try {
      const response = await fetch('/api/admin/nft/campaigns/remove-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          emailsToRemove: [email],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '移除失敗');
      }

      alert(`✅ 已從白名單移除：${email}\n\n請注意：您需要到管理後台更新智能合約的 Merkle Root！`);
      fetchCampaignData(); // Reload data
    } catch (err: any) {
      console.error('Error removing from whitelist:', err);
      alert(`❌ 移除失敗：${err.message}`);
    }
  };

  const getNetworkExplorerUrl = (network: string, address: string) => {
    // Handle Arbitrum network
    if (network.toLowerCase() === 'arbitrum') {
      return `https://arbiscan.io/address/${address}`;
    }
    // Handle Ethereum Mainnet
    if (network.toLowerCase() === 'ethereum' || network.toLowerCase() === 'mainnet') {
      return `https://etherscan.io/address/${address}`;
    }
    // Handle Ethereum testnets (sepolia, goerli, etc.)
    return `https://${network}.etherscan.io/address/${address}`;
  };

  const getTxExplorerUrl = (network: string, txHash: string) => {
    // Handle Arbitrum network
    if (network.toLowerCase() === 'arbitrum') {
      return `https://arbiscan.io/tx/${txHash}`;
    }
    // Handle Ethereum Mainnet
    if (network.toLowerCase() === 'ethereum' || network.toLowerCase() === 'mainnet') {
      return `https://etherscan.io/tx/${txHash}`;
    }
    // Handle Ethereum testnets (sepolia, goerli, etc.)
    return `https://${network}.etherscan.io/tx/${txHash}`;
  };

  if (loading && !campaign) {
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

  if (!campaign) {
    return (
      <>
        <Head>
          <title>錯誤 | RWA Hackathon Taiwan</title>
        </Head>
        <AppHeader />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-rose-700 mb-4">找不到此 NFT 活動</p>
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
                        ? 'bg-emerald-700 bg-opacity-10 text-emerald-700'
                        : campaign.status === 'ended'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-amber-100 text-amber-800'
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

                {/* Network Warning Banner */}
                {walletConnected &&
                  currentChainId &&
                  NETWORK_CONFIG[campaign.network] &&
                  currentChainId.toLowerCase() !==
                    NETWORK_CONFIG[campaign.network].chainId.toLowerCase() && (
                    <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r-lg">
                      <div className="flex items-start">
                        <svg
                          className="w-6 h-6 text-rose-600 mr-3 flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div className="flex-1">
                          <h3 className="text-rose-800 font-bold mb-1">⚠️ 網路錯誤</h3>
                          <p className="text-rose-700 text-sm mb-2">
                            您的 MetaMask 連接到錯誤的網路！此 NFT 必須在{' '}
                            <strong>{NETWORK_CONFIG[campaign.network].chainName}</strong> 上鑄造。
                          </p>
                          <button
                            onClick={connectWallet}
                            className="text-sm px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors font-medium"
                          >
                            切換到正確的網路
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">區塊鏈網路</div>
                    <div className="text-lg font-semibold capitalize" style={{ color: '#1a3a6e' }}>
                      {campaign.network === 'ethereum' ? 'Ethereum' : campaign.network}
                      {NETWORK_CONFIG[campaign.network] && campaign.network !== 'ethereum' && (
                        <span className="text-xs text-gray-500 ml-2 font-normal">
                          ({NETWORK_CONFIG[campaign.network].chainName})
                        </span>
                      )}
                    </div>
                    {walletConnected && currentChainId && (
                      <div className="text-xs mt-2">
                        {currentChainId.toLowerCase() ===
                        NETWORK_CONFIG[campaign.network]?.chainId.toLowerCase() ? (
                          <span className="text-emerald-700 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            錢包已連接到正確網路
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                            錯誤的網路
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1 flex items-center justify-between">
                      <span>已鑄造 / 總供應量</span>
                      {isAdmin && (
                        <button
                          onClick={handleUpdateMaxSupply}
                          className="text-xs px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                          title="編輯總供應量"
                        >
                          ✏️ 編輯
                        </button>
                      )}
                    </div>
                    <div className="text-lg font-semibold" style={{ color: '#1a3a6e' }}>
                      {nftContract.totalSupply !== null && nftContract.maxSupply !== null
                        ? `${nftContract.totalSupply} / ${nftContract.maxSupply}`
                        : `${campaign.currentSupply} / ${campaign.maxSupply}`}
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
                      NFT 智能合約地址
                    </div>
                    <a
                      href={getNetworkExplorerUrl(campaign.network, campaign.contractAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs break-all transition-colors inline-flex items-center"
                      style={{ color: '#1a3a6e' }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      {campaign.contractAddress}
                      <svg
                        className="w-3 h-3 ml-1 flex-shrink-0"
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

                {/* Minted Status - Elegant and Simple */}
                {alreadyMinted && mintRecords.length > 0 && (
                  <div
                    className="mb-4 p-3 rounded border"
                    style={{ backgroundColor: '#f0fdf4', borderColor: '#064e3b' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: '#064e3b' }}>
                        ✓ 已鑄造
                      </span>
                      <span className="text-xs text-gray-600">
                        鑄造於：
                        {new Date(mintRecords[0].mintedAt).toLocaleString('zh-TW', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Minting Section - Integrated (for eligible users including admin) */}
                {canMintNFT && campaign.status === 'active' && !alreadyMinted && (
                  <div className="mt-6 pt-6 border-t border-gray-300">
                    <div className="space-y-3">
                      {/* Wallet Connection Status (if already connected) - Compact */}
                      {walletConnected && (
                        <div
                          className="border rounded p-2 text-xs"
                          style={{ backgroundColor: '#f0fdf4', borderColor: '#064e3b' }}
                        >
                          <span className="font-medium" style={{ color: '#064e3b' }}>
                            ✓ 錢包已連接
                          </span>
                          <span className="text-gray-500 ml-2 font-mono">
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                          </span>
                        </div>
                      )}

                      {/* Two Buttons: Connect and Mint */}
                      <div className="flex gap-3 pt-1">
                        {/* Connect Wallet Button - Dark Green */}
                        <button
                          onClick={connectWallet}
                          disabled={walletConnected || minting}
                          className={`flex-1 px-4 py-3 text-[14px] font-semibold uppercase tracking-wide transition-all duration-300 rounded ${
                            walletConnected
                              ? 'cursor-default border-2'
                              : minting
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'border-2'
                          }`}
                          style={
                            walletConnected
                              ? {
                                  borderColor: '#064e3b',
                                  color: '#064e3b',
                                  backgroundColor: 'white',
                                }
                              : minting
                              ? {}
                              : {
                                  borderColor: '#064e3b',
                                  color: '#064e3b',
                                  backgroundColor: 'white',
                                }
                          }
                          onMouseEnter={(e) => {
                            if (!minting) {
                              e.currentTarget.style.backgroundColor = '#064e3b';
                              e.currentTarget.style.color = 'white';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!minting) {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.color = '#064e3b';
                            }
                          }}
                        >
                          {walletConnected ? '✓ 已連接' : '連接錢包'}
                        </button>

                        {/* Mint Button - Dark Red */}
                        <button
                          onClick={handleMint}
                          disabled={
                            minting ||
                            !walletConnected ||
                            !canMintNFT ||
                            !merkleProof ||
                            alreadyMinted
                          }
                          className={`flex-1 px-4 py-3 text-[14px] font-semibold uppercase tracking-wide transition-all duration-300 rounded ${
                            minting ||
                            !walletConnected ||
                            !canMintNFT ||
                            !merkleProof ||
                            alreadyMinted
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'border-2'
                          }`}
                          style={
                            minting ||
                            !walletConnected ||
                            !canMintNFT ||
                            !merkleProof ||
                            alreadyMinted
                              ? {}
                              : {
                                  borderColor: '#7f1d1d',
                                  color: '#7f1d1d',
                                  backgroundColor: 'white',
                                }
                          }
                          onMouseEnter={(e) => {
                            if (
                              !minting &&
                              walletConnected &&
                              canMintNFT &&
                              merkleProof &&
                              !alreadyMinted
                            ) {
                              e.currentTarget.style.backgroundColor = '#7f1d1d';
                              e.currentTarget.style.color = 'white';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (
                              !minting &&
                              walletConnected &&
                              canMintNFT &&
                              merkleProof &&
                              !alreadyMinted
                            ) {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.color = '#7f1d1d';
                            }
                          }}
                        >
                          {minting ? '處理中...' : '鑄造 NFT'}
                        </button>
                      </div>

                      {/* Status/Error Messages - Compact */}
                      {error && (
                        <div
                          className="rounded p-3 text-center border"
                          style={{
                            backgroundColor: error.includes('❌') ? '#fef2f2' : '#eff6ff',
                            borderColor: error.includes('❌') ? '#991b1b' : '#3b82f6',
                          }}
                        >
                          <p
                            className="text-sm font-medium"
                            style={{
                              color: error.includes('❌') ? '#991b1b' : '#1e40af',
                            }}
                          >
                            {error}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
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
                                <span
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: '#064e3b1a', color: '#064e3b' }}
                                >
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
                            <td className="px-4 py-3 whitespace-nowrap">
                              {item.status === 'not_minted' ? (
                                <button
                                  onClick={() => handleRemoveFromWhitelist(item.email)}
                                  className="text-xs px-2 py-1 rounded transition-colors"
                                  style={{ color: '#991b1b' }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fef2f2';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  title="從白名單移除"
                                >
                                  🗑️ 刪除
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
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
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: '#064e3b1a', color: '#064e3b' }}
                      >
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

      {/* Add Whitelist Modal (Admin Only) */}
      {isAdmin && campaign && (
        <AddWhitelistModal
          open={showAddWhitelistModal}
          onClose={() => setShowAddWhitelistModal(false)}
          campaignId={campaign.id}
          campaignName={campaign.name}
          onSuccess={() => {
            fetchCampaignData();
          }}
        />
      )}
    </>
  );
}
