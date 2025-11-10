/**
 * Script to verify contract on Etherscan using Hardhat
 * Usage: node scripts/verify-contract.js <contractAddress> <network> <name> <symbol> <maxSupply> <baseURI> <merkleRoot>
 */

const hre = require('hardhat');

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 7) {
    console.error(
      'Usage: node scripts/verify-contract.js <contractAddress> <network> <name> <symbol> <maxSupply> <baseURI> <merkleRoot>',
    );
    process.exit(1);
  }

  const [contractAddress, network, name, symbol, maxSupply, baseURI, merkleRoot] = args;

  console.log('[Verify] Starting verification...');
  console.log('[Verify] Contract Address:', contractAddress);
  console.log('[Verify] Network:', network);
  console.log('[Verify] Name:', name);
  console.log('[Verify] Symbol:', symbol);
  console.log('[Verify] Max Supply:', maxSupply);
  console.log('[Verify] Base URI:', baseURI);
  console.log('[Verify] Merkle Root:', merkleRoot);

  try {
    // Set the network in Hardhat config
    hre.network.name = network;

    // Verify the contract
    await hre.run('verify:verify', {
      address: contractAddress,
      constructorArguments: [name, symbol, parseInt(maxSupply), baseURI, merkleRoot],
    });

    console.log('[Verify] ✅ Contract verified successfully!');

    const explorerUrl =
      network === 'sepolia'
        ? `https://sepolia.etherscan.io/address/${contractAddress}#code`
        : network === 'arbitrum'
        ? `https://arbiscan.io/address/${contractAddress}#code`
        : `https://etherscan.io/address/${contractAddress}#code`;

    console.log('[Verify] View on explorer:', explorerUrl);

    process.exit(0);
  } catch (error) {
    if (error.message.includes('Already Verified')) {
      console.log('[Verify] ✅ Contract is already verified!');
      process.exit(0);
    }

    console.error('[Verify] ❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[Verify] Fatal error:', error);
  process.exit(1);
});
