const { ethers } = require('ethers');
const CONTRACT_ABI = require('./contracts/artifacts/contracts/RWAHackathonNFT.sol/RWAHackathonNFT.json');

async function testMint() {
  try {
    // Connect to Sepolia using public RPC
    const provider = new ethers.providers.JsonRpcProvider(
      'https://ethereum-sepolia-rpc.publicnode.com',
    );

    const contractAddress = '0xE744C67219e200906C7A9393B02315B6180E7df0';
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI.abi, provider);

    console.log('📋 Contract Address:', contractAddress);

    // Check contract status
    console.log('\n🔍 Checking contract status...');
    const mintingEnabled = await contract.mintingEnabled();
    const totalSupply = await contract.totalSupply();
    const maxSupply = await contract.maxSupply();
    const merkleRoot = await contract.merkleRoot();

    console.log('  Minting Enabled:', mintingEnabled);
    console.log('  Total Supply:', totalSupply.toString());
    console.log('  Max Supply:', maxSupply.toString());
    console.log('  Merkle Root:', merkleRoot);

    // Test parameters
    const emailHash = '0x6342a5621f8ef4f404962120200b8276713f3d57eb84e9b54922e50aadec5fa8';
    const proof = ['0x152b76a067173ea2de781ca7e5adc2cfef6140c2db0d1d4d936466e2aa18d664'];

    console.log('\n📧 Email Hash:', emailHash);
    console.log('🔐 Proof:', proof);

    // Check if already minted
    const hasMinted = await contract.hasEmailMinted(emailHash);
    console.log('  Has Minted:', hasMinted);

    // Verify whitelist
    console.log('\n✅ Verifying whitelist...');
    const isWhitelisted = await contract.verifyWhitelist(emailHash, proof);
    console.log('  Is Whitelisted:', isWhitelisted);

    if (!isWhitelisted) {
      console.log('\n❌ Whitelist verification FAILED!');
      console.log(
        '   This means the Merkle proof is invalid or the email is not in the Merkle tree.',
      );
      return;
    }

    console.log('\n✅ All checks passed!');
    console.log('   The user SHOULD be able to mint.');

    // Try to estimate gas (this will fail if there's a contract error)
    console.log('\n📊 Estimating gas...');
    try {
      const gasEstimate = await contract.estimateGas.mint(emailHash, proof);
      console.log('  Gas Estimate:', gasEstimate.toString());
      console.log('\n✅ Gas estimation successful - mint should work!');
    } catch (gasError) {
      console.log('\n❌ Gas estimation FAILED!');
      console.log('   Error:', gasError.message);
      console.log('   Reason:', gasError.reason);
      console.log('   Code:', gasError.code);

      if (gasError.message.includes('execution reverted')) {
        console.log('\n🔍 Contract reverted. Possible reasons:');
        console.log('   1. Minting not enabled (but we checked - it is enabled)');
        console.log('   2. Invalid Merkle proof (but verifyWhitelist returned true)');
        console.log('   3. Already minted (but hasEmailMinted returned false)');
        console.log(
          '   4. Max supply reached (current: ' +
            totalSupply.toString() +
            ' / ' +
            maxSupply.toString() +
            ')',
        );
        console.log('   5. Unknown contract error');
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testMint();
