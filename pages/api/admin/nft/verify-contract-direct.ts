import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

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
 * Verify contract using Etherscan API directly (more reliable than Hardhat)
 * POST /api/admin/nft/verify-contract-direct
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

    console.log('[Verify Direct] Starting verification for:', contractAddress);

    // Check API key
    if (!process.env.ETHERSCAN_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'ETHERSCAN_API_KEY not configured',
      });
    }

    // Step 1: Flatten the contract
    const contractsDir = path.join(process.cwd(), 'contracts');
    const flattenedPath = path.join(contractsDir, 'RWAHackathonNFT_flat.sol');

    console.log('[Verify Direct] Flattening contract...');

    try {
      const { stdout } = await execAsync(
        `cd ${contractsDir} && npx hardhat flatten contracts/RWAHackathonNFT.sol`,
        { timeout: 30000 },
      );

      // Clean up flattened source (remove duplicate SPDX licenses)
      const cleanedSource = stdout
        .split('\n')
        .filter((line, index, arr) => {
          // Keep first SPDX license, remove others
          if (line.includes('SPDX-License-Identifier')) {
            return index === arr.findIndex((l) => l.includes('SPDX-License-Identifier'));
          }
          return true;
        })
        .join('\n');

      console.log('[Verify Direct] Contract flattened successfully');

      // Step 2: Encode constructor arguments
      const { ethers } = require('ethers');
      const { name, symbol, maxSupply, baseURI, merkleRoot } = constructorArgs;

      const types = ['string', 'string', 'uint256', 'string', 'bytes32'];
      const values = [name, symbol, maxSupply, baseURI, merkleRoot];

      const encodedArgs = ethers.utils.defaultAbiCoder.encode(types, values).slice(2);

      console.log('[Verify Direct] Constructor arguments encoded');

      // Step 3: Submit to Etherscan API
      const apiUrl =
        network === 'sepolia'
          ? 'https://api-sepolia.etherscan.io/api'
          : network === 'arbitrum'
          ? 'https://api.arbiscan.io/api'
          : 'https://api.etherscan.io/api';

      const verifyParams = {
        apikey: process.env.ETHERSCAN_API_KEY,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: contractAddress,
        sourceCode: cleanedSource,
        codeformat: 'solidity-single-file',
        contractname: 'contracts/RWAHackathonNFT.sol:RWAHackathonNFT',
        compilerversion: 'v0.8.20+commit.a1b79de6',
        optimizationUsed: 1,
        runs: 200,
        constructorArguements: encodedArgs,
        licenseType: 3, // MIT
      };

      console.log('[Verify Direct] Submitting to Etherscan API...');

      const submitResponse = await axios.post(apiUrl, new URLSearchParams(verifyParams as any), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 60000, // Increase timeout to 60 seconds
      });

      console.log('[Verify Direct] Submit response:', submitResponse.data);

      if (submitResponse.data.status === '1') {
        const guid = submitResponse.data.result;
        console.log('[Verify Direct] Verification GUID:', guid);

        // Step 4: Check verification status (retry up to 10 times)
        let verified = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!verified && attempts < maxAttempts) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

          const statusParams = {
            apikey: process.env.ETHERSCAN_API_KEY,
            module: 'contract',
            action: 'checkverifystatus',
            guid,
          };

          const statusResponse = await axios.get(apiUrl, {
            params: statusParams,
            timeout: 30000, // Increase timeout to 30 seconds
          });

          console.log(`[Verify Direct] Status check ${attempts}:`, statusResponse.data);

          if (statusResponse.data.status === '1') {
            verified = true;
            console.log('[Verify Direct] ✅ Contract verified!');

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
              guid,
            });
          } else if (statusResponse.data.result === 'Pending in queue') {
            console.log('[Verify Direct] Still pending...');
            continue;
          } else if (statusResponse.data.result.includes('Already Verified')) {
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
        }

        // Timeout
        return res.status(200).json({
          success: false,
          error: 'Verification status check timeout',
          message: 'Verification may still succeed - check Etherscan later',
          guid,
          contractAddress,
          network,
        });
      } else {
        // Submission failed
        return res.status(200).json({
          success: false,
          error: 'Failed to submit verification',
          details: submitResponse.data.result,
          contractAddress,
          network,
        });
      }
    } catch (execError: any) {
      console.error('[Verify Direct] Error:', execError);
      return res.status(500).json({
        success: false,
        error: 'Verification process failed',
        details: execError.message,
        contractAddress,
        network,
      });
    }
  } catch (error: any) {
    console.error('[Verify Direct] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Verification failed',
      details: error.message,
    });
  }
}
