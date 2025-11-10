import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

/**
 * Simulate mint transaction to debug the issue
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { campaignId, email } = req.query;

  if (!campaignId || !email) {
    return res.status(400).json({ error: 'Missing campaignId or email' });
  }

  try {
    // Get proof from API
    const proofResponse = await fetch(
      `http://localhost:3008/api/nft/get-merkle-proof?campaignId=${campaignId}&email=${email}`,
    );
    const proofData = await proofResponse.json();

    if (!proofData.emailHash || !proofData.proof) {
      return res.status(404).json({ error: 'Proof not found', details: proofData });
    }

    const { emailHash, proof, merkleRoot } = proofData;

    // Connect to Arbitrum
    const provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');

    // Contract ABI
    const contractABI = [
      'function mint(bytes32 emailHash, bytes32[] calldata merkleProof) external',
      'function verifyWhitelist(bytes32 emailHash, bytes32[] calldata merkleProof) external view returns (bool)',
      'function merkleRoot() external view returns (bytes32)',
      'function hasMinted(bytes32 emailHash) external view returns (bool)',
      'function mintingEnabled() external view returns (bool)',
    ];

    const contractAddress = '0xb7F3a468F0BF0e016c7bB99F3501cEa12B0C356c';
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Get contract state
    const contractMerkleRoot = await contract.merkleRoot();
    const hasMintedStatus = await contract.hasMinted(emailHash);
    const mintingEnabled = await contract.mintingEnabled();
    const isWhitelisted = await contract.verifyWhitelist(emailHash, proof);

    // Try to estimate gas (this will fail if the transaction would revert)
    let estimateError = null;
    let gasEstimate = null;
    try {
      // We can't actually call mint without a signer, but we can try to encode the data
      const iface = new ethers.utils.Interface(contractABI);
      const data = iface.encodeFunctionData('mint', [emailHash, proof]);

      // Try to estimate gas using eth_estimateGas
      gasEstimate = await provider.estimateGas({
        to: contractAddress,
        data: data,
        from: '0x618C14041A7ED4A50e8051A47d74410Ddda5617D', // Use the actual wallet address
      });
    } catch (error: any) {
      estimateError = {
        message: error.message,
        code: error.code,
        reason: error.reason,
      };
    }

    return res.status(200).json({
      email,
      emailHash,
      proof,
      proofLength: proof.length,
      contract: {
        address: contractAddress,
        merkleRoot: contractMerkleRoot,
        hasMinted: hasMintedStatus,
        mintingEnabled,
        isWhitelisted,
      },
      database: {
        merkleRoot,
      },
      merkleRootMatch: contractMerkleRoot === merkleRoot,
      gasEstimate,
      estimateError,
      diagnosis: {
        merkleRootMatch: contractMerkleRoot === merkleRoot,
        notMinted: !hasMintedStatus,
        mintingEnabled,
        whitelisted: isWhitelisted,
        shouldWork:
          contractMerkleRoot === merkleRoot && !hasMintedStatus && mintingEnabled && isWhitelisted,
      },
    });
  } catch (error: any) {
    console.error('[SimulateMint] Error:', error);
    return res.status(500).json({
      error: 'Failed to simulate mint',
      details: error.message,
    });
  }
}
