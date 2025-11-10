/**
 * Deploy and automatically verify NFT contract
 * Based on Hardhat best practices
 * Usage: npx hardhat run scripts/deploy-and-verify.js --network <network>
 */

const hre = require('hardhat');

async function main() {
  console.log('====================================');
  console.log('🚀 Starting deployment and verification');
  console.log('====================================\n');

  // Get constructor arguments from command line or use defaults
  const args = process.argv.slice(2);
  const name = args[0] || 'RWA Hackathon NFT';
  const symbol = args[1] || 'RWAHACK';
  const maxSupply = parseInt(args[2]) || 100;
  const baseURI = args[3] || 'ipfs://QmDefault/';
  const merkleRoot =
    args[4] || '0x0000000000000000000000000000000000000000000000000000000000000000';

  console.log('📋 Constructor Arguments:');
  console.log('  Name:', name);
  console.log('  Symbol:', symbol);
  console.log('  Max Supply:', maxSupply);
  console.log('  Base URI:', baseURI);
  console.log('  Merkle Root:', merkleRoot);
  console.log('  Network:', hre.network.name);
  console.log();

  // Deploy contract
  console.log('📦 Deploying RWAHackathonNFT...');
  const RWAHackathonNFT = await hre.ethers.getContractFactory('RWAHackathonNFT');
  const contract = await RWAHackathonNFT.deploy(name, symbol, maxSupply, baseURI, merkleRoot);

  await contract.deployed();
  console.log('✅ Contract deployed to:', contract.address);
  console.log('📝 Transaction hash:', contract.deployTransaction.hash);
  console.log();

  // Wait for confirmations (important for verification)
  console.log('⏳ Waiting for 5 block confirmations...');
  const confirmations = 5;
  await contract.deployTransaction.wait(confirmations);
  console.log('✅ Confirmed after', confirmations, 'blocks');
  console.log();

  // Verify contract on Etherscan
  console.log('🔍 Starting Etherscan verification...');
  try {
    await hre.run('verify:verify', {
      address: contract.address,
      constructorArguments: [name, symbol, maxSupply, baseURI, merkleRoot],
    });
    console.log('✅ Contract verified successfully on Etherscan!');
  } catch (error) {
    if (error.message.includes('Already Verified')) {
      console.log('✅ Contract is already verified!');
    } else {
      console.error('❌ Verification failed:', error.message);
      console.log('💡 You can verify manually later using:');
      console.log(
        `npx hardhat verify --network ${hre.network.name} ${contract.address} "${name}" "${symbol}" ${maxSupply} "${baseURI}" "${merkleRoot}"`,
      );
    }
  }

  console.log();
  console.log('====================================');
  console.log('🎉 Deployment Complete!');
  console.log('====================================');
  console.log('Contract Address:', contract.address);

  const explorerUrl =
    hre.network.name === 'sepolia'
      ? `https://sepolia.etherscan.io/address/${contract.address}`
      : hre.network.name === 'arbitrum'
      ? `https://arbiscan.io/address/${contract.address}`
      : hre.network.name === 'ethereum'
      ? `https://etherscan.io/address/${contract.address}`
      : 'N/A';

  console.log('Explorer:', explorerUrl);
  console.log();

  return {
    address: contract.address,
    transactionHash: contract.deployTransaction.hash,
    constructorArguments: [name, symbol, maxSupply, baseURI, merkleRoot],
  };
}

// Execute and handle errors
main()
  .then((result) => {
    console.log('Deployment result:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
