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

      // Step 0: Upload to IPFS (required!)
      if (!campaign.imageFile) {
        throw new Error('請先上傳 NFT 圖片文件！');
      }
      
      let baseURI = '';
      
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
        `接下來生成白名單 Merkle Tree...`
      );
      
      // Generate Merkle Tree BEFORE deployment
      setStep('setting-up');
      console.log('[AutoSetup] Generating Merkle Tree...');
      
      const merkleResponse = await fetch('/api/admin/nft/campaigns/generate-merkle-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });

      if (!merkleResponse.ok) {
        const errorData = await merkleResponse.json();
        throw new Error(errorData.error || '生成 Merkle Tree 失敗');
      }

      const merkleData = await merkleResponse.json();
      const merkleRoot = merkleData.root;
      console.log('[AutoSetup] Merkle Root:', merkleRoot);
      console.log('[AutoSetup] Total emails:', merkleData.totalEmails);

      alert(
        `✅ 白名單已生成！\n\n` +
        `白名單郵箱數: ${merkleData.totalEmails}\n\n` +
        `現在開始部署合約（一次確認完成所有設置）...`
      );
      
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
        merkleRoot: merkleRoot,
      });

      alert(
        `🔐 準備部署合約（所有設置一次完成）！\n\n` +
        `活動名稱: ${campaign.name}\n` +
        `符號: ${campaign.symbol || 'RWAHACK'}\n` +
        `最大供應量: ${campaign.maxSupply}\n` +
        (ipfsInfo.baseURI ? `Base URI: ${ipfsInfo.baseURI}\n` : '') +
        `白名單郵箱數: ${merkleData.totalEmails}\n\n` +
        `✨ 部署時將自動設置白名單並啟用鑄造\n` +
        `⚡ 僅需一次 MetaMask 確認！\n\n` +
        `MetaMask 即將彈出，請確認部署交易。`
      );

      // Deploy contract with Merkle Root - MetaMask will pop up for confirmation!
      // This single transaction deploys the contract AND sets up the whitelist!
      const deployedContract = await factory.deploy(
        campaign.name,
        campaign.symbol || 'RWAHACK',
        campaign.maxSupply,
        baseURI,
        merkleRoot  // ✨ Pass merkleRoot to constructor!
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
      
      // ✨ All done! Contract is deployed with whitelist and minting enabled!
      console.log('[AutoSetup] Contract deployed with whitelist and minting enabled!');
      
      alert(
        `✅ 部署完成！所有設置已就緒！\n\n` +
        `合約地址: ${contractAddress}\n` +
        `網路: ${network}\n` +
        `白名單郵箱數: ${merkleData.totalEmails}\n` +
        `鑄造狀態: 已啟用\n\n` +
        `✨ 用戶現在可以開始鑄造 NFT 了！`
      );

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
      case 'uploading-ipfs':
        return '正在上傳到 IPFS...';
      case 'setting-up':
        return '正在生成白名單...';
      case 'connecting':
        return '正在連接錢包...';
      case 'deploying':
        return '正在部署合約（一次完成所有設置）...';
      case 'complete':
        return '設置完成！';
      default:
        return '一鍵自動部署';
    }
  };

  if (step === 'complete' && setupSummary) {
    return (
      <div className="bg-green-900 bg-opacity-10 border border-green-900 border-opacity-20 rounded-lg p-4">
        <h3 className="text-lg font-bold text-green-900 mb-2">✅ 設置完成！</h3>
        <div className="text-sm text-green-900 space-y-1">
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
          className="mt-3 text-sm text-green-900 hover:opacity-80 underline"
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

      <button
        onClick={handleAutoSetup}
        disabled={step !== 'idle'}
        className={`w-full px-8 py-3 rounded-lg font-bold transition-all duration-300 ${
          step === 'idle'
            ? 'text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
        style={step === 'idle' ? { backgroundColor: '#8B4049' } : {}}
      >
        {getStepText()}
      </button>

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="font-semibold mb-3 text-gray-800 text-sm">部署流程：</p>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-start gap-3 text-gray-700 p-2 rounded hover:bg-gray-100 transition-colors">
            <span className="text-base flex-shrink-0">📋</span>
            <span>生成白名單 Merkle Tree</span>
          </div>
          <div className="flex items-start gap-3 text-gray-700 p-2 rounded hover:bg-gray-100 transition-colors">
            <span className="text-base flex-shrink-0">🔗</span>
            <span>連接您的 MetaMask 錢包</span>
          </div>
          <div className="flex items-start gap-3 text-gray-700 p-2 rounded hover:bg-gray-100 transition-colors">
            <span className="text-base flex-shrink-0">🔐</span>
            <div className="flex-1">
              <div className="font-medium">部署合約並完成所有設置 (僅需 1 次確認！)</div>
            </div>
          </div>
          <div className="flex items-start gap-3 text-gray-700 p-2 rounded hover:bg-gray-100 transition-colors">
            <span className="text-base flex-shrink-0">✅</span>
            <span>更新活動狀態為「進行中」</span>
          </div>
        </div>
      </div>
    </div>
  );
}

