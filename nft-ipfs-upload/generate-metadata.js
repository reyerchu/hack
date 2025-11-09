const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  name: "RWA Hackathon Taiwan NFT",
  description: "第一屆 RWA 黑客松台灣參與者紀念徽章 NFT。這枚 NFT 證明持有者參與了 2025 年在台灣舉辦的首屆 RWA（Real World Assets）黑客松。",
  imageCID: "REPLACE_WITH_YOUR_IMAGE_CID", // Replace with your actual image folder CID
  externalUrl: "https://hackathon.com.tw",
  totalSupply: 10, // How many NFTs you want to create metadata for
  attributes: [
    {
      "trait_type": "活動",
      "value": "RWA Hackathon Taiwan"
    },
    {
      "trait_type": "年份",
      "value": "2025"
    },
    {
      "trait_type": "類型",
      "value": "參與者徽章"
    },
    {
      "trait_type": "版本",
      "value": "第一版"
    },
    {
      "trait_type": "稀有度",
      "value": "限量"
    }
  ]
};

// Generate metadata for each token
function generateMetadata() {
  const metadataDir = path.join(__dirname, 'metadata');
  
  // Create metadata directory if it doesn't exist
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }

  console.log(`\n🎨 Generating metadata for ${config.totalSupply} NFTs...\n`);

  for (let i = 1; i <= config.totalSupply; i++) {
    const metadata = {
      name: `${config.name} #${i}`,
      description: config.description,
      image: `ipfs://${config.imageCID}/${i}.png`,
      external_url: config.externalUrl,
      attributes: config.attributes
    };

    const filename = path.join(metadataDir, `${i}.json`);
    fs.writeFileSync(filename, JSON.stringify(metadata, null, 2));
    console.log(`✓ Created ${i}.json`);
  }

  console.log(`\n✅ All metadata files generated successfully!`);
  console.log(`\nNext steps:`);
  console.log(`1. Upload your images folder to IPFS`);
  console.log(`2. Replace "REPLACE_WITH_YOUR_IMAGE_CID" in this script with the actual CID`);
  console.log(`3. Run this script again: node generate-metadata.js`);
  console.log(`4. Upload the metadata folder to IPFS`);
  console.log(`5. Set the baseURI in your contract\n`);
}

// Run
if (config.imageCID === "REPLACE_WITH_YOUR_IMAGE_CID") {
  console.log("\n⚠️  WARNING: You need to replace the imageCID in the config first!");
  console.log("\nSteps:");
  console.log("1. Upload your images folder to IPFS (Pinata or NFT.Storage)");
  console.log("2. Get the CID of the images folder");
  console.log("3. Edit this file and replace 'REPLACE_WITH_YOUR_IMAGE_CID' with your CID");
  console.log("4. Run this script again\n");
  
  // Still generate files but with placeholder
  generateMetadata();
} else {
  generateMetadata();
}

