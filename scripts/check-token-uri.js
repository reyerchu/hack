const { ethers } = require('ethers');

const CONTRACT_ADDRESS = '0xE744C67219e200906C7A9393B02315B6180E7df0';
const TOKEN_ID = 1;

const CONTRACT_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function _baseURI() external view returns (string memory)',
  'function name() external view returns (string memory)',
  'function symbol() external view returns (string memory)',
];

async function checkTokenURI() {
  console.log('\n🔍 Checking NFT Token URI...\n');

  const provider = new ethers.providers.JsonRpcProvider('https://rpc.sepolia.org');
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    const tokenURI = await contract.tokenURI(TOKEN_ID);

    console.log(`NFT Collection: ${name} (${symbol})`);
    console.log(`Token #${TOKEN_ID} URI: ${tokenURI}`);
    console.log('\n');

    // Try to fetch the metadata
    if (tokenURI.startsWith('ipfs://')) {
      const ipfsCID = tokenURI.replace('ipfs://', '');
      const gatewayURL = `https://gateway.pinata.cloud/ipfs/${ipfsCID}`;
      console.log(`📡 Gateway URL: ${gatewayURL}`);
      console.log('\n⚠️  Please visit the URL above to check if metadata is accessible\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTokenURI();
