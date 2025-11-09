/**
 * Set Base URI for NFT Contract
 * 
 * Usage:
 *   CONTRACT_ADDRESS=0x... BASE_URI=ipfs://QmXXX.../ npx hardhat run scripts/setBaseURI.js --network sepolia
 */

const hre = require("hardhat");

async function main() {
  // Get parameters from environment variables
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const BASE_URI = process.env.BASE_URI;

  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║   🔧 Setting Base URI for NFT Contract                                       ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  // Validation
  if (!CONTRACT_ADDRESS) {
    console.error('❌ Error: CONTRACT_ADDRESS environment variable is required');
    console.log('\nUsage:');
    console.log('  CONTRACT_ADDRESS=0x... BASE_URI=ipfs://QmXXX.../ npx hardhat run scripts/setBaseURI.js --network sepolia\n');
    process.exit(1);
  }

  if (!BASE_URI) {
    console.error('❌ Error: BASE_URI environment variable is required');
    console.log('\nUsage:');
    console.log('  CONTRACT_ADDRESS=0x... BASE_URI=ipfs://QmXXX.../ npx hardhat run scripts/setBaseURI.js --network sepolia\n');
    process.exit(1);
  }

  // Validate BASE_URI format
  if (!BASE_URI.startsWith('ipfs://')) {
    console.error('❌ Error: BASE_URI must start with "ipfs://"');
    console.log('   Example: ipfs://QmZ43cZMtXrmNqZcz4o14nExvfiVZcdSifnnakg9m6nMYT/\n');
    process.exit(1);
  }

  if (!BASE_URI.endsWith('/')) {
    console.error('⚠️  Warning: BASE_URI should end with "/" for proper tokenURI formatting');
    console.log('   Current: ' + BASE_URI);
    console.log('   Recommended: ' + BASE_URI + '/\n');
  }

  console.log('📋 Configuration:');
  console.log('   Network:', hre.network.name);
  console.log('   Contract Address:', CONTRACT_ADDRESS);
  console.log('   Base URI:', BASE_URI);
  console.log('');

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log('📝 Signer Address:', signer.address);
  
  // Check balance
  const balance = await signer.getBalance();
  console.log('💰 Signer Balance:', hre.ethers.utils.formatEther(balance), 'ETH');
  console.log('');

  if (balance.isZero()) {
    console.error('❌ Error: Signer has no ETH for gas fees');
    console.log('   Please fund your wallet first\n');
    process.exit(1);
  }

  // Get contract instance
  const RWAHackathonNFT = await hre.ethers.getContractFactory("RWAHackathonNFT");
  const nft = RWAHackathonNFT.attach(CONTRACT_ADDRESS);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get current contract info
  try {
    console.log('🔍 Current Contract State:');
    
    const name = await nft.name();
    const symbol = await nft.symbol();
    const totalSupply = await nft.totalSupply();
    const currentBaseURI = await nft.baseTokenURI();
    
    console.log('   Name:', name);
    console.log('   Symbol:', symbol);
    console.log('   Total Supply:', totalSupply.toString());
    console.log('   Current Base URI:', currentBaseURI || '(empty)');
    
    // Check if tokenURI is working
    if (totalSupply.gt(0)) {
      try {
        const tokenURI = await nft.tokenURI(1);
        console.log('   Token #1 URI:', tokenURI);
      } catch (e) {
        console.log('   Token #1 URI: (error getting URI)');
      }
    }
    
    console.log('');
  } catch (error) {
    console.log('⚠️  Could not read current state:', error.message);
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Set Base URI
  console.log('🚀 Setting Base URI...');
  console.log('');

  try {
    const tx = await nft.setBaseURI(BASE_URI);
    console.log('✅ Transaction sent!');
    console.log('   TX Hash:', tx.hash);
    console.log('   Waiting for confirmation...');
    console.log('');

    const receipt = await tx.wait();
    
    console.log('✅ Transaction confirmed!');
    console.log('   Block Number:', receipt.blockNumber);
    console.log('   Gas Used:', receipt.gasUsed.toString());
    console.log('   Status:', receipt.status === 1 ? 'Success' : 'Failed');
    console.log('');
  } catch (error) {
    console.error('❌ Error setting Base URI:', error.message);
    console.log('');
    
    if (error.message.includes('Ownable: caller is not the owner')) {
      console.log('💡 Tip: Only the contract owner can set the Base URI');
      console.log('   Current signer:', signer.address);
      console.log('   Make sure you are using the owner wallet\n');
    }
    
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Verify the change
  console.log('🔍 Verifying Update:');
  
  try {
    const newBaseURI = await nft.baseTokenURI();
    console.log('   New Base URI:', newBaseURI);
    
    if (newBaseURI === BASE_URI) {
      console.log('   ✅ Base URI updated successfully!');
    } else {
      console.log('   ⚠️  Base URI mismatch!');
      console.log('   Expected:', BASE_URI);
      console.log('   Got:', newBaseURI);
    }
    
    console.log('');
    
    // Check tokenURI for token #1
    const totalSupply = await nft.totalSupply();
    if (totalSupply.gt(0)) {
      const tokenURI = await nft.tokenURI(1);
      console.log('   Token #1 URI:', tokenURI);
      console.log('');
      
      // Try to access via IPFS gateway
      const ipfsHash = tokenURI.replace('ipfs://', '');
      console.log('🌐 IPFS Gateway URLs:');
      console.log('   https://gateway.pinata.cloud/ipfs/' + ipfsHash);
      console.log('   https://ipfs.io/ipfs/' + ipfsHash);
      console.log('');
    }
  } catch (error) {
    console.log('   ⚠️  Error verifying:', error.message);
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('✅ Done! Base URI has been set.');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('   1. Wait a few minutes for Etherscan to update');
  console.log('   2. Visit your NFT page on Etherscan');
  console.log('   3. The image should now be visible!');
  console.log('');
  console.log('🔗 View on Etherscan:');
  
  if (hre.network.name === 'sepolia') {
    console.log('   https://sepolia.etherscan.io/address/' + CONTRACT_ADDRESS);
    console.log('   https://sepolia.etherscan.io/nft/' + CONTRACT_ADDRESS + '/1');
  } else if (hre.network.name === 'mainnet') {
    console.log('   https://etherscan.io/address/' + CONTRACT_ADDRESS);
    console.log('   https://etherscan.io/nft/' + CONTRACT_ADDRESS + '/1');
  } else if (hre.network.name === 'arbitrum') {
    console.log('   https://arbiscan.io/address/' + CONTRACT_ADDRESS);
    console.log('   https://arbiscan.io/nft/' + CONTRACT_ADDRESS + '/1');
  }
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║   🎉 Base URI Setup Complete!                                                ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
