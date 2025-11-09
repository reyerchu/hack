import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import CONTRACT_ABI from '../../contracts/artifacts/contracts/RWAHackathonNFT.sol/RWAHackathonNFT.json';

interface MintResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

interface NFTContractMerkleHook {
  contract: ethers.Contract | null;
  loading: boolean;
  canMint: boolean;
  hasMinted: boolean;
  totalSupply: number;
  maxSupply: number;
  mintingEnabled: boolean;
  error: string | null;
  mint: (emailHash: string, proof: string[]) => Promise<MintResult>;
  checkStatus: () => Promise<void>;
}

/**
 * Hook for interacting with NFT contract using Merkle Proof
 * @param contractAddress Contract address
 * @param walletAddress User's wallet address
 * @param emailHash Hash of user's email
 */
export const useNFTContractMerkle = (
  contractAddress?: string,
  walletAddress?: string,
  emailHash?: string
): NFTContractMerkleHook => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [canMint, setCanMint] = useState(false);
  const [hasMinted, setHasMinted] = useState(false);
  const [totalSupply, setTotalSupply] = useState(0);
  const [maxSupply, setMaxSupply] = useState(0);
  const [mintingEnabled, setMintingEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkContractStatus = useCallback(
    async (nftContract: ethers.Contract, currentEmailHash?: string) => {
      setLoading(true);
      setError(null);
      try {
        const _mintingEnabled = await nftContract.mintingEnabled();
        setMintingEnabled(_mintingEnabled);

        const _totalSupply = (await nftContract.totalSupply()).toNumber();
        setTotalSupply(_totalSupply);

        const _maxSupply = (await nftContract.maxSupply()).toNumber();
        setMaxSupply(_maxSupply);

        if (currentEmailHash) {
          const _hasMinted = await nftContract.hasEmailMinted(currentEmailHash);
          setHasMinted(_hasMinted);
          setCanMint(_mintingEnabled && !_hasMinted && _totalSupply < _maxSupply);
        } else {
          setHasMinted(false);
          setCanMint(false);
        }
      } catch (err: any) {
        console.error('Error checking contract status:', err);
        setError(err.message || '無法獲取合約狀態');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const initializeContract = async () => {
      if (!contractAddress || !walletAddress) {
        setContract(null);
        setLoading(false);
        return;
      }

      try {
        if (typeof window.ethereum === 'undefined') {
          console.warn('MetaMask not installed');
          return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(contractAddress, CONTRACT_ABI.abi, signer);

        setContract(nftContract);
        await checkContractStatus(nftContract, emailHash);
      } catch (error) {
        console.error('Error initializing contract:', error);
        setError('無法初始化合約，請檢查網路和錢包連接');
        setLoading(false);
      }
    };

    initializeContract();

    // Listen for account/network changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setContract(null);
      } else {
        initializeContract();
      }
    };

    const handleChainChanged = () => {
      initializeContract();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [contractAddress, walletAddress, emailHash, checkContractStatus]);

  const mint = async (emailHashParam: string, proof: string[]): Promise<MintResult> => {
    if (!contract || !canMint) {
      return { success: false, error: '不符合鑄造條件或合約未準備好' };
    }

    setLoading(true);
    setError(null);
    try {
      console.log('[NFTContract] Minting with:', {
        emailHash: emailHashParam,
        proofLength: proof.length,
      });

      const tx = await contract.mint(emailHashParam, proof);
      await tx.wait();
      
      // Refresh status
      await checkContractStatus(contract, emailHashParam);
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      console.error('Minting error:', err);
      setError(err.message || '鑄造失敗');
      return { success: false, error: err.message || '鑄造失敗' };
    } finally {
      setLoading(false);
    }
  };

  return {
    contract,
    loading,
    canMint,
    hasMinted,
    totalSupply,
    maxSupply,
    mintingEnabled,
    error,
    mint,
    checkStatus: async () => {
      if (contract && emailHash) {
        await checkContractStatus(contract, emailHash);
      }
    },
  };
};

