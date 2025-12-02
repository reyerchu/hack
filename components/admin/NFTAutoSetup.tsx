import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface NFTAutoSetupProps {
  campaignId: string;
  campaignName: string;
  network: string;
  onSuccess: () => void;
  campaign?: any; // Optional: pass full campaign data to avoid extra API call
}

interface DeploymentProgress {
  currentStep: 'idle' | 'ipfs' | 'merkle' | 'deploying' | 'complete';
  lastUpdated?: Date;
  ipfs?: {
    imageCID: string;
    metadataCID: string;
    baseURI: string;
    completedAt: Date;
  };
  merkle?: {
    root: string;
    totalEmails: number;
    completedAt: Date;
  };
  deployment?: {
    contractAddress: string;
    transactionHash: string;
    network: string;
    completedAt: Date;
    verified?: boolean;
    verifiedAt?: Date;
    etherscanUrl?: string;
  };
}

export default function NFTAutoSetup({
  campaignId,
  campaignName,
  network,
  onSuccess,
  campaign: campaignProp,
}: NFTAutoSetupProps) {
  const [step, setStep] = useState<string>('idle');
  const [error, setError] = useState('');
  const [deployedAddress, setDeployedAddress] = useState('');
  const [showDeploymentProcess, setShowDeploymentProcess] = useState(false);
  const [setupSummary, setSetupSummary] = useState<any>(null);
  const [ipfsInfo, setIpfsInfo] = useState<{
    imageCID?: string;
    metadataCID?: string;
    baseURI?: string;
  }>({});
  const [merkleInfo, setMerkleInfo] = useState<{
    root?: string;
    totalEmails?: number;
  }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<DeploymentProgress | null>(null);

  // Load existing progress on mount
  useEffect(() => {
    loadExistingProgress();
  }, [campaignId]);

  const loadExistingProgress = async () => {
    try {
      console.log('[AutoSetup] Loading existing progress...');
      const response = await fetch(`/api/admin/nft/campaigns/${campaignId}`);

      if (!response.ok) {
        console.error('[AutoSetup] Failed to load campaign data');
        return;
      }

      const data = await response.json();
      const existingProgress = data.deploymentProgress;

      if (existingProgress) {
        console.log('[AutoSetup] Found existing progress:', existingProgress);
        console.log('[AutoSetup] Current step from DB:', existingProgress.currentStep);
        setProgress(existingProgress);

        // Restore IPFS info if exists
        if (existingProgress.ipfs) {
          console.log('[AutoSetup] Restoring IPFS info');
          setIpfsInfo({
            imageCID: existingProgress.ipfs.imageCID,
            metadataCID: existingProgress.ipfs.metadataCID,
            baseURI: existingProgress.ipfs.baseURI,
          });
        }

        // Restore Merkle info if exists
        if (existingProgress.merkle) {
          console.log('[AutoSetup] Restoring Merkle info');
          setMerkleInfo({
            root: existingProgress.merkle.root,
            totalEmails: existingProgress.merkle.totalEmails,
          });
        }

        // Restore deployment info if exists
        if (existingProgress.deployment) {
          console.log('[AutoSetup] Restoring deployment info');
          setDeployedAddress(existingProgress.deployment.contractAddress);
          if (existingProgress.currentStep === 'complete') {
            console.log('[AutoSetup] Deployment complete, setting step to "complete"');
            setStep('complete');
            setSetupSummary({
              ...existingProgress.ipfs,
              ...existingProgress.merkle,
              ...existingProgress.deployment,
            });
          } else {
            // If deployment is not complete, set step to 'idle' so button is clickable
            console.log('[AutoSetup] Deployment not complete, setting step to "idle"');
            setStep('idle');
          }
        } else if (existingProgress.ipfs || existingProgress.merkle) {
          // If we have partial progress but no deployment, set to idle for resume
          console.log('[AutoSetup] Partial progress found, setting step to "idle"');
          setStep('idle');
        }
      } else {
        console.log('[AutoSetup] No existing progress found, step remains "idle"');
      }
    } catch (err) {
      console.error('[AutoSetup] Error loading progress:', err);
    }
  };

  const saveProgress = async (updatedProgress: Partial<DeploymentProgress>) => {
    try {
      console.log('[AutoSetup] Saving progress:', updatedProgress);
      console.log('[AutoSetup] Campaign ID:', campaignId);

      const response = await fetch('/api/admin/nft/campaigns/update-deployment-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          progress: updatedProgress,
        }),
      });

      console.log('[AutoSetup] Save progress response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AutoSetup] Failed to save progress:', errorData);
      } else {
        const data = await response.json();
        console.log('[AutoSetup] Progress saved successfully:', data);
        setProgress((prev) => ({ ...prev, ...updatedProgress } as DeploymentProgress));
      }
    } catch (err) {
      console.error('[AutoSetup] Error saving progress:', err);
    }
  };

  const handleAutoSetup = async () => {
    if (isProcessing) {
      console.log('[AutoSetup] Already processing, ignoring duplicate request');
      return;
    }

    setIsProcessing(true);

    try {
      setError('');

      // Get campaign details first
      let campaign = campaignProp;

      if (!campaign) {
        console.log('[AutoSetup] Fetching campaign details from API...');
        const campaignDoc = await fetch(`/api/admin/nft/campaigns/${campaignId}`);

        if (!campaignDoc.ok) {
          throw new Error('無法獲取活動資料，請重新整理頁面');
        }

        const campaignData = await campaignDoc.json();
        campaign = campaignData;

        // Load existing progress from campaign data
        if (campaignData.deploymentProgress) {
          setProgress(campaignData.deploymentProgress);
        }
      }

      if (!campaign) {
        throw new Error('找不到活動資料');
      }

      console.log('[AutoSetup] Starting deployment process...');
      console.log('[AutoSetup] Current progress:', progress);

      let baseURI = '';
      let merkleRoot = '';
      let merkleData: any = null;

      // ============================================
      // STEP 1: Upload to IPFS (if not done)
      // ============================================
      if (progress?.ipfs?.baseURI) {
        console.log('[AutoSetup] ✅ IPFS upload already completed, skipping...');
        baseURI = progress.ipfs.baseURI;
        setIpfsInfo({
          imageCID: progress.ipfs.imageCID,
          metadataCID: progress.ipfs.metadataCID,
          baseURI: progress.ipfs.baseURI,
        });
        console.log('[AutoSetup] Using existing Base URI:', baseURI);
      } else {
        setStep('uploading-ipfs');
        console.log('[AutoSetup] 📤 Step 1: Uploading to IPFS...');

        // Check if we have image file or URL
        let imageToUpload = campaign.imageFile;

        if (!imageToUpload && campaign.imageUrl) {
          console.log('[AutoSetup] Fetching image from URL:', campaign.imageUrl);
          try {
            const imageResponse = await fetch(campaign.imageUrl);
            const imageBlob = await imageResponse.blob();
            const urlParts = campaign.imageUrl.split('/');
            const filename = urlParts[urlParts.length - 1] || 'nft-image.png';
            imageToUpload = new File([imageBlob], filename, { type: imageBlob.type });
            console.log('[AutoSetup] Image fetched successfully:', filename);
          } catch (err) {
            console.error('[AutoSetup] Failed to fetch image:', err);
            throw new Error('無法載入已上傳的圖片，請重新上傳');
          }
        }

        if (!imageToUpload) {
          throw new Error('請先上傳 NFT 圖片文件！');
        }

        const formData = new FormData();
        formData.append('image', imageToUpload);
        formData.append('name', campaign.name);
        formData.append('description', campaign.description || `${campaign.name} NFT Collection`);
        formData.append('maxSupply', campaign.maxSupply.toString());
        formData.append('campaignId', campaign.id);

        const ipfsResponse = await fetch('/api/admin/nft/upload-to-ipfs', {
          method: 'POST',
          body: formData,
        });

        if (!ipfsResponse.ok) {
          const errorData = await ipfsResponse.json();
          throw new Error(errorData.error || 'IPFS 上傳失敗');
        }

        const ipfsData = await ipfsResponse.json();

        if (!ipfsData.success) {
          throw new Error(ipfsData.error || 'IPFS 上傳失敗');
        }

        console.log('[AutoSetup] ✅ IPFS upload successful:', ipfsData);

        baseURI = ipfsData.baseURI!;
        setIpfsInfo({
          imageCID: ipfsData.imageCID,
          metadataCID: ipfsData.metadataCID,
          baseURI: ipfsData.baseURI,
        });

        // Save IPFS progress to database
        console.log('[AutoSetup] 📤 About to save IPFS progress...');
        await saveProgress({
          currentStep: 'ipfs',
          ipfs: {
            imageCID: ipfsData.imageCID,
            metadataCID: ipfsData.metadataCID,
            baseURI: ipfsData.baseURI,
            completedAt: new Date(),
          },
        });

        console.log('[AutoSetup] 💾 IPFS progress saved to database');
        console.log('[AutoSetup] 🔄 Continuing to Step 2: Merkle Tree generation...');
      }

      // ============================================
      // STEP 2: Generate Merkle Tree (if not done)
      // ============================================
      if (progress?.merkle?.root) {
        console.log('[AutoSetup] ✅ Merkle Tree already generated, skipping...');
        merkleRoot = progress.merkle.root;
        setMerkleInfo({
          root: progress.merkle.root,
          totalEmails: progress.merkle.totalEmails,
        });
        merkleData = {
          root: progress.merkle.root,
          totalEmails: progress.merkle.totalEmails,
        };
        console.log('[AutoSetup] Using existing Merkle Root:', merkleRoot);
      } else {
        setStep('generating-merkle');
        console.log('[AutoSetup] 🌳 Step 2: Generating Merkle Tree...');

        const merkleResponse = await fetch('/api/admin/nft/campaigns/generate-merkle-tree', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId }),
        });

        if (!merkleResponse.ok) {
          const errorData = await merkleResponse.json();
          throw new Error(errorData.error || '生成 Merkle Tree 失敗');
        }

        merkleData = await merkleResponse.json();
        merkleRoot = merkleData.root;

        console.log('[AutoSetup] ✅ Merkle Root generated:', merkleRoot);
        console.log('[AutoSetup] Total emails:', merkleData.totalEmails);

        setMerkleInfo({
          root: merkleData.root,
          totalEmails: merkleData.totalEmails,
        });

        // Save Merkle progress to database
        await saveProgress({
          currentStep: 'merkle',
          merkle: {
            root: merkleData.root,
            totalEmails: merkleData.totalEmails,
            completedAt: new Date(),
          },
        });

        console.log('[AutoSetup] 💾 Merkle Tree progress saved to database');
      }

      // ============================================
      // STEP 3: Deploy Contract (if not done)
      // ============================================
      if (progress?.deployment?.contractAddress) {
        console.log('[AutoSetup] ✅ Contract already deployed, skipping...');
        setDeployedAddress(progress.deployment.contractAddress);
        console.log('[AutoSetup] Using existing contract:', progress.deployment.contractAddress);

        // Check if already complete
        if (progress.currentStep === 'complete') {
          setStep('complete');
          setSetupSummary({
            ...ipfsInfo,
            ...merkleInfo,
            contractAddress: progress.deployment.contractAddress,
            network: progress.deployment.network,
          });
          console.log('[AutoSetup] Deployment already complete!');
          return;
        }
      } else {
        setStep('connecting');
        console.log('[AutoSetup] 🔗 Step 3: Connecting to MetaMask...');

        // Check if MetaMask is installed
        if (typeof (window as any).ethereum === 'undefined') {
          throw new Error('請安裝 MetaMask 錢包');
        }

        // Request account access
        console.log('[AutoSetup] Requesting MetaMask accounts...');
        try {
          const accounts = await (window as any).ethereum.request({
            method: 'eth_requestAccounts',
          });
          console.log('[AutoSetup] MetaMask accounts received:', accounts);
        } catch (err: any) {
          console.error('[AutoSetup] MetaMask request failed:', err);
          throw new Error(`MetaMask 連接失敗: ${err.message || '用戶拒絕或請求被阻止'}`);
        }

        // Get provider and signer
        console.log('[AutoSetup] Creating Web3Provider...');
        const provider = new ethers.providers.Web3Provider((window as any).ethereum, 'any');
        await provider.send('eth_chainId', []);

        const signer = provider.getSigner();
        const address = await signer.getAddress();

        console.log('[AutoSetup] ✅ Connected wallet:', address);

        // Check network
        const currentNetwork = await provider.getNetwork();
        console.log('[AutoSetup] Current network:', currentNetwork.name, currentNetwork.chainId);

        // Verify correct network
        const expectedChainIds: Record<string, number> = {
          sepolia: 11155111,
          ethereum: 1,
          arbitrum: 42161,
        };

        const expectedChainId = expectedChainIds[network];
        if (currentNetwork.chainId !== expectedChainId) {
          try {
            const chainIdHex = '0x' + expectedChainId.toString(16);
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: chainIdHex }],
            });

            await new Promise((resolve) => setTimeout(resolve, 1000));

            const newProvider = new ethers.providers.Web3Provider((window as any).ethereum);
            const newNetwork = await newProvider.getNetwork();

            if (newNetwork.chainId !== expectedChainId) {
              throw new Error('網路切換失敗');
            }

            console.log('[AutoSetup] Successfully switched to', network);
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              throw new Error(`請在 MetaMask 中手動添加 ${network.toUpperCase()} 網路`);
            }
            throw new Error(
              `請切換到 ${network.toUpperCase()} 網路。當前鏈 ID: ${
                currentNetwork.chainId
              }, 需要: ${expectedChainId}`,
            );
          }
        }

        // Deploy contract
        setStep('deploying');
        console.log('[AutoSetup] 🚀 Step 4: Deploying contract...');

        // Import contract ABI and bytecode
        const CONTRACT_ARTIFACT = await import('../../lib/contracts/RWAHackathonNFT.json');

        const deployProvider = new ethers.providers.Web3Provider((window as any).ethereum);
        const deploySigner = deployProvider.getSigner();

        const signerAddress = await deploySigner.getAddress();
        console.log('[AutoSetup] Deploying with address:', signerAddress);

        const factory = new ethers.ContractFactory(
          CONTRACT_ARTIFACT.abi,
          CONTRACT_ARTIFACT.bytecode,
          deploySigner,
        );

        console.log('[AutoSetup] Contract parameters:', {
          name: campaign.name,
          symbol: campaign.symbol || 'RWAHACK',
          maxSupply: campaign.maxSupply,
          baseURI: baseURI,
          merkleRoot: merkleRoot,
        });

        console.log('[AutoSetup] 📝 Waiting for MetaMask confirmation...');

        // Deploy contract
        const deployedContract = await factory.deploy(
          campaign.name,
          campaign.symbol || 'RWAHACK',
          campaign.maxSupply,
          baseURI,
          merkleRoot,
        );

        console.log(
          '[AutoSetup] Contract deployment transaction sent:',
          deployedContract.deployTransaction.hash,
        );
        console.log('[AutoSetup] ⏳ Waiting for transaction to be mined...');

        // Wait for deployment to be mined
        await deployedContract.deployed();

        const contractAddress = deployedContract.address;

        console.log('[AutoSetup] ✅ Contract deployed to:', contractAddress);
        setDeployedAddress(contractAddress);

        // Wait for additional confirmations before verification (important for Etherscan)
        console.log('[AutoSetup] ⏳ Waiting for 5 block confirmations before verification...');
        const confirmations = 5;
        await deployedContract.deployTransaction.wait(confirmations);
        console.log(`[AutoSetup] ✅ Confirmed after ${confirmations} blocks`);

        // Save deployment progress to database
        await saveProgress({
          currentStep: 'deploying',
          deployment: {
            contractAddress,
            transactionHash: deployedContract.deployTransaction.hash,
            network,
            completedAt: new Date(),
          },
        });

        console.log('[AutoSetup] 💾 Deployment progress saved to database');

        // Update campaign status in database
        await fetch('/api/admin/nft/campaigns/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId,
            contractAddress,
            network,
            status: 'active',
            merkleRoot: merkleRoot,
            whitelistSummary: {
              totalEmails: merkleData.totalEmails,
              method: 'merkle-tree',
            },
          }),
        });

        console.log('[AutoSetup] ✅ Campaign status updated to active');

        // ============================================
        // STEP 3.5: Auto-Verify Contract on Etherscan
        // ============================================
        console.log('[AutoSetup] 🔍 Starting automatic contract verification...');
        setStep('Verifying contract on Etherscan...');

        try {
          // Use Hardhat verification (more reliable than direct API)
          const verifyResponse = await fetch('/api/admin/nft/verify-contract-hardhat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractAddress,
              network,
              constructorArgs: {
                name: campaign.name,
                symbol: campaign.symbol || 'RWAHACK',
                maxSupply: campaign.maxSupply,
                baseURI: baseURI,
                merkleRoot: merkleRoot,
              },
            }),
          });

          const verifyResult = await verifyResponse.json();

          if (verifyResult.success) {
            console.log('[AutoSetup] ✅ Contract verified on Etherscan!');
            console.log('[AutoSetup] Verification URL:', verifyResult.etherscanUrl);

            // Save verification status
            await saveProgress({
              currentStep: 'deploying',
              deployment: {
                contractAddress,
                transactionHash: deployedContract.deployTransaction.hash,
                network,
                completedAt: new Date(),
                verified: true,
                verifiedAt: new Date(),
                etherscanUrl: verifyResult.etherscanUrl,
              },
            });
          } else {
            console.warn('[AutoSetup] ⚠️ Automatic verification failed:', verifyResult.error);
            console.log('[AutoSetup] Contract can be manually verified later');
            // Don't fail the whole process, just log the warning
          }
        } catch (verifyError: any) {
          console.warn('[AutoSetup] ⚠️ Verification error:', verifyError.message);
          console.log('[AutoSetup] Contract can be manually verified later');
          // Don't fail the whole process
        }
      }

      // ============================================
      // STEP 4: Mark as Complete
      // ============================================
      setStep('finalizing');
      console.log('[AutoSetup] 🎉 Finalizing setup...');

      await saveProgress({
        currentStep: 'complete',
      });

      setSetupSummary({
        ...ipfsInfo,
        ...merkleInfo,
        contractAddress: deployedAddress || progress?.deployment?.contractAddress,
        network,
      });
      setStep('complete');

      console.log('[AutoSetup] ✅ All done! Deployment complete!');

      onSuccess();
    } catch (error: any) {
      console.error('[AutoSetup] ❌ Error:', error);
      setError(error.message || '設置失敗');
      setStep('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepText = () => {
    switch (step) {
      case 'uploading-ipfs':
        return '📤 正在上傳到 IPFS...';
      case 'generating-merkle':
        return '🌳 正在生成白名單...';
      case 'connecting':
        return '🔗 正在連接錢包...';
      case 'deploying':
        return '🚀 正在部署合約...';
      case 'finalizing':
        return '🎉 正在完成設置...';
      case 'complete':
        return '✅ 設置完成！';
      default:
        return '🚀 一鍵部署';
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;

    let completed = 0;
    const total = 3; // IPFS, Merkle, Deployment

    if (progress.ipfs) completed++;
    if (progress.merkle) completed++;
    if (progress.deployment) completed++;

    return Math.round((completed / total) * 100);
  };

  const canResume =
    progress && progress.currentStep !== 'idle' && progress.currentStep !== 'complete';

  // Debug: Log button state
  console.log('[AutoSetup] Button state:', {
    step,
    canResume,
    progressCurrentStep: progress?.currentStep,
    isButtonDisabled: step !== 'idle' && step !== 'complete',
  });

  if (step === 'complete' && setupSummary) {
    return (
      <div className="bg-green-900 bg-opacity-10 border border-green-900 border-opacity-20 rounded-lg p-4">
        <h3 className="text-lg font-bold text-green-900 mb-2">✅ 設置完成！</h3>
        <div className="text-sm text-green-900 space-y-1">
          <p>
            <strong>合約地址:</strong> {setupSummary.contractAddress || deployedAddress}
          </p>
          <p>
            <strong>網路:</strong> {network}
          </p>
          <p>
            <strong>白名單郵箱:</strong> {setupSummary.totalEmails}
          </p>
          {setupSummary.imageCID && (
            <p>
              <strong>📦 IPFS 圖片 CID:</strong> {setupSummary.imageCID}
            </p>
          )}
          {setupSummary.baseURI && (
            <p className="break-all">
              <strong>🔗 Base URI:</strong> {setupSummary.baseURI}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setStep('idle');
            setSetupSummary(null);
          }}
          className="mt-3 text-sm hover:opacity-80 underline"
          style={{ color: '#1a3a6e' }}
        >
          關閉
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-md">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {/* Progress Bar */}
      {(progress || isProcessing) && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>部署進度</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: '#1a3a6e',
                width: `${getProgressPercentage()}%`,
              }}
            ></div>
          </div>
          {progress && (
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span>{progress.ipfs ? '✅' : '⏳'}</span>
                <span className={progress.ipfs ? 'text-green-700' : 'text-gray-500'}>
                  IPFS 上傳 {progress.ipfs && `(${progress.ipfs.imageCID?.substring(0, 8)}...)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>{progress.merkle ? '✅' : '⏳'}</span>
                <span className={progress.merkle ? 'text-green-700' : 'text-gray-500'}>
                  Merkle Tree {progress.merkle && `(${progress.merkle.totalEmails} emails)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>{progress.deployment ? '✅' : '⏳'}</span>
                <span className={progress.deployment ? 'text-green-700' : 'text-gray-500'}>
                  合約部署{' '}
                  {progress.deployment &&
                    `(${progress.deployment.contractAddress?.substring(0, 10)}...)`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {canResume && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">💡 檢測到未完成的部署，點擊按鈕將從中斷處繼續</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleAutoSetup}
          disabled={step !== 'idle' && step !== 'complete'}
          className={`flex-1 px-8 py-3 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300 ${
            step === 'idle' || step === 'complete'
              ? 'border-2'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed border-0'
          }`}
          style={
            step === 'idle' || step === 'complete'
              ? {
                  borderColor: '#1a3a6e',
                  color: '#1a3a6e',
                }
              : {}
          }
          onMouseEnter={(e) => {
            if (step === 'idle' || step === 'complete') {
              e.currentTarget.style.backgroundColor = '#1a3a6e';
              e.currentTarget.style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            if (step === 'idle' || step === 'complete') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#1a3a6e';
            }
          }}
        >
          {canResume ? '▶️ 繼續部署' : getStepText()}
        </button>

        <button
          onClick={() => setShowDeploymentProcess(!showDeploymentProcess)}
          className="px-3 py-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors flex items-center gap-1"
          title="查看流程"
        >
          <span className="text-sm text-gray-700">流程</span>
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
              showDeploymentProcess ? 'transform rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {showDeploymentProcess && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">部署流程（支持斷點續傳）</h4>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-3 text-gray-700 p-2 rounded hover:bg-gray-100 transition-colors">
              <span className="text-base flex-shrink-0">📤</span>
              <div>
                <div className="font-medium">步驟 1: 上傳到 IPFS</div>
                <div className="text-xs text-gray-500">上傳圖片和 metadata，失敗後可跳過</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-gray-700 p-2 rounded hover:bg-gray-100 transition-colors">
              <span className="text-base flex-shrink-0">🌳</span>
              <div>
                <div className="font-medium">步驟 2: 生成 Merkle Tree</div>
                <div className="text-xs text-gray-500">生成白名單證明，失敗後可跳過</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-gray-700 p-2 rounded hover:bg-gray-100 transition-colors">
              <span className="text-base flex-shrink-0">🚀</span>
              <div>
                <div className="font-medium">步驟 3: 部署合約</div>
                <div className="text-xs text-gray-500">部署到區塊鏈，僅需 1 次 MetaMask 確認</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
              💡 每個步驟完成後都會自動保存進度，如果部署失敗，下次執行時會自動從斷點繼續。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
