import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import { ethers } from 'ethers';

interface AddWhitelistModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
  onSuccess: () => void;
}

const AddWhitelistModal: React.FC<AddWhitelistModalProps> = ({
  open,
  onClose,
  campaignId,
  campaignName,
  onSuccess,
}) => {
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'updating-db' | 'updating-contract'>('input');
  const [newMerkleRoot, setNewMerkleRoot] = useState('');

  const handleAddEmails = async () => {
    setError('');
    setLoading(true);
    setStep('updating-db');

    try {
      // Parse emails (comma or newline separated)
      const emailList = emails
        .split(/[\n,]/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      if (emailList.length === 0) {
        throw new Error('請輸入至少一個電子郵件地址');
      }

      // Step 1: Add to database and get new Merkle Root
      const response = await fetch('/api/admin/nft/campaigns/add-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          newEmails: emailList,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '添加失敗');
      }

      setNewMerkleRoot(data.newMerkleRoot);

      // Step 2: Update contract Merkle Root
      setStep('updating-contract');

      // Get contract info
      const contractInfoResponse = await fetch('/api/admin/nft/campaigns/update-merkle-root', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });

      const contractInfo = await contractInfoResponse.json();

      if (!contractInfoResponse.ok) {
        throw new Error(contractInfo.error || '無法獲取合約信息');
      }

      // Connect to MetaMask and update contract
      if (typeof (window as any).ethereum === 'undefined') {
        throw new Error('請安裝 MetaMask');
      }

      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      const contractABI = [
        'function setMerkleRoot(bytes32 _merkleRoot) external',
        'function owner() view returns (address)',
      ];

      const contract = new ethers.Contract(contractInfo.contractAddress, contractABI, signer);

      // Update Merkle Root on contract
      const tx = await contract.setMerkleRoot(data.newMerkleRoot);
      console.log('[AddWhitelist] Transaction sent:', tx.hash);

      await tx.wait();
      console.log('[AddWhitelist] Transaction confirmed');

      alert(
        `✅ 白名單更新成功！\n\n` +
          `已添加：${data.addedCount} 個地址\n` +
          `總數：${data.totalCount} 個地址\n\n` +
          `新的 Merkle Root 已更新到智能合約！`,
      );

      setEmails('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[AddWhitelist] Error:', err);
      setError(err.message || '添加白名單失敗');
    } finally {
      setLoading(false);
      setStep('input');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmails('');
      setError('');
      setStep('input');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>添加白名單 - {campaignName}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step === 'updating-db' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CircularProgress size={24} />
            <Typography>正在更新資料庫...</Typography>
          </Box>
        )}

        {step === 'updating-contract' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CircularProgress size={24} />
            <Typography>正在更新智能合約 Merkle Root...</Typography>
          </Box>
        )}

        <TextField
          label="電子郵件地址"
          multiline
          rows={6}
          fullWidth
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="輸入電子郵件地址（每行一個或用逗號分隔）&#10;例如：&#10;user1@example.com&#10;user2@example.com&#10;user3@example.com"
          helperText="輸入一個或多個電子郵件地址，用換行或逗號分隔"
          disabled={loading}
        />

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          注意：添加後會自動生成新的 Merkle Root 並要求您通過 MetaMask 更新智能合約。
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          取消
        </Button>
        <Button onClick={handleAddEmails} variant="contained" disabled={loading || !emails.trim()}>
          {loading ? '處理中...' : '添加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddWhitelistModal;
