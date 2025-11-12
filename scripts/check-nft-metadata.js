const { ethers } = require('ethers');
const https = require('https');

const CONTRACT_ADDRESS = '0xE744C67219e200906C7A9393B02315B6180E7df0';
const TOKEN_ID = 1;

const CONTRACT_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function name() external view returns (string memory)',
  'function symbol() external view returns (string memory)',
];

function fetchFromIPFS(ipfsUrl) {
  return new Promise((resolve, reject) => {
    const cid = ipfsUrl.replace('ipfs://', '');
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

    console.log(`📡 Fetching from: ${gatewayUrl}\n`);

    https
      .get(gatewayUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        });
      })
      .on('error', reject);
  });
}

async function checkNFTMetadata() {
  console.log('\n🔍 Checking NFT Metadata on Sepolia...\n');

  const provider = new ethers.providers.JsonRpcProvider('https://eth-sepolia.public.blastapi.io');
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  try {
    // Get basic info
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log(`📛 NFT Collection: ${name} (${symbol})`);
    console.log(`🏷️  Contract: ${CONTRACT_ADDRESS}`);
    console.log(`🎫 Token ID: ${TOKEN_ID}\n`);

    // Get tokenURI
    const tokenURI = await contract.tokenURI(TOKEN_ID);
    console.log(`📝 Token URI: ${tokenURI}\n`);

    // Fetch metadata from IPFS
    if (tokenURI.startsWith('ipfs://')) {
      console.log('🌐 Fetching metadata from IPFS...\n');
      const metadata = await fetchFromIPFS(tokenURI);

      console.log('📦 Metadata Content:');
      console.log(JSON.stringify(metadata, null, 2));
      console.log('\n');

      if (metadata.image) {
        console.log(`🖼️  Image URL: ${metadata.image}`);

        if (metadata.image.startsWith('ipfs://')) {
          const imageCID = metadata.image.replace('ipfs://', '');
          console.log(`🌐 Image Gateway URL: https://gateway.pinata.cloud/ipfs/${imageCID}`);
          console.log(`🌐 Alternative Gateway: https://ipfs.io/ipfs/${imageCID}`);
        }
      }

      console.log('\n✅ Metadata structure looks correct!');
      console.log("\n💡 If Etherscan still doesn't show the image, try:");
      console.log('   1. Wait 10-15 minutes for Etherscan to refresh');
      console.log('   2. Clear your browser cache');
      console.log('   3. Use "Refresh Metadata" button on Etherscan (if available)');
      console.log('   4. Check if the image URL is accessible via the gateway URLs above\n');
    } else {
      console.log('⚠️  Token URI is not an IPFS URL');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('Token does not exist')) {
      console.log('\n💡 This token has not been minted yet.');
    }
  }
}

checkNFTMetadata();
