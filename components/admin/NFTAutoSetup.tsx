import { useState } from 'react';
import { ethers } from 'ethers';

interface NFTAutoSetupProps {
  campaignId: string;
  campaignName: string;
  network: string;
  onSuccess: () => void;
}

export default function NFTAutoSetup({ campaignId, campaignName, network, onSuccess }: NFTAutoSetupProps) {
  const [step, setStep] = useState<'idle' | 'connecting' | 'deploying' | 'setting-up' | 'complete'>('idle');
  const [error, setError] = useState('');
  const [deployedAddress, setDeployedAddress] = useState('');
  const [setupSummary, setSetupSummary] = useState<any>(null);

  const handleAutoSetup = async () => {
    try {
      setError('');
      setStep('connecting');

      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('請安裝 MetaMask 錢包');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Get provider and signer (ethers v5)
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      console.log('[AutoSetup] Connected wallet:', address);

      // Check network (ethers v5)
      const network = await provider.getNetwork();
      console.log('[AutoSetup] Current network:', network.name, network.chainId);

      // Verify correct network
      const expectedChainIds: Record<string, number> = {
        sepolia: 11155111,
        ethereum: 1,
        arbitrum: 42161,
      };

      const expectedChainId = expectedChainIds[network];
      if (network.chainId !== expectedChainId) {
        throw new Error(`請切換到對應的網路。當前: ${network.chainId}, 需要: ${expectedChainId}`);
      }

      // Get private key (NOTE: This is for demo purposes only!)
      // In production, you should NEVER ask for private keys in the frontend
      const privateKey = prompt(
        `⚠️  警告：此操作需要您的私鑰來自動化部署流程。\n\n` +
        `在生產環境中，您應該使用更安全的方式（如 Hardhat 腳本）。\n\n` +
        `請輸入您的私鑰（不含 0x 前綴）：`
      );

      if (!privateKey) {
        throw new Error('需要私鑰才能繼續');
      }

      // For now, guide user to manual deployment
      setStep('deploying');
      
      alert(
        `🚀 請在終端機執行以下命令部署合約：\n\n` +
        `cd /home/reyerchu/hack/hack-dev/contracts\n` +
        `npm run deploy:${network}\n\n` +
        `部署完成後，請複製合約地址並繼續下一步。`
      );

      const manualContractAddress = prompt('請輸入已部署的合約地址：');

      if (!manualContractAddress || !ethers.isAddress(manualContractAddress)) {
        throw new Error('無效的合約地址');
      }

      setDeployedAddress(manualContractAddress);

      // Step 2: Auto setup (whitelist + enable minting)
      setStep('setting-up');

      const response = await fetch('/api/admin/nft/campaigns/auto-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(window as any).userToken}`,
        },
        body: JSON.stringify({
          campaignId,
          contractAddress: manualContractAddress,
          deployerPrivateKey: privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey,
          network,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '設置失敗');
      }

      const result = await response.json();
      setSetupSummary(result.summary);
      setStep('complete');

      alert(
        `✅ 設置完成！\n\n` +
        `合約地址: ${manualContractAddress}\n` +
        `已添加 ${result.summary.walletsAddedToContract} 個錢包到白名單\n` +
        `鑄造已啟用，用戶現在可以鑄造 NFT 了！`
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
          <p><strong>已添加錢包:</strong> {setupSummary.walletsAddedToContract} / {setupSummary.walletsFound}</p>
          {setupSummary.emailsWithoutWallet > 0 && (
            <p className="text-orange-600">
              ⚠️ {setupSummary.emailsWithoutWallet} 個用戶尚未設置錢包地址
            </p>
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
          <li>連接您的 MetaMask 錢包</li>
          <li>引導您部署智能合約</li>
          <li>自動添加白名單地址到合約</li>
          <li>啟用鑄造功能</li>
          <li>更新活動狀態為「進行中」</li>
        </ul>
      </div>
    </div>
  );
}

