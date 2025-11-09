import { useState } from 'react';
import { ethers } from 'ethers';

interface NFTAutoSetupProps {
  campaignId: string;
  campaignName: string;
  network: string;
  onSuccess: () => void;
  campaign?: any; // Optional: pass full campaign data to avoid extra API call
}

export default function NFTAutoSetup({ campaignId, campaignName, network, onSuccess, campaign: campaignProp }: NFTAutoSetupProps) {
  const [step, setStep] = useState<'idle' | 'connecting' | 'uploading-ipfs' | 'deploying' | 'setting-up' | 'complete'>('idle');
  const [error, setError] = useState('');
  const [deployedAddress, setDeployedAddress] = useState('');
  const [setupSummary, setSetupSummary] = useState<any>(null);
  const [ipfsInfo, setIpfsInfo] = useState<{ imageCID?: string; metadataCID?: string; baseURI?: string }>({});

  const handleAutoSetup = async () => {
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
        
        campaign = await campaignDoc.json();
      }
      
      if (!campaign) {
        throw new Error('找不到活動資料');
      }

      // Step 0: Upload to IPFS if image file exists
      let baseURI = campaign.imageUrl || '';
      
      if (campaign.imageFile) {
        setStep('uploading-ipfs');
        console.log('[AutoSetup] Uploading image to IPFS...');
        
        alert(
          `☁️ 準備上傳到 IPFS！\n\n` +
          `這將：\n` +
          `1. 上傳 NFT 圖片到 IPFS\n` +
          `2. 生成所有 Token 的 Metadata\n` +
          `3. 上傳 Metadata 到 IPFS\n\n` +
          `請稍候...`
        );

        const formData = new FormData();
        formData.append('image', campaign.imageFile);
        formData.append('name', campaign.name);
        formData.append('description', campaign.description || `${campaign.name} NFT Collection`);
        formData.append('maxSupply', campaign.maxSupply.toString());

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

        console.log('[AutoSetup] IPFS upload successful:', ipfsData);
        
        baseURI = ipfsData.baseURI!;
        setIpfsInfo({
          imageCID: ipfsData.imageCID,
          metadataCID: ipfsData.metadataCID,
          baseURI: ipfsData.baseURI,
        });

        alert(
          `✅ IPFS 上傳成功！\n\n` +
          `圖片 CID: ${ipfsData.imageCID?.substring(0, 10)}...\n` +
          `Metadata CID: ${ipfsData.metadataCID?.substring(0, 10)}...\n` +
          `Base URI: ${ipfsData.baseURI}\n\n` +
          `現在開始部署合約...`
        );
      }
      
      setStep('connecting');

      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('請安裝 MetaMask 錢包');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Get provider and signer (ethers v5)
      // IMPORTANT: Create a new provider instance to get fresh network info
      const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      
      // Force network refresh
      await provider.send('eth_chainId', []);
      
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      console.log('[AutoSetup] Connected wallet:', address);

      // Check network (ethers v5)
      const currentNetwork = await provider.getNetwork();
      console.log('[AutoSetup] Current network:', currentNetwork.name, currentNetwork.chainId);

      // Verify correct network
      const expectedChainIds: Record<string, number> = {
        sepolia: 11155111,
        ethereum: 1,
        arbitrum: 42161,
      };

      const expectedChainId = expectedChainIds[network]; // 'network' is from props (sepolia/ethereum/arbitrum)
      if (currentNetwork.chainId !== expectedChainId) {
        // Offer to switch network automatically
        try {
          const chainIdHex = '0x' + expectedChainId.toString(16);
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });
          
          // Wait a bit for network switch
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify switch was successful
          const newProvider = new ethers.providers.Web3Provider(window.ethereum);
          const newNetwork = await newProvider.getNetwork();
          
          if (newNetwork.chainId !== expectedChainId) {
            throw new Error('網路切換失敗');
          }
          
          console.log('[AutoSetup] Successfully switched to', network);
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            throw new Error(`請在 MetaMask 中手動添加 ${network.toUpperCase()} 網路`);
          }
          throw new Error(`請切換到 ${network.toUpperCase()} 網路。當前鏈 ID: ${currentNetwork.chainId}, 需要: ${expectedChainId}`);
        }
      }

      // Deploy contract using MetaMask (secure!)
      setStep('deploying');
      
      console.log('[AutoSetup] Deploying contract via MetaMask...');
      
      console.log('[AutoSetup] Using campaign:', {
        id: campaign.id,
        name: campaign.name,
        symbol: campaign.symbol,
        maxSupply: campaign.maxSupply,
        baseURI: baseURI,
      });

      // Import contract ABI and bytecode
      const CONTRACT_ARTIFACT = await import('../../lib/contracts/RWAHackathonNFT.json');
      
      // Get a fresh signer for deployment
      const deployProvider = new ethers.providers.Web3Provider(window.ethereum);
      const deploySigner = deployProvider.getSigner();
      
      // Verify signer is ready
      const signerAddress = await deploySigner.getAddress();
      console.log('[AutoSetup] Deploying with address:', signerAddress);
      
      const factory = new ethers.ContractFactory(
        CONTRACT_ARTIFACT.abi,
        CONTRACT_ARTIFACT.bytecode,
        deploySigner
      );

      console.log('[AutoSetup] Contract parameters:', {
        name: campaign.name,
        symbol: campaign.symbol || 'RWAHACK',
        maxSupply: campaign.maxSupply,
        baseURI: baseURI,
      });

      alert(
        `📝 準備部署合約！\n\n` +
        `活動名稱: ${campaign.name}\n` +
        `符號: ${campaign.symbol || 'RWAHACK'}\n` +
        `最大供應量: ${campaign.maxSupply}\n` +
        (ipfsInfo.baseURI ? `Base URI: ${ipfsInfo.baseURI}\n` : '') +
        `\nMetaMask 即將彈出，請確認部署交易。\n` +
        `⚠️ 這將花費一些 gas 費用。`
      );

      // Deploy contract - MetaMask will pop up for confirmation!
      const deployedContract = await factory.deploy(
        campaign.name,
        campaign.symbol || 'RWAHACK',
        campaign.maxSupply,
        baseURI
      );

      console.log('[AutoSetup] Contract deployment transaction sent:', deployedContract.deployTransaction.hash);
      
      alert(
        `⏳ 部署交易已發送！\n` +
        `交易哈希: ${deployedContract.deployTransaction.hash}\n\n` +
        `等待確認中...`
      );

      // Wait for deployment to be mined
      await deployedContract.deployed();

      const contractAddress = deployedContract.address;
      
      console.log('[AutoSetup] Contract deployed to:', contractAddress);
      setDeployedAddress(contractAddress);
      
      // Update Firestore with contract address
      await fetch('/api/admin/nft/campaigns/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          contractAddress,
          network,
          status: 'draft', // Will be set to 'active' after whitelist setup
        }),
      });
      
      alert(
        `✅ 合約部署成功！\n\n` +
        `合約地址: ${contractAddress}\n` +
        `網路: ${network}\n\n` +
        `接下來將自動設置白名單和啟用鑄造。`
      );

      // Step 2: Setup Merkle Tree
      setStep('setting-up');

      alert(
        `✅ 合約部署成功！\n\n` +
        `接下來系統會：\n` +
        `1. 生成 Merkle Tree (email 白名單)\n` +
        `2. 設置 Merkle Root 到合約\n` +
        `3. 啟用鑄造功能\n\n` +
        `請在 MetaMask 中確認交易。`
      );

      // Get a fresh provider with the signer
      const setupProvider = new ethers.providers.Web3Provider(window.ethereum);
      const setupSigner = setupProvider.getSigner();

      // Generate Merkle Tree from eligible emails
      console.log('[AutoSetup] Generating Merkle Tree...');
      const merkleResponse = await fetch('/api/admin/nft/campaigns/generate-merkle-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
        }),
      });

      if (!merkleResponse.ok) {
        const errorData = await merkleResponse.json();
        throw new Error(errorData.error || '生成 Merkle Tree 失敗');
      }

      const merkleData = await merkleResponse.json();
      console.log('[AutoSetup] Merkle Root:', merkleData.root);
      console.log('[AutoSetup] Total emails:', merkleData.totalEmails);

      // Set Merkle Root and enable minting
      const CONTRACT_ABI = [
        "function setMerkleRoot(bytes32 _merkleRoot) external",
        "function setMintingEnabled(bool enabled) external",
      ];

      const contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        setupSigner
      );

      // Set Merkle Root
      console.log('[AutoSetup] Setting Merkle Root...');
      const setRootTx = await contract.setMerkleRoot(merkleData.root);
      
      alert(`⏳ 設置 Merkle Root 交易已發送！\n交易哈希: ${setRootTx.hash}\n\n等待確認中...`);
      
      await setRootTx.wait();
      console.log('[AutoSetup] Merkle Root set');

      // Enable minting
      console.log(`[AutoSetup] Enabling minting...`);
      const enableTx = await contract.setMintingEnabled(true);
      
      alert(`⏳ 啟用鑄造交易已發送！\n交易哈希: ${enableTx.hash}\n\n等待確認中...`);
      
      await enableTx.wait();
      console.log(`[AutoSetup] Minting enabled`);

      // Update Firestore
      const updateResponse = await fetch('/api/admin/nft/campaigns/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          contractAddress: contractAddress,
          status: 'active',
          merkleRoot: merkleData.root,
          whitelistSummary: {
            totalEmails: merkleData.totalEmails,
            method: 'merkle-tree',
          },
        }),
      });

      if (updateResponse.ok) {
        console.log('[AutoSetup] Firestore updated');
      }

      setSetupSummary({
        totalEmails: merkleData.totalEmails,
        method: 'merkle-tree',
        ...ipfsInfo,
      });
      setStep('complete');

      alert(
        `✅ 設置完成！\n\n` +
        `合約地址: ${contractAddress}\n` +
        `Merkle Root: ${merkleData.root.substring(0, 10)}...\n` +
        `白名單郵箱數: ${merkleData.totalEmails}\n` +
        (ipfsInfo.imageCID ? `\n📦 IPFS 圖片 CID: ${ipfsInfo.imageCID}\n` : '') +
        (ipfsInfo.metadataCID ? `📦 IPFS Metadata CID: ${ipfsInfo.metadataCID}\n` : '') +
        (ipfsInfo.baseURI ? `🔗 Base URI: ${ipfsInfo.baseURI}\n` : '') +
        `\n鑄造已啟用，用戶現在可以用 email 鑄造 NFT 了！`
      );

      onSuccess();

    } catch (error: any) {
      console.error('[AutoSetup] Error:', error);
      setError(error.message || '設置失敗');
      setStep('idle');
    }
  };

  const getStepText = () => {
    switch (step) {
      case 'connecting':
        return '正在連接錢包...';
      case 'uploading-ipfs':
        return '正在上傳到 IPFS...';
      case 'deploying':
        return '正在部署合約...';
      case 'setting-up':
        return '正在設置白名單和啟用鑄造...';
      case 'complete':
        return '設置完成！';
      default:
        return '一鍵自動設置';
    }
  };

  if (step === 'complete' && setupSummary) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-green-800 mb-2">✅ 設置完成！</h3>
        <div className="text-sm text-green-700 space-y-1">
          <p><strong>合約地址:</strong> {deployedAddress}</p>
          <p><strong>網路:</strong> {network}</p>
          <p><strong>白名單郵箱:</strong> {setupSummary.totalEmails}</p>
          <p><strong>方法:</strong> Merkle Tree</p>
          {setupSummary.imageCID && (
            <p><strong>📦 IPFS 圖片 CID:</strong> {setupSummary.imageCID}</p>
          )}
          {setupSummary.metadataCID && (
            <p><strong>📦 IPFS Metadata CID:</strong> {setupSummary.metadataCID}</p>
          )}
          {setupSummary.baseURI && (
            <p className="break-all"><strong>🔗 Base URI:</strong> {setupSummary.baseURI}</p>
          )}
        </div>
        <button
          onClick={() => {
            setStep('idle');
            setSetupSummary(null);
          }}
          className="mt-3 text-sm text-green-600 hover:text-green-700 underline"
        >
          關閉
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-lg font-bold text-blue-800 mb-2">🚀 自動部署和設置</h3>
      <p className="text-sm text-blue-700 mb-3">
        一鍵完成合約部署、白名單設置和啟用鑄造
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      <button
        onClick={handleAutoSetup}
        disabled={step !== 'idle'}
        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
          step === 'idle'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {getStepText()}
      </button>

      <div className="mt-3 text-xs text-gray-600">
        <p className="font-semibold mb-1">此操作將會：</p>
        <ul className="list-disc list-inside space-y-1">
          <li>🔗 連接您的 MetaMask 錢包</li>
          <li>🔐 部署智能合約（MetaMask 確認）</li>
          <li>🔐 添加白名單（MetaMask 確認）</li>
          <li>🔐 啟用鑄造（MetaMask 確認）</li>
          <li>✅ 更新活動狀態為「進行中」</li>
        </ul>
        <p className="mt-2 text-green-600 font-semibold">
          🔒 100% 安全！所有操作都需要 MetaMask 確認
        </p>
        <p className="mt-1 text-orange-600 text-xs">
          ⚠️ 部署合約需要支付 gas 費用（約 0.01-0.05 ETH）
        </p>
      </div>
    </div>
  );
}

