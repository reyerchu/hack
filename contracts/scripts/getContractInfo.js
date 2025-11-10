/**
 * Get NFT Contract Information
 *
 * Usage:
 *   CONTRACT_ADDRESS=0x... npx hardhat run scripts/getContractInfo.js --network sepolia
 */

const hre = require('hardhat');

async function main() {
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║   🔍 NFT Contract Information                                                ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  if (!CONTRACT_ADDRESS) {
    console.error('❌ Error: CONTRACT_ADDRESS environment variable is required');
    console.log('\nUsage:');
    console.log(
      '  CONTRACT_ADDRESS=0x... npx hardhat run scripts/getContractInfo.js --network sepolia\n',
    );
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log('   Network:', hre.network.name);
  console.log('   Contract Address:', CONTRACT_ADDRESS);
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const RWAHackathonNFT = await hre.ethers.getContractFactory('RWAHackathonNFT');
    const nft = RWAHackathonNFT.attach(CONTRACT_ADDRESS);

    // Basic Info
    console.log('📝 Basic Information:');
    const name = await nft.name();
    const symbol = await nft.symbol();
    const totalSupply = await nft.totalSupply();
    const maxSupply = await nft.maxSupply();
    const baseURI = await nft.baseTokenURI();

    console.log('   Name:', name);
    console.log('   Symbol:', symbol);
    console.log('   Total Supply:', totalSupply.toString());
    console.log('   Max Supply:', maxSupply.toString());
    console.log('   Base URI:', baseURI || '(empty)');
    console.log('');

    // Owner Info
    console.log('👤 Owner Information:');
    const owner = await nft.owner();
    console.log('   Owner Address:', owner);
    console.log('');

    // Minting Status
    console.log('⚙️  Minting Status:');
    const mintingEnabled = await nft.mintingEnabled();
    const paused = await nft.paused();
    console.log('   Minting Enabled:', mintingEnabled ? '✅ Yes' : '❌ No');
    console.log('   Contract Paused:', paused ? '⚠️  Yes' : '✅ No');
    console.log('');

    // Merkle Root
    console.log('🌲 Whitelist (Merkle Tree):');
    const merkleRoot = await nft.merkleRoot();
    if (merkleRoot === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      console.log('   Merkle Root: (not set)');
    } else {
      console.log('   Merkle Root:', merkleRoot);
    }
    console.log('');

    // Token URIs (if any tokens exist)
    if (totalSupply.gt(0)) {
      console.log('🖼️  Token URIs (Sample):');
      const sampleCount = Math.min(3, totalSupply.toNumber());

      for (let i = 1; i <= sampleCount; i++) {
        try {
          const tokenURI = await nft.tokenURI(i);
          console.log(`   Token #${i}:`, tokenURI);

          // Show gateway URLs
          if (tokenURI.startsWith('ipfs://')) {
            const ipfsHash = tokenURI.replace('ipfs://', '');
            console.log(`      → Pinata: https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
            console.log(`      → IPFS.io: https://ipfs.io/ipfs/${ipfsHash}`);
          }
        } catch (error) {
          console.log(`   Token #${i}: Error -`, error.message);
        }
      }

      if (totalSupply.gt(sampleCount)) {
        console.log(`   ... and ${totalSupply.toNumber() - sampleCount} more tokens`);
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Summary
    console.log('📊 Summary:');

    const issues = [];
    const warnings = [];

    if (!baseURI || baseURI === '') {
      issues.push('❌ Base URI is not set - NFTs will not show images');
    } else {
      console.log('   ✅ Base URI is set');

      if (!baseURI.startsWith('ipfs://')) {
        warnings.push('⚠️  Base URI does not start with "ipfs://"');
      }

      if (!baseURI.endsWith('/')) {
        warnings.push('⚠️  Base URI does not end with "/"');
      }
    }

    if (merkleRoot === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      warnings.push('⚠️  Merkle Root is not set - whitelist is not active');
    } else {
      console.log('   ✅ Merkle Root is set (whitelist active)');
    }

    if (!mintingEnabled) {
      warnings.push('⚠️  Minting is disabled');
    } else {
      console.log('   ✅ Minting is enabled');
    }

    if (paused) {
      warnings.push('⚠️  Contract is paused');
    } else {
      console.log('   ✅ Contract is not paused');
    }

    if (totalSupply.eq(maxSupply)) {
      console.log('   ⚠️  All NFTs have been minted');
    } else {
      console.log(`   ✅ ${maxSupply.sub(totalSupply).toString()} NFTs available to mint`);
    }

    console.log('');

    if (issues.length > 0) {
      console.log('🚨 Issues Found:');
      issues.forEach((issue) => console.log('   ' + issue));
      console.log('');
    }

    if (warnings.length > 0) {
      console.log('⚠️  Warnings:');
      warnings.forEach((warning) => console.log('   ' + warning));
      console.log('');
    }

    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ Everything looks good!\n');
    }

    // Links
    console.log('🔗 Useful Links:');

    if (hre.network.name === 'sepolia') {
      console.log('   Etherscan:', `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`);
      console.log('   NFT Page:', `https://sepolia.etherscan.io/nft/${CONTRACT_ADDRESS}/1`);
      console.log(
        '   Read Contract:',
        `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}#readContract`,
      );
      console.log(
        '   Write Contract:',
        `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}#writeContract`,
      );
    } else if (hre.network.name === 'mainnet') {
      console.log('   Etherscan:', `https://etherscan.io/address/${CONTRACT_ADDRESS}`);
      console.log('   NFT Page:', `https://etherscan.io/nft/${CONTRACT_ADDRESS}/1`);
      console.log(
        '   Read Contract:',
        `https://etherscan.io/address/${CONTRACT_ADDRESS}#readContract`,
      );
      console.log(
        '   Write Contract:',
        `https://etherscan.io/address/${CONTRACT_ADDRESS}#writeContract`,
      );
    } else if (hre.network.name === 'arbitrum') {
      console.log('   Arbiscan:', `https://arbiscan.io/address/${CONTRACT_ADDRESS}`);
      console.log('   NFT Page:', `https://arbiscan.io/nft/${CONTRACT_ADDRESS}/1`);
      console.log(
        '   Read Contract:',
        `https://arbiscan.io/address/${CONTRACT_ADDRESS}#readContract`,
      );
      console.log(
        '   Write Contract:',
        `https://arbiscan.io/address/${CONTRACT_ADDRESS}#writeContract`,
      );
    }

    console.log('');
  } catch (error) {
    console.error('❌ Error reading contract:', error.message);
    console.log('');

    if (error.message.includes('call revert exception')) {
      console.log('💡 Possible reasons:');
      console.log('   - Contract address is incorrect');
      console.log('   - Contract is not deployed on this network');
      console.log('   - Contract is not a RWAHackathonNFT contract');
      console.log('');
    }

    process.exit(1);
  }

  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║   ✅ Contract Information Retrieved                                          ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
