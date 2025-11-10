import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface VerifyRequest {
  contractAddress: string;
  network: string;
  constructorArgs: {
    name: string;
    symbol: string;
    maxSupply: number;
    baseURI: string;
    merkleRoot: string;
  };
}

/**
 * Auto-verify deployed contract on Etherscan
 * POST /api/admin/nft/verify-contract
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractAddress, network, constructorArgs }: VerifyRequest = req.body;

    if (!contractAddress || !network || !constructorArgs) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('[Verify Contract] Starting verification for:', contractAddress);
    console.log('[Verify Contract] Network:', network);
    console.log('[Verify Contract] Constructor Args:', constructorArgs);

    // Check if ETHERSCAN_API_KEY is set
    if (!process.env.ETHERSCAN_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'ETHERSCAN_API_KEY not configured in environment variables',
        hint: 'Please add ETHERSCAN_API_KEY to .env.local',
      });
    }

    // Construct the hardhat verify command
    const contractsDir = path.join(process.cwd(), 'contracts');
    const { name, symbol, maxSupply, baseURI, merkleRoot } = constructorArgs;

    const command = `cd ${contractsDir} && npx hardhat verify --network ${network} ${contractAddress} "${name}" "${symbol}" ${maxSupply} "${baseURI}" "${merkleRoot}"`;

    console.log('[Verify Contract] Executing command:', command);

    try {
      // Execute verification with timeout
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 seconds timeout
        env: {
          ...process.env,
          NODE_OPTIONS: '--max-old-space-size=4096',
        },
      });

      console.log('[Verify Contract] stdout:', stdout);
      if (stderr) {
        console.log('[Verify Contract] stderr:', stderr);
      }

      // Check if verification was successful
      const successIndicators = [
        'Successfully verified',
        'Already Verified',
        'Contract source code already verified',
      ];

      const isSuccess = successIndicators.some(
        (indicator) => stdout.includes(indicator) || stderr.includes(indicator),
      );

      if (isSuccess) {
        const etherscanUrl =
          network === 'sepolia'
            ? `https://sepolia.etherscan.io/address/${contractAddress}#code`
            : network === 'arbitrum'
            ? `https://arbiscan.io/address/${contractAddress}#code`
            : `https://etherscan.io/address/${contractAddress}#code`;

        console.log('[Verify Contract] ✅ Verification successful!');

        return res.status(200).json({
          success: true,
          message: 'Contract verified successfully on Etherscan',
          contractAddress,
          network,
          etherscanUrl,
          output: stdout,
        });
      } else {
        // Verification failed but didn't throw error
        console.error('[Verify Contract] Verification failed:', stderr || stdout);

        return res.status(200).json({
          success: false,
          error: 'Verification completed but may have failed',
          details: stderr || stdout,
          contractAddress,
          network,
        });
      }
    } catch (execError: any) {
      console.error('[Verify Contract] Execution error:', execError);

      // Check if it's already verified
      if (
        execError.stdout?.includes('Already Verified') ||
        execError.stderr?.includes('Already Verified') ||
        execError.message?.includes('Already Verified')
      ) {
        const etherscanUrl =
          network === 'sepolia'
            ? `https://sepolia.etherscan.io/address/${contractAddress}#code`
            : network === 'arbitrum'
            ? `https://arbiscan.io/address/${contractAddress}#code`
            : `https://etherscan.io/address/${contractAddress}#code`;

        return res.status(200).json({
          success: true,
          message: 'Contract was already verified',
          contractAddress,
          network,
          etherscanUrl,
        });
      }

      // Handle timeout
      if (execError.killed || execError.signal === 'SIGTERM') {
        return res.status(500).json({
          success: false,
          error: 'Verification timeout - Etherscan API may be slow',
          details: 'Please try manual verification or retry later',
          contractAddress,
          network,
        });
      }

      // Other execution errors
      return res.status(500).json({
        success: false,
        error: 'Failed to execute verification command',
        details: execError.message,
        stdout: execError.stdout,
        stderr: execError.stderr,
        contractAddress,
        network,
      });
    }
  } catch (error: any) {
    console.error('[Verify Contract] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Verification failed',
      details: error.message,
    });
  }
}
