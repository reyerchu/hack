// NFT Campaign Types
export interface NFTCampaign {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  contractAddress?: string; // Ethereum contract address
  network: 'ethereum' | 'sepolia' | 'goerli'; // Support testnet
  eligibleEmails: string[]; // Whitelist of emails
  startDate: Date;
  endDate: Date;
  maxSupply: number;
  currentSupply: number;
  createdBy: string; // Admin user ID
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'ended' | 'paused';
}

// NFT Mint Record
export interface NFTMint {
  id: string;
  campaignId: string;
  userEmail: string;
  userId: string;
  walletAddress: string;
  tokenId: string;
  transactionHash: string;
  mintedAt: Date;
  imageUrl: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
}

// Mint Status Check Response
export interface MintStatus {
  eligible: boolean;
  campaignId?: string;
  campaignName?: string;
  campaignImage?: string;
  alreadyMinted: boolean;
  mintRecord?: NFTMint;
  reason?: string; // Why not eligible
  endDate?: Date;
}

