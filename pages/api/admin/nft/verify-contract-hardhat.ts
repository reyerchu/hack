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
 * Verify contract using Hardhat CLI (more reliable)
 * POST /api/admin/nft/verify-contract-hardhat
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

    console.log('[Verify Hardhat] Starting verification for:', contractAddress);

    const contractsDir = path.join(process.cwd(), 'contracts');
    const { name, symbol, maxSupply, baseURI, merkleRoot } = constructorArgs;

    // Build the command using hardhat CLI directly with --network flag
    // Important: Escape special characters properly
    const escapedName = name.replace(/"/g, '\\"');
    const escapedSymbol = symbol.replace(/"/g, '\\"');
    const escapedBaseURI = baseURI.replace(/"/g, '\\"');

    const command = `cd ${contractsDir} && npx hardhat verify --network ${network} ${contractAddress} "${escapedName}" "${escapedSymbol}" ${maxSupply} "${escapedBaseURI}" "${merkleRoot}"`;

    console.log('[Verify Hardhat] Executing command...');
    console.log('[Verify Hardhat] Network:', network);
    console.log('[Verify Hardhat] Contract:', contractAddress);

    // Retry mechanism for Etherscan API timeouts
    let lastError: any;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Verify Hardhat] Attempt ${attempt}/${maxRetries}...`);

        const { stdout, stderr } = await execAsync(command, {
          timeout: 120000, // 2 minutes timeout
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        });

        console.log('[Verify Hardhat] stdout:', stdout);
        if (stderr) {
          console.warn('[Verify Hardhat] stderr:', stderr);
        }

        // Check if verification was successful
        const isVerified =
          stdout.includes('Successfully verified') ||
          stdout.includes('Already Verified') ||
          stdout.includes('Contract source code already verified') ||
          stderr.includes('Already Verified') ||
          stderr.includes('Contract source code already verified');

        if (isVerified) {
          const etherscanUrl =
            network === 'sepolia'
              ? `https://sepolia.etherscan.io/address/${contractAddress}#code`
              : network === 'arbitrum'
              ? `https://arbiscan.io/address/${contractAddress}#code`
              : `https://etherscan.io/address/${contractAddress}#code`;

          return res.status(200).json({
            success: true,
            message: 'Contract verified successfully',
            contractAddress,
            network,
            etherscanUrl,
            output: stdout + (stderr || ''),
          });
        } else {
          throw new Error('Verification command completed but result is unclear');
        }
      } catch (execError: any) {
        lastError = execError;

        // Check if already verified
        const isAlreadyVerified =
          execError.stdout?.includes('Already Verified') ||
          execError.stdout?.includes('Contract source code already verified') ||
          execError.stderr?.includes('Already Verified') ||
          execError.stderr?.includes('Contract source code already verified');

        if (isAlreadyVerified) {
          const etherscanUrl =
            network === 'sepolia'
              ? `https://sepolia.etherscan.io/address/${contractAddress}#code`
              : network === 'arbitrum'
              ? `https://arbiscan.io/address/${contractAddress}#code`
              : `https://etherscan.io/address/${contractAddress}#code`;

          return res.status(200).json({
            success: true,
            message: 'Contract is already verified',
            contractAddress,
            network,
            etherscanUrl,
            output: (execError.stdout || '') + (execError.stderr || ''),
          });
        }

        // Check if it's a timeout error - retry
        const isTimeout =
          execError.killed ||
          execError.signal === 'SIGTERM' ||
          execError.stderr?.includes('Timeout') ||
          execError.stderr?.includes('Headers Timeout');

        if (isTimeout && attempt < maxRetries) {
          console.log(
            `[Verify Hardhat] Timeout error, retrying in 10 seconds... (${attempt}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds before retry
          continue;
        }

        // If not a timeout or last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('Verification failed after all retries');
  } catch (error: any) {
    console.error('[Verify Hardhat] Error:', error);

    return res.status(500).json({
      success: false,
      error: 'Verification failed',
      details: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    });
  }
}
