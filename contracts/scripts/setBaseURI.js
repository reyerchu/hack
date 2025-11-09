const hre = require("hardhat");

async function main() {
  // Get contract address from command line or environment
  const contractAddress = process.env.CONTRACT_ADDRESS || process.argv[2];
  const baseURI = process.env.BASE_URI || process.argv[3];

  if (!contractAddress || !baseURI) {
    console.error("Usage: node setBaseURI.js <CONTRACT_ADDRESS> <BASE_URI>");
    console.error("Or set CONTRACT_ADDRESS and BASE_URI environment variables");
    process.exit(1);
  }

  console.log("\n🎨 Setting Base URI for NFT Contract\n");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Base URI: ${baseURI}\n`);

  // Get contract
  const RWAHackathonNFT = await hre.ethers.getContractFactory("RWAHackathonNFT");
  const nft = RWAHackathonNFT.attach(contractAddress);

  // Set base URI
  console.log("Sending transaction...");
  const tx = await nft.setBaseURI(baseURI);
  console.log(`Transaction sent: ${tx.hash}`);
  
  console.log("Waiting for confirmation...");
  await tx.wait();
  
  console.log("\n✅ Base URI updated successfully!");
  console.log(`\nNow your NFTs will have metadata at:`);
  console.log(`${baseURI}1 (for token #1)`);
  console.log(`${baseURI}2 (for token #2)`);
  console.log(`etc.\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

