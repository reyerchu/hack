import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import CONTRACT_ABI from '../../contracts/artifacts/contracts/RWAHackathonNFT.sol/RWAHackathonNFT.json';

interface MintResult {
  success: boolean;
  txHash?: string;
  tokenId?: number;
  error?: string;
}

interface NFTContractMerkleHook {
  contract: ethers.Contract | null;
  loading: boolean;
  canMint: boolean;
  hasMinted: boolean;
  totalSupply: number | null;
  maxSupply: number | null;
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
  emailHash?: string,
): NFTContractMerkleHook => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [canMint, setCanMint] = useState(false);
  const [hasMinted, setHasMinted] = useState(false);
  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  const [maxSupply, setMaxSupply] = useState<number | null>(null);
  const [mintingEnabled, setMintingEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkContractStatus = useCallback(
    async (nftContract: ethers.Contract, currentEmailHash?: string) => {
      setLoading(true);
      setError(null);
      try {
        const [_mintingEnabled, _totalSupply, _maxSupply] = await Promise.all([
          nftContract.mintingEnabled(),
          nftContract.totalSupply().then((s: any) => s.toNumber()),
          nftContract.maxSupply().then((s: any) => s.toNumber()),
        ]);

        setMintingEnabled(_mintingEnabled);
        setTotalSupply(_totalSupply);
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
        console.error('[NFTContract] Error checking status:', err);
        setError(err.message || '無法獲取合約狀態');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const initializeContract = async () => {
      if (!contractAddress) {
        setContract(null);
        setLoading(false);
        return;
      }

      try {
        let nftContract: ethers.Contract;

        // If wallet is connected, use signer (for write operations)
        if (walletAddress && typeof (window as any).ethereum !== 'undefined') {
          const provider = new ethers.providers.Web3Provider((window as any).ethereum);
          const signer = provider.getSigner();
          nftContract = new ethers.Contract(contractAddress, CONTRACT_ABI.abi, signer);
        } else {
          // Otherwise, use the connected MetaMask provider in read-only mode
          // This allows us to read from whatever network MetaMask is connected to
          if (typeof (window as any).ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider((window as any).ethereum);
            nftContract = new ethers.Contract(contractAddress, CONTRACT_ABI.abi, provider);
          } else {
            // Fallback: If no MetaMask, we can't determine the network
            // This will result in contract being null
            throw new Error('Please install MetaMask to view contract information');
          }
        }

        setContract(nftContract);
        await checkContractStatus(nftContract, emailHash);
      } catch (error) {
        console.error('[NFTContract] ❌ Error initializing contract:', error);
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

    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if ((window as any).ethereum) {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [contractAddress, walletAddress, checkContractStatus]);

  // Separate effect to update contract status when emailHash changes
  useEffect(() => {
    if (contract && emailHash) {
      checkContractStatus(contract, emailHash);
    }
  }, [emailHash, contract, checkContractStatus]);

  const mint = async (emailHashParam: string, proof: string[]): Promise<MintResult> => {
    if (!contract) {
      return { success: false, error: '合約未準備好，請稍後再試' };
    }

    // Note: We removed the !canMint check here because canMint state might not be updated yet
    // The actual eligibility check happens on-chain via Merkle proof verification

    setLoading(true);
    setError(null);
    try {
      console.log('[NFTContract] 🎯 Preparing to mint with:', {
        emailHash: emailHashParam,
        emailHashType: typeof emailHashParam,
        emailHashLength: emailHashParam?.length,
        proofLength: proof.length,
        proof: proof,
        proofTypes: proof.map((p) => typeof p),
        contractAddress: contract.address,
      });

      // Verify parameters format
      if (!emailHashParam || !emailHashParam.startsWith('0x') || emailHashParam.length !== 66) {
        throw new Error(`Invalid emailHash format: ${emailHashParam}`);
      }

      for (let i = 0; i < proof.length; i++) {
        if (!proof[i] || !proof[i].startsWith('0x') || proof[i].length !== 66) {
          throw new Error(`Invalid proof[${i}] format: ${proof[i]}`);
        }
      }

      console.log('[NFTContract] ✅ Parameters validated, calling contract.mint()...');

      // Log current network and signer for debugging
      const provider = contract.provider as any;
      const network = await provider.getNetwork();
      console.log('[NFTContract] 🌐 Current network:', {
        name: network.name,
        chainId: network.chainId,
      });

      // Check if contract has a signer
      const signer = contract.signer;
      if (signer) {
        const signerAddress = await signer.getAddress();
        console.log('[NFTContract] 📝 Signer address:', signerAddress);
      } else {
        console.error('[NFTContract] ❌ NO SIGNER! Contract is read-only!');
        throw new Error('合約沒有簽署者，無法執行寫入操作');
      }

      // Note: Network validation is done in the component before calling mint()
      // This hook should be network-agnostic

      // Estimate gas first to catch errors early
      console.log('[NFTContract] 📊 Estimating gas...');
      let gasLimit;
      try {
        const estimatedGas = await contract.estimateGas.mint(emailHashParam, proof);
        // Add 20% buffer
        gasLimit = estimatedGas.mul(120).div(100);
        console.log(
          '[NFTContract] ✅ Gas estimated:',
          estimatedGas.toString(),
          'with buffer:',
          gasLimit.toString(),
        );
      } catch (gasError: any) {
        console.error('[NFTContract] ❌ Gas estimation failed:', gasError);
        console.error('[NFTContract] Error details:', {
          message: gasError.message,
          reason: gasError.reason,
          code: gasError.code,
        });
        throw new Error(`Gas estimation failed: ${gasError.reason || gasError.message}`);
      }

      const tx = await contract.mint(emailHashParam, proof, { gasLimit });

      console.log('[NFTContract] 📡 Transaction sent:', tx.hash);
      console.log('[NFTContract] ⏳ Waiting for confirmation...');

      const receipt = await tx.wait();

      console.log('[NFTContract] ✅ Transaction confirmed!');

      // Extract tokenId from Transfer event
      let tokenId: number | undefined;
      if (receipt.events) {
        const transferEvent = receipt.events.find((e: any) => e.event === 'Transfer');
        if (transferEvent && transferEvent.args) {
          tokenId = transferEvent.args.tokenId?.toNumber();
        }
      }

      // Refresh status
      await checkContractStatus(contract, emailHashParam);

      return { success: true, txHash: tx.hash, tokenId };
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
