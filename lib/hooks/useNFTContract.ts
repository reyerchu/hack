import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ABI for RWAHackathonNFT contract (only the functions we need)
const CONTRACT_ABI = [
  "function mint() external",
  "function canMint(address account) external view returns (bool)",
  "function hasMinted(address account) external view returns (bool)",
  "function totalSupply() external view returns (uint256)",
  "function MAX_SUPPLY() external view returns (uint256)",
  "function mintingEnabled() external view returns (bool)",
  "event NFTMinted(address indexed to, uint256 indexed tokenId)"
];

interface NFTContractHook {
  contract: ethers.Contract | null;
  canMint: boolean;
  hasMinted: boolean;
  totalSupply: number;
  maxSupply: number;
  mintingEnabled: boolean;
  loading: boolean;
  mint: () => Promise<{ success: boolean; txHash?: string; error?: string }>;
  checkStatus: () => Promise<void>;
}

export function useNFTContract(
  contractAddress: string | undefined,
  walletAddress: string | undefined
): NFTContractHook {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [canMint, setCanMint] = useState(false);
  const [hasMinted, setHasMinted] = useState(false);
  const [totalSupply, setTotalSupply] = useState(0);
  const [maxSupply, setMaxSupply] = useState(0);
  const [mintingEnabled, setMintingEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contractAddress || !walletAddress) {
      setContract(null);
      return;
    }

    const initContract = async () => {
      try {
        if (typeof window.ethereum === 'undefined') {
          console.warn('MetaMask not installed');
          return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
        
        setContract(nftContract);
        await checkContractStatus(nftContract, walletAddress);
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    };

    initContract();
  }, [contractAddress, walletAddress]);

  const checkContractStatus = async (
    contractInstance: ethers.Contract,
    address: string
  ) => {
    try {
      setLoading(true);

      const [canMintResult, hasMintedResult, totalSupplyResult, maxSupplyResult, mintingEnabledResult] =
        await Promise.all([
          contractInstance.canMint(address),
          contractInstance.hasMinted(address),
          contractInstance.totalSupply(),
          contractInstance.MAX_SUPPLY(),
          contractInstance.mintingEnabled(),
        ]);

      setCanMint(canMintResult);
      setHasMinted(hasMintedResult);
      setTotalSupply(Number(totalSupplyResult));
      setMaxSupply(Number(maxSupplyResult));
      setMintingEnabled(mintingEnabledResult);
    } catch (error) {
      console.error('Error checking contract status:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (contract && walletAddress) {
      await checkContractStatus(contract, walletAddress);
    }
  };

  const mint = async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!contract) {
      return { success: false, error: '合約未初始化' };
    }

    if (!walletAddress) {
      return { success: false, error: '請先連接錢包' };
    }

    try {
      setLoading(true);

      // 呼叫合約 mint 函數
      const tx = await contract.mint();
      console.log('Transaction sent:', tx.hash);

      // 等待交易確認
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // 更新狀態
      await checkContractStatus(contract, walletAddress);

      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error: any) {
      console.error('Mint error:', error);

      let errorMessage = '鑄造失敗';
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = '用戶拒絕交易';
      } else if (error.message) {
        // 嘗試從錯誤訊息中提取有用資訊
        if (error.message.includes('Not whitelisted')) {
          errorMessage = '您不在白名單中';
        } else if (error.message.includes('Already minted')) {
          errorMessage = '您已經鑄造過了';
        } else if (error.message.includes('Max supply reached')) {
          errorMessage = '已達到最大供應量';
        } else if (error.message.includes('Minting is not enabled')) {
          errorMessage = '鑄造尚未開啟';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = '餘額不足以支付 Gas 費';
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    contract,
    canMint,
    hasMinted,
    totalSupply,
    maxSupply,
    mintingEnabled,
    loading,
    mint,
    checkStatus,
  };
}

