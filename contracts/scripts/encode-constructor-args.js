const { ethers } = require('ethers');

// Constructor arguments from your deployment
const args = [
  'test sepolia', // name
  'RWAHACKTW', // symbol
  2, // maxSupply
  'ipfs://bafkreiaudnw2zbatzu2wjjbvlnqylqyfc35kjbwlginnl4lbdgrpcqbc6y', // baseURI
  '0xd6838d9445c046611678b491e065787dad9c0218f498c58e34fe57ce6954e562', // merkleRoot
];

console.log('\n📝 Constructor Arguments:\n');
console.log('1. name:', args[0]);
console.log('2. symbol:', args[1]);
console.log('3. maxSupply:', args[2]);
console.log('4. baseURI:', args[3]);
console.log('5. merkleRoot:', args[4]);

// Encode constructor arguments
const types = ['string', 'string', 'uint256', 'string', 'bytes32'];

const encoded = ethers.utils.defaultAbiCoder.encode(types, args);

console.log('\n🔐 ABI-Encoded Constructor Arguments:\n');
console.log(encoded);
console.log('\n📋 For Etherscan (remove 0x prefix):\n');
console.log(encoded.slice(2));

console.log('\n\n🌐 Manual Verification URL:\n');
console.log(
  'https://sepolia.etherscan.io/verifyContract?a=0xE744C67219e200906C7A9393B02315B6180E7df0',
);

console.log('\n📝 Instructions:');
console.log('1. Visit the URL above');
console.log('2. Select: "Solidity (Single file)"');
console.log('3. Compiler: v0.8.20+commit.a1b79de6');
console.log('4. License: MIT License');
console.log('5. Paste the flattened contract source');
console.log('6. Paste the encoded arguments above (without 0x)');
console.log('7. Click "Verify and Publish"');
console.log('\n');
